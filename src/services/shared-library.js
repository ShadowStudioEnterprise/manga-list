import { createAppError, toAppError } from '@/utils/firebase-errors'

// Only volatile memory crosses tabs. No IndexedDB/localStorage library cache.
// Web Locks serializes ownership, including abrupt page closure; no polling reads.
export function subscribeSharedLibrary(
  key,
  start,
  onData,
  onError,
  isCurrent,
  runtime = globalThis,
) {
  const locks = runtime.navigator?.locks
  if (!runtime.document || !locks || !runtime.BroadcastChannel) return start(onData, onError)
  const channel = new runtime.BroadcastChannel(`mangalist:library:v1:${key}`)
  const controller = new AbortController()
  const requestedAt = Date.now()
  const faultKey = `mangalist:library:fault:v1:${key}`
  const epochKey = `mangalist:library:epoch:v1:${key}`
  let epoch = 0
  let stopped = false,
    leader = false,
    stale = false,
    stopListener,
    release,
    last,
    lastSeen = Date.now()
  const send = (message) => channel.postMessage({ ...message, epoch })
  const stop = () => {
    if (stopped) return
    stopped = true
    controller.abort()
    stopListener?.()
    clearInterval(timer)
    channel.close()
    last = undefined
    release?.()
  }
  const fail = (error) => {
    if (stopped) return
    stop()
    onError?.(toAppError(error))
  }
  const deliver = (items, metadata) => {
    if (stopped || !isCurrent()) return
    last = { items, metadata }
    stale = false
    lastSeen = Date.now()
    onData(items, metadata)
  }
  channel.onmessage = ({ data }) => {
    if (stopped || !isCurrent()) return
    if (leader) {
      if (data?.type === 'hello' && last) send({ type: 'data', ...last })
      return
    }
    // A retired owner's queued packets cannot overwrite its successor's data.
    if (data?.epoch < epoch) return
    if (data?.epoch > epoch) epoch = data.epoch
    if (data?.type === 'data' && Array.isArray(data.items)) deliver(data.items, data.metadata)
    if (data?.type === 'heartbeat') lastSeen = Date.now()
    if (data?.type === 'error') fail(createAppError(data.code))
  }
  // A suspended owner cannot leave followers claiming current server confirmation.
  // Never steal its lock or open a second listener to recover automatically.
  const timer = setInterval(() => {
    if (!isCurrent()) {
      stop()
      return
    }
    if (leader) send({ type: 'heartbeat' })
    else if (last && !stale && Date.now() - lastSeen > 15000) {
      stale = true
      onData(last.items, { ...last.metadata, fromCache: true, coordinationStale: true })
    }
  }, 5000)
  locks
    .request(`mangalist:library:v1:${key}`, { signal: controller.signal }, async () => {
      if (stopped || !isCurrent()) return
      try {
        // Store only an error code/time, never library data. A suspended follower
        // must see terminal failure before taking ownership, even if it missed IPC.
        const fault = JSON.parse(runtime.localStorage.getItem(faultKey) || 'null')
        if (fault && (fault.at >= requestedAt || fault.until > Date.now())) {
          fail(createAppError(fault.code))
          return
        }
        epoch = Number(runtime.localStorage.getItem(epochKey) || 0) + 1
        if (!Number.isSafeInteger(epoch) || epoch < 1) throw createAppError('app/unknown')
        runtime.localStorage.setItem(epochKey, String(epoch))
        leader = true
        last = undefined
        await new Promise((resolve) => {
          release = resolve
          stopListener = start(
            (items, metadata) => {
              if (stopped || !isCurrent()) return
              deliver(items, metadata)
              send({ type: 'data', items, metadata })
            },
            (error) => {
              if (stopped) return
              const at = Date.now()
              const quota = [
                'resource-exhausted',
                'firestore/resource-exhausted',
                'app/quota-paused',
              ].includes(error.code)
              try {
                runtime.localStorage.setItem(
                  faultKey,
                  JSON.stringify({
                    code: error.code || 'app/unknown',
                    at,
                    until: quota ? at + 15 * 60000 : at,
                  }),
                )
              } catch {
                // Still terminate safely if storage becomes unavailable mid-session.
              } finally {
                send({ type: 'error', code: error.code || 'app/unknown' })
                fail(error)
              }
            },
          )
          if (stopped) stopListener?.()
        })
      } catch (error) {
        // Contain callback rejection before it crosses the Web Locks boundary.
        if (!stopped) fail(error)
      }
    })
    .catch((error) => {
      if (!stopped) fail(error)
    })
  send({ type: 'hello' })
  // Request the active owner's last subscription snapshot, never another SDK listener.
  // Silence and heartbeats leave the stale warning intact until a data reply arrives.
  stop.requestSnapshot = () => {
    if (!stopped && !leader && isCurrent()) send({ type: 'hello' })
  }
  return stop
}

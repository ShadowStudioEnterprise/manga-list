import { createAppError } from './firebase-errors.js'

export const SPARK_LIMITS = Object.freeze({
  libraryDocuments: 10000,
  // Transport size only; the library cap remains provisional pending cost review.
  pageDocuments: 5000,
  libraryRanges: 64,
  deletionBatch: 400,
  deletionBatches: 5,
  transactionAttempts: 3,
  listenerUnconfirmedMs: 60000,
})

// Per-tab admission control, not a global quota or a security boundary.
export function createSparkBudget(now = Date.now, runtime, namespace = 'default') {
  const windows = new Map()
  let blockedUntil = 0
  let listenUntil = 0
  let listenerFailures = 0
  const observers = new Set()
  const recorded = new WeakSet()
  const storageKey = `mangalist:quota-pause:v1:${namespace}`
  const readPause = () => {
    try {
      const until = Number(runtime?.localStorage?.getItem(storageKey))
      if (Number.isFinite(until) && until > now() && until <= now() + 15 * 60000)
        blockedUntil = Math.max(blockedUntil, until)
    } catch {
      // Storage is optional; the in-memory pause remains effective.
    }
  }
  runtime?.addEventListener?.('storage', (event) => {
    if (event.key !== storageKey) return
    readPause()
    if (blockedUntil > now())
      for (const observer of [...observers]) observer(createAppError('app/quota-paused'))
  })
  const limits = Object.assign(Object.create(null), { read: 60, write: 120, listen: 3, auth: 10 })
  return {
    onPause(observer) {
      observers.add(observer)
      return () => observers.delete(observer)
    },
    listenerConfirmed() {
      listenerFailures = 0
    },
    remaining(kind) {
      readPause()
      if (now() < blockedUntil || (kind === 'listen' && now() < listenUntil) || !limits[kind])
        return 0
      const window = windows.get(kind)
      return !window || now() - window.start >= 60000
        ? limits[kind]
        : Math.max(0, limits[kind] - window.count)
    },
    retryAfterMs(kind) {
      readPause()
      const time = now()
      const window = windows.get(kind)
      return Math.max(
        0,
        blockedUntil - time,
        kind === 'listen' ? listenUntil - time : 0,
        window && window.count >= limits[kind] ? window.start + 60000 - time : 0,
      )
    },
    take(kind) {
      readPause()
      const time = now()
      if (time < blockedUntil) throw createAppError('app/quota-paused')
      if (kind === 'listen' && time < listenUntil) throw createAppError('app/reconnect-paused')
      const window = windows.get(kind)
      const current = !window || time - window.start >= 60000 ? { start: time, count: 0 } : window
      if (!limits[kind] || current.count >= limits[kind]) {
        throw createAppError('app/request-budget')
      }
      current.count++
      windows.set(kind, current)
    },
    record(error) {
      // The same failure passes through cursor, service and store boundaries.
      // Count it once, including AppError wrappers retaining the original cause.
      if (error && typeof error === 'object') {
        if (recorded.has(error) || (error.cause && recorded.has(error.cause))) return error
        recorded.add(error)
      }
      if (error?.code === 'app/listener-timeout' || error?.code === 'unavailable') {
        listenerFailures = Math.min(listenerFailures + 1, 7)
        listenUntil = Math.max(listenUntil, now() + Math.min(60000, 1000 * 2 ** listenerFailures))
      }
      if (
        [
          'resource-exhausted',
          'firestore/resource-exhausted',
          'auth/quota-exceeded',
          'auth/too-many-requests',
        ].includes(error?.code)
      ) {
        blockedUntil = Math.max(blockedUntil, now() + 15 * 60000)
        try {
          runtime?.localStorage?.setItem(storageKey, String(blockedUntil))
        } catch {
          // Do not replace the original quota error with a storage error.
        }
        for (const observer of [...observers]) observer(error)
      }
      return error
    },
  }
}

export const sparkBudget = createSparkBudget(
  Date.now,
  globalThis,
  import.meta.env?.VITE_FIREBASE_PROJECT_ID || 'unconfigured',
)

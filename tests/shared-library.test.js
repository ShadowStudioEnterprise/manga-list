import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { loadModule } from './helpers/load-module.js'

const { subscribeSharedLibrary } = await loadModule('src/services/shared-library.js')
const server = { complete: true, fromCache: false, hasPendingWrites: false }
const wait = async (predicate) => {
  const deadline = Date.now() + 3000
  while (!predicate()) {
    assert.ok(Date.now() < deadline, 'coordinator timed out')
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
}
function fixture() {
  const queues = new Map(),
    storage = new Map(),
    listeners = []
  const locks = {
    request(key, { signal }, callback) {
      const previous = queues.get(key) || Promise.resolve()
      const next = previous.then(async () => {
        if (signal.aborted) return
        await callback()
      })
      queues.set(
        key,
        next.catch(() => {}),
      )
      return next
    },
  }
  const runtime = {
    document: {},
    navigator: { locks },
    BroadcastChannel,
    localStorage: { getItem: (k) => storage.get(k), setItem: (k, v) => storage.set(k, v) },
  }
  const subscribe = (key, isCurrent = () => true) => {
    const data = [],
      errors = []
    const stop = subscribeSharedLibrary(
      key,
      (next, fail) => {
        const listener = { next, fail, stopped: false }
        listeners.push(listener)
        next([{ id: 'one', createdAt: new Date(0) }], server)
        return () => {
          listener.stopped = true
        }
      },
      (items, metadata) => data.push({ items, metadata }),
      (error) => errors.push(error),
      isCurrent,
      runtime,
    )
    return { stop, data, errors }
  }
  return { subscribe, listeners, storage }
}

test('same-account tabs share one listener, cloned dates, updates and ownership after close', async () => {
  const f = fixture(),
    key = randomUUID(),
    a = f.subscribe(key),
    b = f.subscribe(key)
  try {
    await wait(() => b.data.length)
    assert.equal(f.listeners.length, 1)
    assert.ok(b.data[0].items[0].createdAt instanceof Date)
    f.listeners[0].next([{ id: 'two' }], { ...server, fromCache: true })
    await wait(() => b.data.at(-1).items[0].id === 'two')
    assert.equal(b.data.at(-1).metadata.fromCache, true)
    a.stop()
    await wait(() => f.listeners.length === 2)
    assert.equal(f.listeners[0].stopped, true)
    assert.equal(b.data.at(-1).items[0].id, 'one')
    const retired = new BroadcastChannel(`mangalist:library:v1:${key}`)
    retired.postMessage({ type: 'data', epoch: 1, items: [{ id: 'retired' }], metadata: server })
    await new Promise((resolve) => setTimeout(resolve, 30))
    retired.close()
    assert.equal(b.data.at(-1).items[0].id, 'one')
  } finally {
    a.stop()
    b.stop()
  }
})

test('account/project namespaces, canceled waiters and late account callbacks remain isolated', async () => {
  const f = fixture(),
    key = randomUUID()
  let current = true
  const a = f.subscribe(key, () => current),
    canceled = f.subscribe(key),
    other = f.subscribe(`${key}:other`)
  canceled.stop()
  try {
    await wait(() => f.listeners.length === 2)
    current = false
    const before = a.data.length
    f.listeners[0].next([{ id: 'private' }], server)
    assert.equal(a.data.length, before)
    a.stop()
    await new Promise((resolve) => setTimeout(resolve, 30))
    assert.equal(f.listeners.length, 2)
    assert.equal(canceled.data.length, 0)
    assert.equal(other.data.at(-1).items[0].id, 'one')
  } finally {
    a.stop()
    canceled.stop()
    other.stop()
  }
})

test('quota errors stop all peers and queued/new leaders cannot reopen during the shared pause', async () => {
  const f = fixture(),
    key = randomUUID(),
    a = f.subscribe(key),
    b = f.subscribe(key)
  let c
  try {
    await wait(() => b.data.length)
    f.listeners[0].fail({ code: 'resource-exhausted', message: 'sensitive detail' })
    await wait(() => b.errors.length)
    c = f.subscribe(key)
    await wait(() => c.errors.length)
    assert.equal(f.listeners.length, 1)
    assert.equal(f.listeners[0].stopped, true)
    assert.equal(b.errors[0].code, 'resource-exhausted')
    assert.ok(!JSON.stringify([...f.storage.values()]).includes('sensitive'))
    assert.ok(!JSON.stringify([...f.storage.values()]).includes('createdAt'))
  } finally {
    a.stop()
    b.stop()
    c?.stop()
  }
})

test('unsupported browsers use the bounded independent listener', () => {
  let starts = 0,
    stops = 0
  const stop = subscribeSharedLibrary(
    'fallback',
    () => {
      starts++
      return () => stops++
    },
    () => {},
    () => {},
    () => true,
    {},
  )
  assert.equal(starts, 1)
  stop()
  assert.equal(stops, 1)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { createSparkBudget, SPARK_LIMITS } from '../src/utils/spark-budget.js'
import { loadModule } from './helpers/load-module.js'

test('ML-09: quota pause survives reload, crosses tabs, stays project scoped and stores no user data', () => {
  let time = 1000
  const storage = new Map()
  const handlers = []
  const runtime = {
    localStorage: {
      getItem: (key) => storage.get(key),
      setItem: (key, value) => storage.set(key, value),
    },
    addEventListener: (_name, handler) => handlers.push(handler),
  }
  const a = createSparkBudget(() => time, runtime, 'demo-a')
  const b = createSparkBudget(() => time, runtime, 'demo-a')
  let notified = 0
  const remove = b.onPause(() => notified++)
  a.record({ code: 'resource-exhausted', message: 'private title and uid' })
  handlers.forEach((handler) => handler({ key: [...storage.keys()][0] }))
  assert.equal(notified, 1)
  remove()
  const reloaded = createSparkBudget(() => time, runtime, 'demo-a')
  for (const budget of [a, b, reloaded]) {
    assert.equal(budget.retryAfterMs('write'), 900000)
    assert.throws(() => budget.take('read'), { code: 'app/quota-paused' })
  }
  createSparkBudget(() => time, runtime, 'demo-b').take('read')
  assert.deepEqual([...storage.values()], ['901000'])
  time += 900000
  reloaded.take('read')
  reloaded.record({ code: 'firestore/resource-exhausted' })
  assert.equal(reloaded.remaining('read'), 0, 'expiry is permission to try, never proof of reset')
})

test('ML-09: denied/corrupt storage preserves in-memory pause and original errors', () => {
  const budget = createSparkBudget(() => 0, {
    localStorage: {
      getItem() {
        throw Error('disabled')
      },
      setItem() {
        throw Error('disabled')
      },
    },
  })
  const error = { code: 'auth/quota-exceeded' }
  assert.equal(budget.record(error), error)
  assert.throws(() => budget.take('auth'), { code: 'app/quota-paused' })
  const corrupt = createSparkBudget(() => 0, { localStorage: { getItem: () => 'NaN' } })
  corrupt.take('read')
})

test('ML-09: each terminal failure is counted once across wrappers and backoff is capped', () => {
  let time = 0
  const budget = createSparkBudget(() => time)
  for (const delay of [2000, 4000, 8000, 16000, 32000, 60000, 60000]) {
    const error = { code: 'unavailable' }
    budget.record(error)
    budget.record({ code: error.code, cause: error })
    assert.equal(budget.retryAfterMs('listen'), delay)
    time += delay
  }
  budget.listenerConfirmed()
  budget.record({ code: 'unavailable' })
  assert.equal(budget.retryAfterMs('listen'), 2000)
})

async function listenerFixture(budget) {
  let next,
    fail,
    starts = 0,
    stops = 0
  const errors = [],
    deliveries = []
  const service = await loadModule('src/services/library-cursors.js', {
    '@/utils/spark-budget': { sparkBudget: budget, SPARK_LIMITS },
    'firebase/firestore': {
      documentId: () => 'id',
      orderBy: () => ({}),
      endAt: () => ({}),
      startAfter: () => ({}),
      limit: () => ({}),
      query: () => ({}),
      getDocsFromServer: async () => {
        throw Error('unexpected export')
      },
      onSnapshot(_query, _options, data, error) {
        starts++
        next = data
        fail = error
        return () => stops++
      },
    },
  })
  const start = () =>
    service.subscribeCursorLibrary(
      {},
      (doc) => doc.id,
      (items, metadata) => deliveries.push({ items, metadata }),
      (error) => errors.push(error),
    )
  return {
    start,
    next: (...args) => next(...args),
    fail: (...args) => fail(...args),
    errors,
    deliveries,
    counts: () => ({ starts, stops }),
  }
}

test('ML-09: quota from another operation stops active listeners once, then manual recovery succeeds', async () => {
  let time = 0
  const budget = createSparkBudget(() => time)
  const f = await listenerFixture(budget)
  const stop = f.start()
  budget.record({ code: 'resource-exhausted' })
  assert.deepEqual(f.counts(), { starts: 1, stops: 1 })
  assert.equal(f.errors.length, 1)
  for (let i = 0; i < 20; i++) assert.throws(f.start, { code: 'app/quota-paused' })
  f.next({ docs: [{ id: 'late' }], metadata: { fromCache: false, hasPendingWrites: false } })
  assert.equal(f.deliveries.length, 0)
  stop()
  time = 900000
  const recovered = f.start()
  f.next({ docs: [{ id: 'whole' }], metadata: { fromCache: false, hasPendingWrites: false } })
  assert.equal(f.deliveries[0].metadata.complete, true)
  assert.deepEqual(f.deliveries[0].items, ['whole'])
  recovered()
})

test('ML-09: silent listener times out; repeated manual failures back off without automatic reconnects', async (t) => {
  let time = 0
  const budget = createSparkBudget(() => time)
  const f = await listenerFixture(budget)
  t.mock.timers.enable({ apis: ['setTimeout'] })
  f.start()
  t.mock.timers.tick(60000)
  assert.equal(f.errors[0].code, 'app/listener-timeout')
  assert.deepEqual(f.counts(), { starts: 1, stops: 1 })
  assert.throws(f.start, { code: 'app/reconnect-paused' })
  assert.equal(budget.retryAfterMs('listen'), 2000)
  time = 2000
  f.start()
  f.fail({ code: 'unavailable' })
  assert.equal(budget.retryAfterMs('listen'), 4000)
  t.mock.timers.tick(3600000)
  assert.equal(f.counts().starts, 2, 'no app reconnect timer')
})

test('ML-09: cached/partial data never cancels the deadline; server confirmation does', async (t) => {
  const f = await listenerFixture(createSparkBudget())
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const stop = f.start()
  f.next({ docs: [{ id: 'cached' }], metadata: { fromCache: true, hasPendingWrites: false } })
  assert.equal(f.deliveries[0].metadata.complete, false)
  t.mock.timers.tick(59000)
  f.next({ docs: [{ id: 'whole' }], metadata: { fromCache: false, hasPendingWrites: false } })
  t.mock.timers.tick(60000)
  assert.equal(f.errors.length, 0)
  f.next({ docs: [{ id: 'whole' }], metadata: { fromCache: true, hasPendingWrites: false } })
  t.mock.timers.tick(60000)
  assert.equal(f.errors[0].code, 'app/listener-timeout')
  stop()
})

test('ML-09: a split after an already confirmed library starts a fresh deadline', async (t) => {
  const f = await listenerFixture(createSparkBudget())
  t.mock.timers.enable({ apis: ['setTimeout'] })
  f.start()
  const metadata = { fromCache: false, hasPendingWrites: false }
  f.next({ docs: [{ id: 'initial' }], metadata })
  f.next({
    docs: Array.from({ length: 5001 }, (_, i) => ({ id: String(i).padStart(6, '0') })),
    metadata,
  })
  assert.equal(f.counts().starts, 2, 'the left child is waiting for server data')
  t.mock.timers.tick(60000)
  assert.equal(f.errors[0].code, 'app/listener-timeout')
  assert.deepEqual(f.counts(), { starts: 2, stops: 2 })
  assert.equal(f.deliveries.length, 1, 'the incomplete split must never be published')
})

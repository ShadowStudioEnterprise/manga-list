import test from 'node:test'
import assert from 'node:assert/strict'
import { loadModule } from './helpers/load-module.js'
import { SPARK_LIMITS } from '../src/utils/spark-budget.js'

const server = { fromCache: false, hasPendingWrites: false }
const id = (number) => String(number).padStart(6, '0')
const doc = (key) => ({ id: key, data: () => ({ name: key }) })

async function fixture(size, { metadata = server, limits = SPARK_LIMITS } = {}) {
  const lifecycle = new EventTarget()
  let documents = Array.from({ length: size }, (_, i) => doc(id(i)))
  const targets = [],
    queries = [],
    errors = [],
    deliveries = [],
    budget = []
  let readFailure,
    readCount = 0,
    maxUnconfirmed = 0
  const select = (q) => {
    const lower = q.find((c) => c.kind === 'after')?.value
    const upper = q.find((c) => c.kind === 'end')?.value
    const max = q.find((c) => c.kind === 'limit').value
    return documents
      .filter((d) => (!lower || d.id > lower) && (!upper || d.id <= upper))
      .slice(0, max)
  }
  const deliver = (target) => {
    if (target.active) {
      if (!metadata.fromCache && !metadata.hasPendingWrites) target.pending = false
      target.data({ docs: select(target.q), metadata })
    }
  }
  const service = await loadModule('src/services/library-cursors.js', {
    '@/utils/spark-budget': {
      SPARK_LIMITS: { ...limits, pageDocuments: 1000 },
      sparkBudget: { take: (kind) => budget.push(kind), record: (error) => error },
    },
    'firebase/firestore': {
      documentId: () => '__name__',
      orderBy: (value) => ({ kind: 'order', value }),
      startAfter: (value) => ({ kind: 'after', value }),
      endAt: (value) => ({ kind: 'end', value }),
      limit: (value) => ({ kind: 'limit', value }),
      query: (_ref, ...constraints) => {
        queries.push(constraints)
        return constraints
      },
      onSnapshot: (q, options, data, fail) => {
        assert.equal(options.includeMetadataChanges, true)
        const target = { q, data, fail, active: true, pending: true }
        targets.push(target)
        maxUnconfirmed = Math.max(
          maxUnconfirmed,
          targets.filter((t) => t.active && t.pending).length,
        )
        queueMicrotask(() => deliver(target))
        return () => {
          target.active = false
        }
      },
      getDocsFromServer: async (q) => {
        readCount++
        if (readFailure?.page === readCount) throw { code: readFailure.code }
        return { docs: select(q), metadata }
      },
    },
  })
  const flush = async () => {
    for (let i = 0; i < 100; i++) await Promise.resolve()
  }
  return {
    service,
    targets,
    queries,
    errors,
    deliveries,
    budget,
    flush,
    freeze: () => lifecycle.dispatchEvent(new Event('freeze')),
    start: () =>
      service.subscribeCursorLibrary(
        {},
        (d) => d.id,
        (docs, meta) => deliveries.push({ docs, meta }),
        (e) => errors.push(e),
        { document: lifecycle },
      ),
    change: async (transform, nextMetadata = server) => {
      documents = transform(documents).sort((a, b) => a.id.localeCompare(b.id))
      metadata = nextMetadata
      for (const target of [...targets]) deliver(target)
      await flush()
    },
    failRead: (page, code) => {
      readFailure = { page, code }
    },
    readCount: () => readCount,
    maxUnconfirmed: () => maxUnconfirmed,
    setMetadata: (value) => {
      metadata = value
    },
  }
}

test('freezing retires every range once and ignores late snapshots until explicit recovery', async () => {
  const f = await fixture(1500)
  f.start()
  await f.flush()
  const before = f.deliveries.length
  const targets = f.targets.length
  f.freeze()
  f.freeze()
  assert.equal(f.errors.length, 1)
  assert.equal(f.errors[0].code, 'app/listener-suspended')
  assert.equal(f.targets.filter((target) => target.active).length, 0)
  await f.change((docs) => [...docs, doc('new-after-freeze')])
  assert.equal(f.deliveries.length, before)
  assert.equal(f.targets.length, targets)
  const stop = f.start()
  await f.flush()
  assert.equal(f.deliveries.at(-1).docs.length, 1501)
  assert.equal(f.deliveries.at(-1).meta.complete, true)
  stop()
  f.freeze()
  assert.equal(f.errors.length, 1)
})

for (const size of [0, 1, 500, 501, 1000, 1001, 2501, 5000, 10000]) {
  test(`real query constraints cover ${size} documents once across bounded ranges and export`, async () => {
    const f = await fixture(size)
    const stop = f.start()
    await f.flush()
    assert.deepEqual(f.errors, [])
    assert.equal(f.maxUnconfirmed(), 1, 'Only one new target may await server confirmation')
    const last = f.deliveries.at(-1)
    assert.equal(last.meta.complete, true)
    assert.equal(last.docs.length, size)
    assert.equal(new Set(last.docs).size, size)
    assert.deepEqual(
      [...last.docs].sort(),
      Array.from({ length: size }, (_, i) => id(i)),
    )
    const exported = await f.service.fetchCursorLibrary(
      {},
      (d) => d.id,
      () => {},
    )
    assert.deepEqual(
      exported,
      Array.from({ length: size }, (_, i) => id(i)),
    )
    for (const q of f.queries) {
      assert.deepEqual(q[0], { kind: 'order', value: '__name__' })
      assert.equal(q.at(-1).value, 1001)
    }
    assert.equal(f.readCount(), Math.max(1, Math.ceil(size / 1000)))
    stop()
    assert.equal(f.targets.filter((t) => t.active).length, 0)
  })
}

test('stable ranges preserve inserts on both sides, boundary deletion, edits and empty results', async () => {
  const f = await fixture(1501)
  f.start()
  await f.flush()
  await f.change((docs) => [
    ...docs.filter((d) => d.id !== id(999)),
    ...Array.from({ length: 1020 }, (_, i) => doc(`000100-${id(i)}`)),
    doc('zz-tail'),
  ])
  const last = f.deliveries.at(-1)
  assert.equal(last.docs.length, 2521)
  assert.equal(new Set(last.docs).size, 2521)
  assert.ok(last.docs.includes('zz-tail'))
  assert.ok(!last.docs.includes(id(999)))
  assert.deepEqual(f.errors, [])
  await f.change(() => [])
  assert.deepEqual(f.deliveries.at(-1).docs, [])
})

test('cache cannot certify completeness; pending/cache metadata remain conservative', async () => {
  const f = await fixture(100, { metadata: { fromCache: true, hasPendingWrites: false } })
  f.start()
  await f.flush()
  assert.equal(f.deliveries.at(-1).meta.complete, false)
  await f.change((docs) => docs)
  assert.equal(f.deliveries.at(-1).meta.complete, true)
  await f.change((docs) => docs, { fromCache: true, hasPendingWrites: true })
  assert.equal(f.deliveries.at(-1).meta.hasPendingWrites, true)
  assert.equal(f.deliveries.at(-1).meta.fromCache, true)
})

test('cancel and late callbacks cannot deliver or attach more targets', async () => {
  const f = await fixture(1500)
  const stop = f.start()
  stop()
  await f.flush()
  f.targets[0].data({ docs: Array.from({ length: 1001 }, (_, i) => doc(id(i))), metadata: server })
  assert.equal(f.targets.length, 1)
  assert.deepEqual(f.deliveries, [])
})

test('cancel while a split child awaits confirmation never opens the deferred sibling', async () => {
  const f = await fixture(2501)
  const stop = f.start()
  await Promise.resolve()
  assert.equal(f.targets.length, 2)
  assert.equal(f.deliveries.length, 0)
  stop()
  await f.flush()
  assert.equal(f.targets.length, 2)
  assert.equal(f.targets.filter((target) => target.active).length, 0)
  assert.equal(f.deliveries.length, 0)
})

test('a failed query stops its listener and never claims a complete partial library', async () => {
  const f = await fixture(1500)
  f.start()
  await f.flush()
  const active = f.targets.filter((t) => t.active)
  active[0].fail({ code: 'permission-denied' })
  const count = f.deliveries.length
  active[0].data({ docs: [], metadata: server })
  assert.equal(f.errors[0].code, 'permission-denied')
  assert.equal(f.targets.filter((t) => t.active).length, 0)
  assert.equal(f.deliveries.length, count)
})

test('document and fragmentation budgets fail closed and stop their targets', async () => {
  for (const limits of [
    { ...SPARK_LIMITS, libraryDocuments: 1000 },
    { ...SPARK_LIMITS, libraryRanges: 1 },
  ]) {
    const f = await fixture(1501, { limits })
    f.start()
    await f.flush()
    assert.equal(f.errors[0].code, 'app/library-budget')
    assert.equal(f.targets.filter((t) => t.active).length, 0)
    assert.equal(f.deliveries.filter((d) => d.meta.complete).length, 0)
  }
})

test('export page failure, cache, pending writes and session changes return no partial copy', async () => {
  for (const code of ['unavailable', 'resource-exhausted', 'permission-denied']) {
    const f = await fixture(1500)
    f.failRead(2, code)
    await assert.rejects(
      f.service.fetchCursorLibrary(
        {},
        (d) => d.id,
        () => {},
      ),
      { code },
    )
    assert.equal(f.readCount(), 2)
  }
  for (const metadata of [
    { fromCache: true, hasPendingWrites: false },
    { fromCache: false, hasPendingWrites: true },
    {},
  ]) {
    const f = await fixture(1500, { metadata })
    await assert.rejects(
      f.service.fetchCursorLibrary(
        {},
        (d) => d.id,
        () => {},
      ),
      { code: 'app/export-not-confirmed' },
    )
    assert.equal(f.readCount(), 1)
  }
  const f = await fixture(1500)
  let checks = 0
  await assert.rejects(
    f.service.fetchCursorLibrary(
      {},
      (d) => d.id,
      () => {
        if (++checks === 4) throw { code: 'app/invalid-account' }
      },
    ),
    { code: 'app/invalid-account' },
  )
  assert.equal(f.readCount(), 2)
})

test('ID tie order stays stable and cancellation ignores late target errors', async () => {
  const f = await fixture(1501)
  f.start()
  await f.flush()
  await f.change((docs) => [
    ...docs,
    ...Array.from({ length: 1020 }, (_, i) => doc(`000100-${id(i)}`)),
  ])
  const last = f.deliveries.at(-1)
  assert.deepEqual(last.docs, [...last.docs].sort())
  f.targets[0].fail({ code: 'unavailable' })
  assert.deepEqual(f.errors, [])
  assert.ok(f.targets.some((target) => target.active))
})

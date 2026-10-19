import test from 'node:test'
import assert from 'node:assert/strict'
import * as firestore from 'firebase/firestore'
import { loadModule } from './helpers/load-module.js'
import { createSparkBudget, SPARK_LIMITS } from '../src/utils/spark-budget.js'

for (const route of ['chapter', 'edit', 'import']) {
  test(`${route}: exhausted read budget prevents SDK reads and writes, then recovers after the window`, async () => {
    let now = 0,
      reads = 0,
      writes = 0
    const budget = createSparkBudget(() => now)
    for (let i = 0; i < 60; i++) budget.take('read')
    const service = await loadModule('src/services/manga-service.js', {
      '@/boot/firebase': { db: {}, requireFirebase() {} },
      '@/utils/spark-budget': { SPARK_LIMITS, sparkBudget: budget },
      'firebase/firestore': {
        ...firestore,
        collection: () => ({}),
        doc: () => ({}),
        runTransaction: async (_db, callback, options) => {
          assert.equal(options.maxAttempts, 3)
          return callback({
            async get() {
              reads++
              return { exists: () => route !== 'import', data: () => ({ chapter: '1' }) }
            },
            set() {
              writes++
            },
            update() {
              writes++
            },
          })
        },
      },
    })
    const operate = () =>
      route === 'chapter'
        ? service.changeMangaChapter('synthetic', 'one', 1)
        : route === 'edit'
          ? service.updateManga(
              'synthetic',
              'one',
              { chapter: '2' },
              { expectedValues: { chapter: '1' } },
            )
          : service.createManga(
              'synthetic',
              { name: 'Synthetic', chapter: '1' },
              {
                importDocumentId: `import-v1-${'a'.repeat(64)}-1`,
              },
            )
    await assert.rejects(operate(), { code: 'app/request-budget' })
    assert.equal(reads, 0)
    assert.equal(writes, 0)
    now = 59999
    await assert.rejects(operate(), { code: 'app/request-budget' })
    assert.equal(reads, 0)
    now++
    await operate()
    assert.equal(reads, 1)
    assert.equal(writes, 1)
  })
}

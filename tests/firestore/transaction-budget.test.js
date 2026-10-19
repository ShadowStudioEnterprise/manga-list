import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import * as sdk from 'firebase/firestore'
import { loadModule } from '../helpers/load-module.js'
import { createSparkBudget, SPARK_LIMITS } from '../../src/utils/spark-budget.js'

let environment
before(async () => {
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8188')
  environment = await initializeTestEnvironment({
    projectId: 'demo-mangalist-transactions',
    firestore: { host: '127.0.0.1', port: 8188, rules: await readFile('firestore.rules', 'utf8') },
  })
})
after(async () => environment?.cleanup())

const routes = ['chapter', 'edit', 'import']
const importId = `import-v1-${'a'.repeat(64)}-1`
const initial = () => ({
  schemaVersion: 1,
  name: 'Synthetic',
  normalizedName: 'synthetic',
  chapter: '1',
  type: 'manga',
  genres: [],
  readingStatus: 'following',
  publicationStatus: 'unknown',
  sources: [],
  notes: '',
  favorite: false,
  createdAt: sdk.serverTimestamp(),
  updatedAt: sdk.serverTimestamp(),
})

async function fixture(route, allowedReads = 60) {
  const uid = `${route}-${allowedReads}`
  const db = environment.authenticatedContext(uid).firestore()
  const writer = environment.authenticatedContext(uid).firestore()
  const id = route === 'import' ? importId : 'one'
  const reference = sdk.doc(db, 'users', uid, 'mangas', id)
  const concurrentReference = sdk.doc(writer, 'users', uid, 'mangas', id)
  if (route !== 'import') await sdk.setDoc(reference, initial())
  const budget = createSparkBudget()
  for (let i = allowedReads; i < 60; i++) budget.take('read')
  const metrics = { route, allowedReads, attempts: 0, sdkReads: 0, readAdmissions: 0 }
  const service = await loadModule('src/services/manga-service.js', {
    '@/boot/firebase': { db, requireFirebase: () => ({ auth: { currentUser: { uid } } }) },
    '@/utils/spark-budget': {
      SPARK_LIMITS,
      sparkBudget: {
        take(kind) {
          budget.take(kind)
          if (kind === 'read') metrics.readAdmissions++
        },
        record: (error) => budget.record(error),
      },
    },
    'firebase/firestore': {
      ...sdk,
      runTransaction(database, callback, options) {
        assert.equal(options.maxAttempts, 3)
        return sdk.runTransaction(
          database,
          async (transaction) => {
            metrics.attempts++
            return callback({
              async get(ref) {
                metrics.sdkReads++
                const snapshot = await transaction.get(ref)
                // A real concurrent commit invalidates the first read version.
                // The SDK itself must retry; no synthetic retry adapter is used.
                if (metrics.attempts === 1) {
                  if (route === 'import') {
                    await sdk.setDoc(concurrentReference, {
                      ...initial(),
                      chapter: '10',
                      notes: 'Concurrent',
                    })
                  } else {
                    await sdk.updateDoc(concurrentReference, {
                      ...(route === 'edit' ? {} : { chapter: '10' }),
                      notes: 'Concurrent',
                      updatedAt: sdk.serverTimestamp(),
                    })
                  }
                }
                return snapshot
              },
              set: (...args) => transaction.set(...args),
              update: (...args) => transaction.update(...args),
            })
          },
          options,
        )
      },
    },
  })
  const operate = () =>
    route === 'chapter'
      ? service.changeMangaChapter(uid, id, 1)
      : route === 'edit'
        ? service.updateManga(uid, id, { chapter: '2' }, { expectedValues: { chapter: '1' } })
        : service.createManga(uid, { name: 'Synthetic', chapter: '1' }, { importDocumentId: id })
  return { operate, metrics, reference }
}

test(
  'real transaction retries admit every SDK read and preserve concurrent data',
  { timeout: 120000 },
  async () => {
    const results = []
    for (const route of routes) {
      const f = await fixture(route)
      await f.operate()
      const data = (await sdk.getDocFromServer(f.reference)).data()
      assert.equal(data.notes, 'Concurrent')
      assert.equal(data.chapter, route === 'chapter' ? '11' : route === 'edit' ? '2' : '10')
      assert.equal(f.metrics.attempts, 2)
      assert.equal(f.metrics.sdkReads, 2)
      results.push(f.metrics)
    }
    await mkdir('test-results', { recursive: true })
    await writeFile(
      'test-results/transaction-budget.json',
      JSON.stringify(
        {
          measuredAt: new Date().toISOString(),
          node: process.version,
          scope: 'synthetic emulator; SDK get calls and local admissions, not billed reads',
          results,
        },
        null,
        2,
      ) + '\n',
    )
    console.log(JSON.stringify(results))
    for (const row of results) assert.equal(row.readAdmissions, row.sdkReads, row.route)
  },
)

test(
  'exhaustion on a real retry stops before a second SDK read and preserves the other writer',
  { timeout: 120000 },
  async () => {
    for (const route of routes) {
      const f = await fixture(route, 1)
      await assert.rejects(f.operate(), { code: 'app/request-budget' })
      assert.equal(f.metrics.attempts, 2)
      assert.equal(f.metrics.sdkReads, 1)
      assert.equal(f.metrics.readAdmissions, 1)
      const data = (await sdk.getDocFromServer(f.reference)).data()
      assert.equal(data.notes, 'Concurrent')
      assert.equal(data.chapter, route === 'edit' ? '1' : '10')
    }
  },
)

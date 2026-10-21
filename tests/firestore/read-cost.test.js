import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { performance } from 'node:perf_hooks'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import * as sdk from 'firebase/firestore'
import { loadModule } from '../helpers/load-module.js'
import { SPARK_LIMITS, createSparkBudget } from '../../src/utils/spark-budget.js'

test(
  'compare 500/1000 ranges with real rules, updates, reconnect and reopen',
  { timeout: 240000 },
  async () => {
    assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8188')
    const env = await initializeTestEnvironment({
      projectId: 'demo-mangalist-read-cost',
      firestore: {
        host: '127.0.0.1',
        port: 8188,
        rules: await readFile('firestore.rules', 'utf8'),
      },
    })
    const results = []
    const wait = async (predicate) => {
      const deadline = Date.now() + 60000
      while (!predicate()) {
        assert.ok(Date.now() < deadline, 'Timed out waiting for server confirmation')
        await new Promise((resolve) => setTimeout(resolve, 20))
      }
    }
    try {
      for (const size of [0, 100, 1000, 5000, 10000]) {
        const uid = `synthetic-${size}`
        await env.withSecurityRulesDisabled(async (context) => {
          const db = context.firestore()
          for (let offset = 0; offset < size; offset += 400) {
            const batch = sdk.writeBatch(db)
            for (let i = offset; i < Math.min(size, offset + 400); i++) {
              batch.set(sdk.doc(db, 'users', uid, 'mangas', String(i).padStart(6, '0')), {
                schemaVersion: 1,
                name: `Synthetic ${i}`,
                normalizedName: `synthetic ${i}`,
                chapter: '1',
                type: 'manga',
                genres: [],
                readingStatus: 'following',
                publicationStatus: 'unknown',
                sources: [],
                notes: '',
                favorite: false,
                createdAt: sdk.Timestamp.fromMillis(1700000000000),
                updatedAt: sdk.Timestamp.fromMillis(1700000000000),
              })
            }
            await batch.commit()
          }
        })
        for (const pageDocuments of [500, 1000]) {
          const db = env.authenticatedContext(uid).firestore()
          const ref = sdk.collection(db, 'users', uid, 'mangas')
          let latest,
            failure,
            targets = 0,
            initialDocuments = 0,
            active = 0,
            exportRequests = 0,
            exportDocuments = 0
          let admissionTime = 0
          const budget = createSparkBudget(() => admissionTime)
          const service = await loadModule('tests/helpers/ml06-library-cursors.js', {
            '@/utils/spark-budget': {
              SPARK_LIMITS: { ...SPARK_LIMITS, pageDocuments },
              sparkBudget: budget,
            },
            'firebase/firestore': {
              ...sdk,
              onSnapshot(q, options, next, fail) {
                targets++
                active++
                let firstServer = true
                const stop = sdk.onSnapshot(
                  q,
                  options,
                  (snapshot) => {
                    if (!snapshot.metadata.fromCache && firstServer) {
                      initialDocuments += snapshot.size
                      firstServer = false
                    }
                    next(snapshot)
                  },
                  fail,
                )
                return () => {
                  active--
                  stop()
                }
              },
              async getDocsFromServer(q) {
                exportRequests++
                const snapshot = await sdk.getDocsFromServer(q)
                exportDocuments += snapshot.size
                return snapshot
              },
            },
          })
          const start = () =>
            service.subscribeCursorLibrary(
              ref,
              (d) => ({ id: d.id, ...d.data() }),
              (items, metadata) => {
                latest = { items, metadata }
              },
              (error) => {
                failure = error
              },
            )
          let stop = start()
          const started = performance.now()
          try {
            await wait(() => failure || (latest?.metadata.complete && !latest.metadata.fromCache))
            assert.equal(failure, undefined)
            assert.equal(latest.items.length, size)
            const pages = Math.max(1, Math.ceil(size / pageDocuments))
            assert.equal(targets, 2 * pages - 1)
            assert.equal(active, pages)
            assert.equal(initialDocuments, size + (pageDocuments + 1) * (pages - 1))
            const row = {
              size,
              pageDocuments,
              targets,
              active,
              initialDocuments,
              initialMs: Math.round(performance.now() - started),
            }
            const exported = await service.fetchCursorLibrary(
              ref,
              (d) => d.id,
              () => {},
            )
            assert.equal(new Set(exported).size, size)
            assert.equal(exportRequests, pages)
            assert.equal(exportDocuments, size + pages - 1)
            Object.assign(row, { exportRequests, exportDocuments })
            if (size === 10000) {
              const before = targets
              const writer = env.authenticatedContext(uid).firestore()
              await sdk.updateDoc(sdk.doc(writer, 'users', uid, 'mangas', '005000'), {
                chapter: '2',
                updatedAt: sdk.serverTimestamp(),
              })
              await wait(
                () =>
                  latest.items.find((d) => d.id === '005000')?.chapter === '2' &&
                  !latest.metadata.hasPendingWrites,
              )
              assert.equal(targets, before)
              row.updateNewTargets = targets - before
              await sdk.disableNetwork(db)
              await wait(() => latest.metadata.fromCache)
              await sdk.enableNetwork(db)
              await wait(() => !latest.metadata.fromCache)
              assert.equal(latest.items.length, size)
              assert.equal(targets, before)
              row.reconnectNewApplicationTargets = targets - before
              row.reconnectBillingReads = 'not measurable by emulator'
              stop()
              assert.equal(active, 0)
              // Advance only the local admission clock before a full reopen.
              admissionTime = 60000
              latest = undefined
              const beforeDocs = initialDocuments
              stop = start()
              await wait(() => failure || (latest?.metadata.complete && !latest.metadata.fromCache))
              assert.equal(failure, undefined)
              assert.equal(latest.items.length, size)
              row.reopenTargets = targets - before
              row.reopenInitialDocuments = initialDocuments - beforeDocs
              await sdk.updateDoc(sdk.doc(writer, 'users', uid, 'mangas', '005000'), {
                chapter: '1',
                updatedAt: sdk.serverTimestamp(),
              })
            }
            results.push(row)
          } finally {
            stop()
          }
          assert.equal(active, 0)
        }
      }
      await mkdir('test-results', { recursive: true })
      await writeFile(
        'test-results/firestore-read-cost.json',
        JSON.stringify(
          {
            base: '68ad672',
            measuredAt: new Date().toISOString(),
            node: process.version,
            scope: 'synthetic local emulator; initial server snapshot documents, not billed reads',
            results,
          },
          null,
          2,
        ) + '\n',
      )
      console.log(JSON.stringify(results))
    } finally {
      await env.cleanup()
    }
  },
)

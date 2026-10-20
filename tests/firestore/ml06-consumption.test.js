import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import * as sdk from 'firebase/firestore'
import { createPinia, setActivePinia } from 'pinia'
import { reactive } from 'vue'
import { loadModule } from '../helpers/load-module.js'
import { createSparkBudget, SPARK_LIMITS } from '../../src/utils/spark-budget.js'

const sizes = [0, 100, 1000, 2500, 5000, 10000]
const wait = async (predicate) => {
  const deadline = Date.now() + 60000
  while (!predicate()) {
    assert.ok(Date.now() < deadline, 'Timed out waiting for confirmed emulator data')
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
}

test(
  'ML-06: measured service scenarios with isolated clients and real rules',
  { timeout: 300000 },
  async () => {
    // Fail before creating a Firebase context if the local runner was not used.
    assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8188')
    const env = await initializeTestEnvironment({
      projectId: 'demo-mangalist-ml06',
      firestore: {
        host: '127.0.0.1',
        port: 8188,
        rules: await readFile('firestore.rules', 'utf8'),
      },
    })
    const results = []
    try {
      for (const size of sizes) {
        const uid = `ml06-${size}`
        await env.withSecurityRulesDisabled(async (context) => {
          const db = context.firestore()
          for (let offset = 0; offset < size; offset += 400) {
            const batch = sdk.writeBatch(db)
            for (let i = offset; i < Math.min(size, offset + 400); i++) {
              batch.set(sdk.doc(db, 'users', uid, 'mangas', String(i).padStart(6, '0')), {
                schemaVersion: 1,
                name: `Synthetic ${i}`,
                normalizedName: `synthetic-${i}`,
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
        const client = async () => {
          const db = env.authenticatedContext(uid).firestore()
          const events = []
          const metrics = {
            targets: 0,
            active: 0,
            firstServerDocuments: 0,
            queryCalls: 0,
            queryDocuments: 0,
            transactionGets: 0,
            read: 0,
            write: 0,
            listen: 0,
          }
          let phase = 'initial',
            latest,
            failure,
            clock = 0
          const budget = createSparkBudget(() => clock)
          const service = await loadModule('src/services/manga-service.js', {
            '@/boot/firebase': { db, requireFirebase: () => ({ auth: { currentUser: { uid } } }) },
            '@/utils/spark-budget': {
              SPARK_LIMITS,
              sparkBudget: {
                take(kind) {
                  budget.take(kind)
                  metrics[kind]++
                },
                record: (error) => budget.record(error),
              },
            },
            'firebase/firestore': {
              ...sdk,
              onSnapshot(q, options, next, fail) {
                metrics.targets++
                metrics.active++
                let first = true
                const stop = sdk.onSnapshot(
                  q,
                  options,
                  (snapshot) => {
                    if (!snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites) {
                      if (first) metrics.firstServerDocuments += snapshot.size
                      events.push({
                        phase,
                        first,
                        documents: snapshot.size,
                        changes: snapshot.docChanges().map((d) => ({ type: d.type, id: d.doc.id })),
                      })
                      first = false
                    }
                    next(snapshot)
                  },
                  fail,
                )
                return () => {
                  metrics.active--
                  stop()
                }
              },
              async getDocsFromServer(q) {
                metrics.queryCalls++
                const snapshot = await sdk.getDocsFromServer(q)
                metrics.queryDocuments += snapshot.size
                return snapshot
              },
              async getDocs(q) {
                metrics.queryCalls++
                const snapshot = await sdk.getDocs(q)
                metrics.queryDocuments += snapshot.size
                return snapshot
              },
              runTransaction(database, callback, options) {
                return sdk.runTransaction(
                  database,
                  (transaction) =>
                    callback({
                      get(ref) {
                        metrics.transactionGets++
                        return transaction.get(ref)
                      },
                      update: (...args) => transaction.update(...args),
                      set: (...args) => transaction.set(...args),
                    }),
                  options,
                )
              },
            },
          })
          const start = () =>
            service.subscribeToMangas(
              uid,
              (items, metadata) => {
                latest = { items, metadata }
              },
              (error) => {
                failure = error
              },
            )
          let stop = start()
          const ready = async () => {
            await wait(
              () =>
                failure ||
                (latest?.metadata.complete &&
                  !latest.metadata.fromCache &&
                  !latest.metadata.hasPendingWrites),
            )
            assert.equal(failure, undefined)
            assert.equal(latest.items.length, size)
          }
          await ready()
          return {
            db,
            service,
            metrics,
            events,
            ready,
            get latest() {
              return latest
            },
            phase(value) {
              phase = value
            },
            stop() {
              stop()
            },
            async reopen() {
              stop()
              latest = undefined
              clock += 60000
              stop = start()
              await ready()
            },
          }
        }
        const first = await client()
        let second
        try {
          const pages = Math.max(1, Math.ceil(size / 1000))
          const initial = { ...first.metrics }
          assert.equal(initial.targets, 2 * pages - 1)
          assert.equal(initial.active, pages)
          assert.equal(initial.firstServerDocuments, size + 1001 * (pages - 1))
          assert.equal(initial.read, initial.targets)

          // Execute the real Pinia getters/actions over the measured service's data.
          setActivePinia(createPinia())
          const settings = reactive({ sortBy: 'name-asc' })
          const module = await loadModule('src/stores/manga-store.js', {
            '@/services/manga-service': first.service,
            '@/stores/settings-store': { useSettingsStore: () => settings },
          })
          const store = module.useMangaStore()
          store.mangas = first.latest.items
          const before = { ...first.metrics }
          store.setSearchQuery('synthetic 9')
          assert.equal(
            store.filteredMangas.length,
            first.latest.items.filter((m) => m.normalizedName.includes('synthetic-9')).length,
          )
          store.setFilters({ favoritesOnly: true })
          assert.equal(store.filteredMangas.length, 0)
          store.setSearchQuery('')
          store.resetFilters()
          for (const [filters, count] of [
            [{ readingStatus: 'following' }, size],
            [{ readingStatus: 'pending' }, 0],
            [{ type: 'manga' }, size],
            [{ type: 'manhwa' }, 0],
            [{ genres: ['Acción', 'Drama'] }, 0],
          ]) {
            store.resetFilters()
            store.setFilters(filters)
            assert.equal(store.filteredMangas.length, count)
          }
          store.resetFilters()
          for (const sort of [
            'name-asc',
            'name-desc',
            'chapter-desc',
            'created-desc',
            'updated-desc',
          ]) {
            settings.sortBy = sort
            assert.equal(store.filteredMangas.length, size)
          }
          let visited = 0
          const view = store.filteredMangas
          for (let page = 0; page < Math.ceil(size / 24); page++)
            visited += view.slice(page * 24, (page + 1) * 24).length
          assert.equal(visited, size)
          assert.deepEqual(first.metrics, before)
          const local = {
            searches: 2,
            filterChanges: 13,
            sorts: 5,
            visualPages: Math.ceil(size / 24),
            extraSdkCalls: 0,
            extraAdmissions: 0,
          }

          first.phase('export')
          const { mangas: exported } = await first.service.fetchLibraryForExport(uid)
          assert.equal(new Set(exported.map((m) => m.id)).size, size)
          const exportMetrics = {
            requests: first.metrics.queryCalls,
            documents: first.metrics.queryDocuments,
            admissions: first.metrics.read - before.read,
          }
          assert.equal(exportMetrics.requests, pages)
          assert.equal(exportMetrics.documents, size + pages - 1)

          const duplicates = []
          for (const name of ['Synthetic 0', 'Not present', '']) {
            const prev = { ...first.metrics }
            const found = await first.service.findMangasByNormalizedName(uid, name)
            duplicates.push({
              name,
              matches: found.length,
              requests: first.metrics.queryCalls - prev.queryCalls,
              documents: first.metrics.queryDocuments - prev.queryDocuments,
              admissions: first.metrics.read - prev.read,
            })
          }
          assert.equal(duplicates[0].matches, size ? 1 : 0)
          assert.equal(duplicates[1].matches, 0)
          assert.equal(duplicates[2].requests, 0)
          assert.equal(duplicates[2].admissions, 1)

          second = await client()
          assert.deepEqual(second.metrics, initial)
          let update = null
          if (size) {
            first.phase('update')
            second.phase('update')
            const prev = { ...first.metrics }
            await first.service.changeMangaChapter(uid, '000000', 1)
            await wait(() =>
              [first, second].every(
                (c) =>
                  c.latest.items.find((m) => m.id === '000000')?.chapter === '2' &&
                  !c.latest.metadata.hasPendingWrites,
              ),
            )
            // Let server-only listener callbacks settle before changing phase.
            await new Promise((resolve) => setTimeout(resolve, 100))
            update = {
              transactionGets: first.metrics.transactionGets - prev.transactionGets,
              admissions: first.metrics.read - prev.read,
              writeAdmissions: first.metrics.write - prev.write,
              newTargets: first.metrics.targets - prev.targets,
              observerModifiedDocuments: second.events
                .filter((e) => e.phase === 'update')
                .flatMap((e) => e.changes)
                .filter((d) => d.type === 'modified').length,
            }
            assert.equal(update.transactionGets, 1)
            assert.equal(update.admissions, 1)
            assert.equal(update.newTargets, 0)
            assert.equal(update.observerModifiedDocuments, 1)
          }
          first.phase('reconnect')
          const preReconnect = { ...first.metrics }
          await sdk.disableNetwork(first.db)
          await wait(() => first.latest.metadata.fromCache)
          await sdk.enableNetwork(first.db)
          await first.ready()
          assert.deepEqual(first.metrics, preReconnect)
          const reconnect = {
            newTargets: 0,
            admissions: 0,
            billedReads: null,
            modeledDocumentReadsWithoutPersistence: Math.max(1, size),
          }
          first.phase('reopen')
          const preReopen = { ...first.metrics }
          await first.reopen()
          const reopen = {
            targets: first.metrics.targets - preReopen.targets,
            firstServerDocuments:
              first.metrics.firstServerDocuments - preReopen.firstServerDocuments,
            admissions: first.metrics.read - preReopen.read,
          }
          assert.equal(reopen.targets, initial.targets)
          assert.equal(reopen.firstServerDocuments, initial.firstServerDocuments)
          results.push({
            size,
            pages,
            initial,
            local,
            export: exportMetrics,
            duplicates,
            independentSecondClient: { ...initial },
            update,
            reconnect,
            reopen,
            confirmedSnapshotEvents: first.events.length + second.events.length,
          })
        } finally {
          first.stop()
          second?.stop()
          assert.equal(first.metrics.active, 0)
          if (second) assert.equal(second.metrics.active, 0)
        }
      }
      await mkdir('test-results', { recursive: true })
      const lock = JSON.parse(await readFile('package-lock.json', 'utf8'))
      await writeFile(
        'test-results/ml06-consumption.json',
        JSON.stringify(
          {
            measuredAt: new Date().toISOString(),
            base: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
            node: process.version,
            firebase: lock.packages['node_modules/firebase'].version,
            scope:
              'Synthetic local emulator; SDK observations, NOT production billing. Two independent SDK contexts proxy tabs; no browser tab sharing measurement.',
            billedReadsMeasured: false,
            fixtureWritesExcluded: true,
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

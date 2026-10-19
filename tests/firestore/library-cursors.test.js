import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing'
import * as firestore from 'firebase/firestore'
import {
  collection,
  doc,
  writeBatch,
  Timestamp,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  getDocsFromServer,
  query,
  orderBy,
  documentId,
  limit,
  startAfter,
} from 'firebase/firestore'
import { loadModule } from '../helpers/load-module.js'
import { createSparkBudget, SPARK_LIMITS } from '../../src/utils/spark-budget.js'
import { createLibraryExport } from '../../src/services/export-service.js'
import { createImportPreview } from '../../src/services/import-service.js'

let environment
before(async () => {
  const address = process.env.FIRESTORE_EMULATOR_HOST
  assert.equal(address, '127.0.0.1:8188', 'Explicit isolated emulator required')
  environment = await initializeTestEnvironment({
    projectId: 'demo-mangalist-cursors',
    firestore: {
      host: '127.0.0.1',
      port: 8188,
      rules: await readFile(new URL('../../firestore.rules', import.meta.url), 'utf8'),
    },
  })
})
after(async () => environment?.cleanup())
const uid = 'cursor-alice'
const key = (i) => String(i).padStart(6, '0')
function manga(i) {
  return {
    schemaVersion: 1,
    name: `Obra ${key(i)}`,
    normalizedName: `obra ${key(i)}`,
    chapter: String(i),
    type: i % 2 ? 'manga' : 'manhwa',
    genres: ['Acción'],
    readingStatus: 'following',
    publicationStatus: 'publishing',
    sources: [],
    notes: 'Synthetic emulator data',
    favorite: false,
    createdAt: Timestamp.fromMillis(1700000000000),
    updatedAt: Timestamp.fromMillis(1700000000000),
  }
}

async function seedMangas(owner, size) {
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    for (let offset = 0; offset < size; offset += 400) {
      const batch = writeBatch(db)
      for (let i = offset; i < Math.min(offset + 400, size); i++)
        batch.set(doc(db, 'users', owner, 'mangas', key(i)), manga(i))
      await batch.commit()
    }
  })
}

// The 5000-document case counts SDK requests without throttling fixture setup.
// The 10000-document case below uses the real admission budget with a controlled clock.
test(
  '5000-document emulator library: cursors, live boundaries, complete JSON/CSV and isolation',
  { timeout: 180000 },
  async () => {
    await environment.clearFirestore()
    await seedMangas(uid, 5000)
    const db = environment.authenticatedContext(uid).firestore()
    const ref = collection(db, 'users', uid, 'mangas')
    let reads = 0
    const service = await loadModule('src/services/manga-service.js', {
      '@/boot/firebase': { db, requireFirebase: () => ({ auth: { currentUser: { uid } } }) },
      '@/utils/spark-budget': {
        SPARK_LIMITS,
        sparkBudget: {
          take: (kind) => {
            if (kind === 'read') reads++
          },
          record: (e) => e,
        },
      },
    })
    const snapshots = [],
      errors = []
    const waitFor = async (predicate) => {
      const deadline = Date.now() + 60000
      while (Date.now() < deadline) {
        if (errors.length) throw errors[0]
        const found = snapshots.at(-1)
        if (found && predicate(found)) return found
        await new Promise((resolve) => setTimeout(resolve, 25))
      }
      assert.fail('Timed out waiting for complete cursor ranges')
    }
    const stop = service.subscribeToMangas(
      uid,
      (items, metadata) => snapshots.push({ items, metadata }),
      (e) => errors.push(e),
    )
    try {
      const initial = await waitFor((s) => s.metadata.complete && s.items.length === 5000)
      assert.equal(new Set(initial.items.map((item) => item.id)).size, 5000)
      assert.equal(initial.metadata.fromCache, false)
      assert.ok(reads <= 21, `Unexpected listener cost: ${reads}`)
      // Delete the ID used as a range cursor; update a title/chapter across sort positions;
      // insert before the first boundary and beyond the last boundary from another client.
      const otherDb = environment.authenticatedContext(uid).firestore()
      await deleteDoc(doc(otherDb, 'users', uid, 'mangas', key(999)))
      await updateDoc(doc(otherDb, 'users', uid, 'mangas', key(2500)), {
        name: 'AAA edited',
        normalizedName: 'aaa edited',
        chapter: '9001',
        updatedAt: serverTimestamp(),
      })
      await setDoc(doc(otherDb, 'users', uid, 'mangas', '000100-new'), {
        ...manga(8000),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      await setDoc(doc(otherDb, 'users', uid, 'mangas', 'zz-tail'), {
        ...manga(8001),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      const changed = await waitFor(
        (s) =>
          s.metadata.complete &&
          s.items.length === 5001 &&
          s.items.some((item) => item.id === 'zz-tail') &&
          s.items.find((item) => item.id === key(2500))?.chapter === '9001',
      )
      assert.equal(
        changed.items.some((item) => item.id === key(999)),
        false,
      )
      assert.equal(new Set(changed.items.map((item) => item.id)).size, 5001)
      const copy = await service.fetchLibraryForExport(uid)
      assert.equal(copy.mangas.length, 5001)
      assert.equal(new Set(copy.mangas.map((item) => item.id)).size, 5001)
      for (const format of ['json', 'csv']) {
        const payload = createLibraryExport(copy.mangas, format, {
          verification: copy.verification,
        })
        const preview = createImportPreview(payload.content, { format })
        assert.equal(preview.summary.valid, 5001)
        assert.equal(
          preview.items.find((item) => item.manga.name === 'AAA edited').manga.chapter,
          '9001',
        )
      }
      // Existing deployed rules accept every cursor page, reject other identities and unbounded reads.
      await assertFails(
        getDocsFromServer(
          query(
            collection(environment.authenticatedContext('bob').firestore(), 'users', uid, 'mangas'),
            orderBy(documentId()),
            startAfter(key(500)),
            limit(501),
          ),
        ),
      )
      await assertFails(
        getDocsFromServer(
          query(
            collection(environment.unauthenticatedContext().firestore(), 'users', uid, 'mangas'),
            limit(501),
          ),
        ),
      )
      await assertFails(getDocsFromServer(ref))
      await assertFails(getDocsFromServer(query(ref, limit(1002))))
      assert.deepEqual(errors, [])
      console.log(
        JSON.stringify({
          documents: 5001,
          listenerAndExportRequests: reads,
          jsonAndCsvRoundTrip: true,
          productionRequests: 0,
        }),
      )
    } finally {
      stop()
    }
  },
)

test(
  '10000-document emulator library obeys the real admission budget, quota pause and document cap',
  { timeout: 300000 },
  async () => {
    const owner = 'cursor-ten-thousand'
    await seedMangas(owner, 10000)
    const db = environment.authenticatedContext(owner).firestore()
    let now = 0
    const budget = createSparkBudget(() => now)
    const admissions = { read: 0, listen: 0 }
    let exportCalls = 0
    let failExportAt = Infinity
    const activeTargets = new Set()
    const service = await loadModule('src/services/manga-service.js', {
      '@/boot/firebase': { db, requireFirebase: () => ({ auth: { currentUser: { uid: owner } } }) },
      '@/utils/spark-budget': {
        SPARK_LIMITS,
        sparkBudget: {
          take(kind) {
            budget.take(kind)
            admissions[kind] = (admissions[kind] || 0) + 1
          },
          record: (error) => budget.record(error),
        },
      },
      'firebase/firestore': {
        ...firestore,
        onSnapshot(...args) {
          const target = {}
          const stop = firestore.onSnapshot(...args)
          activeTargets.add(target)
          return () => {
            activeTargets.delete(target)
            stop()
          }
        },
        getDocsFromServer(q) {
          exportCalls++
          // The emulator has no Spark quota. Inject only this failure; every
          // successful page still uses the real SDK, rules and emulator data.
          if (exportCalls === failExportAt)
            throw Object.assign(new Error('Synthetic quota failure'), {
              code: 'resource-exhausted',
            })
          return firestore.getDocsFromServer(q)
        },
      },
    })
    let latest
    const errors = []
    const waitFor = async (predicate) => {
      const deadline = Date.now() + 60000
      while (Date.now() < deadline) {
        if (predicate()) return
        await new Promise((resolve) => setTimeout(resolve, 25))
      }
      assert.fail('Timed out waiting for the 10000-document library or its limit error')
    }
    const stop = service.subscribeToMangas(
      owner,
      (items, metadata) => {
        latest = { items, metadata }
      },
      (error) => errors.push(error),
    )
    try {
      await waitFor(
        () => errors.length || (latest?.metadata.complete && latest.items.length === 10000),
      )
      assert.deepEqual(errors, [])
      assert.equal(new Set(latest.items.map((item) => item.id)).size, 10000)
      assert.equal(latest.metadata.fromCache, false)
      assert.equal(admissions.listen, 1)
      assert.equal(admissions.read, 19)
      assert.equal(activeTargets.size, 10)

      const copy = await service.fetchLibraryForExport(owner)
      assert.equal(copy.mangas.length, 10000)
      assert.equal(new Set(copy.mangas.map((item) => item.id)).size, 10000)
      assert.equal(exportCalls, 10)
      assert.equal(admissions.read, 29)
      for (const format of ['json', 'csv']) {
        const payload = createLibraryExport(copy.mangas, format, {
          verification: copy.verification,
        })
        const preview = createImportPreview(payload.content, { format })
        assert.equal(preview.summary.valid, 10000)
        assert.equal(
          preview.items.find((item) => item.manga.name === 'Obra 009999').manga.chapter,
          '9999',
        )
      }

      // Leave one admission after accounting for unrelated operations.
      while (admissions.read < 59) {
        budget.take('read')
        admissions.read++
      }
      // The same minute has one admission left. A second export fails after
      // its first page instead of returning that page as a complete copy.
      await assert.rejects(service.fetchLibraryForExport(owner), { code: 'app/request-budget' })
      assert.equal(exportCalls, 11)
      assert.equal(admissions.read, 60)
      now = 60000
      assert.equal((await service.fetchLibraryForExport(owner)).mangas.length, 10000)

      failExportAt = exportCalls + 2
      await assert.rejects(service.fetchLibraryForExport(owner), { code: 'resource-exhausted' })
      const callsAtQuota = exportCalls
      await assert.rejects(service.fetchLibraryForExport(owner), { code: 'app/quota-paused' })
      assert.throws(() => budget.take('write'), { code: 'app/quota-paused' })
      now += 15 * 60000 - 1
      await assert.rejects(service.fetchLibraryForExport(owner), { code: 'app/quota-paused' })
      assert.equal(exportCalls, callsAtQuota)
      now++
      assert.equal((await service.fetchLibraryForExport(owner)).mangas.length, 10000)
      assert.deepEqual(errors, [])

      // Growth beyond the documented cap must stop every actual listener and
      // retain only the last complete snapshot, never publish 10001 as complete.
      await setDoc(doc(db, 'users', owner, 'mangas', 'zz-over-limit'), {
        ...manga(10000),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      await waitFor(() => errors.length)
      assert.equal(errors.length, 1)
      assert.equal(errors[0].code, 'app/library-budget')
      assert.equal(activeTargets.size, 0)
      assert.equal(latest.items.length, 10000)
      await assert.rejects(service.fetchLibraryForExport(owner), { code: 'app/library-budget' })
      console.log(
        JSON.stringify({
          documents: 10000,
          initialListenerAdmissions: 19,
          firstExportAdmissions: 10,
          activeRanges: 10,
          jsonAndCsvRoundTrip: true,
          budgetFailureAfterOnePage: true,
          injectedQuotaPauseMs: 15 * 60000,
          rejectedDocumentCount: 10001,
          remainingListenersAfterLimit: activeTargets.size,
          productionRequests: 0,
        }),
      )
    } finally {
      stop()
    }
  },
)

test(
  '1001-row import resumes after interruption and re-export contains every row once',
  { timeout: 180000 },
  async () => {
    const importUid = 'cursor-import'
    const db = environment.authenticatedContext(importUid).firestore()
    const service = await loadModule('src/services/manga-service.js', {
      '@/boot/firebase': {
        db,
        requireFirebase: () => ({ auth: { currentUser: { uid: importUid } } }),
      },
      '@/utils/spark-budget': { SPARK_LIMITS, sparkBudget: { take() {}, record: (e) => e } },
    })
    const { createRecoverableImportPreview } = await import('../../src/services/import-service.js')
    const data = Array.from({ length: 1001 }, (_, i) => ({
      name: `Import ${key(i)}`,
      chapter: String(i),
      notes: `row ${i}`,
    }))
    const content = JSON.stringify(data)
    const first = await createRecoverableImportPreview(content, { uid: importUid, format: 'json' })
    const commit = (item) =>
      service.createManga(importUid, item.manga, { importDocumentId: item.importDocumentId })
    for (let start = 0; start < 504; start += 8)
      await Promise.all(first.items.slice(start, start + 8).map(commit))
    // A fresh preview after interruption regenerates the same IDs without retained state.
    const recovered = await createRecoverableImportPreview(content, {
      uid: importUid,
      format: 'json',
    })
    for (let start = 0; start < recovered.items.length; start += 8)
      await Promise.all(recovered.items.slice(start, start + 8).map(commit))
    const copy = await service.fetchLibraryForExport(importUid)
    assert.equal(copy.mangas.length, 1001)
    assert.equal(new Set(copy.mangas.map((item) => item.id)).size, 1001)
    assert.equal(copy.mangas.find((item) => item.name === 'Import 001000').notes, 'row 1000')
    const repeated = await createRecoverableImportPreview(content, {
      uid: importUid,
      format: 'json',
      existingMangas: copy.mangas,
    })
    assert.equal(repeated.summary.duplicates, 1001)
    for (const format of ['json', 'csv']) {
      const payload = createLibraryExport(copy.mangas, format, { verification: copy.verification })
      assert.equal(
        createImportPreview(payload.content, { format, existingMangas: copy.mangas }).summary
          .duplicates,
        1001,
      )
    }
    console.log(
      JSON.stringify({ importedRows: 1001, interruptedAfter: 504, documentsAfterReplay: 1001 }),
    )
  },
)

import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing'
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
import { SPARK_LIMITS } from '../../src/utils/spark-budget.js'
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

// This integration suite deliberately counts SDK requests without throttling fixture setup.
// Real admission/quota failure paths are tested independently in spark.test.js.
test(
  '5000-document emulator library: cursors, live boundaries, complete JSON/CSV and isolation',
  { timeout: 180000 },
  async () => {
    await environment.clearFirestore()
    await environment.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      for (let offset = 0; offset < 5000; offset += 400) {
        const batch = writeBatch(db)
        for (let i = offset; i < Math.min(offset + 400, 5000); i++)
          batch.set(doc(db, 'users', uid, 'mangas', key(i)), manga(i))
        await batch.commit()
      }
    })
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
      await deleteDoc(doc(otherDb, 'users', uid, 'mangas', key(499)))
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
        changed.items.some((item) => item.id === key(499)),
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

import test from 'node:test'
import assert from 'node:assert/strict'
import * as firestore from 'firebase/firestore'
import {
  createRecoverableImportPreview,
  prepareImportSelection,
} from '../src/services/import-service.js'
import { loadModule } from './helpers/load-module.js'

const content = JSON.stringify([
  { name: 'First', chapter: '1', url: 'https://example.test' },
  { name: 'First', chapter: '2' },
])
const options = { uid: 'alice', format: 'json' }

test('import IDs survive a new preview and source IDs but separate accounts, formats and edited files', async () => {
  const first = await createRecoverableImportPreview(content, options)
  const fresh = await createRecoverableImportPreview(content, {
    ...options,
    fileName: 'renamed.json',
  })
  const ids = (preview) => preview.items.map((item) => item.importDocumentId)
  assert.deepEqual(ids(first), ids(fresh))
  assert.notEqual(ids(first)[0], ids(first)[1])
  assert.notEqual(first.items[0].manga.sources[0].id, fresh.items[0].manga.sources[0].id)
  for (const [text, opts] of [
    [content + '\n', options],
    [content, { ...options, uid: 'bob' }],
  ]) {
    assert.notDeepEqual(ids(first), ids(await createRecoverableImportPreview(text, opts)))
  }
  const txt = await createRecoverableImportPreview('First | 1', { ...options, format: 'txt' })
  assert.notEqual(ids(txt)[0], ids(first)[0])
  await assert.rejects(createRecoverableImportPreview(content, { format: 'json' }), {
    code: 'app/invalid-account',
  })
})

test('a reselected file marks existing stable document IDs complete without relying on names', async () => {
  const first = await createRecoverableImportPreview(content, options)
  const fresh = await createRecoverableImportPreview(content, {
    ...options,
    existingMangas: [{ id: first.items[0].importDocumentId, name: 'Renamed after import' }],
  })
  assert.equal(fresh.ownerUid, 'alice')
  assert.equal(fresh.items[0].imported, true)
  assert.equal(fresh.items[0].status, 'duplicate')
  assert.equal(fresh.summary.new, 0)
  assert.equal(fresh.duplicates.length, 2)
  const selection = prepareImportSelection(fresh, {
    selectedIds: fresh.items.map((item) => item.id),
  })
  assert.deepEqual(
    selection.selectedItems.map((item) => item.id),
    ['import-record-2'],
  )
})

test('lost acknowledgement and a fresh service instance reuse the committed document and preserve later edits', async () => {
  const preview = await createRecoverableImportPreview(content, options)
  const item = preview.items[0]
  const documents = new Map()
  let sets = 0,
    loseAcknowledgement = true
  const overrides = {
    '@/boot/firebase': { db: {}, requireFirebase() {} },
    'firebase/firestore': {
      ...firestore,
      collection: (_db, ...parts) => parts.join('/'),
      doc: (parent, id) => ({ id, path: `${parent}/${id}` }),
      serverTimestamp: () => 'time',
      addDoc: () => {
        throw new Error('Import must not use random IDs')
      },
      runTransaction: async (_db, callback, config) => {
        assert.equal(config.maxAttempts, 3)
        await callback({
          get: async (ref) => ({ exists: () => documents.has(ref.path) }),
          set: (ref, data) => {
            sets++
            documents.set(ref.path, data)
          },
        })
        if (loseAcknowledgement) {
          loseAcknowledgement = false
          throw Object.assign(new Error('Lost response'), { code: 'unavailable' })
        }
      },
    },
  }
  const firstService = await loadModule('src/services/manga-service.js', overrides)
  await assert.rejects(firstService.createManga('alice', item.manga, item), { code: 'unavailable' })
  assert.equal(documents.size, 1)
  const saved = documents.values().next().value
  saved.chapter = '99'
  const freshService = await loadModule('src/services/manga-service.js', overrides)
  const freshPreview = await createRecoverableImportPreview(content, options)
  assert.equal(
    await freshService.createManga('alice', freshPreview.items[0].manga, freshPreview.items[0]),
    item.importDocumentId,
  )
  assert.equal(documents.size, 1)
  assert.equal(sets, 1)
  assert.equal(saved.chapter, '99')
  await assert.rejects(
    freshService.createManga('alice', item.manga, { importDocumentId: '../bad' }),
    { code: 'app/invalid-import-identity' },
  )
  assert.equal(sets, 1)
})

test('file preparation ignores a late result after reset or an account change', async () => {
  for (const scenario of ['reset', 'account']) {
    let resolveText
    const auth = { user: { uid: 'alice' } }
    const component = (
      await loadModule('src/pages/ImportExportPage.vue', {
        quasar: { useQuasar: () => ({ notify() {} }) },
        '@/stores/auth-store': { useAuthStore: () => auth },
        '@/stores/manga-store': { useMangaStore: () => ({ mangas: [] }) },
      })
    ).default
    const page = component.setup({}, { expose() {} })
    const pending = page.readFile({
      name: 'list.json',
      size: content.length,
      text: () =>
        new Promise((resolve) => {
          resolveText = resolve
        }),
    })
    if (scenario === 'reset') page.resetImport()
    else auth.user = { uid: 'bob' }
    resolveText(content)
    await pending
    assert.equal(page.preview.value, null)
    assert.equal(page.readingFile.value, false)
  }
})

test('confirmation rejects another account and stops future chunks after a session change', async () => {
  for (const changeBeforeConfirmation of [true, false]) {
    const auth = { user: { uid: 'alice' } }
    let writes = 0
    const component = (
      await loadModule('src/pages/ImportExportPage.vue', {
        quasar: { useQuasar: () => ({ notify() {} }) },
        '@/stores/auth-store': { useAuthStore: () => auth },
        '@/stores/manga-store': {
          useMangaStore: () => ({
            mangas: [],
            createManga: async (uid, _manga, identity) => {
              writes++
              assert.equal(uid, 'alice')
              assert.match(identity.importDocumentId, /^import-v1-/)
              auth.user = { uid: 'bob' }
            },
          }),
        },
      })
    ).default
    const page = component.setup({}, { expose() {} })
    const text = JSON.stringify(
      Array.from({ length: 9 }, (_, i) => ({ name: `Manga ${i}`, chapter: '1' })),
    )
    await page.readFile({ name: 'list.json', size: text.length, text: async () => text })
    if (changeBeforeConfirmation) auth.user = { uid: 'bob' }
    await page.importSelected()
    assert.equal(writes, changeBeforeConfirmation ? 0 : 8)
    assert.equal(page.preview.value.ownerUid, 'alice')
    assert.equal(page.importing.value, false)
  }
})

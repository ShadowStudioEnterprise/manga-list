import test from 'node:test'
import assert from 'node:assert/strict'
import { loadModule } from './helpers/load-module.js'
import { createLibraryExport } from '../src/services/export-service.js'
import { createRecoverableImportPreview } from '../src/services/import-service.js'
import {
  importByteLimit,
  partitionForAudit,
  recoveryFixture,
  verification,
} from '../scripts/model-ml08-recovery.mjs'

async function pageFixture(items = []) {
  const notifications = [],
    downloads = []
  const component = (
    await loadModule('src/pages/ImportExportPage.vue', {
      quasar: { useQuasar: () => ({ notify: (message) => notifications.push(message) }) },
      '@/stores/auth-store': { useAuthStore: () => ({ user: { uid: 'synthetic-restore' } }) },
      '@/stores/manga-store': { useMangaStore: () => ({ mangas: [] }) },
      '@/services/manga-service': {
        fetchLibraryForExport: async () => ({ mangas: items, verification }),
      },
      '@/services/export-service': {
        downloadLibraryExport: (...args) =>
          downloads.push(createLibraryExport(args[0], args[1], args[2])),
      },
    })
  ).default
  return { page: component.setup({}, { expose() {} }), notifications, downloads }
}

test('ML-08 recovery: actual page accepts exactly 5 MiB and rejects one more byte before reading', async () => {
  const record = JSON.stringify(recoveryFixture(1, 10))
  for (const extra of [0, 1]) {
    const { page, notifications } = await pageFixture()
    const content = record + ' '.repeat(importByteLimit + extra - Buffer.byteLength(record))
    let textReads = 0
    await page.readFile({
      name: 'boundary.json',
      size: Buffer.byteLength(content),
      text: async () => {
        textReads++
        return content
      },
    })
    assert.equal(textReads, extra ? 0 : 1)
    if (extra) {
      assert.equal(page.preview.value, null)
      assert.match(notifications.at(-1).message, /supera el límite/)
    } else assert.equal(page.preview.value.summary.valid, 1)
  }
})

test('ML-08 recovery: real export action can produce a file its import action rejects', async () => {
  const { page, downloads } = await pageFixture(recoveryFixture(1000, 5000))
  await page.exportLibrary('json')
  assert.equal(downloads.length, 1)
  const payload = downloads[0]
  assert.ok(Buffer.byteLength(payload.content) > importByteLimit)
  let textReads = 0
  await page.readFile({
    name: payload.fileName,
    size: Buffer.byteLength(payload.content),
    text: async () => {
      textReads++
      return payload.content
    },
  })
  assert.equal(textReads, 0)
  assert.equal(page.preview.value, null)
})

test('ML-08 recovery: byte-bounded Unicode parts preserve all exported fields and pass the actual page preview', async () => {
  const items = recoveryFixture(500, 5000, true)
  const parts = partitionForAudit(items)
  assert.ok(parts.length > 1)
  const expected = JSON.parse(
    createLibraryExport(items, 'json', { pretty: false, verification }).content,
  ).mangas
  assert.deepEqual(
    parts.flatMap((part) => JSON.parse(part.content).mangas),
    expected,
  )
  for (const part of parts) {
    const { page } = await pageFixture()
    const originals = JSON.parse(part.content).mangas
    await page.readFile({
      name: `part-${part.number}.json`,
      size: part.bytes,
      text: async () => part.content,
    })
    assert.equal(page.preview.value.summary.errors, 0)
    assert.equal(page.preview.value.summary.valid, part.records)
    for (const [index, item] of page.preview.value.items.entries()) {
      const original = originals[index]
      for (const key of [
        'name',
        'chapter',
        'notes',
        'favorite',
        'type',
        'readingStatus',
        'publicationStatus',
        'genres',
      ])
        assert.deepEqual(item.manga[key], original[key])
      assert.deepEqual(
        item.manga.sources.map(({ name, url, isPrimary }) => ({ name, url, isPrimary })),
        original.sources.map(({ name, url, isPrimary }) => ({ name, url, isPrimary })),
      )
    }
  }
  assert.throws(() => partitionForAudit(items, { byteLimit: 100 }), RangeError)
})

test('ML-08 recovery: immutable parts retain retry IDs; repartitioning changes them', async () => {
  const items = recoveryFixture(80, 10)
  const parts = partitionForAudit(items, { recordLimit: 40 })
  const options = { uid: 'synthetic-restore', format: 'json' }
  const first = await createRecoverableImportPreview(parts[0].content, options)
  const again = await createRecoverableImportPreview(parts[0].content, {
    ...options,
    fileName: 'renamed.json',
  })
  assert.deepEqual(
    first.items.map((item) => item.importDocumentId),
    again.items.map((item) => item.importDocumentId),
  )
  const changed = partitionForAudit(items, { recordLimit: 20 })
  const different = await createRecoverableImportPreview(changed[0].content, options)
  assert.equal(first.items[0].manga.name, different.items[0].manga.name)
  assert.notEqual(first.items[0].importDocumentId, different.items[0].importDocumentId)
})

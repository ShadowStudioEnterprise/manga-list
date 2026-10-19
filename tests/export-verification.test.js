import test from 'node:test'
import assert from 'node:assert/strict'
import * as firestore from 'firebase/firestore'
import { loadModule } from './helpers/load-module.js'
import { createLibraryExport } from '../src/services/export-service.js'
import { createImportPreview } from '../src/services/import-service.js'

const verification = {
  source: 'server',
  observedAtClient: '2026-10-18T08:00:00.000Z',
  hasPendingWrites: false,
}
const mangas = [{ id: 'one', name: 'One', chapter: '1', sources: [], genres: [], notes: 'Keep me' }]

test('verified JSON/CSV record provenance, remain importable and reject unsupported evidence', () => {
  for (const format of ['json', 'csv']) {
    const payload = createLibraryExport(mangas, format, { verification })
    assert.match(payload.fileName, /^mangalist-server-/)
    const preview = createImportPreview(payload.content, { format })
    assert.equal(preview.summary.valid, 1)
    assert.equal(preview.items[0].manga.notes, 'Keep me')
    if (format === 'json') {
      const data = JSON.parse(payload.content)
      assert.equal(data.formatVersion, 2)
      assert.deepEqual(data.verification, verification)
      assert.equal(data.mangas.length, 1)
      assert.equal(data.verification.uid, undefined)
    } else {
      assert.match(payload.content, /exportSource,exportObservedAtClient/)
      assert.match(payload.content, /server,2026-10-18T08:00:00.000Z/)
    }
    for (const invalid of [
      {},
      { ...verification, source: 'cache' },
      { ...verification, hasPendingWrites: true },
      { ...verification, observedAtClient: 'bad' },
    ]) {
      assert.throws(() => createLibraryExport(mangas, format, { verification: invalid }))
    }
  }
})

async function exportService({
  metadata = { fromCache: false, hasPendingWrites: false },
  size = 1,
  failure,
  changeSession = false,
} = {}) {
  const auth = { currentUser: { uid: 'alice' } }
  let reads = 0,
    cursor = -1
  const service = await loadModule('src/services/manga-service.js', {
    '@/boot/firebase': { db: {}, requireFirebase: () => ({ auth }) },
    'firebase/firestore': {
      ...firestore,
      collection: () => ({}),
      query: () => ({}),
      startAfter: (id) => {
        cursor = Number(id)
        return {}
      },
      limit: (value) => {
        assert.equal(value, 1001)
        return {}
      },
      getDocsFromServer: async () => {
        reads++
        if (failure) throw { code: failure }
        if (changeSession) auth.currentUser = { uid: 'bob' }
        return {
          metadata,
          docs: Array.from({ length: Math.min(1001, size - cursor - 1) }, (_, offset) => ({
            id: String(cursor + 1 + offset),
            data: () => mangas[0],
          })),
        }
      },
      getDocs: () => {
        throw new Error('Export must never fall back to cache')
      },
    },
  })
  return { service, auth, reads: () => reads }
}

test('export fetch uses a bounded server query and rejects local, pending, excessive or failed data', async () => {
  const valid = await exportService()
  const snapshot = await valid.service.fetchLibraryForExport('alice')
  assert.equal(snapshot.mangas.length, 1)
  assert.equal(snapshot.verification.source, 'server')
  assert.equal(snapshot.verification.hasPendingWrites, false)
  for (const [options, code] of [
    [{ metadata: { fromCache: true, hasPendingWrites: false } }, 'app/export-not-confirmed'],
    [{ metadata: { fromCache: false, hasPendingWrites: true } }, 'app/export-not-confirmed'],
    [{ metadata: {} }, 'app/export-not-confirmed'],
    [{ size: 10001 }, 'app/library-budget'],
    [{ failure: 'unavailable' }, 'unavailable'],
    [{ changeSession: true }, 'app/invalid-account'],
  ]) {
    const current = await exportService(options)
    await assert.rejects(current.service.fetchLibraryForExport('alice'), { code })
  }
  const quota = await exportService({ failure: 'resource-exhausted' })
  await assert.rejects(quota.service.fetchLibraryForExport('alice'), { code: 'resource-exhausted' })
  await assert.rejects(quota.service.fetchLibraryForExport('alice'), { code: 'app/quota-paused' })
  assert.equal(quota.reads(), 1)
  const wrong = await exportService()
  await assert.rejects(wrong.service.fetchLibraryForExport('bob'), { code: 'app/invalid-account' })
  assert.equal(wrong.reads(), 0)
})

test('download uses the fetched snapshot and cancels on failure, pending edits or an account change', async () => {
  for (const scenario of [
    'success',
    'failure',
    'pending',
    'pending-operation',
    'account',
    'remote-change',
    'concurrent',
  ]) {
    const auth = { user: { uid: 'alice' } }
    const store = { mangas: [{ name: 'stale cache' }] }
    const downloads = [],
      notifications = []
    let resolveFetch,
      calls = 0
    const component = (
      await loadModule('src/pages/ImportExportPage.vue', {
        quasar: { useQuasar: () => ({ notify: (message) => notifications.push(message) }) },
        '@/stores/auth-store': { useAuthStore: () => auth },
        '@/stores/manga-store': { useMangaStore: () => store },
        '@/services/export-service': { downloadLibraryExport: (...args) => downloads.push(args) },
        '@/services/manga-service': {
          fetchLibraryForExport: async () => {
            calls++
            if (scenario === 'failure') throw { code: 'unavailable' }
            if (scenario === 'pending') store.hasPendingWrites = true
            if (scenario === 'pending-operation') store.pendingOperations = 1
            if (scenario === 'account') auth.user = { uid: 'bob' }
            if (scenario === 'remote-change') store.libraryRevision = 1
            if (scenario === 'concurrent')
              await new Promise((resolve) => {
                resolveFetch = resolve
              })
            return { mangas, verification }
          },
        },
      })
    ).default
    const page = component.setup({}, { expose() {} })
    const pending = page.exportLibrary('json')
    if (scenario === 'concurrent') {
      await page.exportLibrary('csv')
      resolveFetch()
    }
    await pending
    assert.equal(calls, 1)
    assert.equal(page.exporting.value, false)
    assert.equal(downloads.length, ['success', 'concurrent'].includes(scenario) ? 1 : 0)
    if (downloads.length) {
      assert.deepEqual(downloads[0], [mangas, 'json', { verification }])
      assert.notEqual(downloads[0][0], store.mangas)
    }
    if (scenario === 'failure') assert.equal(notifications[0].type, 'negative')
  }
})

import test from 'node:test'
import assert from 'node:assert/strict'
import * as vue from 'vue'
import { loadModule } from './helpers/load-module.js'
import { recoveryFixture, verification } from '../scripts/model-ml08-recovery.mjs'

async function fixture(fetch) {
  const auth = vue.reactive({ user: { uid: 'alice' } })
  const store = vue.reactive({
    mangas: recoveryFixture(2),
    snapshotFromCache: false,
    libraryRevision: 0,
  })
  const downloads = [],
    emitted = []
  let reads = 0,
    unmount
  const component = (
    await loadModule('src/components/import/MultipartBackupPanel.vue', {
      vue: {
        ...vue,
        onMounted() {},
        onBeforeUnmount(fn) {
          unmount = fn
        },
      },
      '@/stores/auth-store': { useAuthStore: () => auth },
      '@/stores/manga-store': { useMangaStore: () => store },
      '@/services/manga-service': {
        async fetchLibraryForExport() {
          reads++
          if (fetch) await fetch({ auth, store })
          return { mangas: recoveryFixture(2), verification }
        },
      },
      '@/services/export-service': { downloadExport: (value) => downloads.push(value) },
    })
  ).default
  const panel = component.setup({}, { expose() {}, emit: (...args) => emitted.push(args) })
  return { panel, auth, store, downloads, emitted, reads: () => reads, unmount: () => unmount() }
}

test('multipart panel: downloads use a single sealed server result and account changes clear it', async () => {
  const { panel, auth, downloads, emitted, reads, unmount } = await fixture()
  await panel.prepareExport()
  assert.ok(panel.exportPlan.value)
  panel.downloadManifest()
  panel.downloadPart(0)
  panel.downloadPart(0)
  assert.equal(reads(), 1)
  assert.equal(downloads.length, 3)
  assert.equal(downloads[1].content, downloads[2].content)
  assert.deepEqual(emitted, [
    ['busy', true],
    ['busy', false],
  ])
  auth.user = { uid: 'bob' }
  assert.equal(panel.exportPlan.value, null)
  panel.downloadPart(0)
  assert.equal(downloads.length, 3)
  unmount()
})

test('multipart panel: pending data, revision changes, unmount and account changes cancel preparation', async () => {
  for (const scenario of ['pending', 'revision', 'account', 'unmount']) {
    let resolve
    const state = await fixture(async ({ auth, store }) => {
      if (scenario === 'pending') store.hasPendingWrites = true
      if (scenario === 'revision') store.libraryRevision++
      if (scenario === 'account') auth.user = { uid: 'bob' }
      if (scenario === 'unmount')
        await new Promise((done) => {
          resolve = done
        })
    })
    const pending = state.panel.prepareExport()
    if (scenario === 'unmount') {
      state.unmount()
      resolve()
    }
    await pending
    assert.equal(state.panel.exportPlan.value, null, scenario)
    assert.equal(state.downloads.length, 0, scenario)
    assert.equal(state.panel.active.value, false, scenario)
    if (scenario !== 'unmount') state.unmount()
  }
})

test('multipart panel: preparing another export preserves a completed restore state', async () => {
  const { panel, unmount } = await fixture()
  panel.phase.value = 'complete'
  await panel.prepareExport()
  assert.equal(panel.phase.value, 'complete')
  assert.equal(panel.work.value, '')
  unmount()
})

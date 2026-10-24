import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { loadModule } from './helpers/load-module.js'
import { createLibrarySearchStorage } from '../src/utils/library-search.js'

async function fixture(overrides = {}, searchStorage) {
  const listeners = []
  const conflict = Object.assign(new Error('Conflicto de edición'), { code: 'app/edit-conflict' })
  const service = {
    normalizeMangaName: (value) => value,
    subscribeToMangas(uid, data, error) {
      const listener = { uid, data, error, stopped: false, snapshotRequests: 0 }
      listeners.push(listener)
      const stop = () => {
        listener.stopped = true
      }
      stop.requestSnapshot = () => listener.snapshotRequests++
      return stop
    },
    async updateManga() {
      throw conflict
    },
    async createManga() {
      throw conflict
    },
    async deleteManga() {
      throw conflict
    },
    async findMangasByNormalizedName() {
      throw conflict
    },
    async changeMangaChapter() {
      throw conflict
    },
  }
  Object.assign(service, overrides)
  setActivePinia(createPinia())
  const module = await loadModule('src/stores/manga-store.js', {
    '@/services/manga-service': service,
    '@/stores/settings-store': { useSettingsStore: () => ({ sortBy: 'updated-desc' }) },
    ...(searchStorage ? { '@/utils/library-search': { librarySearchStorage: searchStorage } } : {}),
  })
  return { store: module.useMangaStore(), listeners }
}

test('ML-09: cold store restores search during synchronous quota failure and clears it on account change/logout', async () => {
  const values = new Map()
  const saved = createLibrarySearchStorage(
    () => ({
      getItem: (key) => values.get(key),
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    }),
    'demo-test',
  )
  const first = await fixture({}, saved)
  first.store.subscribe('alice')
  first.store.searchQuery = 'ML09 Safari 0000'
  assert.equal(saved.read('alice'), 'ML09 Safari 0000', 'v-model changes persist synchronously')
  first.store.$dispose()
  const second = await fixture(
    {
      subscribeToMangas(_uid, _next, fail) {
        fail({ code: 'resource-exhausted' })
        return () => {}
      },
    },
    saved,
  )
  second.store.subscribe('alice')
  assert.ok(second.store.syncError)
  assert.equal(second.store.searchQuery, 'ML09 Safari 0000')
  second.store.subscribe('alice')
  assert.equal(second.store.searchQuery, 'ML09 Safari 0000')
  second.store.subscribe('bob')
  assert.equal(second.store.searchQuery, '')
  assert.equal(saved.read('alice'), '')
  second.store.searchQuery = 'Bob selection'
  assert.equal(saved.read('bob'), 'Bob selection')
  second.store.unsubscribe()
  second.store.searchQuery = 'Retired view'
  assert.equal(saved.read('bob'), '', 'sign-out also stops the persistence watcher')
  first.store.unsubscribe()
})

test('ML-09: synchronous terminal callback cannot leave a stale handle that blocks recovery', async () => {
  let starts = 0,
    stops = 0
  const { store } = await fixture({
    subscribeToMangas(_uid, next, fail) {
      starts++
      if (starts === 1) fail({ code: 'resource-exhausted' })
      else
        next([{ id: 'recovered' }], { fromCache: false, hasPendingWrites: false, complete: true })
      return () => stops++
    },
  })
  store.subscribe('alice')
  assert.ok(store.syncError)
  store.searchQuery = 'recovered'
  store.filters.favoritesOnly = true
  assert.equal(stops, 1)
  store.subscribe('alice')
  assert.equal(starts, 2)
  assert.equal(store.syncError, null)
  assert.equal(store.mangas[0].id, 'recovered')
  assert.equal(store.searchQuery, 'recovered')
  assert.equal(store.filters.favoritesOnly, true)
  store.subscribe('alice')
  assert.equal(starts, 2, 'same-account duplicate subscription is a no-op')
  store.subscribe('bob')
  assert.equal(store.searchQuery, '')
  assert.equal(store.filters.favoritesOnly, false)
  store.unsubscribe()
})

test('operation failures never become synchronization errors or erase a real listener failure', async () => {
  const { store, listeners } = await fixture()
  store.subscribe('alice')
  listeners[0].data([{ id: 'nano', chapter: '277' }])
  const operations = [
    () => store.updateManga('alice', 'nano', { chapter: '300' }),
    () => store.createManga('alice', {}),
    () => store.deleteManga('alice', 'nano'),
    () => store.findDuplicates('alice', 'Nano'),
    () => store.changeChapter('alice', { id: 'nano' }, 1),
    () => store.toggleFavorite('alice', { id: 'nano', favorite: false }),
  ]
  for (const operation of operations) {
    await assert.rejects(operation(), { code: 'app/edit-conflict' })
    assert.equal(store.syncError, null)
  }
  listeners[0].error({ code: 'unavailable' })
  const syncError = store.syncError
  assert.ok(syncError)
  await assert.rejects(operations[0]())
  assert.equal(store.syncError, syncError)
  store.subscribe('alice')
  assert.equal(listeners.length, 2)
  listeners[1].data([{ id: 'nano', chapter: '278' }])
  assert.equal(store.syncError, null)
  assert.equal(store.mangas[0].chapter, '278')
  store.unsubscribe()
})

test('coordination recovery preserves filters and data and resets on account change', async () => {
  const { store, listeners } = await fixture()
  try {
    store.subscribe('alice')
    store.searchQuery = 'Nano'
    store.filters.favoritesOnly = true
    listeners[0].data([{ id: 'nano' }], {
      fromCache: true,
      hasPendingWrites: false,
      coordinationStale: true,
    })
    assert.match(store.syncStatusMessage, /no responde/)
    store.requestSharedSnapshot()
    assert.equal(listeners.length, 1)
    assert.equal(listeners[0].snapshotRequests, 1)
    assert.equal(store.mangas[0].id, 'nano')
    assert.equal(store.searchQuery, 'Nano')
    assert.equal(store.filters.favoritesOnly, true)
    assert.equal(store.coordinationStale, true, 'request alone does not confirm data')
    listeners[0].data([{ id: 'nano' }], { fromCache: false, hasPendingWrites: false })
    assert.equal(store.coordinationStale, false)
    assert.match(store.syncStatusMessage, /Última instantánea/)
    store.subscribe('bob')
    store.requestSharedSnapshot()
    assert.equal(listeners[0].snapshotRequests, 1)
    assert.equal(listeners[1].snapshotRequests, 1)
    assert.equal(store.coordinationStale, false)
    assert.equal(store.mangas.length, 0)
  } finally {
    store.unsubscribe()
  }
})

test('stale callbacks cannot overwrite a newer subscription for the same uid or a different account', async () => {
  const { store, listeners } = await fixture()
  store.subscribe('alice')
  store.subscribe('alice')
  assert.equal(listeners.length, 1)
  store.unsubscribe()
  store.subscribe('alice')
  listeners[1].data([{ id: 'current' }])
  listeners[0].data([{ id: 'stale' }])
  listeners[0].error({ code: 'unavailable' })
  assert.equal(store.mangas[0].id, 'current')
  assert.equal(store.syncError, null)
  store.subscribe('bob')
  listeners[1].data([{ id: 'alice' }])
  assert.equal(store.mangas.length, 0)
  listeners[2].data([{ id: 'bob' }])
  assert.equal(store.mangas[0].id, 'bob')
  assert.equal(listeners[1].stopped, true)
  store.unsubscribe()
})

test('favorites carry the displayed value as a transaction precondition', async () => {
  let received
  setActivePinia(createPinia())
  const module = await loadModule('src/stores/manga-store.js', {
    '@/services/manga-service': {
      normalizeMangaName() {},
      subscribeToMangas() {},
      changeMangaChapter() {},
      createManga() {},
      deleteManga() {},
      findMangasByNormalizedName() {},
      updateManga: async (...args) => {
        received = args
      },
    },
  })
  await module.useMangaStore().toggleFavorite('alice', { id: 'nano', favorite: true })
  assert.deepEqual(received, [
    'alice',
    'nano',
    { favorite: false },
    { expectedValues: { favorite: true } },
  ])
})

test('metadata-only events distinguish cache, pending writes and server and cannot cross sessions', async () => {
  const { store, listeners } = await fixture()
  store.subscribe('alice')
  listeners[0].data([], { fromCache: true, hasPendingWrites: false })
  assert.equal(store.snapshotReceived, true)
  assert.equal(store.snapshotFromCache, true)
  assert.match(store.syncStatusMessage, /datos locales/)
  listeners[0].data([], { fromCache: false, hasPendingWrites: true })
  assert.equal(store.hasPendingWrites, true)
  assert.match(store.syncStatusMessage, /pendientes/)
  listeners[0].data([], { fromCache: false, hasPendingWrites: false })
  assert.equal(store.hasPendingWrites, false)
  assert.match(store.syncStatusMessage, /Última instantánea/)
  store.subscribe('bob')
  listeners[0].data([], { fromCache: false, hasPendingWrites: true })
  assert.equal(store.snapshotReceived, false)
  assert.equal(store.hasPendingWrites, false)
  store.unsubscribe()
  assert.equal(store.snapshotFromCache, true)
})

test('retry controls handle synchronous listener initialization failures', async () => {
  const store = {
    mangas: [],
    filteredMangas: [],
    filters: { genres: [] },
    subscribe() {
      throw new Error('initialization failed')
    },
  }
  for (const file of ['src/pages/LibraryPage.vue', 'src/pages/MangaDetailPage.vue']) {
    const component = (
      await loadModule(file, {
        '@/stores/manga-store': { useMangaStore: () => store },
        '@/stores/auth-store': { useAuthStore: () => ({ user: { uid: 'alice' } }) },
        '@/stores/settings-store': { useSettingsStore: () => ({ sortBy: 'updated-desc' }) },
        'vue-router': { useRouter: () => ({}) },
        quasar: { useQuasar: () => ({}) },
      })
    ).default
    const page = component.setup({ id: 'nano' }, { expose() {} })
    assert.doesNotThrow(() => page.retrySubscription())
  }
})

test('in-flight operations remain visible even if query metadata reports no pending writes', async () => {
  let finish
  const { store, listeners } = await fixture({
    deleteManga: () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  })
  store.subscribe('alice')
  listeners[0].data([], { fromCache: false, hasPendingWrites: false })
  const pending = store.deleteManga('alice', 'one')
  assert.equal(store.hasPendingWrites, false)
  assert.equal(store.pendingOperations, 1)
  assert.match(store.syncStatusMessage, /pendientes/)
  store.subscribe('bob')
  assert.equal(store.pendingOperations, 0)
  store.subscribe('alice')
  assert.equal(store.pendingOperations, 1)
  finish()
  await pending
  assert.equal(store.pendingOperations, 0)
  store.unsubscribe()
})

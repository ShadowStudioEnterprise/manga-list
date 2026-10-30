import test from 'node:test'
import assert from 'node:assert/strict'
import { effectScope } from 'vue'
import { createEmptyManga } from '../src/constants/manga-options.js'
import { createDraftStorage, DRAFT_TTL_MS, MAX_DRAFTS } from '../src/utils/form-drafts.js'
import { createMangaEdit, conflictingMangaFields } from '../src/utils/manga-edit.js'
import { loadModule } from './helpers/load-module.js'

function memoryStorage() {
  const items = new Map()
  return {
    get length() {
      return items.size
    },
    key: (index) => [...items.keys()][index],
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, value),
    removeItem: (key) => items.delete(key),
  }
}

const example = () => ({ ...createEmptyManga(), name: 'Nano', chapter: '1' })

test('drafts isolate accounts and forms, whitelist fields, expire and preserve foreign storage', () => {
  const storage = memoryStorage()
  let now = 100
  const drafts = createDraftStorage(storage, () => now)
  storage.setItem('other-feature', 'keep')
  drafts.write(
    'alice',
    'edit:one',
    { ...example(), token: 'never-persist', id: 'private-id' },
    example(),
  )
  assert.equal(drafts.read('bob', 'edit:one'), null)
  assert.equal(drafts.read('alice', 'new'), null)
  assert.equal('token' in drafts.read('alice', 'edit:one').value, false)
  assert.equal('id' in drafts.read('alice', 'edit:one').value, false)
  now += DRAFT_TTL_MS
  assert.equal(drafts.read('alice', 'edit:one'), null)
  assert.equal(storage.length, 1)
  drafts.write('alice', 'new', example(), example())
  drafts.clear()
  assert.equal(storage.getItem('other-feature'), 'keep')
  assert.equal(storage.length, 1)
})

test('draft bounds reject excess count and invalid content without evicting valid drafts', () => {
  const storage = memoryStorage()
  const drafts = createDraftStorage(storage)
  for (let index = 0; index < MAX_DRAFTS; index++)
    drafts.write('alice', String(index), example(), example())
  assert.throws(() => drafts.write('alice', 'overflow', example(), example()))
  assert.throws(() =>
    drafts.write('alice', '0', { ...example(), notes: 'x'.repeat(5001) }, example()),
  )
  assert.equal(drafts.read('alice', '0').value.notes, '')
  // Corrupt JSON and incompatible schemas never reach a form.
  const key = storage.key(0)
  storage.setItem(key, '{invalid')
  assert.equal(drafts.read('alice', '0'), null)
  storage.setItem(
    key,
    JSON.stringify({ version: 2, savedAt: Date.now(), value: example(), baseline: example() }),
  )
  assert.equal(drafts.read('alice', '0'), null)
})

async function form(initialValue, storage, scope) {
  const component = (
    await loadModule('src/components/manga/MangaForm.vue', {
      '@/utils/form-drafts': { browserDraftStorage: () => storage },
    })
  ).default
  return scope.run(() =>
    component.setup(
      { initialValue, loading: false, draftOwner: 'alice', draftScope: 'edit:one' },
      { expose() {}, emit() {} },
    ),
  )
}

test('form drafts require opt in and explicit restore; recovered baseline still detects remote conflicts', async () => {
  const storage = memoryStorage()
  const drafts = createDraftStorage(storage)
  const scope = effectScope()
  try {
    const first = await form(example(), drafts, scope)
    first.form.notes = 'unsaved'
    assert.equal(storage.length, 0)
    first.setDraftEnabled(true)
    first.form.chapter = '2'
    assert.equal(drafts.read('alice', 'edit:one').value.chapter, '2')
    const current = { ...example(), chapter: '3' }
    const recovered = await form(current, drafts, scope)
    assert.equal(recovered.form.chapter, '3')
    assert.ok(recovered.availableDraft.value)
    recovered.restoreDraft()
    assert.equal(recovered.form.chapter, '2')
    const { patch, expectedValues } = createMangaEdit(recovered.formPayload(), recovered.baseline)
    assert.deepEqual(conflictingMangaFields(current, patch, expectedValues), ['chapter'])
    recovered.discardDraft()
    recovered.form.notes = 'no longer persisted'
    assert.equal(storage.length, 0)
  } finally {
    scope.stop()
  }
})

test('storage failure disables draft saving and reports failure without losing edits', async () => {
  const scope = effectScope()
  try {
    const page = await form(
      example(),
      {
        read: () => null,
        write() {
          throw new Error('quota')
        },
      },
      scope,
    )
    page.form.notes = 'still here'
    page.setDraftEnabled(true)
    assert.equal(page.draftEnabled.value, false)
    assert.match(page.draftError.value, /No se ha podido/)
    assert.equal(page.form.notes, 'still here')
  } finally {
    scope.stop()
  }
})

test('PWA registration reports new and already waiting updates, with passive Workbox options', async () => {
  const update = await loadModule('src/utils/pwa-update.js')
  let callbacks
  await loadModule(
    'src-pwa/register-sw.js',
    {
      'register-service-worker': {
        register: (_url, options) => {
          callbacks = options
        },
      },
      '../src/utils/pwa-update': { observeWaitingUpdate: update.observeWaitingUpdate },
    },
    { QUASAR_SERVICE_WORKER_FILE: '/sw.js' },
  )
  callbacks.registered({ waiting: null })
  assert.equal(update.pwaUpdateAvailable.value, false)
  callbacks.cached({ active: null, waiting: {} })
  assert.equal(update.pwaUpdateAvailable.value, false)
  callbacks.updated({ active: {}, waiting: {} })
  assert.equal(update.pwaUpdateAvailable.value, true)
  update.pwaUpdateAvailable.value = false
  callbacks.registered({ active: {}, waiting: {} })
  assert.equal(update.pwaUpdateAvailable.value, true)
  update.pwaUpdateAvailable.value = false
  callbacks.cached({ active: {}, waiting: {} })
  assert.equal(update.pwaUpdateAvailable.value, true)
  const config = (await loadModule('quasar.config.js')).default({
    mode: {},
    appPaths: { resolve: { app: (value) => value } },
  })
  const options = { skipWaiting: true, clientsClaim: true }
  assert.equal(config.pwa.workboxMode, 'GenerateSW')
  config.pwa.extendPWAGenerateSWOptions(options)
  assert.deepEqual(options, {
    skipWaiting: false,
    clientsClaim: false,
    navigateFallbackDenylist: [/^\/__\//],
  })
  const existing = /existing-route/
  const inherited = { navigateFallbackDenylist: [existing] }
  config.pwa.extendPWAGenerateSWOptions(inherited)
  assert.equal(inherited.navigateFallbackDenylist[0], existing)
})

test('an account change during duplicate lookup never saves the previous account form to the next one', async () => {
  const auth = { user: { uid: 'alice' } }
  let finishLookup
  const writes = []
  const component = (
    await loadModule('src/pages/AddMangaPage.vue', {
      quasar: { useQuasar: () => ({ notify() {} }) },
      'vue-router': { useRoute: () => ({ query: {} }), useRouter: () => ({ replace() {} }) },
      '@/stores/auth-store': { useAuthStore: () => auth },
      '@/stores/manga-store': {
        useMangaStore: () => ({
          mangas: [],
          findDuplicates: () =>
            new Promise((resolve) => {
              finishLookup = resolve
            }),
          createManga: (...args) => {
            writes.push(args)
          },
        }),
      },
    })
  ).default
  const page = component.setup({}, { expose() {} })
  const pending = page.checkAndSave(example())
  auth.user = { uid: 'bob' }
  finishLookup([])
  await pending
  assert.deepEqual(writes, [])
  assert.equal(page.duplicateDialog.value, false)
  assert.equal(page.checkingDuplicate.value, false)
})

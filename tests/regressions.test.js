import test from 'node:test'
import assert from 'node:assert/strict'
import { reactive, effectScope, nextTick } from 'vue'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname, resolve, basename } from 'node:path'
import { getAppEnv } from '../node_modules/@quasar/app-vite/lib/utils/env.js'
import { createEmptyManga } from '../src/constants/manga-options.js'
import { createImportPreview, prepareImportSelection } from '../src/services/import-service.js'
import { exportLibraryToCsv, exportLibraryToJson } from '../src/services/export-service.js'
import { authDestination, authRoute } from '../src/utils/auth-redirect.js'
import { createMangaEdit, conflictingMangaFields } from '../src/utils/manga-edit.js'
import { loadModule } from './helpers/load-module.js'

const example = () => ({ ...createEmptyManga(), id: 'nano', name: 'Nano Machine', chapter: '276' })

test('Quasar exposes the documented Firebase dotenv values, including numeric sender ID', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'mangalist-env-'))
  try {
    const fixture = {
      VITE_FIREBASE_API_KEY: 'test-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'demo.test',
      VITE_FIREBASE_PROJECT_ID: 'demo-mangalist',
      VITE_FIREBASE_STORAGE_BUCKET: 'demo.test',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789012',
      VITE_FIREBASE_APP_ID: 'test-app',
    }
    await writeFile(
      join(folder, '.env'),
      Object.entries(fixture)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n'),
    )
    const config = (await loadModule('quasar.config.js')).default({
      appPaths: { resolve: { app: (value) => value } },
      mode: {},
    })
    const definitions = getAppEnv({
      ctx: { appPaths: { appDir: folder }, mode: {} },
      envCfg: config.build.env,
    }).clientEnvDefineList
    const env = Object.fromEntries(
      Object.keys(fixture).map((key) => [key, JSON.parse(definitions[`import.meta.env.${key}`])]),
    )
    let receivedConfig
    const boot = await loadModule(
      'src/boot/firebase.js',
      {
        'firebase/app': {
          getApp: () => ({}),
          getApps: () => [],
          initializeApp: (value) => {
            receivedConfig = value
            return {}
          },
        },
        'firebase/auth': { getAuth: () => ({}), connectAuthEmulator() {} },
        'firebase/firestore': { getFirestore: () => ({}), connectFirestoreEmulator() {} },
      },
      env,
    )
    assert.equal(boot.isFirebaseConfigured, true)
    assert.equal(receivedConfig.messagingSenderId, fixture.VITE_FIREBASE_MESSAGING_SENDER_ID)
    assert.equal(receivedConfig.apiKey, fixture.VITE_FIREBASE_API_KEY)
  } finally {
    assert.equal(dirname(resolve(folder)), resolve(tmpdir()))
    assert.ok(basename(folder).startsWith('mangalist-env-'))
    await rm(folder, { recursive: true, force: true })
  }
})

test('emulators require development mode and a demo project', async () => {
  const env = {
    DEV: true,
    QCLI_FIREBASE_EMULATORS: 'true',
    VITE_FIREBASE_API_KEY: 'demo-key',
    VITE_FIREBASE_AUTH_DOMAIN: 'demo.test',
    VITE_FIREBASE_PROJECT_ID: 'demo-mangalist',
    VITE_FIREBASE_STORAGE_BUCKET: 'demo.test',
    VITE_FIREBASE_MESSAGING_SENDER_ID: '123',
    VITE_FIREBASE_APP_ID: 'demo-app',
  }
  const connections = []
  const overrides = {
    'firebase/app': { getApp: () => ({}), getApps: () => [], initializeApp: () => ({}) },
    'firebase/auth': {
      getAuth: () => ({}),
      connectAuthEmulator: (...args) => connections.push(args),
    },
    'firebase/firestore': {
      getFirestore: () => ({}),
      connectFirestoreEmulator: (...args) => connections.push(args),
    },
  }
  await loadModule('src/boot/firebase.js', overrides, env)
  assert.equal(connections.length, 2)
  assert.equal(connections[0][1], 'http://127.0.0.1:9199')
  assert.equal(connections[1][1], '127.0.0.1')
  await loadModule('src/boot/firebase.js', overrides, { ...env, DEV: false })
  assert.equal(connections.length, 2)
  await assert.rejects(
    loadModule('src/boot/firebase.js', overrides, {
      ...env,
      VITE_FIREBASE_PROJECT_ID: 'live-project',
    }),
    /require a configured demo project/,
  )
  assert.equal(connections.length, 2)
})

test('editing notes preserves a chapter updated remotely after the form opened', async () => {
  const scope = effectScope()
  try {
    const props = reactive({ initialValue: example(), loading: false })
    let submitted
    const component = (await loadModule('src/components/manga/MangaForm.vue')).default
    const form = scope.run(() =>
      component.setup(props, {
        expose() {},
        emit: (...args) => {
          submitted = args
        },
      }),
    )
    form.form.notes = 'Leer mañana'
    props.initialValue = { ...example(), chapter: '277' }
    await nextTick()
    form.submit()
    const { patch, expectedValues } = createMangaEdit(submitted[1], submitted[2])
    assert.deepEqual(patch, { notes: 'Leer mañana' })
    assert.deepEqual(conflictingMangaFields(props.initialValue, patch, expectedValues), [])
    assert.equal({ ...props.initialValue, ...patch }.chapter, '277')
  } finally {
    scope.stop()
  }
})

test('concurrent edits to the same field conflict, while identical edits and reordered map keys do not', () => {
  const baseline = example()
  const edit = createMangaEdit({ ...baseline, chapter: '280' }, baseline)
  assert.deepEqual(
    conflictingMangaFields({ ...baseline, chapter: '279' }, edit.patch, edit.expectedValues),
    ['chapter'],
  )
  assert.deepEqual(
    conflictingMangaFields({ ...baseline, chapter: '280' }, edit.patch, edit.expectedValues),
    [],
  )
  const source = { id: 'a', url: 'https://example.com', name: 'Fuente', isPrimary: true }
  assert.deepEqual(
    createMangaEdit(
      { sources: [{ isPrimary: true, name: 'Fuente', url: source.url, id: 'a' }] },
      { sources: [source] },
    ).patch,
    {},
  )
})

test('bookmarklet destination survives registration with email and Google', async () => {
  const destination = '/add?title=Nano%20Machine&url=https%3A%2F%2Fexample.com%2Fchapter-276'
  const register = authRoute('/register', destination)
  assert.equal(authRoute('/login', register.query.redirect).query.redirect, destination)
  const redirects = []
  const component = (
    await loadModule('src/pages/auth/RegisterPage.vue', {
      'vue-router': {
        useRoute: () => ({ query: register.query }),
        useRouter: () => ({ replace: async (path) => redirects.push(path) }),
      },
      quasar: { useQuasar: () => ({ notify() {} }) },
      '@/stores/auth-store': {
        useAuthStore: () => ({ register: async () => {}, loginWithGoogle: async () => {} }),
      },
    })
  ).default
  const page = component.setup({}, { expose() {} })
  await page.submit()
  await page.registerWithGoogle()
  assert.deepEqual(redirects, [destination, destination])
  for (const invalid of [
    '//example.com',
    '/\\example.com',
    'https://example.com',
    '/login',
    ['/add'],
  ]) {
    assert.equal(authDestination(invalid), '/library')
  }
})

test('CSV rows with missing or extra columns cannot be selected', () => {
  for (const content of ['name,chapter\nNano,276,extra', 'name,chapter,url\nNano,276']) {
    const preview = createImportPreview(content, { format: 'csv' })
    assert.equal(preview.summary.errors, 1)
    assert.equal(preview.errors[0].errors[0].code, 'csv_column_count')
    assert.equal(
      prepareImportSelection(preview, { selectedIds: preview.items.map((item) => item.id) }).mangas
        .length,
      0,
    )
  }
})

test('explicit sources without URLs are reported, while omitted sources remain optional', () => {
  for (const source of [{ name: 'Fuente', url: '' }, null, '']) {
    const preview = createImportPreview(JSON.stringify([{ ...example(), sources: [source] }]), {
      format: 'json',
    })
    assert.equal(preview.summary.errors, 1)
    assert.ok(preview.errors[0].errors.some((error) => error.field === 'sources.0.url'))
  }
  assert.equal(
    createImportPreview('[{"name":"Nano","chapter":"276"}]', { format: 'json' }).summary.valid,
    1,
  )
})

test('JSON and CSV exports still round-trip multiple sources, quotes and multiline notes', () => {
  const manga = {
    ...example(),
    name: 'Nano, "Machine"',
    notes: 'Primera línea\nSegunda línea',
    sources: [
      { id: 'a', name: 'Principal', url: 'https://example.com', isPrimary: true },
      { id: 'b', name: 'Otra', url: 'https://example.org', isPrimary: false },
    ],
  }
  for (const [format, content] of [
    ['json', exportLibraryToJson([manga])],
    ['csv', exportLibraryToCsv([manga])],
  ]) {
    const preview = createImportPreview(content, { format })
    assert.equal(preview.summary.valid, 1)
    assert.equal(preview.valid[0].manga.notes, manga.notes)
    assert.deepEqual(preview.valid[0].manga.sources, manga.sources)
  }
})

async function importPage(createManga) {
  const component = (
    await loadModule('src/pages/ImportExportPage.vue', {
      quasar: { useQuasar: () => ({ notify() {} }) },
      '@/stores/auth-store': { useAuthStore: () => ({ user: { uid: 'test-user' } }) },
      '@/stores/manga-store': { useMangaStore: () => ({ createManga }) },
    })
  ).default
  return component.setup({}, { expose() {} })
}

test('successful import clears both the preview and selected file', async () => {
  const page = await importPage(async () => 'created-id')
  page.preview.value = createImportPreview('[{"name":"Nano","chapter":"276"}]', { format: 'json' })
  page.file.value = { name: 'list.json' }
  await page.importSelected()
  assert.equal(page.importing.value, false)
  assert.equal(page.preview.value, null)
  assert.equal(page.file.value, null)
})

test('retrying a partial import never writes successful records again', async () => {
  const saved = []
  let shouldFail = true
  const page = await importPage(async (_uid, manga) => {
    if (manga.name === 'Second' && shouldFail) throw new Error('offline')
    saved.push(manga.name)
  })
  page.preview.value = createImportPreview(
    '[{"name":"First","chapter":"1"},{"name":"Second","chapter":"2"}]',
    { format: 'json' },
  )
  await page.importSelected()
  assert.equal(page.preview.value.items[0].imported, true)
  page.preview.value.items[0].selected = true
  shouldFail = false
  await page.importSelected()
  assert.deepEqual(saved, ['First', 'Second'])
  assert.equal(page.preview.value, null)
})

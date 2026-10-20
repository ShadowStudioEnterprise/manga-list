import test, { before, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing'
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  setLogLevel,
  writeBatch,
  collection,
  query,
  limit,
  getDocsFromServer,
} from 'firebase/firestore'
import { loadModule } from '../helpers/load-module.js'
import { createRecoverableImportPreview } from '../../src/services/import-service.js'

let environment
before(async () => {
  setLogLevel('silent')
  const endpoint = new URL(`http://${process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8188'}`)
  assert.ok(
    ['127.0.0.1', 'localhost', '[::1]'].includes(endpoint.hostname),
    'Tests must use a local emulator',
  )
  environment = await initializeTestEnvironment({
    projectId: 'demo-mangalist',
    firestore: {
      host: endpoint.hostname,
      port: Number(endpoint.port),
      rules: await readFile(new URL('../../firestore.rules', import.meta.url), 'utf8'),
    },
  })
})
beforeEach(async () => environment.clearFirestore())
after(async () => environment?.cleanup())

function manga(sources = []) {
  return {
    schemaVersion: 1,
    name: 'Nano',
    normalizedName: 'nano',
    chapter: '276',
    type: 'manhwa',
    genres: [],
    readingStatus: 'following',
    publicationStatus: 'publishing',
    sources,
    notes: '',
    favorite: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
}
function sources(count, primaryIndices = []) {
  return Array.from({ length: count }, (_, index) => ({
    id: `source-${index}`,
    name: `Fuente ${index}`,
    url: `https://example.com/${index}`,
    isPrimary: primaryIndices.includes(index),
  }))
}
const dbFor = (uid) => environment.authenticatedContext(uid).firestore()
const reference = (db, id = 'nano') => doc(db, 'users', 'alice', 'mangas', id)

test('owner can create, read, update and delete; anonymous and other users cannot', async () => {
  const alice = reference(dbFor('alice'))
  await assertSucceeds(setDoc(alice, manga()))
  await assertSucceeds(getDoc(alice))
  for (const database of [dbFor('bob'), environment.unauthenticatedContext().firestore()]) {
    await assertFails(getDoc(reference(database)))
    await assertFails(setDoc(reference(database, 'other'), manga()))
    await assertFails(
      updateDoc(reference(database), { chapter: '300', updatedAt: serverTimestamp() }),
    )
    await assertFails(deleteDoc(reference(database)))
  }
  await assertSucceeds(updateDoc(alice, { chapter: '277', updatedAt: serverTimestamp() }))
  await assertSucceeds(deleteDoc(alice))
})

test('zero or one primary source is allowed at every supported array position', async () => {
  const alice = dbFor('alice')
  for (const count of [0, 1, 10]) {
    await assertSucceeds(setDoc(reference(alice, `none-${count}`), manga(sources(count))))
  }
  for (let index = 0; index < 10; index += 1) {
    await assertSucceeds(
      setDoc(reference(alice, `primary-${index}`), {
        ...manga(sources(10, [index])),
        genres: Array.from({ length: 20 }, (_, genre) => `Género ${genre}`),
      }),
    )
  }
})

test('multiple primary sources are rejected on create and update, including the last positions', async () => {
  const alice = dbFor('alice')
  for (const pair of [
    [0, 1],
    [0, 9],
    [8, 9],
  ]) {
    await assertFails(setDoc(reference(alice, `bad-${pair.join('-')}`), manga(sources(10, pair))))
  }
  await setDoc(reference(alice), manga(sources(10, [9])))
  await assertFails(
    updateDoc(reference(alice), { sources: sources(10, [8, 9]), updatedAt: serverTimestamp() }),
  )
  await assertSucceeds(
    updateDoc(reference(alice), { sources: sources(10, [0]), updatedAt: serverTimestamp() }),
  )
  await assertFails(setDoc(reference(alice, 'too-many'), manga(sources(11))))
})

test('the actual update service merges unrelated remote edits and rejects conflicting writes atomically', async () => {
  const alice = dbFor('alice')
  const remote = reference(dbFor('alice'))
  const service = await loadModule('src/services/manga-service.js', {
    '@/boot/firebase': { db: alice, requireFirebase() {} },
  })
  await setDoc(remote, manga())
  await updateDoc(remote, { chapter: '277', updatedAt: serverTimestamp() })
  await service.updateManga(
    'alice',
    'nano',
    { notes: 'Leer mañana' },
    { expectedValues: { notes: '' } },
  )
  assert.equal((await getDoc(remote)).data().chapter, '277')
  await assert.rejects(
    service.updateManga(
      'alice',
      'nano',
      { chapter: '280', notes: 'Conflicting edit' },
      {
        expectedValues: { chapter: '276', notes: 'Leer mañana' },
      },
    ),
    { code: 'app/edit-conflict' },
  )
  const current = (await getDoc(remote)).data()
  assert.equal(current.chapter, '277')
  assert.equal(current.notes, 'Leer mañana')
  await service.updateManga(
    'alice',
    'nano',
    { chapter: '277' },
    { expectedValues: { chapter: '276' } },
  )
})

test('schema checks reject invalid types, missing fields and boundary violations', async () => {
  const alice = dbFor('alice')
  const full = { ...manga(sources(10, [9])), genres: Array(20).fill('a'.repeat(60)) }
  await assertSucceeds(setDoc(reference(alice), full))
  await assertSucceeds(
    updateDoc(reference(alice), { notes: 'Updated', updatedAt: serverTimestamp() }),
  )

  const invalidSources = [
    null,
    'text',
    { ...sources(1)[0], extra: true },
    { name: 'Missing ID', url: 'https://example.com', isPrimary: false, extra: true },
    { ...sources(1)[0], id: 123 },
    { ...sources(1)[0], id: '' },
    { ...sources(1)[0], name: 'a'.repeat(101) },
    { ...sources(1)[0], url: 123 },
    { ...sources(1)[0], url: 'javascript:alert(1)' },
    { ...sources(1)[0], url: `https://example.com/${'a'.repeat(2048)}` },
    { ...sources(1)[0], isPrimary: 'false' },
  ]
  for (const source of invalidSources) {
    await assertFails(
      setDoc(reference(alice, 'invalid-source'), { ...full, sources: [...sources(9), source] }),
    )
  }
  for (const genre of [null, 123, '', 'a'.repeat(61), {}]) {
    await assertFails(
      setDoc(reference(alice, 'invalid-genre'), {
        ...full,
        genres: [...Array(19).fill('Valid'), genre],
      }),
    )
  }
  for (const patch of [
    { extra: true },
    { name: 123 },
    { name: '' },
    { name: 'a'.repeat(201) },
    { normalizedName: 'a'.repeat(251) },
    { chapter: 'a'.repeat(65) },
    { schemaVersion: 2 },
    { type: 'invalid' },
    { readingStatus: 'invalid' },
    { publicationStatus: 'invalid' },
    { genres: Array(21).fill('Valid') },
    { sources: {} },
    { notes: 'a'.repeat(5001) },
    { favorite: 'true' },
    { createdAt: Timestamp.fromMillis(0) },
    { updatedAt: Timestamp.fromMillis(0) },
  ]) {
    await assertFails(setDoc(reference(alice, 'invalid-manga'), { ...full, ...patch }))
  }
  const missingName = { ...full, extra: 'Replaces required field' }
  delete missingName.name
  await assertFails(setDoc(reference(alice, 'missing-name'), missingName))
  await assertFails(
    updateDoc(reference(alice), {
      createdAt: Timestamp.fromMillis(0),
      updatedAt: serverTimestamp(),
    }),
  )
})

test('account metadata remains private, validates timestamps and cannot unlock a deletion marker', async () => {
  const alice = dbFor('alice')
  const user = doc(alice, 'users', 'alice')
  const times = () => ({ createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  await assertFails(setDoc(user, { ...times(), status: 'active' }))
  await assertSucceeds(setDoc(user, times()))
  // Exercise the largest valid model with a parent document as well as without one.
  await assertSucceeds(
    setDoc(reference(alice), {
      ...manga(sources(10, [9])),
      genres: Array(20).fill('a'.repeat(60)),
    }),
  )
  for (const db of [dbFor('bob'), environment.unauthenticatedContext().firestore()]) {
    const foreign = doc(db, 'users', 'alice')
    await assertFails(getDoc(foreign))
    await assertFails(updateDoc(foreign, { status: 'deleting', updatedAt: serverTimestamp() }))
    await assertFails(deleteDoc(foreign))
  }
  await assertFails(
    updateDoc(user, { createdAt: Timestamp.fromMillis(0), updatedAt: serverTimestamp() }),
  )
  await assertSucceeds(updateDoc(user, { status: 'deleting', updatedAt: serverTimestamp() }))
  await assertFails(deleteDoc(user))
  await assertFails(setDoc(user, times()))
  await assertFails(updateDoc(user, { status: 'active', updatedAt: serverTimestamp() }))
  await assertSucceeds(getDoc(user))
})

test('29/30/90-day markers retain the barrier; age grants no client removal permission', async () => {
  for (const days of [29, 30, 90]) {
    const uid = `review-${days}`
    const old = Timestamp.fromMillis(Date.now() - days * 86400000)
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users', uid), {
        createdAt: old,
        updatedAt: old,
        status: 'deleting',
      })
    })
    // This synthetic context models an accepted old token, not Auth revocation.
    const db = environment.authenticatedContext(uid, { auth_time: 1 }).firestore()
    const marker = doc(db, 'users', uid)
    await assertFails(setDoc(doc(db, 'users', uid, 'mangas', 'late'), manga()))
    await assertFails(deleteDoc(marker))
    await assertFails(updateDoc(marker, { status: 'active', updatedAt: serverTimestamp() }))
    assert.equal((await getDoc(marker)).data().status, 'deleting')
  }
})

test('deletion barrier blocks another session and atomic marker-plus-manga writes', async () => {
  const alice = dbFor('alice')
  const other = dbFor('alice')
  await setDoc(reference(alice), manga())
  const batch = writeBatch(alice)
  batch.set(doc(alice, 'users', 'alice'), {
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: 'deleting',
  })
  batch.set(reference(alice, 'sneaked'), manga())
  await assertFails(batch.commit())
  // An absent parent stays compatible with existing libraries.
  await assertSucceeds(setDoc(reference(alice, 'before'), manga()))
  await setDoc(doc(alice, 'users', 'alice'), {
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: 'deleting',
  })
  await assertFails(setDoc(reference(other, 'late'), manga()))
  await assertFails(updateDoc(reference(other), { chapter: '300', updatedAt: serverTimestamp() }))
  await assertSucceeds(deleteDoc(reference(other)))
})

test('actual cleanup deletes more than 400 records, rejects concurrent writes, and retains a retryable barrier', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    const batch = writeBatch(db)
    for (let index = 0; index < 401; index++) batch.set(reference(db, `seed-${index}`), manga())
    await batch.commit()
  })
  const alice = dbFor('alice')
  const other = dbFor('alice')
  const service = await loadModule('src/services/account-service.js', {
    '@/boot/firebase': { db: alice, auth: { currentUser: { uid: 'alice' } }, requireFirebase() {} },
  })
  const progress = []
  await service.deleteUserFirestoreData('alice', ({ deletedCount }) => {
    progress.push(deletedCount)
  })
  assert.deepEqual(progress, [400, 401])
  assert.equal(
    (await getDocsFromServer(query(collection(alice, 'users', 'alice', 'mangas'), limit(400))))
      .size,
    0,
  )
  assert.equal((await getDoc(doc(alice, 'users', 'alice'))).data().status, 'deleting')
  await assertFails(setDoc(reference(other, 'after-cleanup'), manga()))
  assert.equal(await service.deleteUserFirestoreData('alice'), 0)
  await assertFails(deleteDoc(doc(other, 'users', 'alice')))
})

test('a fresh client resumes interrupted cleanup using only the server marker and remaining data', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore()
    const batch = writeBatch(database)
    for (let index = 0; index < 401; index++)
      batch.set(reference(database, `resume-${index}`), manga())
    await batch.commit()
  })
  const initialDb = dbFor('alice')
  let reads = 0
  const firstClient = await loadModule('src/services/account-service.js', {
    '@/boot/firebase': {
      db: initialDb,
      auth: { currentUser: { uid: 'alice' } },
      requireFirebase() {},
    },
    'firebase/firestore': {
      ...(await import('firebase/firestore')),
      getDocsFromServer: async (ref) => {
        if (++reads === 2)
          throw Object.assign(new Error('Client interrupted'), { code: 'unavailable' })
        return getDocsFromServer(ref)
      },
    },
  })
  await assert.rejects(firstClient.deleteUserFirestoreData('alice'), (error) => {
    assert.equal(error.deletedCount, 400)
    assert.equal(error.deletionStarted, true)
    return true
  })
  const freshDb = dbFor('alice')
  const remaining = query(collection(freshDb, 'users', 'alice', 'mangas'), limit(400))
  assert.equal((await getDocsFromServer(remaining)).size, 1)
  await assertFails(setDoc(reference(freshDb, 'blocked-after-interruption'), manga()))
  await assertFails(deleteDoc(doc(freshDb, 'users', 'alice')))
  // No in-memory progress, budget, or module state is passed to this client.
  const freshClient = await loadModule('src/services/account-service.js', {
    '@/boot/firebase': {
      db: freshDb,
      auth: { currentUser: { uid: 'alice' } },
      requireFirebase() {},
    },
  })
  assert.equal(await freshClient.deleteUserFirestoreData('alice'), 1)
  assert.equal((await getDocsFromServer(remaining)).size, 0)
  assert.equal((await getDoc(doc(freshDb, 'users', 'alice'))).data().status, 'deleting')
})

test('recovered and concurrent imports keep one document per row, preserve edits and obey the deletion barrier', async () => {
  const content =
    '[{"name":"First","chapter":"1"},{"name":"Second","chapter":"2"},{"name":"Third","chapter":"3"}]'
  const preview = await createRecoverableImportPreview(content, { uid: 'alice', format: 'json' })
  const alice = dbFor('alice')
  const native = await import('firebase/firestore')
  let lost = false
  const firstClient = await loadModule('src/services/manga-service.js', {
    '@/boot/firebase': { db: alice, requireFirebase() {} },
    'firebase/firestore': {
      ...native,
      runTransaction: async (...args) => {
        const result = await native.runTransaction(...args)
        if (!lost) {
          lost = true
          throw Object.assign(new Error('Lost acknowledgement'), { code: 'unavailable' })
        }
        return result
      },
    },
  })
  await assert.rejects(firstClient.createManga('alice', preview.items[0].manga, preview.items[0]), {
    code: 'unavailable',
  })
  const importedRef = doc(alice, 'users', 'alice', 'mangas', preview.items[0].importDocumentId)
  await updateDoc(importedRef, {
    chapter: '99',
    notes: 'Edited later',
    updatedAt: serverTimestamp(),
  })
  const freshClient = await loadModule('src/services/manga-service.js', {
    '@/boot/firebase': { db: dbFor('alice'), requireFirebase() {} },
  })
  const freshPreview = await createRecoverableImportPreview(content, {
    uid: 'alice',
    format: 'json',
  })
  await freshClient.createManga('alice', freshPreview.items[0].manga, freshPreview.items[0])
  assert.equal((await getDoc(importedRef)).data().chapter, '99')
  assert.equal((await getDoc(importedRef)).data().notes, 'Edited later')
  await Promise.all(
    [firstClient, freshClient].map((client) =>
      client.createManga('alice', freshPreview.items[1].manga, freshPreview.items[1]),
    ),
  )
  assert.equal(
    (await getDocsFromServer(query(collection(alice, 'users', 'alice', 'mangas'), limit(10)))).size,
    2,
  )
  const wrongAccount = await loadModule('src/services/manga-service.js', {
    '@/boot/firebase': { db: dbFor('bob'), requireFirebase() {} },
  })
  await assert.rejects(
    wrongAccount.createManga('alice', freshPreview.items[0].manga, freshPreview.items[0]),
    { code: 'permission-denied' },
  )
  await setDoc(doc(alice, 'users', 'alice'), {
    status: 'deleting',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  await assert.rejects(
    freshClient.createManga('alice', freshPreview.items[2].manga, freshPreview.items[2]),
    { code: 'permission-denied' },
  )
})

test('export reads the current server state with explicit metadata and obeys account isolation', async () => {
  const alice = dbFor('alice')
  await setDoc(reference(alice), manga())
  const auth = { currentUser: { uid: 'alice' } }
  const service = await loadModule('src/services/manga-service.js', {
    '@/boot/firebase': { db: alice, requireFirebase: () => ({ auth }) },
  })
  const first = await service.fetchLibraryForExport('alice')
  assert.equal(first.mangas.length, 1)
  assert.equal(first.verification.source, 'server')
  assert.equal(first.verification.hasPendingWrites, false)
  await updateDoc(reference(alice), { chapter: '300', updatedAt: serverTimestamp() })
  const current = await service.fetchLibraryForExport('alice')
  assert.equal(current.mangas[0].chapter, '300')
  assert.equal(first.mangas[0].chapter, '276')
  const wrong = await loadModule('src/services/manga-service.js', {
    '@/boot/firebase': { db: dbFor('bob'), requireFirebase: () => ({ auth }) },
  })
  await assert.rejects(wrong.fetchLibraryForExport('alice'), { code: 'permission-denied' })
})

test('simultaneous chapter transactions do not lose increments or unrelated fields', async () => {
  const alice = dbFor('alice')
  await setDoc(reference(alice), manga())
  const services = await Promise.all(
    Array.from({ length: 3 }, () =>
      loadModule('src/services/manga-service.js', {
        '@/boot/firebase': { db: dbFor('alice'), requireFirebase() {} },
      }),
    ),
  )
  await Promise.all(services.map((service) => service.changeMangaChapter('alice', 'nano', 1)))
  const current = (await getDoc(reference(alice))).data()
  assert.equal(current.chapter, '279')
  assert.equal(current.notes, '')
  await assert.rejects(
    services[0].updateManga(
      'alice',
      'nano',
      { chapter: '300' },
      { expectedValues: { chapter: '276' } },
    ),
    { code: 'app/edit-conflict' },
  )
})

test('list queries require an owner and an explicit bounded limit', async () => {
  for (const uid of ['alice', 'bob']) {
    const ref = collection(dbFor(uid), 'users', 'alice', 'mangas')
    await assertFails(getDocsFromServer(ref))
    await assertFails(getDocsFromServer(query(ref, limit(5002))))
    if (uid === 'alice') await assertSucceeds(getDocsFromServer(query(ref, limit(5001))))
    else await assertFails(getDocsFromServer(query(ref, limit(10))))
  }
})

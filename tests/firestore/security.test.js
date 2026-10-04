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
} from 'firebase/firestore'
import { loadModule } from '../helpers/load-module.js'

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

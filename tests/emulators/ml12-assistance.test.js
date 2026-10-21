import test, { before, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing'
import { initializeApp, deleteApp } from 'firebase/app'
import {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import * as firestore from 'firebase/firestore'
import { loadModule } from '../helpers/load-module.js'

let environment
const projectId = 'demo-mangalist'
function localEndpoint(value) {
  assert.ok(value, 'An explicit local emulator endpoint is required')
  const url = new URL(`http://${value}`)
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname))
  assert.ok(url.port)
  assert.equal(url.username, '')
  assert.equal(url.password, '')
  assert.equal(url.pathname, '/')
  return url
}

before(async () => {
  localEndpoint(process.env.FIREBASE_AUTH_EMULATOR_HOST)
  const endpoint = localEndpoint(process.env.FIRESTORE_EMULATOR_HOST)
  firestore.setLogLevel('silent')
  environment = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: endpoint.hostname,
      port: Number(endpoint.port),
      rules: await readFile(new URL('../../firestore.rules', import.meta.url), 'utf8'),
    },
  })
})
beforeEach(async () => environment.clearFirestore())
after(async () => environment?.cleanup())

async function seed(uid, count) {
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    const batch = firestore.writeBatch(db)
    for (let index = 0; index < count; index++) {
      batch.set(firestore.doc(db, 'users', uid, 'mangas', `synthetic-${index}`), {
        synthetic: true,
      })
    }
    await batch.commit()
  })
}
function service(db, uid, overrides = {}) {
  return loadModule('src/services/account-service.js', {
    '@/boot/firebase': { db, auth: { currentUser: { uid } }, requireFirebase() {} },
    'firebase/firestore': { ...firestore, ...overrides },
  })
}
function remaining(db, uid) {
  return firestore.getDocsFromServer(
    firestore.query(firestore.collection(db, 'users', uid, 'mangas'), firestore.limit(400)),
  )
}

test('ML-12: lost batch acknowledgement undercounts applied deletion; fresh client resumes from server', async () => {
  const uid = 'SYN-ML12-ACK'
  await seed(uid, 401)
  const firstDb = environment.authenticatedContext(uid).firestore()
  const first = await service(firstDb, uid, {
    writeBatch: (db) => {
      const batch = firestore.writeBatch(db)
      return {
        delete: (ref) => batch.delete(ref),
        commit: async () => {
          await batch.commit()
          throw Object.assign(new Error('Synthetic lost acknowledgement'), { code: 'unavailable' })
        },
      }
    },
  })
  await assert.rejects(first.deleteUserFirestoreData(uid), (error) => {
    assert.equal(error.deletedCount, 0)
    assert.equal(error.deletionStarted, true)
    assert.equal(error.partialDataDeletion, false)
    return true
  })
  const freshDb = environment.authenticatedContext(uid).firestore()
  assert.equal((await remaining(freshDb, uid)).size, 1)
  const marker = firestore.doc(freshDb, 'users', uid)
  assert.equal((await firestore.getDocFromServer(marker)).data().status, 'deleting')
  await assertFails(firestore.deleteDoc(marker))
  const fresh = await service(freshDb, uid)
  assert.equal(await fresh.deleteUserFirestoreData(uid), 1)
  assert.equal((await remaining(freshDb, uid)).size, 0)
  assert.equal((await firestore.getDocFromServer(marker)).data().status, 'deleting')
})

test('ML-12: deleting synthetic Auth identity leaves Firestore residue and marker for independent inspection', async () => {
  const endpoint = localEndpoint(process.env.FIREBASE_AUTH_EMULATOR_HOST)
  const app = initializeApp({ projectId, apiKey: 'demo-mangalist-key' }, 'ml12-auth-residue')
  try {
    const auth = getAuth(app)
    connectAuthEmulator(auth, endpoint.origin, { disableWarnings: true })
    const email = 'ml12-residue@example.test'
    const password = 'Synthetic-only-ML12-password'
    const { user } = await createUserWithEmailAndPassword(auth, email, password)
    const uid = user.uid
    await seed(uid, 1)
    await environment.withSecurityRulesDisabled(async (context) => {
      await firestore.setDoc(firestore.doc(context.firestore(), 'users', uid), {
        status: 'deleting',
        createdAt: firestore.serverTimestamp(),
        updatedAt: firestore.serverTimestamp(),
      })
    })
    await deleteUser(user)
    assert.equal(auth.currentUser, null)
    await assert.rejects(signInWithEmailAndPassword(auth, email, password))
    // Auth emulator inventory confirms absence; a failed login alone is insufficient.
    const response = await fetch(
      `${endpoint.origin}/identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:batchGet`,
      { headers: { Authorization: 'Bearer owner' } }, // Fixed emulator-only administrator identity.
    )
    assert.equal(response.ok, true)
    const accounts = await response.json()
    assert.equal(accounts.nextPageToken, undefined, 'Synthetic inventory must fit in one page')
    assert.equal(
      (accounts.users || []).some((entry) => entry.localId === uid),
      false,
    )
    await environment.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      assert.equal((await remaining(db, uid)).size, 1)
      assert.equal(
        (await firestore.getDocFromServer(firestore.doc(db, 'users', uid))).data().status,
        'deleting',
      )
    })
    const foreign = environment.authenticatedContext('SYN-ML12-FOREIGN').firestore()
    await assertFails(remaining(foreign, uid))
  } finally {
    await deleteApp(app)
  }
})

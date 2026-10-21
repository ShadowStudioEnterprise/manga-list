import test from 'node:test'
import assert from 'node:assert/strict'
import * as firestore from 'firebase/firestore'
import * as firebaseAuth from 'firebase/auth'
import { loadModule } from './helpers/load-module.js'

async function fixture({
  count = 0,
  failBatch = 0,
  lockFails = false,
  authFails = false,
  reauthFails = false,
  changeSession = false,
  readFails = false,
  authAckLost = false,
} = {}) {
  const user = {
    uid: 'alice',
    email: 'alice@example.test',
    providerData: [{ providerId: 'password' }],
  }
  const auth = { currentUser: user }
  const state = {
    remaining: count,
    batches: 0,
    locked: false,
    authDeleted: false,
    reads: 0,
    authFails,
  }
  const failure = () => Object.assign(new Error('injected'), { code: 'unavailable' })
  const module = await loadModule('src/services/account-service.js', {
    '@/boot/firebase': { auth, db: {}, requireFirebase() {} },
    'firebase/auth': {
      ...firebaseAuth,
      EmailAuthProvider: { credential: () => ({}) },
      reauthenticateWithCredential: async () => {
        if (reauthFails) throw failure()
        if (changeSession) auth.currentUser = { ...user, uid: 'bob' }
      },
      deleteUser: async () => {
        if (state.authFails) throw failure()
        state.authDeleted = true
        if (authAckLost) throw failure()
      },
    },
    'firebase/firestore': {
      ...firestore,
      collection: () => ({}),
      doc: () => ({}),
      query: () => ({}),
      limit: () => ({}),
      serverTimestamp: () => 'server-time',
      runTransaction: async (_db, callback) => {
        if (lockFails) throw failure()
        await callback({
          get: async () => ({
            exists: () => state.locked,
            data: () => (state.locked ? { status: 'deleting' } : undefined),
          }),
          set: (_ref, data) => {
            assert.equal(data.status, 'deleting')
            state.locked = true
          },
        })
      },
      getDocsFromServer: async () => {
        state.reads++
        assert.equal(state.locked, true)
        if (readFails)
          throw Object.assign(failure(), {
            code: typeof readFails === 'string' ? readFails : 'unavailable',
          })
        const size = Math.min(400, state.remaining)
        return { empty: size === 0, size, docs: Array.from({ length: size }, () => ({ ref: {} })) }
      },
      writeBatch: () => {
        let count = 0
        return {
          delete: () => {
            count++
          },
          commit: async () => {
            state.batches++
            if (state.batches === failBatch) throw failure()
            state.remaining -= count
          },
        }
      },
    },
  })
  return { service: module, state, auth }
}

test('deletion drains more than two batches and ignores presentation callback failures', async () => {
  const { service, state } = await fixture({ count: 805 })
  await service.deleteCurrentAccount({
    password: 'test',
    onProgress() {
      throw new Error('UI')
    },
  })
  assert.equal(state.batches, 3)
  assert.equal(state.remaining, 0)
  assert.equal(state.authDeleted, true)
  assert.equal(state.locked, true)
})

test('failed second batch reports confirmed progress and retries the remaining records', async () => {
  const { service, state } = await fixture({ count: 805, failBatch: 2 })
  await assert.rejects(service.deleteCurrentAccount({ password: 'test' }), (error) => {
    assert.equal(error.deletedCount, 400)
    assert.equal(error.partialDataDeletion, true)
    assert.equal(error.deletionStarted, true)
    assert.equal(error.firestoreDataDeleted, false)
    return true
  })
  assert.equal(state.authDeleted, false)
  await service.deleteCurrentAccount({ password: 'test' })
  assert.equal(state.remaining, 0)
  assert.equal(state.authDeleted, true)
})

test('failed Auth deletion retains the write barrier and can be retried', async () => {
  const { service, state } = await fixture({ count: 2, authFails: true })
  await assert.rejects(service.deleteCurrentAccount({ password: 'test' }), (error) => {
    assert.equal(error.firestoreDataDeleted, true)
    assert.equal(error.deletionStarted, true)
    return true
  })
  state.authFails = false
  await service.deleteCurrentAccount({ password: 'test' })
  assert.equal(state.authDeleted, true)
  assert.equal(state.locked, true)
})

test('reauthentication and marker failures stop before deleting any records', async () => {
  for (const options of [{ lockFails: true }, { reauthFails: true }]) {
    const { service, state } = await fixture({ count: 2, ...options })
    await assert.rejects(service.deleteCurrentAccount({ password: 'test', reauthenticate: false }))
    assert.equal(state.batches, 0)
    assert.equal(state.reads, 0)
    assert.equal(state.authDeleted, false)
  }
})

test('a server read failure cannot be mistaken for an empty library', async () => {
  const { service, state } = await fixture({ count: 2, readFails: true })
  await assert.rejects(service.deleteCurrentAccount({ password: 'test' }), (error) => {
    assert.equal(error.deletionStarted, true)
    assert.equal(error.firestoreDataDeleted, false)
    return true
  })
  assert.equal(state.authDeleted, false)
  assert.equal(state.remaining, 2)
})

test('cleanup rejects another uid and a missing session', async () => {
  const { service, state, auth } = await fixture({ count: 2 })
  await assert.rejects(service.deleteUserFirestoreData('bob'), { code: 'app/invalid-account' })
  auth.currentUser = null
  await assert.rejects(service.deleteCurrentAccount(), { code: 'app/invalid-account' })
  assert.equal(state.batches, 0)
})

test('a session change during reauthentication stops before the write barrier', async () => {
  const { service, state } = await fixture({ count: 2, changeSession: true })
  await assert.rejects(service.deleteCurrentAccount({ password: 'test' }), {
    code: 'app/invalid-account',
  })
  assert.equal(state.locked, false)
  assert.equal(state.batches, 0)
  assert.equal(state.authDeleted, false)
})

test('large deletion stops at a bounded budget and resumes without deleting Auth early', async () => {
  const { service, state } = await fixture({ count: 2401 })
  await assert.rejects(service.deleteCurrentAccount({ password: 'test' }), (error) => {
    assert.equal(error.code, 'app/deletion-budget')
    assert.equal(error.deletedCount, 2000)
    assert.equal(error.deletionStarted, true)
    return true
  })
  assert.equal(state.batches, 5)
  assert.equal(state.reads, 6)
  assert.equal(state.authDeleted, false)
  await service.deleteCurrentAccount({ password: 'test' })
  assert.equal(state.remaining, 0)
  assert.equal(state.authDeleted, true)
})

test('quota exhaustion keeps marker and Auth, and repeated confirmation performs no further reads', async () => {
  const { service, state } = await fixture({ count: 1, readFails: 'resource-exhausted' })
  await assert.rejects(service.deleteCurrentAccount({ password: 'test' }), {
    code: 'resource-exhausted',
  })
  await assert.rejects(service.deleteCurrentAccount({ password: 'test' }), {
    code: 'app/quota-paused',
  })
  assert.equal(state.reads, 1)
  assert.equal(state.locked, true)
  assert.equal(state.authDeleted, false)
})

test('simultaneous deletion confirmations are rejected before a second cleanup starts', async () => {
  const { service, state } = await fixture({ count: 2 })
  const first = service.deleteCurrentAccount({ password: 'test' })
  await assert.rejects(service.deleteCurrentAccount({ password: 'test' }), {
    code: 'app/request-budget',
  })
  await first
  assert.equal(state.batches, 1)
})

test('ML-12: lost Auth acknowledgement reports failure despite applied deletion, requiring independent inspection', async () => {
  const { service, state } = await fixture({ count: 1, authAckLost: true })
  await assert.rejects(service.deleteCurrentAccount({ password: 'test' }), (error) => {
    assert.equal(error.firestoreDataDeleted, true)
    assert.equal(error.deletionStarted, true)
    return true
  })
  assert.equal(state.authDeleted, true)
  assert.equal(state.remaining, 0)
  assert.equal(state.locked, true)
})

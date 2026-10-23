import test from 'node:test'
import assert from 'node:assert/strict'
import { createSparkBudget } from '../src/utils/spark-budget.js'
import { loadModule } from './helpers/load-module.js'

async function fixture({ pause, resume } = {}) {
  let now = 0
  const budget = createSparkBudget(() => now)
  const auth = { currentUser: { uid: 'alice' } }
  const db = {}
  const calls = []
  const service = await loadModule('src/services/library-recovery.js', {
    '@/boot/firebase': { requireFirebase: () => ({ auth, db }) },
    '@/utils/spark-budget': { sparkBudget: budget },
    'firebase/firestore': {
      disableNetwork: async (instance) => {
        assert.equal(instance, db)
        calls.push('pause')
        await pause?.()
      },
      enableNetwork: async (instance) => {
        assert.equal(instance, db)
        calls.push('resume')
        await resume?.()
      },
    },
  })
  return {
    ...service,
    calls,
    auth,
    budget,
    advance: (ms) => {
      now += ms
    },
  }
}

test('manual recovery is serialized and limited before calling the SDK', async () => {
  let release
  const f = await fixture({
    pause: () =>
      new Promise((resolve) => {
        release = resolve
      }),
  })
  const first = f.recoverLibraryConnection('alice')
  await assert.rejects(f.recoverLibraryConnection('alice'), { code: 'app/request-budget' })
  assert.deepEqual(f.calls, ['pause'])
  release()
  await first
  assert.deepEqual(f.calls, ['pause', 'resume'])
  const g = await fixture()
  for (let i = 0; i < 3; i++) await g.recoverLibraryConnection('alice')
  await assert.rejects(g.recoverLibraryConnection('alice'), { code: 'app/request-budget' })
  assert.equal(g.calls.length, 6)
  g.advance(60000)
  await g.recoverLibraryConnection('alice')
  assert.equal(g.calls.length, 8)
})

test('quota and listener backoff prevent transport resets while writes retain admission', async () => {
  const f = await fixture()
  f.budget.record({ code: 'app/listener-suspended' })
  await assert.rejects(f.recoverLibraryConnection('alice'), { code: 'app/reconnect-paused' })
  assert.deepEqual(f.calls, [])
  f.budget.take('write')
  f.advance(2000)
  await f.recoverLibraryConnection('alice')
  f.budget.record({ code: 'resource-exhausted' })
  await assert.rejects(f.recoverLibraryConnection('alice'), { code: 'app/quota-paused' })
  assert.deepEqual(f.calls, ['pause', 'resume'])
})

test('failed pausing still restores transport and keeps both failures', async () => {
  const pauseError = { code: 'unavailable' }
  const resumeError = { code: 'permission-denied' }
  const f = await fixture({
    pause: () => {
      throw pauseError
    },
    resume: () => {
      throw resumeError
    },
  })
  await assert.rejects(f.recoverLibraryConnection('alice'), (error) => {
    assert.deepEqual(error.cause.errors, [pauseError, resumeError])
    return true
  })
  assert.deepEqual(f.calls, ['pause', 'resume'])
})

test('recovery rejects a different account and rechecks identity after restoration', async () => {
  let f
  f = await fixture({
    pause: () => {
      f.auth.currentUser = { uid: 'bob' }
    },
  })
  await assert.rejects(f.recoverLibraryConnection('bob'), { code: 'app/invalid-account' })
  assert.deepEqual(f.calls, [])
  await assert.rejects(f.recoverLibraryConnection('alice'), { code: 'app/invalid-account' })
  assert.deepEqual(f.calls, ['pause', 'resume'])
})

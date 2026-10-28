import test from 'node:test'
import assert from 'node:assert/strict'
import { loadModule } from './helpers/load-module.js'

async function fixture(providers = ['password'], overrides = {}) {
  const user = {
    uid: 'demo-a',
    email: 'demo@example.test',
    providerData: providers.map((providerId) => ({ providerId })),
  }
  const auth = { currentUser: user }
  const calls = []
  const record =
    (name) =>
    async (...args) => {
      calls.push([name, ...args])
      return { user }
    }
  const sdk = {
    EmailAuthProvider: { credential: (email, password) => ({ email, password }) },
    GoogleAuthProvider: class {
      setCustomParameters(value) {
        this.parameters = value
      }
    },
    linkWithCredential: record('linkPassword'),
    linkWithPopup: record('linkGoogle'),
    reauthenticateWithCredential: record('reauthPassword'),
    reauthenticateWithPopup: record('reauthGoogle'),
    reload: record('reload'),
    updatePassword: record('password'),
    verifyBeforeUpdateEmail: record('email'),
    ...overrides,
  }
  const service = await loadModule('src/services/credential-service.js', {
    '@/boot/firebase': { auth, requireFirebase() {} },
    '@/utils/spark-budget': { sparkBudget: { take() {}, record: (error) => error } },
    'firebase/auth': sdk,
  })
  return { service, auth, user, calls }
}

test('password change confirms identity first and preserves user identity', async () => {
  const { service, user, calls } = await fixture()
  assert.equal(await service.changeAccountPassword('old-secret', 'new-secret'), user)
  assert.deepEqual(
    calls.map((c) => c[0]),
    ['reauthPassword', 'password'],
  )
  assert.deepEqual(calls[0][2], { email: user.email, password: 'old-secret' })
  assert.equal(calls[1][1], user)
  assert.equal(calls[1][2], 'new-secret')
})

test('email change verifies the new address without changing the current one optimistically', async () => {
  const { service, user, calls } = await fixture()
  await service.requestAccountEmailChange('old-secret', ' new@example.test ')
  assert.deepEqual(
    calls.map((c) => c[0]),
    ['reauthPassword', 'email'],
  )
  assert.equal(calls[1][2], 'new@example.test')
  assert.equal(user.email, 'demo@example.test')
})

test('invalid input and absent identity never reach credential mutations', async () => {
  const { service, auth, calls } = await fixture()
  await assert.rejects(service.changeAccountPassword('old', '123'), { code: 'auth/weak-password' })
  await assert.rejects(service.requestAccountEmailChange('old', 'invalid'), {
    code: 'auth/invalid-email',
  })
  await assert.rejects(service.changeAccountPassword('', 'new-secret'), {
    code: 'auth/missing-password',
  })
  assert.equal(calls.length, 0)
  auth.currentUser = null
  await assert.rejects(service.addGoogleAccess('old-secret'), { code: 'app/invalid-account' })
  assert.equal(calls.length, 0)
})

test('incorrect confirmation blocks mutations and a subsequent retry succeeds', async () => {
  let attempts = 0
  let writes = 0
  const { service } = await fixture(['password'], {
    async reauthenticateWithCredential() {
      if (++attempts === 1) throw { code: 'auth/invalid-credential' }
    },
    async updatePassword() {
      writes++
    },
  })
  await assert.rejects(service.changeAccountPassword('wrong', 'new-secret'), {
    code: 'auth/invalid-credential',
  })
  assert.equal(writes, 0)
  await service.changeAccountPassword('correct', 'new-secret')
  assert.equal(writes, 1)
})

test('account replacement during confirmation prevents mutation of either account', async () => {
  const state = await fixture(['password'], {
    async reauthenticateWithCredential() {
      state.auth.currentUser = { uid: 'demo-b' }
    },
  })
  await assert.rejects(state.service.changeAccountPassword('old-secret', 'new-secret'), {
    code: 'app/invalid-account',
  })
  assert.deepEqual(state.calls, [])
})

test('Google account can add password access to its current email and UID', async () => {
  const { service, user, calls } = await fixture(['google.com'])
  assert.equal(await service.addPasswordAccess('', 'new-secret'), user)
  assert.deepEqual(
    calls.map((c) => c[0]),
    ['reauthGoogle', 'linkPassword'],
  )
  assert.deepEqual(calls[0][2].parameters, { prompt: 'select_account' })
  assert.deepEqual(calls[1][2], { email: user.email, password: 'new-secret' })
})

for (const code of [
  'auth/credential-already-in-use',
  'auth/popup-closed-by-user',
  'auth/popup-blocked',
  'auth/network-request-failed',
]) {
  test(`Google linking preserves ${code}, does not switch identity and permits retry`, async () => {
    let attempts = 0
    const { service, auth, user, calls } = await fixture(['password'], {
      async linkWithPopup(target, provider) {
        assert.equal(target, user)
        assert.deepEqual(provider.parameters, { prompt: 'select_account' })
        if (++attempts === 1) throw { code }
        return { user }
      },
    })
    await assert.rejects(service.addGoogleAccess('old-secret'), { code })
    assert.equal(auth.currentUser, user)
    assert.equal(await service.addGoogleAccess('old-secret'), user)
    assert.equal(attempts, 2)
    assert.deepEqual(
      calls.map((c) => c[0]),
      ['reauthPassword', 'reauthPassword'],
    )
  })
}

test('concurrent credential operations are rejected until the first completes', async () => {
  let resume
  const { service, calls } = await fixture(['password'], {
    reauthenticateWithCredential: () =>
      new Promise((resolve) => {
        resume = resolve
      }),
  })
  const first = service.changeAccountPassword('old-secret', 'new-secret')
  await assert.rejects(service.addGoogleAccess('old-secret'), { code: 'app/credential-busy' })
  resume()
  await first
  assert.deepEqual(
    calls.map((c) => c[0]),
    ['password'],
  )
})

test('refresh rejects an identity changed during reload', async () => {
  const state = await fixture(['password'], {
    async reload() {
      state.auth.currentUser = null
    },
  })
  await assert.rejects(state.service.refreshAccountIdentity(), { code: 'app/invalid-account' })
})

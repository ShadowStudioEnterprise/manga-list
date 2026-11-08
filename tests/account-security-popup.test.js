import test from 'node:test'
import assert from 'node:assert/strict'
import { effectScope, reactive, nextTick } from 'vue'
import { loadModule } from './helpers/load-module.js'

async function fixture(openPopup = async (user) => user) {
  const store = reactive({
    user: { uid: 'demo-c', email: 'demo@example.test', providerIds: ['password'] },
  })
  let prepared = 0
  let opened = 0
  const component = (
    await loadModule('src/components/AccountSecurityCard.vue', {
      '@/stores/auth-store': { useAuthStore: () => store },
      '@/services/auth-service': { serializeAuthUser: (user) => user },
      '@/services/credential-service': {
        async prepareGoogleAccess(password) {
          assert.equal(password, 'synthetic-password')
          prepared++
          return () => {
            opened++
            return openPopup(store.user)
          }
        },
        addPasswordAccess() {},
        changeAccountPassword() {},
        refreshAccountIdentity() {},
        requestAccountEmailChange() {},
      },
    })
  ).default
  const scope = effectScope()
  const state = scope.run(() => component.setup({}, { expose() {} }))
  return { state, store, scope, counts: () => ({ prepared, opened }) }
}

test('confirmation clears password and waits for explicit popup consent; cancel discards action', async () => {
  const f = await fixture()
  try {
    f.state.open('google')
    f.state.currentPassword.value = 'synthetic-password'
    await f.state.submit()
    assert.equal(f.state.currentPassword.value, '')
    assert.equal(typeof f.state.googlePopupAction.value, 'function')
    assert.deepEqual(f.counts(), { prepared: 1, opened: 0 })
    await f.state.submit() // Enter/form submission must not open a popup.
    assert.deepEqual(f.counts(), { prepared: 1, opened: 0 })
    f.state.clearSecrets() // Dialog hide/cancel.
    await f.state.openGooglePopup()
    assert.deepEqual(f.counts(), { prepared: 1, opened: 0 })
  } finally {
    f.scope.stop()
  }
})

test('blocked popup resets confirmation and exposes safe error without retaining password', async () => {
  const f = await fixture(async () => {
    throw { code: 'auth/popup-blocked' }
  })
  try {
    f.state.open('google')
    f.state.currentPassword.value = 'synthetic-password'
    await f.state.submit()
    await f.state.openGooglePopup()
    assert.equal(f.state.googlePopupAction.value, null)
    assert.equal(f.state.currentPassword.value, '')
    assert.match(f.state.error.value, /bloqueado/)
    assert.equal(f.state.busy.value, false)
  } finally {
    f.scope.stop()
  }
})

test('switching accounts discards prepared popup before it can be used', async () => {
  const f = await fixture()
  try {
    f.state.open('google')
    f.state.currentPassword.value = 'synthetic-password'
    await f.state.submit()
    f.store.user = { uid: 'demo-d', providerIds: ['password'] }
    await nextTick()
    assert.equal(f.state.dialog.value, false)
    assert.equal(f.state.googlePopupAction.value, null)
    await f.state.openGooglePopup()
    assert.equal(f.counts().opened, 0)
  } finally {
    f.scope.stop()
  }
})

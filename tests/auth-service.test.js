import test from 'node:test'
import assert from 'node:assert/strict'
import { loadModule } from './helpers/load-module.js'

async function readinessService(observer) {
  return loadModule('src/services/auth-service.js', {
    '@/boot/firebase': { auth: {}, requireFirebase() {} },
    '@/utils/spark-budget': { sparkBudget: { take() {}, record: (error) => error } },
    'firebase/auth': {
      GoogleAuthProvider: class {},
      browserLocalPersistence: 'local',
      inMemoryPersistence: 'memory',
      async setPersistence() {
        throw Error('Boot persistence must not be overridden')
      },
      onAuthStateChanged: observer,
      signInWithPopup() {},
      createUserWithEmailAndPassword() {},
      signInWithEmailAndPassword() {},
      sendPasswordResetEmail() {},
      signOut() {},
    },
  })
}

test('ML-15: concurrent readiness callers share one observer and retain boot persistence', async () => {
  let observers = 0
  const user = { uid: 'synthetic-memory-user' }
  const service = await readinessService((_auth, next) => {
    observers++
    queueMicrotask(() => next(user))
    return () => {}
  })
  const first = service.initializeAuth()
  assert.equal(first, service.waitForAuthReady())
  assert.equal(await first, user)
  assert.equal(await service.initializeAuth(), user)
  assert.equal(service.getCurrentAuthUser(), user)
  assert.equal(observers, 1)
})

test('ML-15: failed initial observer is disposed and readiness can retry without changing persistence', async () => {
  let observers = 0
  let disposed = 0
  const service = await readinessService((_auth, next, fail) => {
    const attempt = ++observers
    queueMicrotask(() =>
      attempt === 1 ? fail({ code: 'auth/network-request-failed' }) : next(null),
    )
    return () => {
      disposed++
    }
  })
  await assert.rejects(service.initializeAuth(), { code: 'auth/network-request-failed' })
  assert.equal(disposed, 1)
  assert.equal(await service.initializeAuth(), null)
  assert.equal(observers, 2)
})

for (const [code, message] of [
  ['auth/popup-closed-by-user', 'Se ha cerrado la ventana de acceso antes de terminar.'],
  ['auth/popup-blocked', 'El navegador ha bloqueado la ventana de acceso con Google.'],
  [
    'auth/network-request-failed',
    'No se ha podido conectar. Comprueba tu conexión e inténtalo de nuevo.',
  ],
]) {
  test(`ML-15: actual Google service preserves ${code} and permits a retry (synthetic SDK)`, async () => {
    let attempts = 0
    let parameters
    const user = { uid: 'synthetic-google', providerData: [{ providerId: 'google.com' }] }
    const service = await loadModule('src/services/auth-service.js', {
      '@/boot/firebase': { auth: {}, requireFirebase() {} },
      '@/utils/spark-budget': { sparkBudget: { take() {}, record: (error) => error } },
      'firebase/auth': {
        GoogleAuthProvider: class {
          setCustomParameters(value) {
            parameters = value
          }
        },
        browserLocalPersistence: 'local',
        inMemoryPersistence: 'memory',
        setPersistence: async () => {},
        onAuthStateChanged(_auth, callback) {
          queueMicrotask(() => callback(null))
          return () => {}
        },
        async signInWithPopup() {
          if (++attempts === 1) throw Object.assign(new Error('synthetic failure'), { code })
          return { user }
        },
        createUserWithEmailAndPassword() {},
        signInWithEmailAndPassword() {},
        sendPasswordResetEmail() {},
        signOut() {},
      },
    })
    await assert.rejects(
      service.loginWithGoogle(),
      (error) => error.code === code && error.message === message,
    )
    assert.equal(await service.loginWithGoogle(), user)
    assert.deepEqual(parameters, { prompt: 'select_account' })
  })
}

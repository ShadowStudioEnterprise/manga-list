import test from 'node:test'
import assert from 'node:assert/strict'
import { loadModule } from './helpers/load-module.js'

for (const failMemoryOnce of [false, true]) {
  test(`ML-15: local persistence denied, memory fallback${failMemoryOnce ? ' recovers after an initialization failure' : ' initializes once'} (synthetic SDK)`, async () => {
    const persistenceCalls = []
    let observerCount = 0
    let memoryFailurePending = failMemoryOnce
    const service = await loadModule('src/services/auth-service.js', {
      '@/boot/firebase': { auth: {}, requireFirebase() {} },
      '@/utils/spark-budget': { sparkBudget: { take() {}, record: (error) => error } },
      'firebase/auth': {
        GoogleAuthProvider: class {},
        browserLocalPersistence: 'local',
        inMemoryPersistence: 'memory',
        async setPersistence(_auth, persistence) {
          persistenceCalls.push(persistence)
          if (persistence === 'local' || memoryFailurePending) {
            if (persistence === 'memory') memoryFailurePending = false
            throw Object.assign(new Error('Synthetic storage unavailable'), {
              code: 'auth/web-storage-unsupported',
            })
          }
        },
        onAuthStateChanged(_auth, callback) {
          observerCount++
          queueMicrotask(() => callback(null))
          return () => {}
        },
        signInWithPopup() {},
        createUserWithEmailAndPassword() {},
        signInWithEmailAndPassword() {},
        sendPasswordResetEmail() {},
        signOut() {},
      },
    })
    if (failMemoryOnce) {
      await assert.rejects(service.initializeAuth(), { code: 'auth/web-storage-unsupported' })
      assert.equal(observerCount, 0)
    }
    assert.equal(await service.initializeAuth(), null)
    assert.equal(await service.initializeAuth(), null)
    assert.deepEqual(
      persistenceCalls,
      failMemoryOnce ? ['local', 'memory', 'local', 'memory'] : ['local', 'memory'],
    )
    assert.equal(observerCount, 1)
    assert.equal(service.getCurrentAuthUser(), null)
  })
}

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

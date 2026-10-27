import test from 'node:test'
import assert from 'node:assert/strict'
import { loadModule } from './helpers/load-module.js'

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

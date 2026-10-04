import { defineBoot } from '#q-app'
import { getApp, getApps, initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

const firebaseConfig = Object.freeze(
  Object.fromEntries(
    Object.entries({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    }).map(([key, value]) => [key, String(value ?? '').trim()]),
  ),
)

const ENV_BY_CONFIG_KEY = Object.freeze({
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
})

export const missingFirebaseEnv = Object.entries(firebaseConfig)
  .filter(([, value]) => typeof value !== 'string' || value.trim() === '')
  .map(([key]) => ENV_BY_CONFIG_KEY[key])

export const isFirebaseConfigured = missingFirebaseEnv.length === 0

export const firebaseApp = isFirebaseConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null

export const auth = firebaseApp ? getAuth(firebaseApp) : null
export const db = firebaseApp ? getFirestore(firebaseApp) : null

// Emulator connections are opt-in, development-only, and require a demo project.
if (import.meta.env.DEV && String(import.meta.env.QCLI_FIREBASE_EMULATORS) === 'true') {
  if (!firebaseApp || !firebaseConfig.projectId.startsWith('demo-')) {
    throw new Error('Firebase emulators require a configured demo project.')
  }
  connectAuthEmulator(auth, 'http://127.0.0.1:9199', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8188)
}

export function requireFirebase() {
  if (!firebaseApp || !auth || !db) {
    const error = new Error('Firebase configuration is incomplete.')
    error.code = 'app/firebase-not-configured'
    error.missingEnv = [...missingFirebaseEnv]
    throw error
  }

  return { app: firebaseApp, auth, db }
}

export default defineBoot(() => undefined)

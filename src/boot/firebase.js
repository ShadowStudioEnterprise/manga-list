import { defineBoot } from '#q-app'
import { getApp, getApps, initializeApp } from 'firebase/app'
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  connectAuthEmulator,
  initializeAuth,
  inMemoryPersistence,
} from 'firebase/auth'
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

// Reject an unsafe emulator request before any Firebase app/service initialization.
const emulatorFlag = String(import.meta.env.QCLI_FIREBASE_EMULATORS ?? '').trim()
if (!['', 'true', 'false'].includes(emulatorFlag)) {
  throw new Error('Firebase emulator flag must be true or false.')
}
const useEmulators = emulatorFlag === 'true'
if (
  useEmulators &&
  (import.meta.env.DEV !== true ||
    !isFirebaseConfigured ||
    !firebaseConfig.projectId.startsWith('demo-'))
) {
  throw new Error('Firebase emulators require development mode and a configured demo project.')
}

function configuredApp() {
  if (!isFirebaseConfigured) return null
  if (getApps().length === 0) return initializeApp(firebaseConfig)
  const app = getApp()
  if (Object.keys(firebaseConfig).some((key) => app.options?.[key] !== firebaseConfig[key])) {
    throw new Error('Existing Firebase app does not match the configured application.')
  }
  return app
}

export const firebaseApp = configuredApp()

// Choose persistence before initialization. Starting with getAuth's IndexedDB
// defaults and then moving to localStorage can sign another tab out during migration.
export const auth = firebaseApp
  ? initializeAuth(firebaseApp, {
      persistence: [browserLocalPersistence, inMemoryPersistence],
      popupRedirectResolver: browserPopupRedirectResolver,
    })
  : null

// Connect synchronously before initializing the next service; never fall back to cloud.
if (useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9199', { disableWarnings: true })
}

export const db = firebaseApp ? getFirestore(firebaseApp) : null
if (useEmulators) {
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

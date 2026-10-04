import {
  GoogleAuthProvider,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  inMemoryPersistence,
} from 'firebase/auth'
import { auth, requireFirebase } from '@/boot/firebase'
import { toAppError } from '@/utils/firebase-errors'

const authStateListeners = new Set()
const authErrorListeners = new Set()

let currentAuthUser = null
let authObserverUnsubscribe = null
let authInitializationPromise = null
let authIsReady = false

function notifyAuthState(user) {
  for (const listener of authStateListeners) {
    listener(user)
  }
}

function notifyAuthError(error) {
  for (const listener of authErrorListeners) {
    listener(error)
  }
}

export function initializeAuth() {
  if (authInitializationPromise) {
    return authInitializationPromise
  }

  authInitializationPromise = (async () => {
    requireFirebase()
    try {
      await setPersistence(auth, browserLocalPersistence)
    } catch {
      await setPersistence(auth, inMemoryPersistence)
    }

    return new Promise((resolve, reject) => {
      let initialStatePending = true

      authObserverUnsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          currentAuthUser = user
          authIsReady = true
          notifyAuthState(user)

          if (initialStatePending) {
            initialStatePending = false
            resolve(user)
          }
        },
        (error) => {
          const appError = toAppError(error, 'No se ha podido comprobar el estado de tu sesión.')
          notifyAuthError(appError)

          if (initialStatePending) {
            initialStatePending = false
            reject(appError)
          }
        },
      )
    })
  })().catch((error) => {
    authObserverUnsubscribe?.()
    authObserverUnsubscribe = null
    authInitializationPromise = null
    authIsReady = false
    throw toAppError(error, 'No se ha podido iniciar el servicio de autenticación.')
  })

  return authInitializationPromise
}

export function waitForAuthReady() {
  return initializeAuth()
}

export const authReady = waitForAuthReady

export function observeAuthState(listener, onError) {
  authStateListeners.add(listener)

  if (onError) {
    authErrorListeners.add(onError)
  }

  if (authIsReady) {
    queueMicrotask(() => listener(currentAuthUser))
  }

  void initializeAuth().catch((error) => {
    if (onError && !authIsReady) {
      onError(error)
    }
  })

  return () => {
    authStateListeners.delete(listener)

    if (onError) {
      authErrorListeners.delete(onError)
    }
  }
}

export function getCurrentAuthUser() {
  return currentAuthUser ?? auth?.currentUser ?? null
}

export function serializeAuthUser(user) {
  if (!user) {
    return null
  }

  return {
    uid: user.uid,
    email: user.email,
    emailVerified: user.emailVerified,
    displayName: user.displayName,
    photoURL: user.photoURL,
    providerIds: user.providerData.map(({ providerId }) => providerId),
  }
}

export async function loginWithEmail(email, password) {
  try {
    await initializeAuth()
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
    return credential.user
  } catch (error) {
    throw toAppError(error, 'No se ha podido iniciar sesión.')
  }
}

export async function registerWithEmail(email, password) {
  try {
    await initializeAuth()
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
    return credential.user
  } catch (error) {
    throw toAppError(error, 'No se ha podido crear la cuenta.')
  }
}

export async function loginWithGoogle() {
  try {
    await initializeAuth()
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    const credential = await signInWithPopup(auth, provider)
    return credential.user
  } catch (error) {
    throw toAppError(error, 'No se ha podido iniciar sesión con Google.')
  }
}

export async function logout() {
  try {
    requireFirebase()
    await signOut(auth)
  } catch (error) {
    throw toAppError(error, 'No se ha podido cerrar la sesión.')
  }
}

export async function resetPassword(email) {
  try {
    requireFirebase()
    await sendPasswordResetEmail(auth, email.trim())
  } catch (error) {
    throw toAppError(error, 'No se ha podido enviar el correo de recuperación.')
  }
}

export function disposeAuthObserver() {
  authObserverUnsubscribe?.()
  authObserverUnsubscribe = null
}

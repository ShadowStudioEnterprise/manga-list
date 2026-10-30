import { sparkBudget } from '@/utils/spark-budget'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
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
    // Boot already selects an available persistence before Auth initializes.
    // setPersistence(local) may resolve with no current user even when writes
    // are denied, undoing boot's memory fallback and breaking the next login.

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
    throw toAppError(
      sparkBudget.record(error),
      'No se ha podido iniciar el servicio de autenticación.',
    )
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
    sparkBudget.take('auth')
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
    return credential.user
  } catch (error) {
    throw toAppError(sparkBudget.record(error), 'No se ha podido iniciar sesión.')
  }
}

export async function registerWithEmail(email, password) {
  try {
    await initializeAuth()
    sparkBudget.take('auth')
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
    return credential.user
  } catch (error) {
    throw toAppError(sparkBudget.record(error), 'No se ha podido crear la cuenta.')
  }
}

export async function loginWithGoogle() {
  try {
    await initializeAuth()
    sparkBudget.take('auth')
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    const credential = await signInWithPopup(auth, provider)
    return credential.user
  } catch (error) {
    throw toAppError(sparkBudget.record(error), 'No se ha podido iniciar sesión con Google.')
  }
}

export async function logout() {
  try {
    requireFirebase()
    await signOut(auth)
  } catch (error) {
    throw toAppError(sparkBudget.record(error), 'No se ha podido cerrar la sesión.')
  }
}

export async function resetPassword(email) {
  try {
    requireFirebase()
    sparkBudget.take('auth')
    await sendPasswordResetEmail(auth, email.trim())
  } catch (error) {
    throw toAppError(sparkBudget.record(error), 'No se ha podido enviar el correo de recuperación.')
  }
}

export function disposeAuthObserver() {
  authObserverUnsubscribe?.()
  authObserverUnsubscribe = null
}

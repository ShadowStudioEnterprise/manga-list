import {
  EmailAuthProvider,
  GoogleAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from 'firebase/auth'
import { collection, deleteDoc, doc, getDocs, limit, query, writeBatch } from 'firebase/firestore'
import { auth, db, requireFirebase } from '@/boot/firebase'
import { createAppError, toAppError } from '@/utils/firebase-errors'

const DELETE_BATCH_SIZE = 400

function normalizeDeleteOptions(options) {
  if (typeof options === 'string') {
    return { password: options }
  }

  return options && typeof options === 'object' ? options : {}
}

function providerIdsFor(user) {
  return new Set(user.providerData.map(({ providerId }) => providerId))
}

export async function reauthenticateCurrentUser(options = {}) {
  requireFirebase()

  const user = auth.currentUser

  if (!user) {
    throw createAppError('app/invalid-account', 'No hay ninguna cuenta activa.')
  }

  const { password } = normalizeDeleteOptions(options)
  const providerIds = providerIdsFor(user)

  try {
    if (password && providerIds.has('password') && user.email) {
      const credential = EmailAuthProvider.credential(user.email, password)
      await reauthenticateWithCredential(user, credential)
      return user
    }

    if (providerIds.has('google.com')) {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      await reauthenticateWithPopup(user, provider)
      return user
    }

    if (providerIds.has('password')) {
      throw createAppError(
        'app/reauthentication-required',
        'Introduce tu contraseña para confirmar la eliminación de la cuenta.',
      )
    }

    throw createAppError(
      'app/reauthentication-required',
      'Vuelve a iniciar sesión antes de eliminar la cuenta.',
    )
  } catch (error) {
    throw toAppError(error, 'No se ha podido verificar tu identidad.')
  }
}

export async function deleteUserFirestoreData(uid, onProgress) {
  requireFirebase()

  if (typeof uid !== 'string' || !uid.trim() || uid.includes('/')) {
    throw createAppError('app/invalid-account', 'No se ha podido identificar la cuenta.')
  }

  const normalizedUid = uid.trim()
  const mangasReference = collection(db, 'users', normalizedUid, 'mangas')
  let deletedCount = 0

  try {
    while (true) {
      const snapshot = await getDocs(query(mangasReference, limit(DELETE_BATCH_SIZE)))

      if (snapshot.empty) {
        break
      }

      const batch = writeBatch(db)

      for (const mangaDocument of snapshot.docs) {
        batch.delete(mangaDocument.ref)
      }

      await batch.commit()
      deletedCount += snapshot.size

      try {
        onProgress?.({ deletedCount })
      } catch {
        // A presentation callback must never interrupt account deletion.
      }
    }

    await deleteDoc(doc(db, 'users', normalizedUid))
    return deletedCount
  } catch (error) {
    const appError = toAppError(error, 'No se han podido eliminar todos los datos de la cuenta.')
    appError.deletedCount = deletedCount
    appError.partialDataDeletion = deletedCount > 0
    throw appError
  }
}

export async function deleteCurrentAccount(options = {}) {
  requireFirebase()

  const user = auth.currentUser

  if (!user) {
    throw createAppError('app/invalid-account', 'No hay ninguna cuenta activa.')
  }

  const normalizedOptions = normalizeDeleteOptions(options)
  let firestoreDataDeleted = false

  try {
    if (normalizedOptions.reauthenticate !== false) {
      await reauthenticateCurrentUser(normalizedOptions)
    }

    await deleteUserFirestoreData(user.uid, normalizedOptions.onProgress)
    firestoreDataDeleted = true
    await deleteUser(user)
  } catch (error) {
    const appError = toAppError(error, 'No se ha podido eliminar la cuenta.')
    appError.firestoreDataDeleted = firestoreDataDeleted
    throw appError
  }
}

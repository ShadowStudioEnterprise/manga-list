import { sparkBudget, SPARK_LIMITS } from '@/utils/spark-budget'
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from 'firebase/auth'
import {
  collection,
  doc,
  getDocsFromServer,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { auth, db, requireFirebase } from '@/boot/firebase'
import { createAppError, toAppError } from '@/utils/firebase-errors'

const DELETE_BATCH_SIZE = SPARK_LIMITS.deletionBatch
let deletionInProgress = false

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
    throw toAppError(sparkBudget.record(error), 'No se ha podido verificar tu identidad.')
  }
}

// Retain this marker after Auth deletion: other sessions can still hold valid
// tokens. Removing it would let those sessions recreate orphaned manga data.
async function beginAccountDeletion(uid) {
  const reference = doc(db, 'users', uid)
  sparkBudget.take('write')
  await runTransaction(
    db,
    async (transaction) => {
      const snapshot = await transaction.get(reference)
      if (snapshot.data()?.status === 'deleting') return
      transaction.set(reference, {
        createdAt: snapshot.exists() ? snapshot.data().createdAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'deleting',
      })
    },
    { maxAttempts: SPARK_LIMITS.transactionAttempts },
  )
}

export async function deleteUserFirestoreData(uid, onProgress) {
  requireFirebase()

  if (typeof uid !== 'string' || !uid.trim() || uid.includes('/')) {
    throw createAppError('app/invalid-account', 'No se ha podido identificar la cuenta.')
  }

  const normalizedUid = uid.trim()
  if (auth.currentUser?.uid !== normalizedUid) {
    throw createAppError('app/invalid-account', 'La sesión no coincide con la cuenta a eliminar.')
  }
  const mangasReference = collection(db, 'users', normalizedUid, 'mangas')
  let deletedCount = 0
  let deletionStarted = false

  try {
    await beginAccountDeletion(normalizedUid)
    deletionStarted = true
    for (let page = 0; page <= SPARK_LIMITS.deletionBatches; page++) {
      if (auth.currentUser?.uid !== normalizedUid) throw createAppError('app/invalid-account')
      sparkBudget.take('read')
      const snapshot = await getDocsFromServer(query(mangasReference, limit(DELETE_BATCH_SIZE)))

      if (snapshot.empty) {
        break
      }

      if (page === SPARK_LIMITS.deletionBatches) throw createAppError('app/deletion-budget')
      sparkBudget.take('write')
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

    return deletedCount
  } catch (error) {
    const appError = toAppError(
      sparkBudget.record(error),
      'No se han podido eliminar todos los datos de la cuenta.',
    )
    appError.deletionStarted = deletionStarted
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

  if (deletionInProgress) throw createAppError('app/request-budget')
  sparkBudget.take('auth')
  deletionInProgress = true
  const normalizedOptions = normalizeDeleteOptions(options)
  let firestoreDataDeleted = false

  try {
    await reauthenticateCurrentUser(normalizedOptions)
    if (auth.currentUser !== user) {
      throw createAppError('app/invalid-account', 'La sesión cambió durante la confirmación.')
    }

    await deleteUserFirestoreData(user.uid, normalizedOptions.onProgress)
    firestoreDataDeleted = true
    if (auth.currentUser !== user) throw createAppError('app/invalid-account')
    await deleteUser(user)
  } catch (error) {
    const appError = toAppError(sparkBudget.record(error), 'No se ha podido eliminar la cuenta.')
    appError.deletionStarted = appError.deletionStarted || firestoreDataDeleted
    appError.firestoreDataDeleted = firestoreDataDeleted
    throw appError
  } finally {
    deletionInProgress = false
  }
}

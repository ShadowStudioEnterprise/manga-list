import { disableNetwork, enableNetwork } from 'firebase/firestore'
import { requireFirebase } from '@/boot/firebase'
import { sparkBudget } from '@/utils/spark-budget'
import { createAppError, toAppError } from '@/utils/firebase-errors'

let recovering = false

// Explicit user recovery only. Pausing the local transport retains queued writes;
// it does not terminate the SDK, clear data or claim a server acknowledgement.
export async function recoverLibraryConnection(uid) {
  const { auth, db } = requireFirebase()
  if (!uid || auth.currentUser?.uid !== uid) throw createAppError('app/invalid-account')
  if (recovering) throw createAppError('app/request-budget')
  sparkBudget.take('recover')
  if (sparkBudget.retryAfterMs('listen') > 0) throw createAppError('app/reconnect-paused')
  recovering = true
  try {
    let pauseError
    try {
      await disableNetwork(db)
    } catch (error) {
      pauseError = sparkBudget.record(error)
    }
    // Always attempt restoration, even if pausing failed. Keep both causes if
    // restoration also fails rather than replacing the first failure.
    try {
      await enableNetwork(db)
    } catch (error) {
      sparkBudget.record(error)
      throw pauseError
        ? new AggregateError([pauseError, error], 'Connection recovery failed')
        : error
    }
    if (pauseError) throw pauseError
    if (auth.currentUser?.uid !== uid) throw createAppError('app/invalid-account')
  } catch (error) {
    throw toAppError(
      sparkBudget.record(error),
      'No se ha podido restablecer la conexión. Conserva tus cambios y reintenta más tarde.',
    )
  } finally {
    recovering = false
  }
}

import { createAppError } from './firebase-errors.js'

export const SPARK_LIMITS = Object.freeze({
  libraryDocuments: 10000,
  // Transport size only; the library cap remains provisional pending cost review.
  pageDocuments: 1000,
  libraryRanges: 64,
  deletionBatch: 400,
  deletionBatches: 5,
  transactionAttempts: 3,
})

// Per-tab admission control, not a global quota or a security boundary.
export function createSparkBudget(now = Date.now) {
  const windows = new Map()
  let blockedUntil = 0
  const limits = { read: 60, write: 120, listen: 3, auth: 10 }
  return {
    take(kind) {
      const time = now()
      if (time < blockedUntil) throw createAppError('app/quota-paused')
      const window = windows.get(kind)
      const current = !window || time - window.start >= 60000 ? { start: time, count: 0 } : window
      if (!limits[kind] || current.count >= limits[kind]) {
        throw createAppError('app/request-budget')
      }
      current.count++
      windows.set(kind, current)
    },
    record(error) {
      if (
        [
          'resource-exhausted',
          'firestore/resource-exhausted',
          'auth/quota-exceeded',
          'auth/too-many-requests',
        ].includes(error?.code)
      ) {
        blockedUntil = Math.max(blockedUntil, now() + 15 * 60000)
      }
      return error
    },
  }
}

export const sparkBudget = createSparkBudget()

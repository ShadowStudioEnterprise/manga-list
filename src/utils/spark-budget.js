import { createAppError } from './firebase-errors.js'

export const SPARK_LIMITS = Object.freeze({
  libraryDocuments: 10000,
  // Transport size only; the library cap remains provisional pending cost review.
  pageDocuments: 5000,
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
    remaining(kind) {
      if (now() < blockedUntil || !limits[kind]) return 0
      const window = windows.get(kind)
      return !window || now() - window.start >= 60000
        ? limits[kind]
        : Math.max(0, limits[kind] - window.count)
    },
    retryAfterMs(kind) {
      const time = now()
      const window = windows.get(kind)
      return Math.max(
        0,
        blockedUntil - time,
        window && window.count >= limits[kind] ? window.start + 60000 - time : 0,
      )
    },
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

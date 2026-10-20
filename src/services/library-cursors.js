import {
  documentId,
  getDocsFromServer,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
} from 'firebase/firestore'
import { sparkBudget, SPARK_LIMITS } from '@/utils/spark-budget'
import { createAppError, toAppError } from '@/utils/firebase-errors'

function rangeQuery(reference, lower) {
  return query(
    reference,
    orderBy(documentId()),
    ...(lower === null ? [] : [startAfter(lower)]),
    limit(SPARK_LIMITS.pageDocuments + 1),
  )
}

// Search, filters and global sorting already require the whole bounded library.
// One target avoids re-reading each closed child during recursive range splits.
export function subscribeCursorLibrary(reference, deserialize, onData, onError) {
  sparkBudget.take('listen')
  let stopped = false,
    unsubscribe,
    confirmed = false
  const stop = () => {
    stopped = true
    unsubscribe?.()
  }
  const fail = (error) => {
    if (stopped) return
    stop()
    onError?.(toAppError(sparkBudget.record(error)))
  }
  try {
    sparkBudget.take('read')
    unsubscribe = onSnapshot(
      query(reference, orderBy(documentId()), limit(SPARK_LIMITS.libraryDocuments + 1)),
      { includeMetadataChanges: true },
      (snapshot) => {
        if (stopped) return
        if (snapshot.docs.length > SPARK_LIMITS.libraryDocuments) {
          fail(createAppError('app/library-budget'))
          return
        }
        const fromCache = snapshot.metadata?.fromCache !== false
        const hasPendingWrites = snapshot.metadata?.hasPendingWrites !== false
        confirmed ||= !fromCache && !hasPendingWrites
        onData(snapshot.docs.map(deserialize), {
          fromCache,
          hasPendingWrites,
          complete: confirmed,
        })
      },
      fail,
    )
    if (stopped) unsubscribe()
  } catch (error) {
    fail(error)
  }
  return stop
}

// A failed page never returns a truncated export. No cache fallback or offsets.
export async function fetchCursorLibrary(reference, deserialize, assertSession) {
  const documents = []
  let cursor = null
  while (true) {
    assertSession()
    sparkBudget.take('read')
    const snapshot = await getDocsFromServer(rangeQuery(reference, cursor))
    assertSession()
    if (snapshot.metadata?.fromCache !== false || snapshot.metadata?.hasPendingWrites !== false) {
      throw createAppError('app/export-not-confirmed')
    }
    // Keep the sentinel for the next page rather than skipping it.
    const page = snapshot.docs.slice(0, SPARK_LIMITS.pageDocuments)
    documents.push(...page)
    if (documents.length > SPARK_LIMITS.libraryDocuments) {
      throw createAppError('app/library-budget')
    }
    if (snapshot.docs.length <= SPARK_LIMITS.pageDocuments) break
    const nextCursor = page.at(-1)?.id
    if (!nextCursor || nextCursor === cursor) throw createAppError('app/export-not-confirmed')
    cursor = nextCursor
  }
  return documents.map(deserialize)
}

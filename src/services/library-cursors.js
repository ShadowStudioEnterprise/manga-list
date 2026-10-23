import {
  documentId,
  endAt,
  getDocsFromServer,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
} from 'firebase/firestore'
import { sparkBudget, SPARK_LIMITS } from '@/utils/spark-budget'
import { createAppError, toAppError } from '@/utils/firebase-errors'

function rangeQuery(reference, lower, upper) {
  return query(
    reference,
    orderBy(documentId()),
    ...(lower === null ? [] : [startAfter(lower)]),
    ...(upper === null ? [] : [endAt(upper)]),
    limit(SPARK_LIMITS.pageDocuments + 1),
  )
}

// Stable, disjoint ID ranges retain deletions and insertions at page boundaries.
// Ordering by mutable titles/timestamps here would move documents between listeners.
export function subscribeCursorLibrary(reference, deserialize, onData, onError) {
  sparkBudget.take('listen')
  const ranges = new Set()
  let stopped = false
  let attaching = 0
  let deferred = 0
  let confirmationTimer
  let removePauseObserver
  const stopRange = (range) => {
    range.active = false
    range.stop?.()
  }
  const stop = () => {
    stopped = true
    clearTimeout(confirmationTimer)
    removePauseObserver?.()
    for (const range of ranges) stopRange(range)
    ranges.clear()
  }
  const fail = (error) => {
    if (stopped) return
    stop()
    onError?.(toAppError(sparkBudget.record(error)))
  }
  const awaitConfirmation = () => {
    if (!confirmationTimer) {
      confirmationTimer = setTimeout(
        () => fail(createAppError('app/listener-timeout')),
        SPARK_LIMITS.listenerUnconfirmedMs,
      )
      confirmationTimer.unref?.()
    }
  }
  removePauseObserver = sparkBudget.onPause?.(fail)
  awaitConfirmation()
  const publish = () => {
    if (stopped || attaching || deferred || [...ranges].some((range) => !range.ready)) return
    // Preserve Firestore's ID order for stable ties in the existing client sorts.
    // Binary tree paths order ranges without comparing arbitrary Unicode IDs.
    const leaves = [...ranges].sort((left, right) =>
      left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
    )
    const documents = leaves.flatMap((range) => range.docs)
    if (documents.length > SPARK_LIMITS.libraryDocuments) {
      fail(createAppError('app/library-budget'))
      return
    }
    if (
      leaves.every(
        (range) => range.metadata.fromCache === false && range.metadata.hasPendingWrites === false,
      )
    ) {
      clearTimeout(confirmationTimer)
      confirmationTimer = null
      sparkBudget.listenerConfirmed?.()
    } else awaitConfirmation()
    onData(documents.map(deserialize), {
      fromCache: leaves.some((range) => range.metadata.fromCache !== false),
      hasPendingWrites: leaves.some((range) => range.metadata.hasPendingWrites !== false),
      complete: leaves.every((range) => range.confirmed),
    })
  }
  const attach = (lower, upper, path = '', afterReady) => {
    if (stopped) return
    awaitConfirmation()
    if (ranges.size >= SPARK_LIMITS.libraryRanges) {
      fail(createAppError('app/library-budget'))
      return
    }
    const range = { active: true, ready: false, confirmed: false, path, afterReady }
    ranges.add(range)
    attaching++
    try {
      // Each actual listener target consumes admission budget, including splits.
      sparkBudget.take('read')
      range.stop = onSnapshot(
        rangeQuery(reference, lower, upper),
        { includeMetadataChanges: true },
        (snapshot) => {
          if (stopped || !range.active) return
          const authoritative =
            snapshot.metadata?.fromCache === false && snapshot.metadata?.hasPendingWrites === false
          if (!authoritative) awaitConfirmation()
          if (snapshot.docs.length > SPARK_LIMITS.pageDocuments) {
            range.ready = false
            if (!authoritative) return
            const boundary =
              snapshot.docs[
                upper === null
                  ? SPARK_LIMITS.pageDocuments - 1
                  : Math.floor(SPARK_LIMITS.pageDocuments / 2) - 1
              ].id
            stopRange(range)
            ranges.delete(range)
            // Opening both children together can queue >10000 WebChannel
            // messages. Wait for the left subtree's server confirmation before
            // opening the right, without ever publishing the partial subtree.
            deferred++
            attach(lower, boundary, `${path}0`, () => {
              deferred--
              attach(boundary, upper, `${path}1`, range.afterReady)
            })
            return
          }
          range.docs = snapshot.docs
          range.metadata = snapshot.metadata || {}
          range.ready = true
          range.confirmed ||= authoritative
          if (authoritative && range.afterReady) {
            const ready = range.afterReady
            range.afterReady = null
            ready()
          }
          publish()
        },
        (error) => {
          if (range.active) fail(error)
        },
      )
      // Also handles synchronous test adapters and a stop during attachment.
      if (stopped || !range.active) range.stop()
    } catch (error) {
      fail(error)
    } finally {
      attaching--
      publish()
    }
  }
  attach(null, null)
  return stop
}

// A failed page never returns a truncated export. No cache fallback or offsets.
export async function fetchCursorLibrary(reference, deserialize, assertSession) {
  const documents = []
  let cursor = null
  while (true) {
    assertSession()
    sparkBudget.take('read')
    const snapshot = await getDocsFromServer(rangeQuery(reference, cursor, null))
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

import test from 'node:test'
import assert from 'node:assert/strict'

// Synthetic specification exercise only. Not imported by the application and no
// Auth, Firestore, network, credentials, UID or removal operation is available.
const DAY = 86400000
const completedAt = Date.parse('2026-10-01T10:00:00Z')
const reviewAt = completedAt + 30 * DAY
function proposedOutcome(evidence, now) {
  const checks = [
    'identityVerified',
    'operatorAuthorized',
    'independentReviewer',
    'inventoryComplete',
    'inventoryEmpty',
    'authAbsent',
    'tokenAssessmentAccepted',
    'privacyAssessmentAccepted',
    'noConcurrentOperation',
    'noUidReusePlanned',
    'noRetentionException',
  ]
  if (
    !Number.isFinite(evidence.completedAt) ||
    !Number.isFinite(evidence.lastAuthConfirmationAt) ||
    !Number.isFinite(now) ||
    now < evidence.completedAt + 30 * DAY ||
    now < evidence.lastAuthConfirmationAt + DAY ||
    checks.some((check) => evidence[check] !== true)
  ) {
    return 'preserve-and-escalate'
  }
  return 'propose-only'
}
const complete = {
  completedAt,
  lastAuthConfirmationAt: completedAt,
  identityVerified: true,
  operatorAuthorized: true,
  independentReviewer: true,
  inventoryComplete: true,
  inventoryEmpty: true,
  authAbsent: true,
  tokenAssessmentAccepted: true,
  privacyAssessmentAccepted: true,
  noConcurrentOperation: true,
  noUidReusePlanned: true,
  noRetentionException: true,
}

test('ML-11 proposal: exact UTC threshold across Madrid DST only permits a recommendation', () => {
  assert.equal(new Date(reviewAt).toISOString(), '2026-10-31T10:00:00.000Z')
  assert.equal(proposedOutcome(complete, reviewAt - 1), 'preserve-and-escalate')
  assert.equal(proposedOutcome(complete, reviewAt), 'propose-only')
  assert.equal(proposedOutcome(complete, reviewAt + 90 * DAY), 'propose-only')
})

test('ML-11 proposal: every missing or uncertain prerequisite preserves and escalates', () => {
  for (const field of Object.keys(complete).filter((key) => complete[key] === true)) {
    for (const value of [false, undefined, 'unknown']) {
      assert.equal(
        proposedOutcome({ ...complete, [field]: value }, reviewAt),
        'preserve-and-escalate',
        field,
      )
    }
  }
  // A very old marker cannot replace absent completion evidence.
  assert.equal(
    proposedOutcome({ ...complete, completedAt: undefined, updatedAt: 0 }, reviewAt),
    'preserve-and-escalate',
  )
  assert.equal(
    proposedOutcome({ ...complete, completedAt: NaN }, reviewAt),
    'preserve-and-escalate',
  )
})

test('ML-11 proposal: recent Auth confirmation requires both clocks and a separate token assessment', () => {
  const lastAuthConfirmationAt = reviewAt - DAY + 1
  const evidence = { ...complete, lastAuthConfirmationAt }
  assert.equal(proposedOutcome(evidence, reviewAt), 'preserve-and-escalate')
  assert.equal(proposedOutcome(evidence, reviewAt + 1), 'propose-only')
  assert.equal(
    proposedOutcome({ ...evidence, tokenAssessmentAccepted: false }, reviewAt + 1),
    'preserve-and-escalate',
  )
})

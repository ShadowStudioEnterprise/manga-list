import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'

// Planning arithmetic only. Never initializes Firebase or inspects real accounts.
const accounts = 50
const works = 500
const quota = { reads: 50000, writes: 20000, storedGiB: 1, monthlyOutboundGiB: 10 }
const proposal = {
  dailyReadBudget: 40000,
  emergencyReadReserve: 10000,
  auxiliaryReadAllowance: 5000,
  coldOpensPerActiveAccount: 1,
  chapterIncrementsPerActiveAccount: 20,
  noMatchDuplicateChecksPerActiveAccount: 1,
}
const base = (active) => ({
  coldReads: active * works,
  chapterReads: active * proposal.chapterIncrementsPerActiveAccount * 3,
  duplicateReads: active * proposal.noMatchDuplicateChecksPerActiveAccount,
  auxiliaryReads: proposal.auxiliaryReadAllowance,
  writes: active * proposal.chapterIncrementsPerActiveAccount,
})
const daily = (active, additionalFullEvents = 0) => {
  const detail = base(active)
  const reads =
    detail.coldReads +
    detail.chapterReads +
    detail.duplicateReads +
    detail.auxiliaryReads +
    additionalFullEvents * works
  return {
    active,
    additionalFullEvents,
    ...detail,
    reads,
    withinPlanningBudget: reads <= proposal.dailyReadBudget,
    withinFreeReadQuota: reads <= quota.reads,
    freeReadHeadroom: quota.reads - reads,
  }
}
const steadyBase = daily(accounts)
const maxAdditionalEvents = Math.floor((proposal.dailyReadBudget - steadyBase.reads) / works)
assert.equal(maxAdditionalEvents, 13)
assert.equal(daily(accounts, 13).reads, 39550)
assert.equal(daily(accounts, 14).withinPlanningBudget, false)
assert.equal(daily(accounts, 50).withinFreeReadQuota, false)

// An explicit conservative onboarding sensitivity: 3 reads/imported work,
// PLUS one separate cold open and 20 increments/one duplicate check per loaded
// account each day. The 3N term already includes delivery; the cold open is an
// additional event, not another charge for that same delivery. No actual import.
const onboarding = []
let loaded = 0
while (loaded < accounts) {
  let accepted
  for (let added = 1; added <= accounts - loaded; added++) {
    const steady = daily(loaded + added)
    const reads = steady.reads + added * works * 3
    const writes = steady.writes + added * works
    if (reads <= proposal.dailyReadBudget && writes <= quota.writes) {
      accepted = {
        day: onboarding.length + 1,
        previouslyLoaded: loaded,
        newAccounts: added,
        loadedAccounts: loaded + added,
        reads,
        writes,
      }
    }
  }
  assert.ok(accepted, 'No feasible onboarding allocation')
  onboarding.push(accepted)
  loaded = accepted.loadedAccounts
}
assert.equal(
  onboarding.reduce((sum, day) => sum + day.newAccounts, 0),
  accounts,
)
assert.ok(
  onboarding.every((day) => day.reads <= proposal.dailyReadBudget && day.writes <= quota.writes),
)

const result = {
  declared: {
    registeredAccounts: accounts,
    worksPerAccount: works,
    totalWorks: accounts * works,
    dailyFrequenciesKnown: false,
  },
  scope:
    'Deterministic planning sensitivities, not measured billing, an enforced global quota or operational approval; no Firebase access',
  quota,
  proposal,
  assumptions: [
    'All 50 accounts active; stable 500-work libraries, one coordinated owner per account/origin/project',
    'An extra full event is a reopening after closure, reconnect, export or owner handoff; all share the same aggregate allowance',
    'An independent active device/tab adds its own opening and ongoing update deliveries; it is outside the single-owner proposal',
    'Three modeled reads and one write per uncontended chapter increment; one minimum read per no-match duplicate check',
    'Auxiliary allowance must cover other reads and retries; actual amounts and real document sizes are unknown',
    'No extra writes, deletes or imports in the steady proposal; those require additional budgeting',
    'Rules/SDK retries, multiple independent owners and other clients can exceed these assumptions',
  ],
  minimumReadSensitivitiesBeforeOtherOperations: {
    allAccountsOneColdOpen: accounts * works,
    coldPlusOneExportPerAccount: accounts * works * 2,
    coldPlusOneReconnectPerAccount: accounts * works * 2,
    twoIndependentColdTabsPerAccount: accounts * works * 2,
  },
  steadyBase,
  proposedEnvelope: daily(accounts, maxAdditionalEvents),
  nextFullEvent: daily(accounts, maxAdditionalEvents + 1),
  allAccountsDailyExtraEvent: daily(accounts, accounts),
  maxAdditionalFullEventsAcrossWholeProject: maxAdditionalEvents,
  onboarding: {
    model:
      '3N import reads plus separate daily steady events, auxiliary allowance, and writes as described in source',
    days: onboarding,
  },
  sizeSensitivities: [1, 5, 25].map((averageKiB) => ({
    averageKiB,
    rawWorksGiBExcludingIndexes: (accounts * works * averageKiB) / 1048576,
    monthlyGiBIfEachModeledReadTransfersAverageKiB:
      (daily(accounts, maxAdditionalEvents).reads * 30 * averageKiB) / 1048576,
  })),
  sizeCaveat:
    'Hypothetical average bytes, not emulator billing/storage accounting; indexes, overhead, auxiliary payloads and real sizes are not measured',
  sources: [
    'https://firebase.google.com/docs/firestore/quotas#free-quota',
    'https://firebase.google.com/docs/firestore/pricing#listening_to_query_results',
  ],
}
const output = JSON.stringify(result, null, 2) + '\n'
const outputIndex = process.argv.indexOf('--output')
if (outputIndex !== -1) {
  const path = process.argv[outputIndex + 1]
  if (!path) throw new Error('Expected output file after --output')
  await writeFile(path, output)
} else process.stdout.write(output)

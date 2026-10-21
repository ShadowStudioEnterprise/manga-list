import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { SPARK_LIMITS } from '../src/utils/spark-budget.js'

// Pure planning model. No SDK, credentials, remote reads or production writes.
export function libraryCost(size) {
  assert.ok(Number.isInteger(size) && size >= 0 && size <= SPARK_LIMITS.libraryDocuments)
  const pages = Math.max(1, Math.ceil(size / SPARK_LIMITS.pageDocuments))
  return {
    size,
    stableListeners: pages,
    initialQueries: 2 * pages - 1,
    cold: Math.max(1, size) + (pages - 1) * (SPARK_LIMITS.pageDocuments + 1),
    reconnect: Math.max(1, size),
    exportQueries: pages,
    export: Math.max(1, size) + pages - 1,
  }
}

export function daily(groups, options = {}) {
  const p = {
    opens: 1,
    reconnects: 0,
    exports: 0,
    handoffs: 0,
    devices: 1,
    updates: 20,
    attempts: 1,
    duplicateMisses: 1,
    auxiliaryReads: 5000,
    auxiliaryWrites: 1000,
    imports: 0,
    ...options,
  }
  assert.ok(Object.values(p).every((v) => Number.isFinite(v) && v >= 0))
  assert.ok(p.devices >= 1 && p.attempts >= 1)
  const detail = { cold: 0, reconnect: 0, export: 0, handoff: 0, updates: 0, duplicates: 0 }
  let accounts = 0,
    documents = 0
  for (const { count, size } of groups) {
    assert.ok(Number.isInteger(count) && count >= 0)
    const c = libraryCost(size)
    accounts += count
    documents += count * size
    detail.cold += count * c.cold * p.opens * p.devices
    detail.reconnect += count * c.reconnect * p.reconnects * p.devices
    detail.export += count * c.export * p.exports
    detail.handoff += count * c.cold * p.handoffs
    // Attempts = transaction gets; 1 dependent rules read per committed write;
    // one delivery per independent active device. Failed rule requests need extra allowance.
    detail.updates += count * p.updates * (p.attempts + 1 + p.devices)
    detail.duplicates += count * p.duplicateMisses
  }
  // New import: missing-doc transaction get + dependent rules read + live delivery.
  // This excludes extra range splits, retries, and a separate opening.
  const importReads = p.imports * (p.attempts + 1 + p.devices)
  const reads = Object.values(detail).reduce((a, b) => a + b, 0) + p.auxiliaryReads + importReads
  const writes = accounts * p.updates + p.imports + p.auxiliaryWrites
  return {
    accounts,
    documents,
    parameters: p,
    detail,
    importReads,
    reads,
    writes,
    withinProposedReadBudget: reads <= 40000,
    withinFreeReadQuota: reads <= 50000,
    withinProposedWriteBudget: writes <= 16000,
    headroomToProposal: 40000 - reads,
  }
}

export function buildModel() {
  const sizes = [100, 500, 1000, 2500, 5000, 10000]
  const declared = [{ count: 50, size: 500 }]
  const named = {
    uniform100: [{ count: 50, size: 100 }],
    declared50x500: declared,
    mixedSmall: [
      { count: 40, size: 100 },
      { count: 10, size: 1000 },
    ],
    mixedNearBudget: [
      { count: 40, size: 500 },
      { count: 10, size: 1000 },
    ],
    mixedHeavy: [
      { count: 45, size: 500 },
      { count: 5, size: 5000 },
    ],
    oneLarge: [
      { count: 49, size: 100 },
      { count: 1, size: 10000 },
    ],
    uniform1000: [{ count: 50, size: 1000 }],
    uniform2500: [{ count: 50, size: 2500 }],
    uniform5000: [{ count: 50, size: 5000 }],
    uniform10000: [{ count: 50, size: 10000 }],
  }
  const rows = sizes.map((size) => {
    const cost = libraryCost(size)
    const base = daily([{ count: 50, size }])
    return {
      ...cost,
      fiftyAccounts: base,
      maximumActiveOfFiftyAccountsUnderProposal: Math.min(
        50,
        Math.max(0, Math.floor(35000 / (cost.cold + 61))),
      ),
      oneAccountColdExport: cost.cold + cost.export,
    }
  })
  const base = daily(declared)
  const onboarding = []
  let loaded = 0
  while (loaded < 50) {
    let accepted
    for (let added = 1; added <= 50 - loaded; added++) {
      const candidate = daily([{ count: loaded + added, size: 500 }], { imports: added * 500 })
      if (candidate.withinProposedReadBudget && candidate.withinProposedWriteBudget) {
        accepted = {
          day: onboarding.length + 1,
          newAccounts: added,
          loadedAccounts: loaded + added,
          ...candidate,
        }
      }
    }
    assert.ok(accepted, 'No onboarding capacity remains under the chosen assumptions')
    onboarding.push(accepted)
    loaded = accepted.loadedAccounts
  }
  const result = {
    kind: 'Deterministic sensitivity estimates; NOT measured billed quota or operational approval',
    referenceDate: '2026-10-21',
    productionBase: '36fe4f3bd46615a4e18983d506fb79d2337c768c',
    quota: {
      dailyReads: 50000,
      dailyWrites: 20000,
      dailyDeletes: 20000,
      storedGiB: 1,
      monthlyOutboundGiB: 10,
    },
    proposal: {
      approved: false,
      reservePercent: 20,
      reads: 40000,
      writes: 16000,
      deletes: 16000,
      storedGiB: 0.8,
      monthlyOutboundGiB: 8,
    },
    rows,
    mixtures: Object.entries(named).map(([name, groups]) => ({ name, groups, ...daily(groups) })),
    eventSensitivity: [0, 0.1, 0.25, 0.5, 1, 2].map((eventsPerAccount) => ({
      eventsPerAccount,
      aggregateEvents: eventsPerAccount * 50,
      reconnect: daily(declared, { reconnects: eventsPerAccount }),
      export: daily(declared, { exports: eventsPerAccount }),
      handoff: daily(declared, { handoffs: eventsPerAccount }),
    })),
    independentDevices: [1, 2, 3].map((devices) => daily(declared, { devices })),
    auxiliaries: [0, 1000, 5000, 10000].map((auxiliaryReads) =>
      daily(declared, { auxiliaryReads }),
    ),
    updateSensitivity: [0, 20, 100].flatMap((updates) =>
      [1, 3].map((attempts) => daily(declared, { updates, attempts })),
    ),
    reserves: [0, 10, 20, 30].map((percent) => ({
      percent,
      readBudget: 50000 * (1 - percent / 100),
      additional500WorkEvents: Math.max(
        0,
        Math.floor((50000 * (1 - percent / 100) - base.reads) / 500),
      ),
    })),
    importSensitivity: [100, 500, 1000, 2500, 5000, 10000, 25000].map((imports) =>
      daily(declared, { imports }),
    ),
    onboarding,
    declaredBase: base,
    thirteenExtraEvents: daily(declared, { exports: 13 / 50 }),
    fourteenExtraEvents: daily(declared, { exports: 14 / 50 }),
    bandwidth: [1, 5, 25, 100].map((averageKiB) => ({
      averageKiB,
      storedPayloadGiBFor25000: (25000 * averageKiB) / 1048576,
      storageSensitivityIncludingHypotheticalOverhead: [1, 2, 4].map((factor) => ({
        factor,
        storedGiB: (25000 * averageKiB * factor) / 1048576,
      })),
      thirtyDayGiBAt33050Reads: (33050 * 30 * averageKiB) / 1048576,
      thirtyDayGiBAt39550Reads: (39550 * 30 * averageKiB) / 1048576,
      maxDailyDocumentTransfersWithin8GiB30Days: Math.floor((8 * 1048576) / (30 * averageKiB)),
    })),
    memorySensitivity: sizes.map((size) => ({
      size,
      profiles: [1, 5, 25, 100].map((averageKiB) => ({
        averageKiB,
        rawMiB: (size * averageKiB) / 1024,
        fourCopiesMiB: (size * averageKiB * 4) / 1024,
        eightCopiesMiB: (size * averageKiB * 8) / 1024,
      })),
    })),
    caveats: [
      'Steady, disjoint ID ranges. Boundary splits add reads; 10000 is a local client cap, not a global rules cap.',
      'Reconnect = stable ranges; handoff/reopening = cold discovery including discarded parent target.',
      'Fractional event frequencies are aggregate expectations, not per-account fractional operations.',
      '20 successful uncontended chapter increments, one duplicate miss and 5000 project auxiliary reads are assumptions, not observations.',
      '1000 auxiliary writes is an additional ML-08 allowance; no imports or deletes in steady base.',
      'Other origins, browser profiles, unsupported sharing APIs and independent devices each require separate listeners.',
      'Import sensitivity excludes range split/reopening overhead and must not be used as a fixed import admission limit.',
      'Payload-byte and memory multipliers are hypothetical. They exclude actual indexes, SDK heap, protocol overhead, auth and Hosting.',
    ],
    sources: [
      'https://firebase.google.com/docs/firestore/quotas',
      'https://firebase.google.com/docs/firestore/pricing',
      'https://firebase.google.com/docs/firestore/storage-size',
      'https://firebase.google.com/docs/firestore/manage-data/enable-offline',
    ],
  }
  assert.equal(base.reads, 33050)
  assert.equal(result.thirteenExtraEvents.reads, 39550)
  assert.equal(result.fourteenExtraEvents.reads, 40050)
  assert.equal(result.eventSensitivity.find((r) => r.eventsPerAccount === 1).export.reads, 58050)
  assert.equal(result.independentDevices[1].reads, 59050)
  return result
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const evidenceIndex = process.argv.indexOf('--verify-emulator')
  if (evidenceIndex !== -1) {
    const evidence = JSON.parse(await readFile(process.argv[evidenceIndex + 1], 'utf8'))
    assert.equal(evidence.billedReadsMeasured, false)
    for (const size of [100, 500, 1000, 2500, 5000, 5001, 10000]) {
      const observed = evidence.results.find((row) => row.size === size)
      assert.ok(observed, `Missing emulator scenario ${size}`)
      const expected = libraryCost(size)
      assert.equal(observed.initial.firstServerDocuments, expected.cold)
      assert.equal(observed.initial.targets, expected.initialQueries)
      assert.equal(observed.initial.active, expected.stableListeners)
      assert.equal(observed.export.documents, expected.export)
      assert.equal(observed.export.requests, expected.exportQueries)
      assert.equal(observed.reopen.firstServerDocuments, expected.cold)
    }
  }
  const result = JSON.stringify(buildModel(), null, 2) + '\n'
  const index = process.argv.indexOf('--output')
  if (index === -1) process.stdout.write(result)
  else {
    assert.ok(process.argv[index + 1], 'Missing --output path')
    await writeFile(process.argv[index + 1], result)
  }
}

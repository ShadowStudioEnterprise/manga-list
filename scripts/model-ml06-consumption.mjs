import { mkdir, writeFile } from 'node:fs/promises'

// Planning assumptions, not a billing meter or a daily quota enforcement mechanism.
const dailyReads = 50000
const reservedReads = 10000
const rows = [100, 1000, 2500, 5000, 10000].map((size) => {
  const ranges = Math.ceil(size / 1000)
  const cold = size + 1001 * (ranges - 1)
  const exported = size + ranges - 1
  // 20 uncontended transactions: one get, one listener delivery per tab,
  // and one dependent rules document on each successful write request.
  const oneTabDay = cold + exported + 20 * 3 + 1
  const twoTabReconnectDay = 2 * cold + 2 * size + exported + 20 * 4 + 1
  return {
    size,
    ranges,
    initialTargets: 2 * ranges - 1,
    initialDocumentsPlanning: cold,
    exportRequests: ranges,
    exportDocumentsPlanning: exported,
    stableReconnectDocumentsPlanning: size,
    twoColdTabsPlanning: 2 * cold,
    threeColdTabsPlanning: 3 * cold,
    coldAndExportPlanning: cold + exported,
    coldAndExportDailyQuotaPercent: ((cold + exported) / dailyReads) * 100,
    oneTabDayPlanning: oneTabDay,
    oneTabDaysWithReserve: Math.floor((dailyReads - reservedReads) / oneTabDay),
    twoTabReconnectDayPlanning: twoTabReconnectDay,
    twoTabDaysWithReserve: Math.floor((dailyReads - reservedReads) / twoTabReconnectDay),
    coldExportSessionsPerMonthAt1KiB: Math.floor((10 * 1024 * 1024) / (cold + exported)),
    coldExportSessionsPerMonthAt5KiB: Math.floor((10 * 1024 * 1024) / ((cold + exported) * 5)),
  }
})
await mkdir('test-results', { recursive: true })
await writeFile(
  'test-results/ml06-model.json',
  JSON.stringify(
    {
      kind: 'Derived scenario model, NOT measured billing; stable cold ID ranges; no auth/profile reads included',
      dailyReads,
      reservedReads,
      successfulUncontendedUpdatesPerDay: 20,
      duplicateMissQueriesPerDay: 1,
      exportsPerDay: 1,
      reserveIsPolicyProposal: true,
      rows,
    },
    null,
    2,
  ) + '\n',
)
console.log(
  '| N | Rangos | Targets/admisiones arranque | Docs arranque I | Docs exportación E | I+E | % de 50000 |',
)
console.log('| --- | --- | --- | --- | --- | --- | --- |')
for (const r of rows)
  console.log(
    `| ${r.size} | ${r.ranges} | ${r.initialTargets} | ${r.initialDocumentsPlanning} | ${r.exportDocumentsPlanning} | ${r.coldAndExportPlanning} | ${r.coldAndExportDailyQuotaPercent.toFixed(2)} |`,
  )
console.log(
  '\n| N | Dos arranques | Tres arranques | Mezcla A | A con reserva | Mezcla B | B con reserva |',
)
console.log('| --- | --- | --- | --- | --- | --- | --- |')
for (const r of rows)
  console.log(
    `| ${r.size} | ${r.twoColdTabsPlanning} | ${r.threeColdTabsPlanning} | ${r.oneTabDayPlanning} | ${r.oneTabDaysWithReserve} | ${r.twoTabReconnectDayPlanning} | ${r.twoTabDaysWithReserve} |`,
  )

import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
const root = new URL('./', import.meta.url)
const rows = (await readFile(new URL('safari-listeners-2026-10-24.jsonl', root), 'utf8'))
  .trim()
  .split('\n')
  .map(JSON.parse)
const value = (r) => (r.result?.ok === true ? r.result.value : r.result)
function stage(label) {
  const row = rows.find((r) => r.action === 'measure' && value(r)?.label === label)
  assert.ok(row, `Missing ${label}`)
  return { at: row.at, ...value(row) }
}
function stateAndNetwork(label) {
  const i = rows.findIndex((r) => r.action === 'state' && r.label === label)
  assert.ok(i >= 0, `Missing ${label}`)
  const snapshot = rows
    .slice(i + 1)
    .find((r) => r.action === 'js' && r.result?.counters && r.result?.events)
  assert.ok(snapshot, `Missing network after ${label}`)
  return { state: value(rows[i]), network: snapshot.result }
}
function confirmed(state, chapter) {
  assert.equal(state.count, 500)
  assert.equal(state.unique, 500)
  assert.equal(state.chapter, chapter)
  assert.equal(state.fromCache, false)
  assert.equal(state.error, null)
  assert.equal(state.pending, false)
  assert.equal(state.pendingOperations, 0)
}
const owner = stateAndNetwork('propietaria-dos-pestanas')
const follower = stateAndNetwork('seguidora-cambio-concurrente')
for (const p of [owner, follower]) {
  confirmed(p.state, '6')
  assert.equal(p.state.libraryLocks, 1)
  assert.equal(p.network.counters.unreadableBodies, 0)
}
assert.equal(owner.network.counters.addTarget, 1)
assert.equal(follower.network.counters.addTarget, 0)
const adds = owner.network.events.filter((e) => e.kind === 'addTarget')
assert.equal(adds.length, 1)
assert.equal(adds[0].transport, 'fetch')
assert.equal(adds[0].target.query.structuredQuery.from[0].collectionId, 'mangas')
const closed = rows
  .map((r) => r.result)
  .find((v) => v?.events?.some((e) => e.kind === 'removeTarget'))
assert.ok(closed)
assert.equal(closed.counters.addTarget, 1)
assert.equal(closed.counters.removeTarget, 1)
assert.equal(closed.events.find((e) => e.kind === 'removeTarget').targetId, adds[0].target.targetId)
const blocked = stateAndNetwork('reintento-anticipado')
assert.equal(blocked.network.counters.addTarget, 0)
assert.ok(blocked.state.remainingQuotaPauseMs > 0)
for (const row of rows.filter((r) => r.action === 'measure'))
  assert.equal(value(row).network.counters.unreadableBodies, 0)
const before = stage('vencida-sin-reintento-medida')
assert.equal(before.state.remainingQuotaPauseMs, 0)
assert.equal(before.network.counters.addTarget, 0)
assert.equal(before.state.fromCache, true)
const signal = rows.find((r) => value(r)?.label === 'cuota-inyectada')
assert.ok(signal)
assert.ok(
  Date.parse(before.at) - Date.parse(signal.at) >= 905000,
  'Must wait at least 15 real minutes plus five seconds',
)
const after = stage('reintento-valido-medido')
confirmed(after.state, '6')
assert.equal(after.network.counters.addTarget - before.network.counters.addTarget, 1)
assert.equal(after.network.counters.removeTarget, 0)
assert.equal(after.network.counters.unreadableBodies, 0)
assert.equal(after.state.libraryLocks, 1)
const stable = stage('reintento-estable-medido')
confirmed(stable.state, '6')
assert.equal(stable.network.counters.addTarget, 1)
assert.ok(Date.parse(stable.at) - Date.parse(after.at) >= 60000)
const checks = {
  twoTabsOneTarget: true,
  sameTargetRemovedOnQuota: true,
  blockedRetryNoTarget: true,
  realWaitMs: Date.parse(before.at) - Date.parse(signal.at),
  noAutomaticReopen: true,
  validRetryExactlyOneTarget: true,
  stableForAtLeast60s: true,
  noUnreadableBodies: true,
}
await writeFile(
  new URL('verificacion-listeners-safari.json', root),
  JSON.stringify(
    {
      passed: true,
      checkedAt: new Date().toISOString(),
      scope:
        'Observed outgoing Listen protocol in real Safari; synthetic quota signal, local emulators. Not billed reads or real Firebase quota reset.',
      checks,
    },
    null,
    2,
  ) + '\n',
)
console.log(JSON.stringify(checks, null, 2))

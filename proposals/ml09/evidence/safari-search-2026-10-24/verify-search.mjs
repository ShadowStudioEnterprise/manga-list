import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'

const root = new URL('./', import.meta.url)
const rows = (await readFile(new URL('safari-search-2026-10-24.jsonl', root), 'utf8'))
  .trim()
  .split('\n')
  .map(JSON.parse)
const value = (row) => (row.result?.ok ? row.result.value : row.result)
const stage = (label) => {
  const row = rows.find((row) => row.action === 'measure' && value(row)?.label === label)
  assert.ok(row, `Missing ${label}`)
  return { at: row.at, ...value(row) }
}
const query = 'ML09 Safari 0000'
const before = stage('search-antes-cuota')
assert.equal(before.state.count, 500)
assert.equal(before.state.search, query)
assert.equal(before.state.fromCache, false)
const reload = stage('search-cuota-tras-recarga')
const blocked = stage('search-reintento-bloqueado')
for (const item of [reload, blocked]) {
  assert.equal(item.state.search, query)
  assert.ok(item.state.error)
  assert.equal(item.state.fromCache, true)
  assert.ok(item.state.remainingQuotaPauseMs > 0)
  assert.equal(item.network.counters.addTarget, 0)
  assert.equal(item.network.counters.unreadableBodies, 0)
}
const expired = stage('search-vencida-sin-reintento')
assert.equal(expired.state.search, query)
assert.equal(expired.state.remainingQuotaPauseMs, 0)
assert.equal(expired.network.counters.addTarget, 0)
const signal = rows.find((row) => value(row)?.label === 'cuota-inyectada')
assert.ok(signal)
const elapsed = Date.parse(expired.at) - Date.parse(signal.at)
assert.ok(elapsed >= 905000, 'Wait 15 real minutes plus five seconds')
const recovered = stage('search-recuperada')
assert.equal(recovered.state.search, query)
assert.equal(recovered.state.count, 500)
assert.equal(recovered.state.unique, 500)
assert.equal(recovered.state.chapter, '2')
assert.equal(recovered.state.fromCache, false)
assert.equal(recovered.state.error, null)
assert.equal(recovered.state.pending, false)
assert.equal(recovered.state.pendingOperations, 0)
assert.equal(recovered.network.counters.addTarget, 1)
assert.equal(recovered.network.counters.unreadableBodies, 0)
const ui = rows.map(value).find((item) => item?.label === 'search-ui-recuperada')
assert.equal(ui?.input, query)
assert.equal(ui.selection.query, query)
assert.deepEqual(Object.keys(ui.selection).sort(), ['query', 'uid', 'version'])
const logout = rows.map(value).find((item) => item?.label === 'search-logout')
assert.equal(logout?.route, '#/login')
assert.equal(logout.selection, null)
const again = stage('search-tras-login-nuevo')
assert.equal(again.state.search, '')
assert.equal(again.state.count, 500)
assert.equal(again.state.fromCache, false)
const result = {
  passed: true,
  checkedAt: new Date().toISOString(),
  realWaitMs: elapsed,
  searchSurvivesQuotaReload: true,
  blockedRetryNoListener: true,
  noAutomaticReopen: true,
  oneListenerAfterRecovery: true,
  all500Confirmed: true,
  sameSearchVisibleAfterRecovery: true,
  logoutClearsSelection: true,
  loginStartsWithEmptySearch: true,
  scope: 'Real Safari, synthetic quota and local emulators; not real Firebase quota reset.',
}
await writeFile(new URL('verification.json', root), JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))

// Offline, read-only verification of sealed observations. Never repeats physical tests.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { resolve, sep } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const read = (file) => readFile(resolve(root, file))
const json = async (file) => JSON.parse((await read(file)).toString('utf8'))
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
const base = 'proposals/ml09/evidence/'
let files = 0
let runtime = 0
let currentMatches = 0
const recordedRuntime = 'c150b0c8bb557f292425e1ca711711de2057fb1f'
async function verify(folder, file, expected) {
  const target = resolve(root, folder, file)
  assert.ok(target.startsWith(resolve(root, folder) + sep), 'Manifest path escapes evidence')
  assert.equal(hash(await readFile(target)), expected, folder + file)
  files++
}
for (const folder of ['safari-iphone-2026-10-24', 'iphone-physical-lock-2026-10-24']) {
  const path = base + folder + '/'
  for (const [file, expected] of Object.entries(await json(path + 'manifest-sha256.json')))
    await verify(path, file, expected)
}
const search = base + 'safari-search-2026-10-24/'
const manifest = await json(search + 'manifest.json')
await verify(search, manifest.rawArchive.file, manifest.rawArchive.sha256)
for (const log of manifest.normalizedLogs) await verify(search, log.file, log.publishedSha256)
for (const folder of [
  'safari-search-2026-10-24',
  'safari-iphone-2026-10-24',
  'iphone-physical-lock-2026-10-24',
]) {
  const evidence = await json(base + folder + '/runtime.json')
  for (const [file, expected] of Object.entries(evidence.sourceHashes)) {
    assert.ok(file.startsWith('src/') && !file.split('/').includes('..'))
    // Historical evidence remains tied to the tested commit, even after future
    // product changes. Never rewrite a sealed manifest to match a newer runtime.
    const recorded = execFileSync('git', ['show', `${recordedRuntime}:${file}`], {
      cwd: root,
      maxBuffer: 2 * 1024 * 1024,
    })
    assert.equal(hash(recorded), expected, `${folder}: recorded runtime ${file}`)
    if (hash(await read(file)) === expected) currentMatches++
    runtime++
  }
}
const iphone = await json(base + 'safari-iphone-2026-10-24/verification-ios.json')
assert.equal(iphone.passed, true)
assert.ok(iphone.checks.realWaitMs >= 905000)
const lock = await json(base + 'iphone-physical-lock-2026-10-24/ios-lock-manual-result.json')
assert.equal(lock.passed, true)
assert.ok(lock.stableObservedMs >= 60000)
// Preserve the failed attempts as well as the successful, separately scoped
// Redmi follow-up. Read data only; never execute the archived instruments.
const redmi = base + 'redmi-physical-2026-10-25/'
for (const entry of await json(redmi + 'manifest-sha256.json'))
  await verify(redmi, entry.path, entry.sha256)
const redmiRevision = 'b435371af8d75071857667daaab69852543a9c42'
for (const entry of await json(redmi + 'source-sha256.json')) {
  if (!entry.path.startsWith('src/')) continue
  assert.ok(!entry.path.split('/').includes('..'))
  const recorded = execFileSync('git', ['show', `${redmiRevision}:${entry.path}`], {
    cwd: root,
  })
  assert.equal(hash(recorded), entry.sha256, `Redmi recorded runtime ${entry.path}`)
  if (hash(await read(entry.path)) === entry.sha256) currentMatches++
  runtime++
}
const redmiAttempt = await json(redmi + 'screen-lock.json')
const redmiFollowup = await json(redmi + 'followup.json')
const redmiRecovery = await json(redmi + 'recovery.json')
for (const result of [redmiAttempt, redmiFollowup, redmiRecovery])
  assert.equal(result.head, redmiRevision)
assert.equal(redmiAttempt.result, 'failed-or-blocked')
assert.equal(redmiAttempt.wholeSystemSuspensionProven, false)
assert.equal(redmiFollowup.result, 'failed-or-blocked')
assert.equal(redmiRecovery.result, 'passed-explicit-recovery-only')
assert.match(redmiRecovery.before.error, /suspendido/)
assert.equal(redmiRecovery.before.status, undefined)
assert.equal(redmiRecovery.manualRetry, true)
assert.equal(redmiRecovery.addTargets, 1)
for (const sample of ['recovered', 'after20', 'after40', 'after60']) {
  const result = redmiRecovery[sample]
  assert.equal(result.count, 500)
  assert.equal(result.unique, 500)
  assert.equal(result.chapter, '2')
  assert.equal(result.search, 'ML09 física 0000')
  assert.equal(result.error, null)
  assert.match(result.status, /Última instantánea/)
}
assert.deepEqual(redmiRecovery.exported, { count: 500, unique: 500, chapter: '2' })
const redmiFreeze = redmiRecovery.lifecycle.events.find((event) => event.type === 'freeze')
const redmiResume = redmiRecovery.lifecycle.events.find((event) => event.type === 'resume')
assert.equal(redmiResume.at - redmiFreeze.at, 187030)
assert.ok(redmiRecovery.after60.at - redmiRecovery.recovered.at >= 60000)
console.log(
  `PASS: ${files} sealed evidence hashes and ${runtime} recorded runtime hashes; ${currentMatches}/${runtime} match the current tree. Historical passes never certify untested changes, repeat a physical test or certify production quotas.`,
)

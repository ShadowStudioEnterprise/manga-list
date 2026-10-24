// Offline, read-only verification of sealed observations. Never repeats physical tests.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve, sep } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const read = (file) => readFile(resolve(root, file))
const json = async (file) => JSON.parse((await read(file)).toString('utf8'))
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
const base = 'proposals/ml09/evidence/'
let files = 0
let runtime = 0
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
    assert.equal(hash(await read(file)), expected, `${folder}: runtime ${file}`)
    runtime++
  }
}
const iphone = await json(base + 'safari-iphone-2026-10-24/verification-ios.json')
assert.equal(iphone.passed, true)
assert.ok(iphone.checks.realWaitMs >= 905000)
const lock = await json(base + 'iphone-physical-lock-2026-10-24/ios-lock-manual-result.json')
assert.equal(lock.passed, true)
assert.ok(lock.stableObservedMs >= 60000)
console.log(
  `PASS: ${files} sealed evidence hashes and ${runtime} runtime hashes; recorded Safari passes retained. This does not repeat a physical test or certify production quotas.`,
)

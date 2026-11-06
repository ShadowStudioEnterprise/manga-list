// Read sealed artifacts only; never import historical service launchers.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))
const read = (name) => readFile(resolve(root, name))
const json = async (name) => JSON.parse(await read(name))
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
const manifest = await json('manifest-sha256.json')
assert.equal(manifest.candidate, '28d876d394dc3e5bf458303abd181f10ecb33b3b')
assert.equal(manifest.ml09Complete, false)
for (const entry of manifest.entries) {
  assert.ok(resolve(root, entry.path).startsWith(resolve(root) + sep))
  assert.ok(!entry.path.toLowerCase().includes('private'))
  const bytes = await read(entry.path)
  assert.equal(bytes.length, entry.bytes, entry.path)
  assert.equal(hash(bytes), entry.sha256, entry.path)
}
const zip = 'ML09-celular-evidencias-2026-11-06.zip'
assert.equal(hash(await read(zip)), (await read(zip + '.sha256')).toString().split(/\s/)[0])
const base = 'cellular-live-20261106/evidence/'
const data = await json(base + 'iphone-safari-export-500.json')
const snapshot = await json(base + 'export-server-snapshot.json')
const delivery = await json(base + 'iphone-export-delivery-verification.json')
assert.equal(hash(await read(base + 'iphone-safari-export-500.json')), delivery.captured.event.sha256)
const decode = (value) => {
  if ('stringValue' in value) return value.stringValue
  if ('booleanValue' in value) return value.booleanValue
  if ('integerValue' in value) return Number(value.integerValue)
  if ('doubleValue' in value) return value.doubleValue
  if ('timestampValue' in value) return new Date(value.timestampValue).toISOString()
  if ('nullValue' in value) return null
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decode)
  if ('mapValue' in value) return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([k, v]) => [k, decode(v)]))
  throw Error('Unknown emulator value')
}
const expected = new Map(snapshot.map((d) => {
  const id = d.name.split('/').at(-1)
  return [id, { id, ...Object.fromEntries(Object.entries(d.fields).map(([k, v]) => [k, decode(v)])) }]
}))
function compare(value) {
  assert.equal(value.formatVersion, 2)
  assert.equal(value.verification.source, 'server')
  assert.equal(value.verification.hasPendingWrites, false)
  assert.equal(value.mangas.length, 500)
  assert.equal(expected.size, 500)
  assert.equal(new Set(value.mangas.map((m) => m.id)).size, 500)
  for (const manga of value.mangas) assert.deepEqual(manga, expected.get(manga.id))
}
compare(data)
const partial = structuredClone(data)
partial.mangas.pop()
assert.throws(() => compare(partial))
const altered = structuredClone(data)
altered.mangas[0].notes += 'altered'
assert.throws(() => compare(altered))
console.log(`${manifest.entries.length} sealed files, ZIP hash and all 500 records verified; negative controls rejected. ML-09 remains open.`)

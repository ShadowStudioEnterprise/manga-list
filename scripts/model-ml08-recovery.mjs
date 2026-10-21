import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { createLibraryExport } from '../src/services/export-service.js'
import { createRecoverableImportPreview } from '../src/services/import-service.js'

export const verification = {
  source: 'server',
  observedAtClient: '2026-10-21T00:00:00.000Z',
  hasPendingWrites: false,
}
export const importByteLimit = 5 * 1024 * 1024
const bytes = (text) => Buffer.byteLength(text, 'utf8')
const hash = (text) => createHash('sha256').update(text).digest('hex')

export function recoveryFixture(size, notesLength = 1000, unicode = false) {
  return Array.from({ length: size }, (_, i) => ({
    id: String(i).padStart(6, '0'),
    schemaVersion: 1,
    name: `Recovery ${i}`,
    normalizedName: `recovery-${i}`,
    chapter: String(i + 1),
    type: 'manga',
    genres: ['Acción'],
    readingStatus: 'following',
    publicationStatus: 'unknown',
    sources: [
      { id: `source-${i}`, name: 'Fuente', url: `https://example.invalid/${i}`, isPrimary: true },
    ],
    notes: `${i}:`.padEnd(notesLength, unicode ? '界' : 'a'),
    favorite: i % 2 === 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  }))
}

const json = (items, pretty = false) =>
  createLibraryExport(items, 'json', { pretty, verification }).content

// Audit prototype only. No downloads, SDK calls, remote writes or UI integration.
// Return immutable part contents; do not regenerate/repartition them during retries.
export function partitionForAudit(
  items,
  { byteLimit = 4 * 1024 * 1024, recordLimit = Infinity } = {},
) {
  assert.ok(Number.isInteger(byteLimit) && byteLimit > 0 && byteLimit <= importByteLimit)
  assert.ok(recordLimit === Infinity || (Number.isInteger(recordLimit) && recordLimit > 0))
  const emptyBytes = bytes(json([]))
  const parts = []
  let current = [],
    currentBytes = emptyBytes
  const flush = () => {
    if (!current.length) return
    const content = json(current)
    assert.equal(bytes(content), currentBytes)
    assert.ok(currentBytes <= byteLimit)
    parts.push({
      number: parts.length + 1,
      records: current.length,
      bytes: currentBytes,
      sha256: hash(content),
      content,
    })
    current = []
    currentBytes = emptyBytes
  }
  for (const item of items) {
    // Serialize with the real exporter, preserving its conversions rather than
    // treating JS string length as UTF-8 bytes or dropping long fields.
    const encodedBytes = bytes(createLibraryExport([item], 'json', { pretty: false }).content) - 2
    if (emptyBytes + encodedBytes > byteLimit)
      throw new RangeError('One record exceeds the chosen part budget')
    if (
      current.length &&
      (currentBytes + 1 + encodedBytes > byteLimit || current.length >= recordLimit)
    )
      flush()
    currentBytes += (current.length ? 1 : 0) + encodedBytes
    current.push(item)
  }
  flush()
  return parts
}

export async function modelRecovery() {
  const rows = []
  for (const size of [100, 500, 1000, 2500, 5000, 10000]) {
    for (const notesLength of [1000, 5000]) {
      const items = recoveryFixture(size, notesLength)
      const pretty = json(items, true)
      const compact = json(items)
      const parts = partitionForAudit(items)
      const restored = parts.flatMap((part) => JSON.parse(part.content).mangas)
      assert.deepEqual(restored, JSON.parse(compact).mangas)
      rows.push({
        size,
        notesLength,
        prettyBytes: bytes(pretty),
        compactBytes: bytes(compact),
        prettyAcceptedBySizeGate: bytes(pretty) <= importByteLimit,
        compactAcceptedBySizeGate: bytes(compact) <= importByteLimit,
        proposed4MiBParts: parts.length,
        maximumPartBytes: Math.max(...parts.map((part) => part.bytes)),
        recordsPreserved: restored.length,
        // Administrative sensitivity only, not a product limit or paced restore implementation.
        proposedPartsWith40RecordBudget: partitionForAudit(items, { recordLimit: 40 }).length,
      })
    }
  }
  const unicode = recoveryFixture(500, 5000, true)
  const parts = partitionForAudit(unicode)
  for (const part of parts) {
    const preview = await createRecoverableImportPreview(part.content, {
      uid: 'synthetic-restore',
      format: 'json',
    })
    assert.equal(preview.summary.errors, 0)
    assert.equal(preview.summary.valid, part.records)
  }
  return {
    scope:
      'Synthetic local audit and partition prototype. No production access, Firestore writes, full UI/browser restore or mobile-device validation.',
    base: '55476c0683486909d005dd95f854d0ed71c782cf',
    importByteLimit,
    proposedPartByteLimit: 4 * 1024 * 1024,
    proposalApproved: false,
    rows,
    unicode500: {
      originalPrettyBytes: bytes(json(unicode, true)),
      parts: parts.map(({ number, records, bytes, sha256 }) => ({
        number,
        records,
        bytes,
        sha256,
      })),
    },
    caveats: [
      'Byte-admissible parts do not bypass per-tab read/write admission windows or project quotas.',
      'Forty records per part is an administrative sensitivity, not a guarantee of remaining admissions.',
      'Repartitioning, modifying verification metadata or changing the file contents changes import document IDs.',
      'Import normalizes supported fields and creates new document IDs/timestamps; it is not an exact database restore.',
      'The current UI does not implement this prototype or an automatic manifest/part restore manager.',
    ],
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const output = process.argv[process.argv.indexOf('--output') + 1]
  assert.ok(process.argv.includes('--output') && output, 'Use --output path')
  await writeFile(output, JSON.stringify(await modelRecovery(), null, 2) + '\n')
  console.log(
    'Twelve size/profile cases and Unicode partitions verified locally; zero backend writes.',
  )
}

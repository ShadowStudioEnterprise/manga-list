import test from 'node:test'
import assert from 'node:assert/strict'
import { File } from 'node:buffer'
import { createHash } from 'node:crypto'
import {
  prepareMultipartExport,
  verifyMultipartBackup,
  restoreMultipartBackup,
  BACKUP_PART_BYTES,
  BACKUP_FILE_BYTES,
} from '../src/services/multipart-backup.js'
import { createLibraryExport } from '../src/services/export-service.js'
import { createSparkBudget } from '../src/utils/spark-budget.js'
import { recoveryFixture, verification } from '../scripts/model-ml08-recovery.mjs'

const copyId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
const bytes = (text) => Buffer.byteLength(text)
const digest = (text) => createHash('sha256').update(text).digest('hex')
const invalid = (error) => error.code === 'app/backup-invalid'
const file = (name, content) => new File([content], name, { type: 'application/json' })
function filesFor(plan) {
  return [
    file(plan.manifestFileName, plan.manifestContent),
    ...plan.manifest.parts.map((part, i) => file(part.fileName, plan.partContent(i))),
  ]
}
async function fixture(count = 12, partBytes = 4000) {
  const records = recoveryFixture(count, 100, true)
  const exported = await prepareMultipartExport(records, verification, undefined, {
    copyId,
    partBytes,
  })
  const files = filesFor(exported)
  const plan = await verifyMultipartBackup(files, { uid: 'synthetic-target' })
  return { records, exported, files, plan }
}
function runner(plan, { library = new Map(), budget = createSparkBudget(), ...overrides } = {}) {
  let writes = 0
  const options = {
    assertCurrent() {},
    getMangas: () => [...library.values()],
    budget,
    async write(uid, manga, { importDocumentId: id }) {
      assert.equal(uid, plan.uid)
      budget.take('write')
      budget.take('read')
      writes++
      if (!library.has(id)) library.set(id, { ...manga, id })
    },
    ...overrides,
  }
  return { options, library, writes: () => writes }
}

test('multipart export: exact UTF-8 packing, stable sealed downloads and every exported field', async () => {
  const { exported, records, files } = await fixture()
  assert.ok(exported.manifest.parts.length > 1)
  const actual = []
  for (const [index, part] of exported.manifest.parts.entries()) {
    const content = exported.partContent(index)
    assert.equal(bytes(content), part.bytes)
    assert.ok(part.bytes <= 4000)
    assert.equal(digest(content), part.sha256)
    assert.equal(content, exported.partContent(index))
    actual.push(...JSON.parse(content).mangas)
  }
  assert.deepEqual(
    actual,
    JSON.parse(createLibraryExport(records, 'json', { pretty: false }).content),
  )
  records[0].name = 'changed after sealing'
  assert.notEqual(JSON.parse(exported.partContent(0)).mangas[0].name, records[0].name)
  assert.equal(files.length, exported.manifest.parts.length + 1)
  assert.ok(!exported.manifestContent.includes('synthetic-target'))
  await assert.rejects(
    prepareMultipartExport(records, verification, undefined, { partBytes: 100 }),
    invalid,
  )
})

test('multipart export: real 4 MiB parts make an oversized legacy JSON recoverable', async () => {
  const records = recoveryFixture(1000, 5000)
  assert.ok(
    bytes(createLibraryExport(records, 'json', { verification }).content) > BACKUP_FILE_BYTES,
  )
  const exported = await prepareMultipartExport(records, verification)
  assert.ok(exported.manifest.parts.length > 1)
  for (const part of exported.manifest.parts) assert.ok(part.bytes <= BACKUP_PART_BYTES)
  const plan = await verifyMultipartBackup(filesFor(exported), { uid: 'large-target' })
  assert.equal(plan.expectedIds.size, 1000)
  let now = 0
  const run = runner(plan, { budget: createSparkBudget(() => now) })
  let result
  for (let attempt = 0; attempt < 18; attempt++) {
    result = await restoreMultipartBackup(plan, run.options)
    if (result.complete) break
    now += 60000
  }
  assert.equal(result.complete, true)
  assert.equal(run.library.size, 1000)
  assert.equal(run.writes(), 1000)
})

test('multipart preflight: missing, extra, repeated, altered and invalid files cannot produce a plan', async () => {
  const { files, exported } = await fixture()
  const badManifest = JSON.parse(exported.manifestContent)
  badManifest.totalRecords++
  const variants = [
    files.slice(0, -1),
    [...files, file('extra.json', '{}')],
    [...files, files[1]],
    [file(files[0].name, 'null'), ...files.slice(1)],
    [file(files[0].name, JSON.stringify(badManifest)), ...files.slice(1)],
    [
      files[0],
      file(files[1].name, (await files[1].text()).replace('Recovery', 'Alteredx')),
      ...files.slice(2),
    ],
    [
      files[0],
      {
        name: files[1].name,
        size: BACKUP_FILE_BYTES + 1,
        text() {
          throw Error('must not read')
        },
      },
      ...files.slice(2),
    ],
  ]
  for (const selected of variants)
    await assert.rejects(verifyMultipartBackup(selected, { uid: 'target' }), invalid)
  // Even with an updated hash, a part from another copy fails its identity check.
  const text = (await files[1].text()).replace(copyId, 'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee')
  const manifest = JSON.parse(exported.manifestContent)
  manifest.parts[0].sha256 = digest(text)
  await assert.rejects(
    verifyMultipartBackup(
      [file(files[0].name, JSON.stringify(manifest)), file(files[1].name, text), ...files.slice(2)],
      { uid: 'target' },
    ),
    invalid,
  )
})

test('multipart recovery: changed bytes after preflight and unrelated libraries stop before a write', async () => {
  const { files, plan } = await fixture()
  const first = files[1]
  const original = await first.text()
  plan.files.set(first.name, {
    name: first.name,
    size: first.size,
    text: async () => original.replace('Recovery', 'Alteredx'),
  })
  const run = runner(plan)
  await assert.rejects(restoreMultipartBackup(plan, run.options), invalid)
  assert.equal(run.writes(), 0)
  await assert.rejects(
    verifyMultipartBackup(files, { uid: plan.uid, existingMangas: [{ id: 'unrelated' }] }),
    invalid,
  )
})

test('multipart recovery: local read admission pauses, reload resumes original IDs and preserves edits', async () => {
  const { files, plan } = await fixture(30)
  let now = 0
  const budget = createSparkBudget(() => now)
  for (let i = 0; i < 57; i++) budget.take('read')
  assert.equal(budget.remaining('read'), 3)
  const run = runner(plan, { budget })
  const first = await restoreMultipartBackup(plan, run.options)
  assert.equal(first.complete, false)
  assert.equal(first.completed, 3)
  assert.equal(first.retryAfterMs, 60000)
  assert.equal(run.writes(), 3)
  const edited = run.library.values().next().value
  edited.chapter = '99'
  now += 60000
  const reloaded = await verifyMultipartBackup(files, {
    uid: plan.uid,
    existingMangas: [...run.library.values()],
  })
  const result = await restoreMultipartBackup(reloaded, run.options)
  assert.equal(result.complete, true)
  assert.equal(run.library.size, 30)
  assert.equal(run.writes(), 30)
  assert.equal(run.library.get(edited.id).chapter, '99')
  await restoreMultipartBackup(reloaded, run.options)
  assert.equal(run.writes(), 30)
})

test('multipart recovery: lost acknowledgement, duplicate names and manual pause remain idempotent', async () => {
  const records = recoveryFixture(12, 10)
  records[1].name = records[0].name
  const exported = await prepareMultipartExport(records, verification)
  const files = filesFor(exported)
  const plan = await verifyMultipartBackup(files, { uid: 'target' })
  const library = new Map()
  let calls = 0,
    lost = true
  const run = runner(plan, {
    library,
    async write(uid, manga, { importDocumentId: id }) {
      calls++
      if (!library.has(id)) library.set(id, { ...manga, id })
      if (lost) {
        lost = false
        throw Object.assign(Error('lost acknowledgement'), { code: 'unavailable' })
      }
    },
  })
  assert.equal((await restoreMultipartBackup(plan, run.options)).complete, false)
  assert.equal(library.size, 8)
  library.values().next().value.chapter = '99'
  const resume = await verifyMultipartBackup(files, {
    uid: plan.uid,
    existingMangas: [...library.values()],
  })
  assert.equal(
    (await restoreMultipartBackup(resume, { ...run.options, shouldPause: () => true })).completed,
    8,
  )
  assert.equal(calls, 8)
  assert.equal((await restoreMultipartBackup(resume, run.options)).complete, true)
  assert.equal(calls, 12)
  assert.equal(library.size, 12)
  assert.equal(library.values().next().value.chapter, '99')
})

test('multipart recovery: changing account during a chunk awaits started writes and starts no more', async () => {
  const { plan } = await fixture(12)
  let current = true,
    started = 0,
    settled = 0
  const run = runner(plan, {
    assertCurrent() {
      if (!current) throw Object.assign(Error('account changed'), { code: 'cancelled' })
    },
    async write() {
      started++
      current = false
      await new Promise((resolve) => setTimeout(resolve, 10))
      settled++
    },
  })
  await assert.rejects(restoreMultipartBackup(plan, run.options), { code: 'cancelled' })
  assert.equal(started, 1)
  assert.equal(settled, 1)
})

test('budget introspection does not consume admissions or shorten quota cooldown', () => {
  let now = 100
  const budget = createSparkBudget(() => now)
  for (let i = 0; i < 60; i++) {
    assert.equal(budget.remaining('read'), 60 - i)
    budget.take('read')
  }
  assert.equal(budget.remaining('read'), 0)
  assert.equal(budget.retryAfterMs('read'), 60000)
  budget.record({ code: 'resource-exhausted' })
  now += 60000
  assert.equal(budget.remaining('read'), 0)
  assert.equal(budget.retryAfterMs('read'), 14 * 60000)
  now += 14 * 60000
  assert.equal(budget.remaining('read'), 60)
  assert.equal(budget.retryAfterMs('read'), 0)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, dirname, basename } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createEvidence, verifyEvidence } from '../scripts/build-evidence.mjs'
import { buildInfoPlugin, collectBuildInfo } from '../scripts/build-info.mjs'
import { loadModule } from './helpers/load-module.js'

const revision = 'a'.repeat(40)
const compatibility = JSON.parse(readFileSync('release-contract.json', 'utf8'))

function fixture(run, { project = 'demo-mangalist', dirty = false } = {}) {
  const root = mkdtempSync(resolve(tmpdir(), 'mangalist-evidence-'))
  try {
    const directory = resolve(root, 'dist/pwa')
    mkdirSync(directory, { recursive: true })
    mkdirSync(resolve(root, 'src-pwa'))
    for (const file of [
      'release-contract.json',
      'spark-policy.json',
      'firestore.rules',
      'firebase.json',
      'package-lock.json',
      'src-pwa/package-lock.json',
    ]) {
      writeFileSync(resolve(root, file), readFileSync(file))
    }
    const source = { revision, dirty }
    const info = {
      ...source,
      builtAt: '2026-10-18T12:00:00.000Z',
      compatibility,
      project,
      mode: 'pwa',
    }
    for (const [name, content] of Object.entries({
      'index.html': '<html></html>',
      'sw.js': '// worker',
      'manifest.json': '{}',
      'build-info.json': JSON.stringify(info),
    }))
      writeFileSync(resolve(directory, name), content)
    createEvidence(root, 'pwa')
    const verify = (options = {}) =>
      verifyEvidence(root, directory, { mode: 'pwa', project, source, ...options })
    return run({ root, directory, info, source, verify })
  } finally {
    assert.equal(dirname(root), resolve(tmpdir()))
    assert.ok(basename(root).startsWith('mangalist-evidence-'))
    rmSync(root, { recursive: true, force: true })
  }
}

test('build evidence verifies byte inventory and rejects changed, missing, added files and source inputs', () => {
  fixture(({ root, directory, verify }) => {
    assert.equal(verify().application.revision, revision)
    const worker = resolve(directory, 'sw.js')
    writeFileSync(worker, '// changed')
    assert.throws(verify, /files changed/)
    writeFileSync(worker, '// worker')
    writeFileSync(resolve(directory, 'extra.txt'), 'extra')
    assert.throws(verify, /files changed/)
    rmSync(resolve(directory, 'extra.txt'))
    writeFileSync(resolve(directory, '__proto__'), 'unexpected')
    assert.throws(verify, /files changed/)
    rmSync(resolve(directory, '__proto__'))
    rmSync(worker)
    assert.throws(verify, /files changed/)
    writeFileSync(worker, '// worker')
    writeFileSync(resolve(root, 'firestore.rules'), '// old rules')
    assert.throws(verify, /inputs changed/)
  })
})

test('release evidence rejects wrong projects, stale revisions, dirty builds and changed contracts', () => {
  fixture(({ directory, source, verify }) => {
    assert.throws(() => verify({ project: 'mangalist-61bb8' }), /project mismatch/)
    assert.throws(() => verify({ source: { ...source, revision: 'b'.repeat(40) } }), /revision/)
    assert.throws(() => verify({ source: { ...source, dirty: true } }), /Clean source/)
    const path = resolve(directory, 'build-evidence.json')
    const evidence = JSON.parse(readFileSync(path, 'utf8'))
    evidence.application.compatibility.deletionBarrier = 0
    writeFileSync(path, JSON.stringify(evidence))
    assert.throws(verify, /contracts/)
  })
  fixture(
    ({ verify }) => {
      assert.throws(verify, /Clean source/)
      assert.doesNotThrow(() => verify({ allowDirtyDemo: true }))
    },
    { dirty: true },
  )
  fixture(
    ({ verify }) => {
      assert.doesNotThrow(verify)
      assert.throws(() => verify({ allowDirtyDemo: true }), /demo-only/)
    },
    { project: 'mangalist-61bb8' },
  )
})

test('symbolic links are rejected and the CLI fails closed without build evidence', () => {
  fixture(({ root, directory, verify }) => {
    mkdirSync(resolve(root, 'outside'))
    symlinkSync(
      resolve(root, 'outside'),
      resolve(directory, 'linked'),
      process.platform === 'win32' ? 'junction' : 'dir',
    )
    assert.throws(verify, /Symbolic links/)
    const result = spawnSync(
      process.execPath,
      [
        'scripts/build-evidence.mjs',
        'verify',
        'pwa',
        '--project',
        'demo-mangalist',
        '--dir',
        resolve(root, 'missing'),
      ],
      { encoding: 'utf8' },
    )
    assert.equal(result.status, 1)
    assert.match(result.stderr, /verification blocked/)
  })
})

test('the Vite plugin emits only the resolved public project and the explicit source stamp', () => {
  const info = { revision, dirty: false, builtAt: '2026-10-18T12:00:00.000Z', compatibility }
  const plugin = buildInfoPlugin(info, 'pwa')
  plugin.configResolved({
    define: {
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': '"demo-mangalist"',
      'import.meta.env.SECRET': '"never-copy"',
    },
  })
  let file
  plugin.generateBundle.call({
    emitFile(value) {
      file = value
    },
  })
  assert.equal(file.fileName, 'build-info.json')
  assert.deepEqual(JSON.parse(file.source), { ...info, mode: 'pwa', project: 'demo-mangalist' })
  const actual = collectBuildInfo()
  assert.match(actual.revision, /^[a-f0-9]{40}$/)
  assert.equal(typeof actual.dirty, 'boolean')
})

test('version diagnostics whitelist public build fields and handle unidentified development builds', async () => {
  const module = await loadModule(
    'src/utils/application-version.js',
    {},
    {
      MANGALIST_BUILD_INFO: {
        revision,
        dirty: false,
        builtAt: '2026-10-18T12:00:00.000Z',
        email: 'never-copy',
        token: 'never-copy',
      },
    },
  )
  assert.equal(module.applicationVersionLabel, 'a'.repeat(12))
  assert.deepEqual(JSON.parse(module.versionDiagnostic()), {
    application: 'MangaList',
    revision,
    dirty: false,
    builtAt: '2026-10-18T12:00:00.000Z',
  })
  const unknown = await loadModule('src/utils/application-version.js')
  assert.equal(unknown.applicationVersionLabel, 'Versión local sin identificar')
  assert.equal(JSON.parse(unknown.versionDiagnostic()).revision, null)
})

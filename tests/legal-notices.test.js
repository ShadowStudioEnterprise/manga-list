import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { legalAssets } from '../scripts/legal-notices.mjs'

test('license output preserves original texts and a missing required notice stops the build', () => {
  const root = mkdtempSync(resolve(tmpdir(), 'mangalist-legal-'))
  const files = [
    'LICENSE',
    'NOTICE',
    'LICENSE-SCOPE.md',
    'ASSET-PROVENANCE.md',
    'THIRD-PARTY-NOTICES.md',
    'proposals/ml14/distribution-license-texts.md',
  ]
  try {
    for (const source of files) {
      const target = resolve(root, source)
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, readFileSync(source))
    }
    const assets = legalAssets(root)
    assert.equal(assets.length, 7)
    assert.equal(
      assets.find((a) => a.fileName === 'legal/LICENSE.txt').source,
      readFileSync('LICENSE', 'utf8'),
    )
    assert.equal(
      assets.find((a) => a.fileName === 'legal/COMPONENT-LICENSES.txt').source,
      readFileSync(files.at(-1), 'utf8'),
    )
    rmSync(resolve(root, 'NOTICE'))
    assert.throws(() => legalAssets(root), /ENOENT/)
  } finally {
    assert.equal(dirname(root), resolve(tmpdir()))
    rmSync(root, { recursive: true, force: true })
  }
})

test('all legacy icons are replaced with traceable original assets', () => {
  const provenance = JSON.parse(readFileSync('docs/measurements/ml14-original-icons.json'))
  const legacy = JSON.parse(readFileSync('proposals/ml14/distribution-audit.json')).assets
  const hash = (file) => createHash('sha256').update(readFileSync(file)).digest('hex')
  assert.equal(hash(provenance.source), provenance.sourceSha256)
  assert.equal(legacy.length, 16)
  for (const old of legacy) {
    assert.notEqual(hash(old.path), old.sha256, old.path)
    assert.equal(hash(old.path), provenance.files[old.path].sha256, old.path)
  }
})

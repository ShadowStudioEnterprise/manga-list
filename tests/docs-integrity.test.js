import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'

test('offline docs audit accepts a complete fixture and rejects drift, broken references, routes and anchors', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'mangalist-docs-audit-'))
  const write = async (path, content) => {
    const target = resolve(root, path)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, typeof content === 'string' ? content : JSON.stringify(content))
  }
  const git = (...args) => execFileSync('git', args, { cwd: root, stdio: 'pipe' }).toString().trim()
  const run = () =>
    spawnSync(
      process.execPath,
      [resolve(import.meta.dirname, '../scripts/check-docs-integrity.mjs'), '--root', root],
      { encoding: 'utf8' },
    )
  try {
    const source = 'export const sample = 1\n'
    await write('src/services/example.js', source)
    await mkdir(resolve(root, 'src/stores'), { recursive: true })
    git('init', '--initial-branch=main')
    git('add', 'src/services/example.js')
    git(
      '-c',
      'user.name=Docs fixture',
      '-c',
      'user.email=fixture@example.invalid',
      '-c',
      'commit.gpgsign=false',
      'commit',
      '-m',
      'synthetic source',
    )
    const baseCommit = git('rev-parse', 'HEAD')
    await write('docs/maintenance/contracts.json', {
      baseCommit,
      sources: {
        'src/services/example.js': { sha256: createHash('sha256').update(source).digest('hex') },
      },
    })
    await write('docs/maintenance/pages.json', {
      pages: { 'docs/index.md': { scope: 'synthetic', decision: 'reviewed fixture' } },
    })
    await write('docs/index.md', '# Fixture\n`123456789` is a decimal run ID.\n')
    await write('firebase.json', {
      hosting: [{ target: 'docs', redirects: [{ source: '/old', destination: '/' }] }],
    })
    await write(
      'docs/.vitepress/dist/index.html',
      '<h1 id="ok">Fixture</h1><a href="#ok">valid</a>',
    )
    let result = run()
    assert.equal(result.status, 0, result.stderr || result.stdout)
    await write('src/services/example.js', source + '// changed behavior needs review\n')
    await write('src/services/new-service.js', 'export const undocumented = 1\n')
    await write('docs/unreviewed.md', '# Newly added page\n')
    await write(
      'docs/index.md',
      '# Fixture\n`deadbeefdeadbeefdeadbeefdeadbeefdeadbeef`\n`src/services/missing.js`\n[missing source](https://github.com/ShadowStudioEnterprise/manga-list/blob/main/src/missing.js)\n',
    )
    await write(
      'docs/.vitepress/dist/index.html',
      '<h1 id="ok">Fixture</h1><a href="#absent">anchor</a><a href="/missing">route</a><img src="/missing.svg">',
    )
    result = run()
    assert.notEqual(result.status, 0)
    const report = JSON.parse(
      await readFile(resolve(root, 'test-results/docs-integrity/results.json'), 'utf8'),
    )
    for (const expected of [
      'changed since contract review',
      'missing contract review',
      'missing review disposition',
      'missing source reference',
      'unresolved repository link',
      'Unresolved documented commit',
      'missing compiled target',
      'missing anchor',
    ]) {
      assert(
        report.failures.some((message) => message.includes(expected)),
        `${expected}: ${JSON.stringify(report)}`,
      )
    }
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

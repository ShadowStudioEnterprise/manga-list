import test from 'node:test'
import assert from 'node:assert/strict'
import { inspectText, inspectWorkflow } from '../scripts/security-audit.mjs'

test('credential detector reports location without reproducing secrets', () => {
  const token = 'ghp_' + 'S'.repeat(36)
  const key = '-----BEGIN ' + 'PRIVATE KEY-----'
  const findings = inspectText('fixture.md', `safe\n${token}\n${key}`)
  assert.deepEqual(findings.map(({ kind, line }) => [kind, line]).sort(), [
    ['github-token', 2],
    ['private-key', 3],
  ])
  assert(!JSON.stringify(findings).includes(token))
  assert.deepEqual(
    inspectText('fixture.md', 'UID sintético, alice@example.test; VITE_FIREBASE_API_KEY='),
    [],
  )
  assert.equal(
    inspectText('fixture.json', '"refresh_token": "' + 's'.repeat(20) + '"')[0].kind,
    'credential-field',
  )
  assert.equal(inspectText('fixture.html', '?oobCode=' + 's'.repeat(20))[0].kind, 'sensitive-url')
})

test('workflow guard rejects privilege escalation, credentials and mutable actions', () => {
  const valid = `permissions:\n  contents: read\n\njobs:\n  verify:\n    steps:\n      - uses: actions/checkout@${'a'.repeat(40)}\n        with:\n          persist-credentials: false\n`
  assert.deepEqual(inspectWorkflow('ci.yml', valid), [])
  for (const bad of [
    valid.replace('contents: read', 'contents: write'),
    valid + '\n  id-token: write',
    valid + '\npull_request_target:',
    valid + '\nsecrets: inherit',
    valid.replace('@' + 'a'.repeat(40), '@v6'),
    valid.replace('persist-credentials: false', 'persist-credentials: true'),
  ]) {
    assert(inspectWorkflow('ci.yml', bad).length > 0)
  }
})

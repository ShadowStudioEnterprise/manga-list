import { execFileSync } from 'node:child_process'
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

// Offline only: no environment values, credentials, Firebase SDK or network access.
export function inspectText(path, text) {
  const findings = []
  const patterns = {
    'private-key': /-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/g,
    'github-token': /(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})/g,
    'google-oauth-token': /ya29\.[A-Za-z0-9_-]{20,}|1\/\/[A-Za-z0-9_-]{30,}/g,
    jwt: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
    'credential-field':
      /["']?(?:private_key|refresh_token|client_secret)["']?\s*:\s*["'][^"'\r\n]{8,}/g,
    'sensitive-url':
      /[?&](?:oobCode|access_token|id_token|refresh_token|token)=[A-Za-z0-9_%.-]{8,}/g,
  }
  for (const [kind, pattern] of Object.entries(patterns)) {
    for (const match of text.matchAll(pattern)) {
      findings.push({ path, line: text.slice(0, match.index).split('\n').length, kind })
    }
  }
  return findings // Never include the matched value, even on failure.
}

export function inspectWorkflow(path, text) {
  const failures = []
  const check = (ok, kind) => {
    if (!ok) failures.push({ path, kind })
  }
  // Deliberately conservative policy for this repository's one credential-free CI.
  check(/^permissions:\s*\r?\n {2}contents: read\s*\r?\n/m.test(text), 'read-only-token-required')
  check(!/\b(?:write|write-all|read-all)\b|\bid-token\s*:/.test(text), 'excess-token-permissions')
  check(
    !/\bsecrets\s*(?:\.|\[|:)|pull_request_target|workflow_run|self-hosted|firebase\s+deploy/.test(
      text,
    ),
    'privileged-workflow',
  )
  check(/persist-credentials: false/.test(text), 'checkout-credentials')
  for (const match of text.matchAll(/\buses:\s*([^\s#]+)/g)) {
    check(/^[\w.-]+\/[\w./-]+@[a-f0-9]{40}$/.test(match[1]), 'unpinned-action')
  }
  return failures
}

export async function audit(root, built = false) {
  const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
    .split('\0')
    .filter(Boolean)
  const findings = []
  const inventory = []
  for (const path of tracked) {
    if (
      /(?:^|\/)\.env(?!\.example$)|\.(?:pem|key|p12|pfx)$|(?:service-account|serviceAccount|firebase-adminsdk).*\.json$/i.test(
        path,
      )
    ) {
      findings.push({ path, kind: 'credential-file' })
    }
    const buffer = await readFile(resolve(root, path))
    if (!buffer.includes(0)) findings.push(...inspectText(path, buffer.toString('utf8')))
    if (path.startsWith('.github/workflows/'))
      findings.push(...inspectWorkflow(path, buffer.toString('utf8')))
    if (path.startsWith('docs/') && !path.startsWith('docs/.vitepress/')) {
      inventory.push({
        path,
        publication: path.startsWith('docs/public/')
          ? 'copied asset'
          : path.endsWith('.md')
            ? 'VitePress page'
            : path.startsWith('docs/measurements/') || /ml-1[12]-rules-audit\.json$/.test(path)
              ? 'copied download'
              : 'source only; check generated build',
      })
    }
  }
  let builtFiles = 0
  if (built) {
    const dist = resolve(root, 'docs/.vitepress/dist')
    async function walk(dir) {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        const path = resolve(dir, entry.name)
        if (entry.isDirectory()) await walk(path)
        else {
          builtFiles++
          const name = relative(root, path).replaceAll('\\', '/')
          if (/\.(?:map|pem|key|p12|pfx)$|(?:^|\/)\.env/.test(name))
            findings.push({ path: name, kind: 'private-build-file' })
          const buffer = await readFile(path)
          if (!buffer.includes(0)) findings.push(...inspectText(name, buffer.toString('utf8')))
        }
      }
    }
    await walk(dist) // A missing build fails instead of silently skipping it.
  }
  return {
    scope: 'tracked current tree; optional local docs build; no history or remote IAM',
    trackedFiles: tracked.length,
    builtFiles,
    inventory,
    findings,
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.slice(2).some((arg) => arg !== '--built'))
    throw new Error('Usage: security-audit.mjs [--built]')
  const root = resolve(import.meta.dirname, '..')
  const result = await audit(root, process.argv.includes('--built'))
  await mkdir(resolve(root, 'test-results/security'), { recursive: true })
  await writeFile(
    resolve(root, 'test-results/security/audit.json'),
    JSON.stringify(result, null, 2) + '\n',
  )
  console.log(
    `${result.trackedFiles} tracked files; ${result.builtFiles} built files; ${result.findings.length} findings (values suppressed)`,
  )
  if (result.findings.length) {
    console.error(JSON.stringify(result.findings))
    process.exitCode = 1
  }
}

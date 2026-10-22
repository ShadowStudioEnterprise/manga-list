import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile, readdir, mkdir, writeFile, access } from 'node:fs/promises'
import { resolve, relative } from 'node:path'

// Offline audit: never imports the app, initializes Firebase or requests a URL.
const args = process.argv.slice(2)
assert(
  args.length === 0 || (args.length === 2 && args[0] === '--root'),
  'Usage: check-docs-integrity.mjs [--root fixture]',
)
const root = args.length ? resolve(args[1]) : resolve(import.meta.dirname, '..')
const read = (path) => readFile(resolve(root, path), 'utf8')
const exists = async (path) =>
  access(path).then(
    () => true,
    () => false,
  )
const files = async (folder) =>
  (await readdir(resolve(root, folder), { recursive: true }))
    .map((path) => `${folder}/${path.replaceAll('\\', '/')}`)
    .sort()
const hash = (text) => createHash('sha256').update(text).digest('hex')
const manifest = JSON.parse(await read('docs/maintenance/contracts.json'))
const review = JSON.parse(await read('docs/maintenance/pages.json'))
const failures = []
const check = (condition, message) => {
  if (!condition) failures.push(message)
}
const report = {
  sourceFiles: [],
  pages: [],
  commits: [],
  repositoryLinks: [],
  externalLinks: [],
  compiledLinks: 0,
}
for (const [path, expected] of Object.entries(manifest.sources)) {
  const source = await read(path)
  check(
    hash(source) === expected.sha256,
    `${path}: changed since contract review; review docs and update fingerprint explicitly`,
  )
  report.sourceFiles.push(path)
}
// Track additions too, so a new service/store cannot silently lack a contract.
for (const folder of ['src/services', 'src/stores']) {
  for (const path of (await files(folder)).filter((path) => path.endsWith('.js'))) {
    check(Boolean(manifest.sources[path]), `${path}: missing contract review`)
  }
}
const markdown = (await files('docs')).filter(
  (path) => path.endsWith('.md') && !path.includes('/.vitepress/'),
)
const external = new Map()
const repositoryTargets = new Map()
const commits = new Set([manifest.baseCommit])
for (const path of markdown) {
  const source = await read(path)
  const disposition = review.pages[path]
  check(Boolean(disposition?.scope && disposition?.decision), `${path}: missing review disposition`)
  report.pages.push({ path, ...disposition })
  for (const match of source.matchAll(/`([a-f0-9]{7,40})`/g)) {
    // Decimal workflow/job IDs are not abbreviated Git hashes.
    if (/[a-f]/.test(match[1]) || match[1].length === 40) commits.add(match[1])
  }
  // Literal code references (not prose examples with placeholders) must exist.
  for (const match of source.matchAll(
    /`((?:src|src-pwa|tests|scripts)\/[\w./-]+\.(?:js|mjs|vue|json))`/g,
  )) {
    check(await exists(resolve(root, match[1])), `${path}: missing source reference ${match[1]}`)
  }
  for (const match of source.matchAll(/https?:\/\/[^\s<>"')`]+/g)) {
    const url = match[0].replace(/[.,;]+$/, '')
    if (!external.has(url)) external.set(url, new Set())
    external.get(url).add(path)
    const repo = url.match(
      /^https:\/\/github\.com\/ShadowStudioEnterprise\/manga-list\/(blob|tree)\/([^/]+)\/(.*?)(?:#.*)?$/,
    )
    if (repo) {
      const [, , ref, target] = repo
      // GitHub PR checkouts are detached and need not have a local main branch.
      // Validate moving main links against the explicitly reviewed base tree.
      const gitRef = ref === 'main' ? manifest.baseCommit : ref
      let valid = repositoryTargets.get(url)
      if (valid === undefined) {
        valid = true
        try {
          execFileSync('git', ['cat-file', '-e', `${gitRef}:${decodeURIComponent(target)}`], {
            cwd: root,
            stdio: 'pipe',
          })
        } catch {
          valid = false
        }
        repositoryTargets.set(url, valid)
        report.repositoryLinks.push({ url, valid })
      }
      check(valid, `${path}: unresolved repository link ${url}`)
    }
  }
}
for (const path of Object.keys(review.pages))
  check(markdown.includes(path), `${path}: reviewed page was removed`)
for (const commit of [...commits].sort()) {
  let valid = true
  try {
    execFileSync('git', ['rev-parse', '--verify', `${commit}^{commit}`], {
      cwd: root,
      stdio: 'pipe',
    })
  } catch {
    valid = false
  }
  // Historical short refs missing from a shallow checkout cannot be certified.
  check(valid, `Unresolved documented commit ${commit}; use a full clone or correct reference`)
  report.commits.push({ commit, valid })
}

// Check the actual rendered routes/anchors, including Vue, navbar and copied JSON.
const dist = resolve(root, 'docs/.vitepress/dist')
assert(await exists(dist), 'Build docs first: npm run docs:build')
const compiled = new Map()
const targetFile = (pathname) => {
  let target = resolve(dist, `.${decodeURIComponent(pathname)}`)
  if (pathname.endsWith('/')) target = resolve(target, 'index.html')
  else if (!/\.[^/]+$/.test(pathname)) target += '.html'
  return target
}
// Firebase Hosting's historical redirects must still point at compiled pages.
// This only reads versioned configuration, without contacting Hosting.
const hosting = JSON.parse(await read('firebase.json')).hosting.find(
  (site) => site.target === 'docs',
)
for (const redirect of hosting.redirects || []) {
  check(
    await exists(targetFile(redirect.destination)),
    `Historical redirect ${redirect.source}: missing ${redirect.destination}`,
  )
}
const htmlFiles = (await files('docs/.vitepress/dist')).filter((path) => path.endsWith('.html'))
const seen = new Set()
for (const path of htmlFiles) {
  const html = await read(path)
  const from = `https://local.invalid/${relative(dist, resolve(root, path)).replaceAll('\\', '/')}`
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const href = match[1].replaceAll('&amp;', '&')
    if (/^(?:data:|mailto:|tel:|javascript:)/.test(href)) continue
    const url = new URL(href, from)
    if (url.origin !== 'https://local.invalid') {
      if (!external.has(url.href)) external.set(url.href, new Set())
      external.get(url.href).add(path.replace('docs/.vitepress/dist/', 'rendered:'))
      continue
    }
    if (seen.has(url.href)) continue
    seen.add(url.href)
    const target = targetFile(url.pathname)
    check(!relative(dist, target).startsWith('..'), `${path}: link escapes dist ${href}`)
    const found = await exists(target)
    check(found, `${path}: missing compiled target ${href}`)
    if (found && target.endsWith('.html') && url.hash) {
      if (!compiled.has(target)) {
        const body = await readFile(target, 'utf8')
        compiled.set(target, new Set([...body.matchAll(/\bid="([^"]+)"/g)].map((item) => item[1])))
      }
      const ids = compiled.get(target)
      check(ids.has(decodeURIComponent(url.hash.slice(1))), `${path}: missing anchor ${href}`)
    }
    report.compiledLinks++
  }
}
report.externalLinks = [...external]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([url, pages]) => ({
    url,
    pages: [...pages],
    status: 'inventoried-offline; HTTP/auth/remote-state not certified',
  }))
report.failures = failures
await mkdir(resolve(root, 'test-results/docs-integrity'), { recursive: true })
await writeFile(
  resolve(root, 'test-results/docs-integrity/results.json'),
  JSON.stringify(report, null, 2),
)
console.log(
  `${report.pages.length} pages reviewed; ${report.sourceFiles.length} source fingerprints; ${report.commits.length} commits; ${report.compiledLinks} rendered local targets; ${report.externalLinks.length} external URLs inventoried`,
)
assert.deepEqual(failures, [], failures.join('\n'))
console.log(
  'PASS: offline documentation integrity (external availability and semantic completeness require human review)',
)

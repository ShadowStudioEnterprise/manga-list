import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

// Explicit, optional public-documentation probe. No credentials or Firebase project access.
// Run docs:check first. Never run automatically in CI or as a deploy hook.
const root = resolve(import.meta.dirname, '..')
const input = JSON.parse(
  await readFile(resolve(root, 'test-results/docs-integrity/results.json'), 'utf8'),
)
const results = []
const queue = [...input.externalLinks]
async function worker() {
  while (queue.length) {
    const entry = queue.shift()
    const url = new URL(entry.url)
    // Never probe app hosts, consoles, project APIs, support inboxes or examples.
    const allowed = [
      'firebase.google.com',
      'vitepress.dev',
      'vite.dev',
      'vuejs.org',
      'pinia.vuejs.org',
      'quasar.dev',
      'developer.mozilla.org',
      'docs.github.com',
      'cloud.google.com',
      'nodejs.org',
      'nextcloud.com',
      'docs.nextcloud.com',
      'proton.me',
      'www.seafile.com',
      'docs.syncthing.net',
      'docs.oracle.com',
      'www.aepd.es',
      'www.edpb.europa.eu',
      'eur-lex.europa.eu',
      'www.boe.es',
    ]
    if (!allowed.includes(url.hostname) || url.pathname.startsWith('/console')) {
      results.push({
        ...entry,
        status:
          'not-probed: repository/local resolution, example, authentication or remote project excluded',
      })
      continue
    }
    try {
      // Manual redirects: validate every host before sending the next request.
      let target = url
      let response
      for (let hop = 0; hop < 6; hop++) {
        if (!allowed.includes(target.hostname))
          throw new Error(`Redirect outside public allowlist: ${target.hostname}`)
        response = await fetch(target, {
          method: 'HEAD',
          redirect: 'manual',
          signal: AbortSignal.timeout(15000),
        })
        if (response.status < 300 || response.status >= 400 || !response.headers.get('location'))
          break
        target = new URL(response.headers.get('location'), target)
      }
      results.push({
        ...entry,
        status: response.status,
        finalUrl: target.href,
        checkedAt: new Date().toISOString(),
        fragmentChecked: false,
      })
    } catch (error) {
      results.push({ ...entry, status: 'inconclusive', reason: error.message })
    }
  }
}
await Promise.all([worker(), worker(), worker(), worker()])
results.sort((a, b) => a.url.localeCompare(b.url))
await writeFile(
  resolve(root, 'test-results/docs-integrity/public-links.json'),
  JSON.stringify(results, null, 2),
)
const counts = {}
for (const item of results) counts[item.status] = (counts[item.status] || 0) + 1
console.log(JSON.stringify(counts))
console.log(
  'Public HEAD results are dated observations, not content, anchor, authentication or deployment verification.',
)

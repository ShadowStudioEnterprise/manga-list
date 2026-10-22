import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { once } from 'node:events'
import { resolve, sep, extname } from 'node:path'
import { chromium } from '@playwright/test'
import { createHash } from 'node:crypto'
import { legalAssets } from '../../scripts/legal-notices.mjs'

test('SPA, PWA and documentation distributions preserve every complete legal text', async () => {
  for (const folder of ['dist/spa', 'dist/pwa', 'docs/.vitepress/dist']) {
    for (const asset of legalAssets(process.cwd())) {
      assert.equal(
        await readFile(resolve(folder, asset.fileName), 'utf8'),
        asset.source,
        folder + '/' + asset.fileName,
      )
    }
  }
  const icons = JSON.parse(await readFile('docs/measurements/ml14-original-icons.json', 'utf8'))
  for (const folder of ['dist/spa', 'dist/pwa']) {
    for (const [source, expected] of Object.entries(icons.files)) {
      const bytes = await readFile(resolve(folder, source.replace(/^public\//, '')))
      assert.equal(createHash('sha256').update(bytes).digest('hex'), expected.sha256, source)
    }
  }
})

test(
  'installed PWA serves legal page and complete notices offline without contacting Firebase',
  { timeout: 60000 },
  async () => {
    const root = resolve('dist/pwa')
    const types = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.txt': 'text/plain',
      '.png': 'image/png',
      '.svg': 'image/svg+xml',
      '.woff2': 'font/woff2',
    }
    const server = createServer(async (request, response) => {
      try {
        const pathname = new URL(request.url, 'http://localhost').pathname
        const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname))
        if (!file.startsWith(root + sep)) throw new Error('Invalid path')
        const bytes = await readFile(file)
        response.writeHead(200, {
          'Content-Type': types[extname(file)] || 'application/octet-stream',
          'Cache-Control': 'no-store',
        })
        response.end(bytes)
      } catch {
        response.writeHead(404).end()
      }
    })
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')
    let browser
    try {
      browser = await chromium.launch()
      const context = await browser.newContext()
      const origin = `http://127.0.0.1:${server.address().port}`
      const external = []
      await context.route('**/*', (route) => {
        if (new URL(route.request().url()).origin === origin) return route.continue()
        external.push(route.request().url())
        return route.abort()
      })
      const page = await context.newPage()
      await page.goto(origin + '/#/login')
      const link = page.getByRole('link', { name: 'Licencias de software', exact: true })
      await link.waitFor()
      assert.equal(new URL(await link.getAttribute('href'), origin).pathname, '/legal/index.html')
      // The legal page needs no account; retain the worker's application scope.
      await page.goto(origin + '/legal/index.html')
      await page.evaluate(async () => {
        await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready
      })
      await page.reload()
      await page.waitForFunction(() => navigator.serviceWorker.controller)
      await context.setOffline(true)
      await page.goto(origin + '/legal/index.html')
      assert.equal(await page.getByRole('heading', { name: 'Licencias de software' }).count(), 1)
      for (const asset of legalAssets(process.cwd()).filter((a) => a.fileName.endsWith('.txt'))) {
        const actual = await page.evaluate(async (url) => {
          const response = await fetch(url)
          if (!response.ok) throw new Error('Missing offline notice')
          return response.text()
        }, '/' + asset.fileName)
        assert.equal(actual, asset.source, asset.fileName)
      }
      assert.deepEqual(external, [])
    } finally {
      await browser?.close()
      server.closeAllConnections()
      await new Promise((done) => server.close(done))
    }
  },
)

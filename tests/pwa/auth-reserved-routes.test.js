import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, readdir } from 'node:fs/promises'
import { resolve, sep, extname } from 'node:path'
import { once } from 'node:events'
import { chromium, firefox } from '@playwright/test'

for (const engine of [chromium, firefox]) {
  test(
    `built PWA preserves Firebase reserved navigation in ${engine.name()}`,
    { timeout: 60000 },
    async () => {
      const root = resolve('dist/pwa')
      const assets = (await readdir(resolve(root, 'assets'))).filter((file) =>
        /^firebase-.*\.js$/.test(file),
      )
      assert.equal(assets.length, 1)
      assert.match(
        await readFile(resolve(root, 'assets', assets[0]), 'utf8'),
        /projectId\s*:\s*["'`]demo-mangalist["'`]/,
      )
      const hits = []
      const types = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.woff2': 'font/woff2',
      }
      const server = createServer(async (request, response) => {
        const path = new URL(request.url, 'http://localhost').pathname
        if (path.startsWith('/__/')) {
          hits.push(path)
          response.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' })
          response.end('<p id="firebase-helper">Local reserved endpoint fixture</p>')
          return
        }
        try {
          const file = resolve(root, '.' + (path === '/' ? '/index.html' : path))
          assert.ok(file.startsWith(root + sep))
          const content = await readFile(file)
          response.writeHead(200, {
            'Content-Type': types[extname(file)] || 'application/octet-stream',
            'Cache-Control': 'no-store',
          })
          response.end(content)
        } catch {
          response.writeHead(404)
          response.end()
        }
      })
      server.listen(0, '127.0.0.1')
      await once(server, 'listening')
      let browser
      try {
        browser = await engine.launch()
        const context = await browser.newContext()
        const origin = `http://127.0.0.1:${server.address().port}`
        // Every cloud request is blocked; no OAuth identity or real Firebase account is used.
        await context.route('**/*', (route) =>
          new URL(route.request().url()).origin === origin ? route.continue() : route.abort(),
        )
        const page = await context.newPage()
        await page.goto(origin + '/#/login')
        await page.evaluate(() => navigator.serviceWorker.ready)
        await page.reload()
        await page.waitForFunction(() => navigator.serviceWorker.controller)
        const paths = [
          '/__/auth/handler',
          '/__/auth/iframe',
          '/__/auth/action',
          '/__/firebase/init.json',
        ]
        for (const path of paths) {
          const response = await page.goto(origin + path)
          assert.equal(
            response.fromServiceWorker(),
            false,
            `${path} must reach Hosting, not the app shell`,
          )
          await page.locator('#firebase-helper').waitFor({ timeout: 5000 })
        }
        assert.deepEqual(hits, paths)
        // Ordinary app navigation must keep its offline shell fallback.
        const response = await page.goto(origin + '/ordinary-app-route#/login')
        assert.equal(response.fromServiceWorker(), true)
        await page.getByLabel('Correo electrónico', { exact: true }).waitFor()
      } finally {
        await browser?.close()
        server.closeAllConnections()
        await new Promise((done) => server.close(done))
      }
    },
  )
}

import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, readdir } from 'node:fs/promises'
import { resolve, sep, extname } from 'node:path'
import { once } from 'node:events'
import { chromium } from '@playwright/test'

for (const firstControlled of [true, false]) {
  test(
    `built PWA shows update notice with first client ${firstControlled ? 'controlled' : 'uncontrolled'}`,
    { timeout: 60000 },
    async () => {
      const root = resolve('dist/pwa')
      // Fail before launching anything if the build points to production.
      const html = await readFile(resolve(root, 'index.html'), 'utf8')
      assert.match(html, /<html/)
      const firebaseAssets = (await readdir(resolve(root, 'assets'))).filter(
        (file) => file.startsWith('firebase-') && file.endsWith('.js'),
      )
      assert.equal(
        firebaseAssets.length,
        1,
        'Build the PWA with the demo Firebase configuration first',
      )
      const firebaseCode = await readFile(resolve(root, 'assets', firebaseAssets[0]), 'utf8')
      assert.match(firebaseCode, /projectId\s*:\s*["'`]demo-mangalist["'`]/)
      const types = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.woff2': 'font/woff2',
      }
      let revision = 1
      const server = createServer(async (request, response) => {
        try {
          const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
          const file = resolve(root, '.' + (path === '/' ? '/index.html' : path))
          if (!file.startsWith(root + sep)) throw new Error('Invalid path')
          let content = await readFile(file)
          if (path === '/sw.js') {
            // Test-only version probe; the built application's activation logic is unchanged.
            content = Buffer.from(
              content +
                `\nself.addEventListener('message', e => { if(e.data === 'test-version') e.ports[0].postMessage(${revision}); });`,
            )
          }
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
      const external = []
      const errors = []
      try {
        browser = await chromium.launch()
        const context = await browser.newContext()
        const origin = `http://127.0.0.1:${server.address().port}`
        await context.route('**/*', (route) => {
          if (new URL(route.request().url()).origin === origin) return route.continue()
          external.push(route.request().url())
          return route.abort()
        })
        const first = await context.newPage()
        first.on('pageerror', (error) => errors.push(error.message))
        await first.goto(origin + '/#/login')
        await first.evaluate(() => navigator.serviceWorker.ready)
        assert.equal(
          await first
            .getByRole('status')
            .filter({ hasText: 'Hay una nueva versión disponible' })
            .count(),
          0,
          'The first installation must not be reported as an update',
        )
        if (firstControlled) {
          await first.reload()
          await first.waitForFunction(() => navigator.serviceWorker.controller)
        } else {
          assert.equal(await first.evaluate(() => navigator.serviceWorker.controller), null)
        }
        const second = await context.newPage()
        second.on('pageerror', (error) => errors.push(error.message))
        await second.goto(origin + '/#/login')
        await second.waitForFunction(() => navigator.serviceWorker.controller)
        await first
          .getByLabel('Correo electrónico', { exact: true })
          .fill('unfinished@example.test')
        await first.evaluate(() => {
          window.testControllerChanges = 0
          navigator.serviceWorker.addEventListener(
            'controllerchange',
            () => window.testControllerChanges++,
          )
        })
        revision = 2
        await first.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update())
        await first.waitForFunction(async () =>
          Boolean((await navigator.serviceWorker.getRegistration()).waiting),
        )
        await first
          .getByRole('status')
          .filter({ hasText: 'Hay una nueva versión disponible' })
          .waitFor({ timeout: 10000 })
        assert.equal(
          await first.getByLabel('Correo electrónico', { exact: true }).inputValue(),
          'unfinished@example.test',
        )
        assert.equal(await first.evaluate(() => window.testControllerChanges), 0)
        assert.equal(await workerVersion(second, 'active'), 1)
        assert.equal(await workerVersion(second, 'waiting'), 2)
        await second.reload()
        await second
          .getByRole('status')
          .filter({ hasText: 'Hay una nueva versión disponible' })
          .waitFor()
        await first.close()
        assert.equal(await workerVersion(second, 'active'), 1)
        assert.equal(await workerVersion(second, 'waiting'), 2)
        await second.close()
        const reopened = await context.newPage()
        await reopened.goto(origin + '/#/login')
        await reopened.evaluate(() => navigator.serviceWorker.ready)
        await reopened.waitForFunction(
          async () => !(await navigator.serviceWorker.getRegistration()).waiting,
        )
        assert.equal(await workerVersion(reopened, 'active'), 2)
        assert.deepEqual(external, [])
        assert.deepEqual(errors, [])
      } finally {
        await browser?.close()
        server.closeAllConnections()
        await new Promise((done) => server.close(done))
      }
    },
  )
}

async function workerVersion(page, state) {
  return page.evaluate(async (state) => {
    const worker = (await navigator.serviceWorker.getRegistration())[state]
    return new Promise((resolve, reject) => {
      const channel = new MessageChannel()
      const timeout = setTimeout(() => reject(new Error('Worker probe timed out')), 5000)
      channel.port1.onmessage = (event) => {
        clearTimeout(timeout)
        resolve(event.data)
      }
      worker.postMessage('test-version', [channel.port2])
    })
  }, state)
}

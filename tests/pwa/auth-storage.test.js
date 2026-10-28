import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, readdir } from 'node:fs/promises'
import { resolve, sep, extname } from 'node:path'
import { once } from 'node:events'
import { chromium, firefox } from '@playwright/test'

// Exercise release bundles, not the development server (whose Vue DevTools
// reads storage before application startup). Never contact Firebase or Google.
for (const mode of ['spa', 'pwa']) {
  for (const [engine, launcher] of Object.entries({ chromium, firefox })) {
    for (const denial of ['access', 'writes']) {
      test(
        `built ${mode} guest Auth starts with storage ${denial} denied in ${engine}`,
        { timeout: 60000 },
        async () => {
          const root = resolve('dist', mode)
          const build = JSON.parse(await readFile(resolve(root, 'build-info.json'), 'utf8'))
          assert.equal(build.project, 'demo-mangalist')
          assert.equal(build.mode, mode)
          const assets = (await readdir(resolve(root, 'assets'))).filter((name) =>
            /^firebase-.*\.js$/.test(name),
          )
          assert.equal(assets.length, 1, 'Build with demo Firebase configuration first')
          assert.match(
            await readFile(resolve(root, 'assets', assets[0]), 'utf8'),
            /projectId\s*:\s*["'`]demo-mangalist["'`]/,
          )
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
            try {
              const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
              const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname))
              if (!file.startsWith(root + sep)) throw Error('Invalid path')
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
          const errors = []
          const external = []
          try {
            browser = await launcher.launch()
            console.info(
              JSON.stringify({
                artifact: mode,
                revision: build.revision,
                engine,
                browser: browser.version(),
                denial,
              }),
            )
            const context = await browser.newContext({ serviceWorkers: 'block' })
            const origin = `http://127.0.0.1:${server.address().port}`
            await context.route('**/*', (route) => {
              if (new URL(route.request().url()).origin === origin) return route.continue()
              external.push(new URL(route.request().url()).origin)
              return route.abort()
            })
            await context.addInitScript((policy) => {
              window.ml15StorageDenials = 0
              if (policy === 'access') {
                for (const name of ['localStorage', 'sessionStorage'])
                  Object.defineProperty(window, name, {
                    configurable: true,
                    get() {
                      window.ml15StorageDenials++
                      throw new DOMException('Synthetic storage policy', 'SecurityError')
                    },
                  })
              } else {
                Storage.prototype.setItem = function () {
                  window.ml15StorageDenials++
                  throw new DOMException('Synthetic storage quota', 'QuotaExceededError')
                }
              }
            }, denial)
            const page = await context.newPage()
            page.on('pageerror', (error) => errors.push(error.message))
            await page.goto(origin + '/#/library')
            await page.getByRole('heading', { name: 'Inicia sesión', exact: true }).waitFor()
            assert.match(page.url(), /#\/login/)
            assert.ok(
              await page.evaluate(() => window.ml15StorageDenials > 0),
              'The bundle must actually encounter the denied storage',
            )
            await page
              .getByLabel('Correo electrónico', { exact: true })
              .fill('synthetic-storage@example.test')
            await page.getByLabel('Contraseña', { exact: true }).fill('Synthetic-only-123!')
            await page.getByRole('link', { name: /contraseña/i }).click()
            await page
              .getByRole('heading', { name: 'Restablecer contraseña', exact: true })
              .waitFor()
            await page.reload()
            await page
              .getByRole('heading', { name: 'Restablecer contraseña', exact: true })
              .waitFor()
            await page.getByRole('link', { name: 'Volver al login', exact: true }).click()
            await page.getByRole('heading', { name: 'Inicia sesión', exact: true }).waitFor()
            assert.deepEqual(errors, [])
            assert.deepEqual(external, [])
          } finally {
            await browser?.close()
            server.closeAllConnections()
            await new Promise((done) => server.close(done))
          }
        },
      )
    }
  }
}

import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { readFile, readdir } from 'node:fs/promises'
import { resolve, sep, extname } from 'node:path'
import { chromium, firefox } from '@playwright/test'

assert.equal(
  process.env.FIREBASE_AUTH_EMULATOR_HOST,
  '127.0.0.1:9199',
  'Use npm run test:auth:built',
)
const emulator = 'http://127.0.0.1:9199'
const operations = new Set([
  '/v1/accounts:signUp',
  '/v1/accounts:signInWithPassword',
  '/v1/accounts:lookup',
])

for (const mode of ['spa', 'pwa']) {
  for (const [engine, launcher] of Object.entries({ chromium, firefox })) {
    for (const denial of ['access', 'writes']) {
      test(
        `built ${mode} authenticated memory session with global storage ${denial} denied in ${engine}`,
        { timeout: 60000 },
        async () => {
          const root = resolve('dist', mode)
          const build = JSON.parse(await readFile(resolve(root, 'build-info.json'), 'utf8'))
          assert.equal(build.project, 'demo-mangalist')
          assert.equal(build.mode, mode)
          const assets = (await readdir(resolve(root, 'assets'))).filter((name) =>
            /^firebase-.*\.js$/.test(name),
          )
          assert.equal(assets.length, 1)
          assert.match(
            await readFile(resolve(root, 'assets', assets[0]), 'utf8'),
            /projectId\s*:\s*["'`]demo-mangalist["'`]/,
          )
          const types = {
            '.html': 'text/html',
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.svg': 'image/svg+xml',
            '.png': 'image/png',
            '.woff2': 'font/woff2',
          }
          const server = createServer(async (request, response) => {
            try {
              const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
              const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname))
              if (!file.startsWith(root + sep)) throw Error('Invalid static path')
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
          const unexpected = []
          const authResponses = []
          let blockedFirestore = 0
          try {
            browser = await launcher.launch()
            // Firefox rejects navigation before routing when offline. In both
            // engines every allowed response comes from loopback via Node;
            // no browser request is continued and service workers are blocked.
            const browserOffline = engine === 'chromium'
            const context = await browser.newContext({
              offline: browserOffline,
              serviceWorkers: 'block',
            })
            const origin = `http://127.0.0.1:${server.address().port}`
            await context.route('**/*', async (route) => {
              const url = new URL(route.request().url())
              if (url.origin === origin) {
                const response = await route.fetch({
                  url: route.request().url(),
                  maxRedirects: 0,
                  timeout: 10000,
                })
                return route.fulfill({ response })
              }
              if (
                url.protocol === 'https:' &&
                url.hostname === 'identitytoolkit.googleapis.com' &&
                operations.has(url.pathname)
              ) {
                assert.equal(url.searchParams.get('key'), 'demo-mangalist-key')
                const response = await route.fetch({
                  url: emulator + '/identitytoolkit.googleapis.com' + url.pathname + url.search,
                  maxRedirects: 0,
                  timeout: 10000,
                })
                authResponses.push({ operation: url.pathname, status: response.status() })
                return route.fulfill({
                  response,
                  headers: { ...response.headers(), 'access-control-allow-origin': origin },
                })
              }
              if (url.hostname === 'firestore.googleapis.com') blockedFirestore++
              else unexpected.push(url.origin)
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
                  throw new DOMException('Synthetic quota', 'QuotaExceededError')
                }
              }
            }, denial)
            const page = await context.newPage()
            page.on('pageerror', (error) => errors.push(error.stack || error.message))
            const email = `compiled-memory-${randomUUID()}@example.test`
            const password = 'Synthetic-compiled-123!'
            await page.goto(origin + '/#/register')
            await page.getByLabel('Correo electrónico', { exact: true }).fill(email)
            await page.getByLabel('Contraseña', { exact: true }).fill(password)
            await page.getByLabel('Repite la contraseña', { exact: true }).fill(password)
            const registered = page.waitForResponse((response) =>
              response.url().includes('/accounts:signUp'),
            )
            await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click()
            const signup = await registered
            assert.equal(signup.status(), 200)
            const uid = (await signup.json()).localId
            assert.ok(uid)
            await page.getByRole('heading', { name: 'Biblioteca', exact: true }).waitFor()
            assert.ok(await page.evaluate(() => window.ml15StorageDenials > 0))
            const second = await context.newPage()
            await second.goto(origin + '/#/library')
            await second.getByRole('heading', { name: 'Inicia sesión', exact: true }).waitFor()
            assert.match(page.url(), /#\/library/)
            await page.reload()
            await page.getByRole('heading', { name: 'Inicia sesión', exact: true }).waitFor()
            await page.getByLabel('Correo electrónico', { exact: true }).fill(email)
            await page.getByLabel('Contraseña', { exact: true }).fill(password)
            const signedIn = page.waitForResponse((response) =>
              response.url().includes('/accounts:signInWithPassword'),
            )
            await page.getByRole('button', { name: 'Entrar', exact: true }).click()
            const signin = await signedIn
            assert.equal(signin.status(), 200)
            assert.equal((await signin.json()).localId, uid)
            await page.getByRole('heading', { name: 'Biblioteca', exact: true }).waitFor()
            await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
            await page.getByRole('heading', { name: 'Inicia sesión', exact: true }).waitFor()
            assert.deepEqual(errors, [])
            assert.deepEqual(unexpected, [])
            console.info(
              JSON.stringify({
                artifact: mode,
                revision: build.revision,
                engine,
                browser: browser.version(),
                denial,
                authResponses,
                blockedFirestore,
                externallyForwarded: 0,
                browserOffline,
                worker: 'blocked',
                result: 'PASS',
              }),
            )
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

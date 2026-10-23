import { spawn, execFileSync } from 'node:child_process'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { platform, release, cpus, totalmem } from 'node:os'
import { performance } from 'node:perf_hooks'
import { randomUUID, createHash } from 'node:crypto'
import { chromium } from '@playwright/test'

const root = resolve(import.meta.dirname, '..')
const args = process.argv.slice(2)
const label = args[0] || 'local'
const pairs = Number(args[1] || 3)
const authenticated = args[2] === 'authenticated'
if (
  !/^[a-z0-9-]+$/.test(label) ||
  !Number.isInteger(pairs) ||
  pairs < 1 ||
  pairs > 10 ||
  args.length > 3 ||
  (args[2] && !authenticated)
) {
  throw new Error('Usage: npm run diagnose:startup -- label [1..10 pairs] [authenticated]')
}
const output = resolve(root, 'test-results/startup', label)
const origin = 'http://127.0.0.1:9118'
if (
  authenticated &&
  (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8188' ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9199')
) {
  throw new Error(
    'Authenticated measurements require isolated emulators:exec with the repository ports.',
  )
}
const environment = {
  ...process.env,
  QCLI_FIREBASE_EMULATORS: 'true',
  VITE_FIREBASE_API_KEY: 'demo-mangalist-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'demo-mangalist.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'demo-mangalist',
  VITE_FIREBASE_STORAGE_BUCKET: 'demo-mangalist.appspot.com',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
  VITE_FIREBASE_APP_ID: '1:123456789:web:demo',
}
// Fail before deleting any generated cache if another server owns the fixed port.
const { createServer } = await import('node:net')
const probe = createServer()
await new Promise((accept, reject) => probe.once('error', reject).listen(9118, '127.0.0.1', accept))
await new Promise((accept) => probe.close(accept))
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const results = []
const version = async (name) =>
  JSON.parse(await readFile(resolve(root, 'node_modules', name, 'package.json'))).version
const metadata = {
  recordedAt: new Date().toISOString(),
  revision: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  platform: platform(),
  release: release(),
  cpu: cpus()[0]?.model,
  logicalCpus: cpus().length,
  memoryGiB: totalmem() / 1024 ** 3,
  node: process.version,
  browser: browser.version(),
  versions: Object.fromEntries(
    await Promise.all(
      ['@quasar/app-vite', 'quasar', 'vite', 'sass-embedded'].map(async (name) => [
        name,
        await version(name),
      ]),
    ),
  ),
  authenticated,
  hashes: Object.fromEntries(
    await Promise.all(
      ['quasar.config.js', 'package-lock.json', 'scripts/measure-startup.mjs'].map(async (file) => [
        file,
        createHash('sha256')
          .update(await readFile(resolve(root, file)))
          .digest('hex'),
      ]),
    ),
  ),
  definition:
    'cold = .quasar and node_modules/.q-cache/dev-spa removed; warm = retained; fresh browser context each time; OS file cache not cleared; CLI spawn excludes npm wrapper; authenticated mode creates synthetic users only in local emulators',
}
try {
  for (let pair = 1; pair <= pairs; pair++) {
    for (const cache of ['cold', 'warm']) {
      if (cache === 'cold') {
        // Fixed generated paths inside this checkout only; never remove node_modules or .env.
        for (const relative of ['.quasar', 'node_modules/.q-cache/dev-spa']) {
          await rm(resolve(root, relative), { recursive: true, force: true })
        }
      }
      const sample = { pair, cache, status: 'failed', blocked: [], errors: [], slowRequests: [] }
      const started = performance.now()
      const child = spawn(
        process.execPath,
        [
          'node_modules/@quasar/app-vite/bin/quasar.js',
          'dev',
          '--hostname',
          '127.0.0.1',
          '--port',
          '9118',
        ],
        { cwd: root, env: environment, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] },
      )
      let log = ''
      child.stdout.on('data', (chunk) => {
        log += chunk
      })
      child.stderr.on('data', (chunk) => {
        log += chunk
      })
      let spawnError
      child.on('error', (error) => {
        spawnError = error
      })
      const context = await browser.newContext({ serviceWorkers: 'block' })
      await context.route('**/*', (route) => {
        const target = new URL(route.request().url()).origin
        if (
          target === origin ||
          (authenticated && ['http://127.0.0.1:8188', 'http://127.0.0.1:9199'].includes(target))
        )
          return route.continue()
        sample.blocked.push(route.request().url())
        return route.abort()
      })
      const page = await context.newPage()
      page.setDefaultTimeout(120000)
      page.on('pageerror', (error) => sample.errors.push(error.message))
      page.on('response', (response) => {
        if (response.status() >= 400) sample.errors.push(`${response.status()} ${response.url()}`)
      })
      page.on('requestfinished', (request) => {
        const timing = request.timing()
        sample.slowRequests.push({ url: request.url().replace(origin, ''), ms: timing.responseEnd })
      })
      try {
        while (true) {
          if (spawnError) throw spawnError
          if (child.exitCode !== null) throw new Error(`Server exited ${child.exitCode}`)
          if (performance.now() - started > 120000) throw new Error('HTTP readiness timeout')
          try {
            const response = await fetch(origin, {
              signal: AbortSignal.timeout(1000),
              redirect: 'error',
            })
            await response.text()
            if (response.ok) break
          } catch {
            /* server not listening yet */
          }
          await new Promise((accept) => setTimeout(accept, 100))
        }
        sample.httpMs = performance.now() - started
        const navigation = performance.now()
        await page.goto(`${origin}/#/login`, { waitUntil: 'domcontentloaded', timeout: 120000 })
        await page
          .getByRole('heading', { name: 'Inicia sesión', exact: true })
          .waitFor({ timeout: 120000 })
        await page.locator('input[type=email]').waitFor()
        await page.evaluate(() =>
          Promise.race([
            document.fonts.ready,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Font readiness timeout')), 30000),
            ),
          ]),
        )
        sample.initialPageMs = performance.now() - navigation
        sample.spawnToPageMs = performance.now() - started
        const firstRoute = performance.now()
        await page.getByRole('link', { name: 'Crear cuenta', exact: true }).click()
        await page
          .getByRole('heading', { name: 'Crea tu cuenta', exact: true })
          .waitFor({ timeout: 120000 })
        sample.firstRouteMs = performance.now() - firstRoute
        if (authenticated) {
          await page
            .getByLabel('Correo electrónico', { exact: true })
            .fill(`startup-${randomUUID()}@example.test`)
          await page.getByLabel('Contraseña', { exact: true }).fill('Startup-local-123!')
          await page.getByLabel('Repite la contraseña', { exact: true }).fill('Startup-local-123!')
          const library = performance.now()
          await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click()
          await page
            .getByRole('heading', { name: 'Biblioteca', exact: true })
            .waitFor({ timeout: 120000 })
          sample.registrationToLibraryMs = performance.now() - library
          await page.getByRole('button', { name: 'Menú de usuario', exact: true }).click()
          const settings = performance.now()
          await page.locator('.q-menu a[href="#/settings"]').click()
          await page
            .getByRole('heading', { name: 'Ajustes', exact: true })
            .waitFor({ timeout: 120000 })
          sample.settingsMs = performance.now() - settings
          const transfer = performance.now()
          await page
            .locator('a[href="#/settings/import-export"]')
            .filter({ hasText: 'Importar o exportar datos' })
            .click()
          await page
            .getByRole('heading', { name: 'Importar / Exportar', exact: true })
            .waitFor({ timeout: 120000 })
          sample.importExportMs = performance.now() - transfer
        }
        await page.screenshot({ path: resolve(output, `${pair}-${cache}.png`) })
        if (sample.errors.length || sample.blocked.length)
          throw new Error('Browser errors or external requests')
        sample.status = 'passed'
      } catch (error) {
        sample.failure = error.message
      } finally {
        await context.close()
        if (child.pid && child.exitCode === null) {
          if (process.platform === 'win32')
            execFileSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
              stdio: 'ignore',
              windowsHide: true,
            })
          else {
            child.kill('SIGTERM')
            await new Promise((accept) => child.once('exit', accept))
          }
        }
        sample.slowRequests.sort((a, b) => b.ms - a.ms)
        sample.slowRequests = sample.slowRequests.slice(0, 15)
        results.push(sample)
        await writeFile(resolve(output, `${pair}-${cache}.log`), log)
        await writeFile(
          resolve(output, 'results.json'),
          JSON.stringify({ metadata, results }, null, 2) + '\n',
        )
        const summary = { ...sample }
        delete summary.slowRequests
        console.log(JSON.stringify(summary))
      }
    }
  }
} finally {
  await browser.close()
}
if (results.some((sample) => sample.status !== 'passed')) process.exitCode = 1

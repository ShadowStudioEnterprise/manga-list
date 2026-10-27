import { chromium, expect as baseExpect } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'

// Requires the isolated demo dev server, Auth/Firestore emulators and USB tunnels.
// Only newly created pages are inspected; never enumerate or inspect existing tabs.
if (process.env.MANGALIST_ANDROID_DEMO !== 'true') throw new Error('Explicit demo opt-in required')
const output = 'test-results/ml15-android'
await mkdir(output, { recursive: true })
const browser = await chromium.connectOverCDP('http://127.0.0.1:9227')
const context = browser.contexts()[0]
const pages = []
const checks = []
const external = []
let blockedBootstrap = 0
const password = 'Android-ml15-123!'
const expect = baseExpect.configure({ timeout: 30000 })
async function newPage() {
  const page = await context.newPage()
  pages.push(page)
  await page.bringToFront()
  page.setDefaultTimeout(30000)
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url())
    if (url.origin === 'https://apis.google.com' && url.pathname === '/js/api.js') {
      blockedBootstrap++
      return route.abort()
    }
    if (url.hostname === '127.0.0.1' && ['9100', '8188', '9199'].includes(url.port))
      return route.continue()
    external.push(url.origin)
    return route.abort()
  })
  return page
}
try {
  const page = await newPage()
  const email = `android-ml15-${randomUUID()}@example.test`
  await page.goto('http://127.0.0.1:9100/#/login')
  await page.evaluate(async () => {
    const { waitForAuthReady, logout } = await import('/src/services/auth-service.js')
    await waitForAuthReady()
    await logout()
  })
  await expect(page).toHaveURL(/#\/login/)
  await page.getByRole('link', { name: 'Crear cuenta', exact: true }).dispatchEvent('click')
  await expect(page.getByRole('heading', { name: 'Crea tu cuenta', exact: true })).toBeVisible()
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByLabel('Repite la contraseña', { exact: true }).fill(password)
  await page.getByLabel('Repite la contraseña', { exact: true }).press('Enter')
  await expect(page).toHaveURL(/#\/library/)
  checks.push('register-email')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Biblioteca', exact: true })).toBeVisible()
  checks.push('reload-persistence')
  const other = await newPage()
  await other.goto('http://127.0.0.1:9100/#/library')
  await expect(other.getByRole('heading', { name: 'Biblioteca', exact: true })).toBeVisible()
  checks.push('new-tab-persistence')
  // Mobile drawer is collapsed: invoke the actual application logout service.
  await other.evaluate(async () => {
    const { logout } = await import('/src/services/auth-service.js')
    await logout()
  })
  await expect(other).toHaveURL(/#\/login/)
  await page.bringToFront()
  await expect(page).toHaveURL(/#\/login/)
  checks.push('logout-propagation')
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByLabel('Contraseña', { exact: true }).press('Enter')
  await expect(page).toHaveURL(/#\/library/)
  checks.push('email-login')
  await page.screenshot({ path: `${output}/library.png` })
  await page.evaluate(async () => {
    const { logout } = await import('/src/services/auth-service.js')
    await logout()
  })
  await expect(page).toHaveURL(/#\/login/)
  checks.push('final-logout')
  expect(external).toEqual([])
  await writeFile(
    `${output}/summary.json`,
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        status: 'PASS',
        browser: browser.version(),
        backend: 'demo-emulators-only',
        blockedBootstrap,
        checks,
        external,
      },
      null,
      2,
    ),
  )
} catch (error) {
  for (const [index, page] of pages.entries()) {
    await page.screenshot({ path: `${output}/failure-${index}.png` }).catch(() => {})
  }
  await writeFile(
    `${output}/summary.json`,
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        status: 'FAIL',
        browser: browser.version(),
        backend: 'demo-emulators-only',
        checks,
        external,
        error: error.message,
      },
      null,
      2,
    ),
  )
  throw error
} finally {
  for (const page of pages) {
    await page
      .evaluate(async () => {
        const { logout } = await import('/src/services/auth-service.js')
        await logout()
      })
      .catch(() => {})
    await page.close().catch(() => {})
  }
  await browser.close()
}

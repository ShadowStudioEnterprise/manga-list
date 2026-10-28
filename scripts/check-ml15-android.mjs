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
  const uid = await page.evaluate(
    async () => (await import('/src/services/auth-service.js')).getCurrentAuthUser().uid,
  )
  await page.goto('http://127.0.0.1:9100/#/add')
  await page.getByLabel('Nombre *', { exact: true }).fill('Android credential library')
  await page.getByLabel('Capítulo *', { exact: true }).fill('4')
  await page.getByLabel('Capítulo *', { exact: true }).press('Enter')
  await expect(page).toHaveURL(/#\/manga\//)
  checks.push('synthetic-work-created')
  await page.goto('http://127.0.0.1:9100/#/settings')
  await page
    .getByRole('button', { name: 'Cambiar contraseña ahora', exact: true })
    .dispatchEvent('click')
  const dialog = page.getByRole('dialog')
  const newPassword = 'Android-ml15-updated-456!'
  await dialog.getByLabel('Contraseña actual', { exact: true }).fill('Wrong-synthetic-123!')
  await dialog.getByLabel('Nueva contraseña', { exact: true }).fill(newPassword)
  await dialog.getByLabel('Confirmar nueva contraseña', { exact: true }).fill(newPassword)
  await dialog.getByLabel('Confirmar nueva contraseña', { exact: true }).press('Enter')
  await expect(dialog.locator('.q-banner[role="alert"]')).toContainText(/contraseña|correctos/)
  checks.push('wrong-current-password-rejected')
  await dialog.getByLabel('Contraseña actual', { exact: true }).fill(password)
  await dialog.getByLabel('Nueva contraseña', { exact: true }).fill(newPassword)
  await dialog.getByLabel('Confirmar nueva contraseña', { exact: true }).fill(newPassword)
  await dialog.getByLabel('Confirmar nueva contraseña', { exact: true }).press('Enter')
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('status')).toContainText('Acceso actualizado')
  checks.push('authenticated-password-change')
  await page.evaluate(async () => (await import('/src/services/auth-service.js')).logout())
  await expect(page).toHaveURL(/#\/login/)
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByLabel('Contraseña', { exact: true }).press('Enter')
  await expect(
    page.locator('.q-notification__message').filter({ hasText: /contraseña/ }),
  ).toBeVisible()
  await expect(page).toHaveURL(/#\/login/)
  checks.push('old-password-rejected')
  await page.getByLabel('Contraseña', { exact: true }).fill(newPassword)
  await page.getByLabel('Contraseña', { exact: true }).press('Enter')
  await expect(
    page.getByRole('heading', { name: 'Android credential library', exact: true }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      async () => (await import('/src/services/auth-service.js')).getCurrentAuthUser().uid,
    ),
  ).toBe(uid)
  checks.push('new-password-same-uid-and-library')
  const newEmail = `android-updated-${randomUUID()}@example.test`
  await page.goto('http://127.0.0.1:9100/#/settings')
  await page.getByRole('button', { name: 'Cambiar correo', exact: true }).dispatchEvent('click')
  await dialog.getByLabel('Contraseña actual', { exact: true }).fill(newPassword)
  await dialog.getByLabel('Nuevo correo electrónico', { exact: true }).fill(newEmail)
  await dialog.getByLabel('Nuevo correo electrónico', { exact: true }).press('Enter')
  await expect(dialog).toHaveCount(0)
  await expect(page.getByText(email, { exact: true }).first()).toBeVisible()
  checks.push('new-email-request-preserves-current-email')
  const codesResponse = await fetch(
    'http://127.0.0.1:9199/emulator/v1/projects/demo-mangalist/oobCodes',
    { redirect: 'error' },
  )
  expect(codesResponse.ok).toBe(true)
  const { oobCodes } = await codesResponse.json()
  const code = oobCodes.find(
    (item) => item.requestType === 'VERIFY_AND_CHANGE_EMAIL' && item.newEmail === newEmail,
  )
  expect(code).toBeTruthy()
  const applied = await fetch(
    'http://127.0.0.1:9199/identitytoolkit.googleapis.com/v1/accounts:update?key=demo-mangalist-key',
    {
      method: 'POST',
      redirect: 'error',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oobCode: code.oobCode }),
    },
  )
  expect(applied.ok).toBe(true)
  await page
    .getByRole('button', { name: 'Actualizar datos de acceso', exact: true })
    .dispatchEvent('click')
  await expect(page.getByText(newEmail, { exact: true }).first()).toBeVisible()
  checks.push('verified-new-email-refreshed')
  await page.evaluate(async () => (await import('/src/services/auth-service.js')).logout())
  await expect(page).toHaveURL(/#\/login/)
  await page.getByLabel('Correo electrónico', { exact: true }).fill(newEmail)
  await page.getByLabel('Contraseña', { exact: true }).fill(newPassword)
  await page.getByLabel('Contraseña', { exact: true }).press('Enter')
  await expect(
    page.getByRole('heading', { name: 'Android credential library', exact: true }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      async () => (await import('/src/services/auth-service.js')).getCurrentAuthUser().uid,
    ),
  ).toBe(uid)
  checks.push('new-email-and-password-same-uid-and-library')
  await expect(
    page.locator('.q-notification__message').filter({ hasText: /contraseña/ }),
  ).toHaveCount(0)
  await page.screenshot({ path: `${output}/library.png`, fullPage: true })
  await page.evaluate(async () => {
    const { logout } = await import('/src/services/auth-service.js')
    await logout()
  })
  await expect(page).toHaveURL(/#\/login/)
  checks.push('persistent-session-logout')
  await page.addInitScript(() => {
    window.ml15DeniedAuthStorage = 0
    const set = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === '__sak' || String(key).startsWith('firebase:')) {
        window.ml15DeniedAuthStorage++
        throw new DOMException('Synthetic Auth-only storage denial', 'QuotaExceededError')
      }
      return set.call(this, key, value)
    }
  })
  await page.goto('http://127.0.0.1:9100/#/register')
  await page.reload()
  await page
    .getByLabel('Correo electrónico', { exact: true })
    .fill(`android-memory-${randomUUID()}@example.test`)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByLabel('Repite la contraseña', { exact: true }).fill(password)
  await page.getByLabel('Repite la contraseña', { exact: true }).press('Enter')
  await expect(page).toHaveURL(/#\/library/)
  expect(await page.evaluate(() => window.ml15DeniedAuthStorage)).toBeGreaterThan(0)
  checks.push('auth-only-storage-denial-memory-login')
  const independent = await newPage()
  await independent.goto('http://127.0.0.1:9100/#/library')
  await expect(independent).toHaveURL(/#\/login/)
  await page.bringToFront()
  await expect(page).toHaveURL(/#\/library/)
  checks.push('memory-session-not-shared-with-new-tab')
  await page.reload()
  await expect(page).toHaveURL(/#\/login/)
  expect(
    await page.evaluate(async () =>
      (await import('/src/services/auth-service.js')).getCurrentAuthUser(),
    ),
  ).toBeNull()
  checks.push('memory-reload-clears-final-session')
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

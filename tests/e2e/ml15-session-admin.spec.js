import { randomUUID } from 'node:crypto'
import { test, expect } from '@playwright/test'

const password = 'Synthetic-admin-cases-123!'
const authApi = 'http://127.0.0.1:9199/identitytoolkit.googleapis.com/v1/'
let external

test.beforeEach(async ({ context }) => {
  external = []
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url())
    if (url.hostname === '127.0.0.1' && ['9100', '8188', '9199'].includes(url.port))
      return route.continue()
    external.push(url.origin)
    return route.abort()
  })
})
test.afterEach(() => expect(external).toEqual([]))

async function register(page) {
  const email = `ml15-admin-${randomUUID()}@example.test`
  await page.goto('/#/register')
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByLabel('Repite la contraseña', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click()
  await expect(page).toHaveURL(/#\/library/)
  return email
}
async function identity(page) {
  return page.evaluate(async () => {
    const user = (await import('/src/services/auth-service.js')).getCurrentAuthUser()
    return user ? { uid: user.uid, email: user.email } : null
  })
}
async function login(page, email) {
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
}
async function changeEmail(page, email) {
  await page.goto('/#/settings')
  await page.getByRole('button', { name: 'Cambiar correo', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Contraseña actual', { exact: true }).fill(password)
  await dialog.getByLabel('Nuevo correo electrónico', { exact: true }).fill(email)
  await dialog.getByRole('button', { name: 'Confirmar cambio' }).click()
  return dialog
}

test('ML-15: actual emulator account disable rejects refresh and signs out both tabs; reenable preserves UID and work', async ({
  page,
  context,
  request,
}) => {
  const email = await register(page)
  const before = await identity(page)
  await page.goto('/#/add')
  await page.getByLabel('Nombre *', { exact: true }).fill('Disabled account retains work')
  await page.getByLabel('Capítulo *', { exact: true }).fill('8')
  await page.getByRole('button', { name: 'Guardar obra', exact: true }).click()
  await expect(page).toHaveURL(/#\/manga\//)
  const second = await context.newPage()
  await second.goto('/#/library')
  await expect(
    second.getByRole('heading', { name: 'Disabled account retains work', exact: true }),
  ).toBeVisible()
  const disable = await request.post(authApi + 'accounts:update?key=demo-mangalist-key', {
    headers: { Authorization: 'Bearer owner' },
    data: { localId: before.uid, disableUser: true },
    maxRedirects: 0,
  })
  expect(disable.ok()).toBeTruthy()
  try {
    const code = await page.evaluate(async () => {
      try {
        await (await import('/src/services/auth-service.js')).getCurrentAuthUser().getIdToken(true)
        return 'unexpected-success'
      } catch (error) {
        return error.code
      }
    })
    expect(code).toBe('auth/user-disabled')
    await expect(page).toHaveURL(/#\/login/)
    await expect(second).toHaveURL(/#\/login/)
    expect(await identity(page)).toBeNull()
    expect(await identity(second)).toBeNull()
  } finally {
    const enable = await request.post(authApi + 'accounts:update?key=demo-mangalist-key', {
      headers: { Authorization: 'Bearer owner' },
      data: { localId: before.uid, disableUser: false },
      maxRedirects: 0,
    })
    expect(enable.ok()).toBeTruthy()
  }
  await login(page, email)
  await expect(page).toHaveURL(/#\/library/)
  expect((await identity(page)).uid).toBe(before.uid)
  await expect(
    page.getByRole('heading', { name: 'Disabled account retains work', exact: true }),
  ).toBeVisible()
})

test('ML-15: changing email to an existing emulator account fails without replacing either identity', async ({
  page,
  request,
}) => {
  const email = await register(page)
  const before = await identity(page)
  const occupied = `occupied-${randomUUID()}@example.test`
  const second = await request.post(authApi + 'accounts:signUp?key=demo-mangalist-key', {
    data: { email: occupied, password, returnSecureToken: true },
    maxRedirects: 0,
  })
  expect(second.ok()).toBeTruthy()
  const otherUid = (await second.json()).localId
  expect(otherUid).not.toBe(before.uid)
  const dialog = await changeEmail(page, occupied)
  await expect(dialog.locator('.q-banner[role="alert"]')).toContainText('Ya existe una cuenta')
  expect(await identity(page)).toEqual(before)
  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await page.evaluate(async () => (await import('/src/services/auth-service.js')).logout())
  await expect(page).toHaveURL(/#\/login/)
  await login(page, occupied)
  await expect(page).toHaveURL(/#\/library/)
  expect((await identity(page)).uid).toBe(otherUid)
  expect((await identity(page)).email).not.toBe(email)
})

test('ML-15: verified email change rejects invalid and reused local codes and the old email login', async ({
  page,
  request,
}) => {
  const oldEmail = await register(page)
  const before = await identity(page)
  const email = `verified-followup-${randomUUID()}@example.test`
  await expect(await changeEmail(page, email)).toHaveCount(0)
  const codes = await request.get(
    'http://127.0.0.1:9199/emulator/v1/projects/demo-mangalist/oobCodes',
    { maxRedirects: 0 },
  )
  expect(codes.ok()).toBeTruthy()
  const code = (await codes.json()).oobCodes.find(
    (item) => item.requestType === 'VERIFY_AND_CHANGE_EMAIL' && item.newEmail === email,
  )
  expect(code).toBeTruthy()
  const apply = (oobCode) =>
    request.post(authApi + 'accounts:update?key=demo-mangalist-key', {
      data: { oobCode },
      maxRedirects: 0,
    })
  const invalid = await apply('invalid-' + randomUUID())
  expect(invalid.status()).toBe(400)
  expect((await invalid.json()).error.message).toBe('INVALID_OOB_CODE')
  expect((await apply(code.oobCode)).status()).toBe(200)
  const reused = await apply(code.oobCode)
  expect(reused.status()).toBe(400)
  expect((await reused.json()).error.message).toBe('INVALID_OOB_CODE')
  await page.evaluate(async () => (await import('/src/services/auth-service.js')).logout())
  await expect(page).toHaveURL(/#\/login/)
  await login(page, oldEmail)
  await expect(
    page.locator('.q-notification__message').filter({ hasText: /contraseña|correctos/ }),
  ).toBeVisible()
  await expect(page).toHaveURL(/#\/login/)
  await login(page, email)
  await expect(page).toHaveURL(/#\/library/)
  expect((await identity(page)).uid).toBe(before.uid)
})

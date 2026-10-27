import { randomUUID } from 'node:crypto'
import { test, expect } from '@playwright/test'

const password = 'Synthetic-ml15-123!'
let external

test.beforeEach(async ({ context }) => {
  external = []
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url())
    if (url.hostname === '127.0.0.1' && ['9100', '8188', '9199'].includes(url.port)) {
      return route.continue()
    }
    // Firestore's optional connectivity probe is blocked, never forwarded.
    if (url.origin === 'https://www.google.com' && url.pathname === '/images/cleardot.gif') {
      return route.abort()
    }
    external.push(url.origin)
    return route.abort()
  })
})

test.afterEach(async ({ browser }, info) => {
  await info.attach('environment', {
    body: JSON.stringify({ backend: 'demo-emulators-only', browser: browser.version(), external }),
    contentType: 'application/json',
  })
  expect(external).toEqual([])
})

async function register(page) {
  const email = `ml15-${randomUUID()}@example.test`
  await page.goto('/#/register')
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByLabel('Repite la contraseña', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click()
  await expect(page).toHaveURL(/#\/library/)
  return email
}

async function login(page, email, secret = password) {
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(secret)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
}

async function currentUid(page) {
  return page.evaluate(async () => {
    const { getCurrentAuthUser } = await import('/src/services/auth-service.js')
    return getCurrentAuthUser()?.uid ?? null
  })
}

test('ML-15: local persistence, new tab and logout propagation protect every private route', async ({
  page,
  context,
}) => {
  const email = await register(page)
  const uid = await currentUid(page)
  expect(uid).toBeTruthy()
  await page.reload()
  await expect(page).toHaveURL(/#\/library/)
  await expect.poll(() => currentUid(page)).toBe(uid)
  const other = await context.newPage()
  await other.goto('/#/settings')
  await expect(other.getByRole('button', { name: 'Cerrar sesión', exact: true })).toBeVisible()
  expect(await currentUid(other)).toBe(uid)
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
  await expect(page).toHaveURL(/#\/login/)
  await expect(other).toHaveURL(/#\/login/)
  for (const path of ['/library', '/add', '/settings', '/settings/import-export']) {
    await other.goto(`/#${path}`)
    await expect(other).toHaveURL(/#\/login/)
    expect(await currentUid(other)).toBeNull()
  }
  await login(page, email)
  await expect(page).toHaveURL(/#\/library/)
  await expect.poll(() => currentUid(other)).toBe(uid)
})

test('ML-15: same-origin account replacement propagates UID and clears another account library', async ({
  page,
  context,
}) => {
  await register(page)
  const firstUid = await currentUid(page)
  await page.goto('/#/add')
  await page.getByLabel('Nombre *', { exact: true }).fill('ML15 private A')
  await page.getByLabel('Capítulo *', { exact: true }).fill('7')
  await page.getByRole('button', { name: 'Guardar obra', exact: true }).click()
  await expect(page).toHaveURL(/#\/manga\//)
  const other = await context.newPage()
  await other.goto('/#/library')
  await expect(other.getByRole('heading', { name: 'ML15 private A', exact: true })).toBeVisible()
  // Exercise an account replacement without a logout interval in the second tab.
  await page.evaluate(async (email) => {
    const { registerWithEmail } = await import('/src/services/auth-service.js')
    await registerWithEmail(email, 'Synthetic-ml15-123!')
  }, `ml15-b-${randomUUID()}@example.test`)
  const secondUid = await currentUid(page)
  expect(secondUid).not.toBe(firstUid)
  await expect.poll(() => currentUid(other)).toBe(secondUid)
  await expect(other.getByRole('heading', { name: 'ML15 private A', exact: true })).toHaveCount(0)
  await expect(other.getByRole('heading', { name: 'Tu biblioteca está vacía' })).toBeVisible()
})

test('ML-15: expired local token refreshes using emulator and rejected refresh clears session', async ({
  page,
  context,
}) => {
  await register(page)
  const uid = await currentUid(page)
  const refresh = page.waitForResponse((r) => r.url().includes('/securetoken.googleapis.com/'))
  const refreshedUid = await page.evaluate(async () => {
    const { getCurrentAuthUser } = await import('/src/services/auth-service.js')
    const user = getCurrentAuthUser()
    // Deliberate SDK clock-state injection; this does not wait one real hour.
    user.stsTokenManager.expirationTime = 0
    await user.getIdToken()
    return user.uid
  })
  expect((await refresh).status()).toBe(200)
  expect(refreshedUid).toBe(uid)
  await context.route('**/securetoken.googleapis.com/**', (route) =>
    route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ error: { code: 400, message: 'TOKEN_EXPIRED' } }),
    }),
  )
  const code = await page.evaluate(async () => {
    const { getCurrentAuthUser } = await import('/src/services/auth-service.js')
    try {
      await getCurrentAuthUser().getIdToken(true)
      return 'unexpected-success'
    } catch (error) {
      return error.code
    }
  })
  expect(code).toBe('auth/user-token-expired')
  await expect(page).toHaveURL(/#\/login/)
  expect(await currentUid(page)).toBeNull()
})

test('ML-15: rejected login and controlled network failure allow a successful retry', async ({
  page,
  context,
}) => {
  const email = await register(page)
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
  await expect(page).toHaveURL(/#\/login/)
  await login(page, email, 'Incorrect-123!')
  await expect(
    page.locator('.q-notification__message').filter({ hasText: /contraseña/ }),
  ).toBeVisible()
  expect(await currentUid(page)).toBeNull()
  const pattern = '**/accounts:signInWithPassword*'
  await context.route(pattern, (route) => route.abort('internetdisconnected'))
  await login(page, email)
  await expect(
    page.getByText('No se ha podido conectar. Comprueba tu conexión e inténtalo de nuevo.', {
      exact: true,
    }),
  ).toBeVisible()
  await context.unroute(pattern)
  await login(page, email)
  await expect(page).toHaveURL(/#\/library/)
})

test('ML-15: blocked Google bootstrap reports failure and allows email login', async ({
  page,
  context,
}) => {
  const email = await register(page)
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
  await expect(page).toHaveURL(/#\/login/)
  let blockedBootstrap = 0
  await context.route('https://apis.google.com/js/api.js*', (route) => {
    blockedBootstrap++
    return route.abort()
  })
  await page.getByRole('button', { name: 'Google', exact: true }).click()
  await expect(
    page.getByText('No se ha podido iniciar sesión con Google.', { exact: true }),
  ).toBeVisible()
  expect(blockedBootstrap).toBeGreaterThan(0)
  await expect(page.getByRole('button', { name: 'Google', exact: true })).toBeEnabled()
  expect(await currentUid(page)).toBeNull()
  await login(page, email)
  await expect(page).toHaveURL(/#\/library/)
})

test('ML-15: independent Auth clients and actual emulator tokens cannot read or delete another UID', async ({
  page,
  request,
}) => {
  await register(page)
  const uid = await currentUid(page)
  await page.goto('/#/add')
  await page.getByLabel('Nombre *', { exact: true }).fill('ML15 UID boundary')
  await page.getByLabel('Capítulo *', { exact: true }).fill('1')
  await page.getByRole('button', { name: 'Guardar obra', exact: true }).click()
  await expect(page).toHaveURL(/#\/manga\//)
  const id = new URL(page.url()).hash.split('/').at(-1)
  const ownToken = await page.evaluate(async () => {
    const { getCurrentAuthUser } = await import('/src/services/auth-service.js')
    return getCurrentAuthUser().getIdToken()
  })
  const signup = await request.post(
    'http://127.0.0.1:9199/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-mangalist-key',
    {
      data: { email: `separate-${randomUUID()}@example.test`, password, returnSecureToken: true },
      maxRedirects: 0,
    },
  )
  expect(signup.status()).toBe(200)
  const second = await signup.json()
  expect(second.localId).not.toBe(uid)
  expect(await currentUid(page)).toBe(uid)
  const target = `http://127.0.0.1:8188/v1/projects/demo-mangalist/databases/(default)/documents/users/${uid}/mangas/${id}`
  const own = await request.get(target, {
    headers: { Authorization: `Bearer ${ownToken}` },
    maxRedirects: 0,
  })
  expect(own.status()).toBe(200)
  for (const headers of [{}, { Authorization: `Bearer ${second.idToken}` }]) {
    expect((await request.get(target, { headers, maxRedirects: 0 })).status()).toBe(403)
    expect((await request.delete(target, { headers, maxRedirects: 0 })).status()).toBe(403)
  }
  expect(
    (
      await request.get(target, {
        headers: { Authorization: `Bearer ${ownToken}` },
        maxRedirects: 0,
      })
    ).status(),
  ).toBe(200)
})

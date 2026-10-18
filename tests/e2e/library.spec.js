import { randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

let runtimeErrors
let externalRequests
let routingWarnings
const password = 'Local-test-123!'

test.beforeEach(async ({ context, page }) => {
  runtimeErrors = []
  externalRequests = []
  routingWarnings = []
  // ResizeObserver reports an ErrorEvent without error, which pageerror can miss.
  await context.exposeBinding('__mangalistReportWindowError', (_source, message) => {
    runtimeErrors.push(message)
  })
  await context.addInitScript(() => {
    window.addEventListener('error', (event) => {
      if (event.message?.includes('ResizeObserver')) {
        void window.__mangalistReportWindowError(event.message)
      }
    })
  })
  context.on('console', (message) => {
    if (message.text().includes('VUE_ROUTER_R0121')) routingWarnings.push(message.text())
  })
  page.on('pageerror', (error) => runtimeErrors.push(error.message))
  // Fail closed if a misconfiguration tries to reach a live backend.
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url())
    if (url.hostname === '127.0.0.1' && ['9100', '8188', '9199'].includes(url.port)) {
      return route.continue()
    }
    externalRequests.push(url.origin)
    return route.abort()
  })
})

test.afterEach(() => {
  expect(runtimeErrors).toEqual([])
  expect(externalRequests).toEqual([])
  expect(routingWarnings).toEqual([])
})

async function register(page, { currentPage = false } = {}) {
  const email = `reader-${randomUUID()}@example.test`
  if (!currentPage) await page.goto('/#/register')
  await expect(page.getByRole('heading', { name: 'Crea tu cuenta', exact: true })).toBeVisible()
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByLabel('Repite la contraseña', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Menú de usuario' })).toBeVisible()
  return email
}

async function addManga(page, name = 'Nano Machine', chapter = '276') {
  await page.goto('/#/add')
  await page.getByLabel('Nombre *', { exact: true }).fill(name)
  await page.getByLabel('Capítulo *', { exact: true }).fill(chapter)
  await page.getByRole('button', { name: 'Guardar obra', exact: true }).click()
  await expect(page).toHaveURL(/#\/manga\//)
  await page.getByRole('link', { name: 'Volver a la biblioteca', exact: true }).click()
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
}

async function editFirstManga(page) {
  await page.getByRole('button', { name: 'Más acciones', exact: true }).first().click()
  await page.getByRole('link', { name: 'Editar', exact: true }).click()
  await expect(page.getByLabel('Nombre *', { exact: true })).toBeVisible()
}

async function auditAccessibility(page, testInfo, name) {
  // Audit a stable screen, after transient feedback finishes covering controls.
  await expect(page.locator('.q-notification')).toHaveCount(0)
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze()
  const path = testInfo.outputPath(`accessibility-${name}.json`)
  await writeFile(path, JSON.stringify(result, null, 2))
  await testInfo.attach(`accessibility-${name}`, { path, contentType: 'application/json' })
  expect(
    result.violations.map(({ id, nodes }) => ({
      id,
      nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
    })),
  ).toEqual([])
}

async function expectNoHorizontalOverflow(page) {
  expect(
    await page.evaluate(() => ({
      width: window.innerWidth,
      content: document.documentElement.scrollWidth,
      overflowing: [...document.querySelectorAll('main *')]
        .filter((element) => {
          const box = element.getBoundingClientRect()
          return (
            box.width > 0 &&
            getComputedStyle(element).visibility !== 'hidden' &&
            box.right > innerWidth + 1
          )
        })
        .slice(0, 8)
        .map((element) => ({ tag: element.tagName, class: element.className })),
    })),
  ).toMatchObject({ width: 320, content: 320, overflowing: [] })
}

test('320px main screens retain usable controls and pass automated accessibility checks', async ({
  page,
  context,
}, testInfo) => {
  test.setTimeout(120000)
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto('/#/login')
  await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await auditAccessibility(page, testInfo, 'login-320')
  await register(page)
  await expect(page.getByRole('heading', { name: 'Tu biblioteca está vacía' })).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await auditAccessibility(page, testInfo, 'empty-library-320')
  await addManga(page, 'Una obra con un nombre largo para comprobar pantallas pequeñas', '123.5')
  await expectNoHorizontalOverflow(page)
  await auditAccessibility(page, testInfo, 'library-320')
  await page.goto('/#/add')
  await expect(page.getByLabel('Nombre *', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Añadir fuente' }).click()
  await expectNoHorizontalOverflow(page)
  await auditAccessibility(page, testInfo, 'form-with-source-320')
  await page.goto('/#/settings/import-export')
  await expect(
    page.getByRole('heading', { name: 'Importar / Exportar', exact: true }),
  ).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await auditAccessibility(page, testInfo, 'import-export-320')
  await page.screenshot({
    path: testInfo.outputPath('import-export-320.png'),
    fullPage: true,
    animations: 'disabled',
  })
  for (const width of [768, 1280]) {
    // Start each viewport before mounting Quasar's responsive layout.
    const viewportPage = await context.newPage()
    viewportPage.on('pageerror', (error) => runtimeErrors.push(error.message))
    try {
      await viewportPage.setViewportSize({ width, height: 900 })
      await viewportPage.goto('/#/library')
      await expect(
        viewportPage.getByRole('heading', { name: 'Biblioteca', exact: true }),
      ).toBeVisible()
      await expect
        .poll(() =>
          viewportPage.evaluate(() => ({
            width: innerWidth,
            content: document.documentElement.scrollWidth,
          })),
        )
        .toEqual({ width, content: width })
      await auditAccessibility(viewportPage, testInfo, `library-${width}`)
    } finally {
      await viewportPage.close()
    }
  }
})

async function tabTo(page, target, key = 'Tab') {
  const traversal = []
  for (let attempt = 0; attempt < 60; attempt++) {
    const focus = await target.evaluate((element) => ({
      reached: element === document.activeElement,
      tag: document.activeElement?.tagName,
      label: document.activeElement?.getAttribute('aria-label'),
      text: document.activeElement?.textContent?.trim().slice(0, 100),
      documentFocused: document.hasFocus(),
    }))
    if (focus.reached) return
    traversal.push(focus)
    await page.keyboard.press(key)
  }
  await test.info().attach('keyboard-traversal', {
    body: JSON.stringify(traversal, null, 2),
    contentType: 'application/json',
  })
  await expect(target).toBeFocused()
}

test(
  'settings copy the running version without account data and handle unavailable clipboard',
  { tag: '@chromium-only' },
  async ({ page, context }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 740 })
    const email = await register(page)
    await page.goto('/#/settings')
    await expect(
      page.getByRole('heading', { name: 'Versión de la aplicación', exact: true }),
    ).toBeVisible()
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: 'http://127.0.0.1:9100',
    })
    await page.getByRole('button', { name: 'Copiar versión', exact: true }).click()
    await expect(page.getByText('Versión copiada.', { exact: true })).toBeVisible()
    const text = await page.evaluate(() => navigator.clipboard.readText())
    const payload = JSON.parse(text)
    expect(Object.keys(payload).sort()).toEqual(['application', 'builtAt', 'dirty', 'revision'])
    expect(payload.application).toBe('MangaList')
    expect(payload.revision).toBe(
      execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    )
    expect(typeof payload.dirty).toBe('boolean')
    expect(new Date(payload.builtAt).toISOString()).toBe(payload.builtAt)
    expect(text).not.toContain(email)
    await expectNoHorizontalOverflow(page)
    await auditAccessibility(page, testInfo, 'settings-version-320')
    await page.evaluate(() =>
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async () => {
            throw new Error('Clipboard unavailable')
          },
        },
      }),
    )
    await page.getByRole('button', { name: 'Copiar versión', exact: true }).click()
    await expect(
      page.getByText('No se ha podido copiar la versión.', { exact: true }),
    ).toBeVisible()
  },
)

test('keyboard reaches forms, mobile navigation and chapter dialog with visible focus and Escape recovery', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto('/#/login')
  await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible()
  const skip = page.getByRole('link', { name: 'Saltar al contenido' })
  await page.keyboard.press('Tab')
  await expect(skip).toBeFocused()
  expect((await skip.boundingBox()).y).toBeGreaterThanOrEqual(0)
  await page.keyboard.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Correo electrónico', { exact: true })).toBeFocused()
  await tabTo(page, page.getByRole('link', { name: 'Crear cuenta', exact: true }))
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Crea tu cuenta', exact: true })).toBeVisible()
  await tabTo(page, page.getByLabel('Correo electrónico', { exact: true }))
  await page.keyboard.type(`keyboard-${randomUUID()}@example.test`)
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Contraseña', { exact: true })).toBeFocused()
  await page.keyboard.type(password)
  await page.keyboard.press('Tab')
  const reveal = page.getByRole('button', { name: 'Mostrar contraseña' })
  await expect(reveal).toBeFocused()
  expect(await reveal.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid')
  await page.keyboard.press('Space')
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute('type', 'text')
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Repite la contraseña', { exact: true })).toBeFocused()
  await page.keyboard.type(password)
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Crear cuenta', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Tu biblioteca está vacía' })).toBeVisible()
  // Seed one work; the interaction under test below uses the keyboard only.
  await addManga(page, 'Prueba de teclado', '12')
  await expect.poll(() => page.evaluate(() => history.state?.current)).toBe('/library')
  const chapter = page.getByRole('button', { name: 'Editar capítulo actual: 12', exact: true })
  await expect(chapter).toBeVisible()
  await tabTo(page, chapter)
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Actualizar capítulo' })).toBeVisible()
  await expect(page.getByRole('dialog').getByLabel('Capítulo *', { exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(chapter).toBeFocused()
  const navigation = page.getByRole('button', { name: 'Abrir navegación' })
  // Move backwards to the earlier header control rather than relying on the
  // browser chrome wrapping Tab from the last link back into the document.
  await tabTo(page, navigation, 'Shift+Tab')
  await page.keyboard.press('Enter')
  const nav = page.getByRole('navigation', { name: 'Navegación principal' })
  await expect(nav).toBeVisible()
  await tabTo(page, nav.getByRole('link', { name: 'Importar / Exportar', exact: true }))
  await page.keyboard.press('Enter')
  await expect(
    page.getByRole('heading', { name: 'Importar / Exportar', exact: true }),
  ).toBeVisible()
})

test('live resizing preserves library controls and unsaved form fields across responsive breakpoints', async ({
  page,
}, testInfo) => {
  test.setTimeout(120000)
  await register(page)
  await addManga(page, 'Obra durante el cambio de ancho', '12')
  const samples = []
  const widths = [1280, 1024, 1023, 768, 600, 599, 320, 599, 600, 1023, 1024, 1280, 320]
  async function resizeAndCheck(screen, width) {
    await page.setViewportSize({ width, height: 900 })
    await expect
      .poll(() =>
        page.evaluate(() => ({
          width: innerWidth,
          content: document.documentElement.scrollWidth,
        })),
      )
      .toEqual({ width, content: width })
    samples.push({
      screen,
      width,
      ...(await page.evaluate(() => ({
        content: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
      }))),
    })
    const menu = page.getByRole('button', { name: 'Abrir navegación' })
    if (width < 1024) await expect(menu).toBeVisible()
    else await expect(menu).toBeHidden()
    await expect(page.getByRole('link', { name: 'Añadir', exact: true })).toBeVisible()
  }
  try {
    for (const width of widths) {
      await resizeAndCheck('library', width)
      await expect(
        page.getByRole('heading', { name: 'Obra durante el cambio de ancho', exact: true }),
      ).toBeVisible()
      await expect(page.getByRole('button', { name: 'Limpiar filtros', exact: true })).toBeVisible()
    }
    await page.getByRole('link', { name: 'Añadir', exact: true }).click()
    await page
      .getByLabel('Nombre *', { exact: true })
      .fill('Formulario conservado al redimensionar')
    await page.getByLabel('Capítulo *', { exact: true }).fill('42')
    await page.getByLabel('Notas', { exact: true }).fill('Cambios todavía sin guardar')
    for (const width of widths) {
      await resizeAndCheck('form', width)
      await expect(page.getByLabel('Nombre *', { exact: true })).toHaveValue(
        'Formulario conservado al redimensionar',
      )
      await expect(page.getByLabel('Capítulo *', { exact: true })).toHaveValue('42')
      await expect(page.getByLabel('Notas', { exact: true })).toHaveValue(
        'Cambios todavía sin guardar',
      )
      await expect(page.getByRole('button', { name: 'Guardar obra', exact: true })).toBeEnabled()
    }
    await page.getByRole('button', { name: 'Guardar obra', exact: true }).click()
    await expect(page).toHaveURL(/#\/manga\//)
    await expect(
      page.getByRole('heading', { name: 'Formulario conservado al redimensionar', exact: true }),
    ).toBeVisible()
    await expect(page.getByLabel('Notas', { exact: true })).toHaveValue(
      'Cambios todavía sin guardar',
    )
  } finally {
    const path = testInfo.outputPath('live-resize-measurements.json')
    await writeFile(path, JSON.stringify(samples, null, 2))
    await testInfo.attach('live-resize-measurements', {
      path,
      contentType: 'application/json',
    })
  }
})

test('router history survives dialog cancellation and browser back and forward without saving edits', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await register(page)
  await addManga(page, 'Historial conservado', '12')
  const libraryState = await page.evaluate(() => ({
    current: history.state?.current,
    position: history.state?.position,
  }))
  expect(libraryState.current).toBe('/library')
  expect(Number.isInteger(libraryState.position)).toBe(true)

  const chapter = page.getByRole('button', { name: 'Editar capítulo actual: 12', exact: true })
  await chapter.click()
  const dialog = page.getByRole('dialog', { name: 'Actualizar capítulo' })
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('Capítulo *', { exact: true }).fill('999')
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(chapter).toBeFocused()
  expect(
    await page.evaluate(() => ({
      current: history.state?.current,
      position: history.state?.position,
    })),
  ).toEqual(libraryState)

  await page.getByRole('link', { name: 'Añadir', exact: true }).click()
  await expect(page.getByLabel('Nombre *', { exact: true })).toBeVisible()
  await expect.poll(() => page.evaluate(() => history.state?.current)).toBe('/add')
  expect(await page.evaluate(() => history.state.position)).toBe(libraryState.position + 1)

  await page.goBack()
  await expect(page).toHaveURL(/#\/library$/)
  await expect(chapter).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Editar capítulo actual: 999', exact: true }),
  ).toHaveCount(0)
  await expect.poll(() => page.evaluate(() => history.state?.position)).toBe(libraryState.position)
  await page.goForward()
  await expect(page).toHaveURL(/#\/add$/)
  await expect(page.getByLabel('Nombre *', { exact: true })).toBeVisible()
  await expect.poll(() => page.evaluate(() => history.state?.current)).toBe('/add')
  await page.goBack()
  await expect(chapter).toBeVisible()
  await page.reload()
  await expect(chapter).toBeVisible()
  await expect.poll(() => page.evaluate(() => history.state?.current)).toBe('/library')
})

test('optional drafts survive reload, require recovery and clear after save or logout', async ({
  page,
}) => {
  await register(page)
  await page.goto('/#/add')
  await page.getByLabel('Nombre *', { exact: true }).fill('Borrador privado')
  await page.getByLabel('Capítulo *', { exact: true }).fill('12')
  const draftKeys = () =>
    page.evaluate(() =>
      Object.keys(sessionStorage).filter((key) => key.startsWith('mangalist:form-draft:')),
    )
  expect(await draftKeys()).toHaveLength(0)
  await page.getByRole('checkbox', { name: 'Conservar borrador en esta pestaña' }).check()
  await page.getByLabel('Notas', { exact: true }).fill('Notas sin sincronizar')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Recuperar borrador' })).toBeVisible()
  await expect(page.getByLabel('Nombre *', { exact: true })).toHaveValue('')
  await page.getByRole('button', { name: 'Recuperar borrador' }).click()
  await expect(page.getByLabel('Nombre *', { exact: true })).toHaveValue('Borrador privado')
  await expect(page.getByLabel('Notas', { exact: true })).toHaveValue('Notas sin sincronizar')
  await page.getByRole('button', { name: 'Guardar obra', exact: true }).click()
  await expect(page).toHaveURL(/#\/manga\//)
  expect(await draftKeys()).toHaveLength(0)
  await page.getByRole('checkbox', { name: 'Conservar borrador en esta pestaña' }).check()
  await page.getByLabel('Notas', { exact: true }).fill('Otro borrador local')
  expect(await draftKeys()).toHaveLength(1)
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
  await expect(page).toHaveURL(/#\/login/)
  expect(await draftKeys()).toHaveLength(0)
})

test('bookmarklet survives recovery and registration, then session persists across reload and login', async ({
  page,
}) => {
  const query = new URLSearchParams({
    title: 'Bookmarklet Manga',
    url: 'https://example.test/chapter/24',
  })
  await page.goto(`/#/add?${query}`)
  await expect(page).toHaveURL(/#\/login\?redirect=/)
  await page.getByRole('link', { name: '¿Has olvidado la contraseña?' }).click()
  await page.getByRole('link', { name: /Volver/ }).click()
  await page.getByRole('link', { name: 'Crear cuenta', exact: true }).click()
  const email = await register(page, { currentPage: true })
  await expect(page.getByLabel('Nombre *', { exact: true })).toHaveValue('Bookmarklet Manga')
  await expect(page.getByLabel('Capítulo *', { exact: true })).toHaveValue('24')
  await expect(page.getByLabel('URL 1 *', { exact: true })).toHaveValue(
    'https://example.test/chapter/24',
  )
  await page.getByRole('button', { name: 'Guardar obra' }).click()
  await expect(page).toHaveURL(/#\/manga\//)
  await page.getByRole('link', { name: 'Volver a la biblioteca', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Bookmarklet Manga', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Bookmarklet Manga', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
  await expect(page).toHaveURL(/#\/login/)
  await page.goto('/#/settings/import-export')
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Importar / Exportar', exact: true }),
  ).toBeVisible()
  await expect(page.getByText('1 obras disponibles', { exact: true })).toBeVisible()
})

test('password recovery keeps responses generic and rejects invalid or reused reset codes', async ({
  page,
  context,
  request,
}, testInfo) => {
  let blockedHealthProbes = 0
  // WebChannel can probe connectivity when password reset interrupts its transport.
  // Abort only this exact probe; every other external request still fails isolation.
  await context.route(/^https:\/\/www\.google\.com\/images\/cleardot\.gif(?:\?.*)?$/, (route) => {
    blockedHealthProbes++
    return route.abort()
  })
  const email = await register(page)
  await addManga(page, 'Biblioteca conservada al recuperar', '12')
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
  await expect(page).toHaveURL(/#\/login/)
  await page.getByRole('link', { name: '¿Has olvidado la contraseña?' }).click()
  await expect(page.getByRole('heading', { name: 'Restablecer contraseña' })).toBeVisible()
  const notice = page.getByText(
    'Si existe una cuenta con ese correo, recibirás un enlace en unos minutos.',
    { exact: true },
  )
  const missingEmail = `missing-${randomUUID()}@example.test`
  await page.getByLabel('Correo electrónico', { exact: true }).fill(missingEmail)
  await page.getByRole('button', { name: 'Enviar enlace', exact: true }).click()
  await expect(notice).toBeVisible()
  await expect(notice).toHaveCount(0)
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email)
  await page.getByRole('button', { name: 'Enviar enlace', exact: true }).click()
  await expect(notice).toBeVisible()

  // The test-only admin endpoint and action API are hardcoded to the demo emulator.
  // Do not follow redirects or derive these URLs/keys from a production environment.
  const codesResponse = await request.get(
    'http://127.0.0.1:9199/emulator/v1/projects/demo-mangalist/oobCodes',
    { maxRedirects: 0 },
  )
  expect(codesResponse.status()).toBe(200)
  const { oobCodes = [] } = await codesResponse.json()
  expect(oobCodes.filter((entry) => entry.email === missingEmail)).toHaveLength(0)
  const resets = oobCodes.filter(
    (entry) => entry.email === email && entry.requestType === 'PASSWORD_RESET',
  )
  expect(resets).toHaveLength(1)
  const code = resets[0].oobCode
  expect(typeof code).toBe('string')
  const resetURL =
    'http://127.0.0.1:9199/identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=demo-mangalist-key'
  const newPassword = 'Recovered-local-456!'
  const invalid = await request.post(resetURL, {
    data: { oobCode: `invalid-${randomUUID()}`, newPassword },
    maxRedirects: 0,
  })
  expect(invalid.status()).toBe(400)
  expect((await invalid.json()).error.message).toBe('INVALID_OOB_CODE')
  const confirmed = await request.post(resetURL, {
    data: { oobCode: code, newPassword },
    maxRedirects: 0,
  })
  expect(confirmed.status()).toBe(200)
  expect((await confirmed.json()).email).toBe(email)
  const reused = await request.post(resetURL, {
    data: { oobCode: code, newPassword: 'Must-not-replace-789!' },
    maxRedirects: 0,
  })
  expect(reused.status()).toBe(400)
  expect((await reused.json()).error.message).toBe('INVALID_OOB_CODE')

  await page.getByRole('link', { name: 'Volver al login', exact: true }).click()
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(
    page
      .locator('.q-notification__message')
      .filter({ hasText: /contraseña.*no.*correct|contraseña no es correcta/ }),
  ).toBeVisible()
  await expect(page).toHaveURL(/#\/login/)
  await page.getByLabel('Contraseña', { exact: true }).fill(newPassword)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Biblioteca conservada al recuperar', exact: true }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Biblioteca conservada al recuperar', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Editar capítulo actual: 12', exact: true }),
  ).toBeVisible()
  const path = testInfo.outputPath('password-recovery-summary.json')
  await writeFile(
    path,
    JSON.stringify(
      {
        mode: 'demo-emulators-only',
        knownAndUnknownNoticeMatch: true,
        invalidAndReusedCodesRejected: true,
        oldPasswordRejected: true,
        recoveredLibrarySurvivesReload: true,
        blockedHealthProbes,
      },
      null,
      2,
    ),
  )
  await testInfo.attach('password-recovery-summary', { path, contentType: 'application/json' })
})

test('two tabs preserve unrelated edits and show a recoverable same-field conflict', async ({
  page,
  context,
}) => {
  await register(page)
  await addManga(page)
  await editFirstManga(page)
  const other = await context.newPage()
  other.on('pageerror', (error) => runtimeErrors.push(error.message))
  await other.goto('/#/library')
  await other.getByRole('button', { name: 'Sumar un capítulo' }).click()
  await expect(
    other.getByRole('button', { name: 'Editar capítulo actual: 277', exact: true }),
  ).toBeVisible()
  await page.getByLabel('Notas', { exact: true }).fill('Notas conservadas')
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(
    page.getByRole('button', { name: 'Editar capítulo actual: 277', exact: true }),
  ).toBeVisible()
  await expect(other.getByText('Notas conservadas', { exact: true })).toBeVisible()
  await editFirstManga(page)
  await page.getByLabel('Capítulo *', { exact: true }).fill('300')
  await other.getByRole('button', { name: 'Sumar un capítulo' }).click()
  await expect(
    other.getByRole('button', { name: 'Editar capítulo actual: 278', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(page.getByRole('button', { name: 'Cargar versión actual' })).toBeVisible()
  await expect(page.getByLabel('Capítulo *', { exact: true })).toHaveValue('300')
  await page.getByRole('button', { name: 'Cargar versión actual' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Cargar versión actual' }).click()
  await expect(page.getByLabel('Capítulo *', { exact: true })).toHaveValue('278')
  await expect(page.getByLabel('Notas', { exact: true })).toHaveValue('Notas conservadas')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('main').getByRole('button', { name: 'Cancelar', exact: true }).click()
  await expect(page).toHaveURL(/#\/library/)
  await expect(
    page.getByRole('button', { name: 'Editar capítulo actual: 278', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reintentar', exact: true })).toHaveCount(0)
  await expect(page.getByText(/Esta obra cambió en otro dispositivo/)).toHaveCount(0)
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Editar capítulo actual: 278', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reintentar', exact: true })).toHaveCount(0)
})

test('invalid import rows remain errors, successful import resets, export preserves data and accounts stay isolated', async ({
  page,
}) => {
  await register(page)
  await page.goto('/#/settings/import-export')
  await expect(page.locator('input[type=file]')).toBeEnabled()
  await page.locator('input[type=file]').setInputFiles({
    name: 'library.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(
      'name,chapter,url\nValid Manga,24,https://example.test\nBroken Manga,2,https://example.test,EXTRA',
    ),
  })
  await expect(page.getByRole('tab', { name: 'Errores (1)' })).toBeVisible()
  await page.getByRole('tab', { name: 'Errores (1)' }).click()
  await expect(page.getByRole('tabpanel').getByRole('checkbox')).toHaveCount(0)
  await page.getByRole('button', { name: 'Importar 1', exact: true }).click()
  await expect(page.getByText('1 obras importadas correctamente.', { exact: true })).toBeVisible()
  await expect(page.getByText('obras detectadas')).toHaveCount(0)
  await expect(page.locator('input[type=file]')).toHaveValue('')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar JSON' }).click()
  const download = await downloadPromise
  const exported = JSON.parse(await readFile(await download.path(), 'utf8'))
  expect(exported.formatVersion).toBe(2)
  expect(exported.verification).toMatchObject({ source: 'server', hasPendingWrites: false })
  const records = Array.isArray(exported) ? exported : exported.mangas
  expect(records).toHaveLength(1)
  expect(records[0]).toMatchObject({ name: 'Valid Manga', chapter: '24' })
  expect(records[0].sources[0].url).toBe('https://example.test')
  await page.reload()
  await expect(page.locator('input[type=file]')).toBeEnabled()
  await page.locator('input[type=file]').setInputFiles({
    name: 'renamed-library.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(
      'name,chapter,url\nValid Manga,24,https://example.test\nBroken Manga,2,https://example.test,EXTRA',
    ),
  })
  await page.getByRole('tab', { name: 'Duplicados (1)' }).click()
  await expect(
    page.getByRole('checkbox', { name: 'Seleccionar Valid Manga', exact: true }),
  ).toBeDisabled()
  await expect(page.getByText('Importado', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Importar 0', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Elegir otro archivo', exact: true }).click()
  await page.locator('input[type=file]').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify([
        { name: 'Missing URL', chapter: '2', sources: [{ name: 'Bad source', url: '' }] },
      ]),
    ),
  })
  await expect(page.getByRole('button', { name: 'Importar 0', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
  await expect(page).toHaveURL(/#\/login/)
  await register(page)
  await expect(page.getByRole('heading', { name: 'Tu biblioteca está vacía' })).toBeVisible()
})

test('offline export never downloads a cache copy and recovers after the connection returns', async ({
  page,
  context,
}) => {
  test.setTimeout(90000)
  await register(page)
  await addManga(page, 'Offline export')
  await page.goto('/#/settings/import-export')
  // Hash navigation returns before its lazy module finishes loading.
  await expect(
    page.getByRole('heading', { name: 'Importar / Exportar', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Descargar JSON', exact: true })).toBeEnabled()
  await expect(page.getByRole('status')).toContainText('Última instantánea')
  // WebChannel probes Google when its transport fails. Keep this exact probe
  // blocked; all other external requests still fail the global isolation check.
  await context.route('https://www.google.com/images/cleardot.gif*', (route) => route.abort())
  const downloads = []
  page.on('download', (download) => downloads.push(download))
  await context.setOffline(true)
  try {
    await expect(page.getByRole('status')).toContainText('Mostrando datos locales', {
      timeout: 30000,
    })
    await page.getByRole('button', { name: 'Descargar JSON', exact: true }).click()
    await expect(
      page
        .locator('.q-notification__message')
        .filter({ hasText: /no está disponible|confirmar.*servidor/ }),
    ).toBeVisible({ timeout: 30000 })
    expect(downloads).toHaveLength(0)
  } finally {
    await context.setOffline(false)
  }
  await expect(page.getByRole('status')).toContainText('Última instantánea', { timeout: 30000 })
  const nextDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar JSON', exact: true }).click()
  const data = JSON.parse(await readFile(await (await nextDownload).path(), 'utf8'))
  expect(data.verification.source).toBe('server')
  expect(data.mangas[0].name).toBe('Offline export')
})

test('mobile library supports manual chapters and confirmed deletion', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await register(page)
  await addManga(page, 'Lectura móvil', '45 Extra')
  await page.getByRole('button', { name: 'Editar capítulo actual: 45 Extra', exact: true }).click()
  await page.getByRole('dialog').getByLabel('Capítulo *', { exact: true }).fill('Special 2')
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Editar capítulo actual: Special 2', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('.q-notification')).toHaveCount(0)
  await page.evaluate(() => window.scrollTo(0, 0))
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  await page.screenshot({
    path: testInfo.outputPath('mobile-library.png'),
    fullPage: true,
    animations: 'disabled',
  })
  await page.getByRole('button', { name: 'Más acciones', exact: true }).click()
  await page.getByText('Eliminar', { exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Lectura móvil', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Más acciones', exact: true }).click()
  await page.getByText('Eliminar', { exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Tu biblioteca está vacía' })).toBeVisible()
})

test('account deletion rejects a wrong password without data loss and then removes emulator Auth', async ({
  page,
  context,
}) => {
  const email = await register(page)
  await addManga(page, 'Delete test')
  const other = await context.newPage()
  other.on('pageerror', (error) => runtimeErrors.push(error.message))
  await other.goto('/#/library')
  await expect(other.getByRole('heading', { name: 'Delete test', exact: true })).toBeVisible()
  await page.bringToFront()
  await expect(page.getByRole('button', { name: 'Menú de usuario', exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Ajustes', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Ajustes', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Eliminar cuenta', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Contraseña actual *', { exact: true }).fill('Wrong-password-123!')
  await dialog.getByLabel('Escribe ELIMINAR *', { exact: true }).fill('ELIMINAR')
  await dialog.getByRole('button', { name: 'Eliminar definitivamente', exact: true }).click()
  await expect(
    page.locator('.q-notification').filter({
      hasText: /La contraseña no es correcta|El correo o la contraseña no son correctos/,
    }),
  ).toBeVisible()
  await expect(other.getByRole('heading', { name: 'Delete test', exact: true })).toBeVisible()
  // The error notification can appear before QBtn leaves its loading state.
  // Wait for the visible button content before submitting a second attempt.
  const confirmDeletion = dialog.getByRole('button', {
    name: 'Eliminar definitivamente',
    exact: true,
  })
  await expect(confirmDeletion.locator('.q-btn__content')).not.toHaveClass(/q-btn__content--hidden/)
  await dialog.getByLabel('Contraseña actual *', { exact: true }).fill(password)
  await dialog.getByLabel('Contraseña actual *', { exact: true }).press('Tab')
  await confirmDeletion.click()
  await expect(page).toHaveURL(/#\/login/)
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(
    page.locator('.q-notification').filter({
      hasText: /No existe una cuenta con estos datos|El correo o la contraseña no son correctos/,
    }),
  ).toBeVisible()
})

import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { test, expect } from '@playwright/test'

let runtimeErrors
let externalRequests
const password = 'Local-test-123!'

test.beforeEach(async ({ context, page }) => {
  runtimeErrors = []
  externalRequests = []
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
})

test('invalid import rows remain errors, successful import resets, export preserves data and accounts stay isolated', async ({
  page,
}) => {
  await register(page)
  await page.goto('/#/settings/import-export')
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
  const records = Array.isArray(exported) ? exported : exported.mangas
  expect(records).toHaveLength(1)
  expect(records[0]).toMatchObject({ name: 'Valid Manga', chapter: '24' })
  expect(records[0].sources[0].url).toBe('https://example.test')
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

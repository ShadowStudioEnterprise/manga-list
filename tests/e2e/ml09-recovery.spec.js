import { randomUUID } from 'node:crypto'
import { test, expect } from '@playwright/test'

test('ML-09: quota stops peers, reload cannot bypass pause, explicit recovery confirms the whole library', async ({
  page,
  context,
}) => {
  test.setTimeout(120000)
  await page.clock.install()
  const external = []
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url())
    if (url.hostname === '127.0.0.1' && ['9100', '8188', '9199'].includes(url.port))
      return route.continue()
    external.push(url.origin)
    return route.abort()
  })
  await page.goto('/#/register')
  await page
    .getByLabel('Correo electrónico', { exact: true })
    .fill(`ml09-${randomUUID()}@example.test`)
  await page.getByLabel('Contraseña', { exact: true }).fill('Local-ml09-123!')
  await page.getByLabel('Repite la contraseña', { exact: true }).fill('Local-ml09-123!')
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Última instantánea')
  await page.goto('/#/add')
  await page.getByLabel('Nombre *', { exact: true }).fill('ML09 recovery')
  await page.getByLabel('Capítulo *', { exact: true }).fill('7')
  await page.getByRole('button', { name: 'Guardar obra', exact: true }).click()
  await expect(page).toHaveURL(/#\/manga\//)
  await page.goto('/#/library')
  await expect(page.getByRole('status')).toContainText('Última instantánea')
  const peer = await context.newPage()
  await peer.goto('/#/library')
  await expect(peer.getByRole('status')).toContainText('Última instantánea')
  const search = page.getByRole('textbox', { name: 'Buscar en la biblioteca', exact: true })
  await search.fill('ML09 recovery')
  // Wait for the debounced input to update the shared model before interrupting it.
  await expect(page.locator('input[aria-label="Buscar por nombre"]')).toHaveValue('ML09 recovery')
  // Inject only the terminal service signal; all app callbacks/IPC/UI are real.
  await page.evaluate(async () => {
    const { sparkBudget } = await import('/src/utils/spark-budget.js')
    sparkBudget.record({ code: 'resource-exhausted' })
  })
  for (const tab of [page, peer])
    await expect(tab.getByRole('main').getByRole('alert')).toContainText(/Cuota|cuota/)
  await peer.close()
  let targets = 0
  page.on('request', (request) => {
    if (!request.url().includes('google.firestore.v1.Firestore/Listen')) return
    for (const value of new URLSearchParams(request.postData() || '').values())
      if (value.includes('"addTarget"')) targets++
  })
  await page.reload()
  await expect(page.getByRole('main').getByRole('alert')).toContainText(/Cuota|cuota/)
  await expect(search).toHaveValue('ML09 recovery')
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click()
  await expect(page.getByRole('main').getByRole('alert')).toContainText(/Cuota|cuota/)
  expect(targets).toBe(0)
  // Advancing client time tests admission expiry, not Firebase's real quota reset.
  await page.clock.setSystemTime((await page.evaluate(() => Date.now())) + 901000)
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Última instantánea')
  await expect(search).toHaveValue('ML09 recovery')
  await expect(page.locator('.library-page-summary')).toContainText('de 1 obras')
  await page
    .getByRole('textbox', { name: 'Buscar en la biblioteca', exact: true })
    .fill('ML09 recovery')
  await expect(page.locator('.manga-grid > .manga-card')).toHaveCount(1)
  expect(targets).toBe(1)
  expect(external).toEqual([])
})

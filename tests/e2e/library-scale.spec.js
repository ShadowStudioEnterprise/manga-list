import { randomUUID } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { test, expect } from '@playwright/test'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, writeBatch, Timestamp } from 'firebase/firestore'
import { LIBRARY_PAGE_SIZE } from '../../src/composables/use-library-pagination.js'
import { normalizeTitle } from '../../src/utils/normalize-title.js'
import AxeBuilder from '@axe-core/playwright'

const projectId = 'demo-mangalist'
if (
  process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8188' ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9199'
) {
  throw new Error('Scale fixtures require the isolated local emulators')
}

async function seedLibrary(uid, size) {
  const environment = await initializeTestEnvironment({
    projectId,
    firestore: { host: '127.0.0.1', port: 8188 },
  })
  try {
    await environment.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore()
      for (let offset = 0; offset < size; offset += 400) {
        const batch = writeBatch(db)
        for (let index = offset; index < Math.min(size, offset + 400); index++) {
          const name = `Obra ${String(index).padStart(4, '0')}`
          batch.set(doc(db, 'users', uid, 'mangas', `scale-${index}`), {
            schemaVersion: 1,
            name,
            normalizedName: normalizeTitle(name),
            chapter: String(index),
            type: index % 2 ? 'manhwa' : 'manga',
            genres: [index % 2 ? 'Acción' : 'Aventura'],
            readingStatus: index % 2 ? 'following' : 'pending',
            publicationStatus: 'publishing',
            sources: [],
            notes: 'Datos sintéticos para medir el coste de representar una biblioteca.',
            favorite: index % 5 === 0,
            createdAt: Timestamp.fromMillis(1_700_000_000_000 + index),
            updatedAt: Timestamp.fromMillis(1_700_000_000_000 + index),
          })
        }
        await batch.commit()
      }
    })
  } finally {
    await environment.cleanup()
  }
}

test.use({ viewport: { width: 1280, height: 900 } })

for (const size of [100, 1000, 2500, 10000]) {
  test(`library scale ${size}: load, search, update and bounded representation`, async ({
    page,
    context,
  }, testInfo) => {
    // The 10000-record case traverses all 417 visual pages as well as exporting.
    test.setTimeout(size === 10000 ? 420000 : 300000)
    const errors = []
    const external = []
    let listenTargets = 0
    page.on('request', (request) => {
      if (request.url().includes('google.firestore.v1.Firestore/Listen')) {
        const data = new URLSearchParams(request.postData() || '')
        for (const value of data.values()) if (value.includes('"addTarget"')) listenTargets++
      }
    })
    page.on('pageerror', (error) => errors.push(error.message))
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
      .fill(`scale-${randomUUID()}@example.test`)
    await page.getByLabel('Contraseña', { exact: true }).fill('Local-scale-123!')
    await page.getByLabel('Repite la contraseña', { exact: true }).fill('Local-scale-123!')
    const signup = page.waitForResponse((response) => response.url().includes('/accounts:signUp'))
    await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click()
    const { localId: uid } = await (await signup).json()
    expect(typeof uid).toBe('string')
    // Cold development imports may take longer than a normal UI interaction.
    await expect(page.getByRole('heading', { name: 'Biblioteca', exact: true })).toBeVisible({
      timeout: 90000,
    })
    // Measure opening the library view with its existing listener, not cold network latency.
    await page.goto('/#/settings')
    // The first visit also compiles this lazy route and its dependencies in Vite.
    // Keep that preparation outside the measured library interactions below.
    await expect(page.getByRole('heading', { name: 'Ajustes', exact: true })).toBeVisible({
      timeout: 90000,
    })
    await seedLibrary(uid, size)
    const client = await context.newCDPSession(page)
    await client.send('Performance.enable')
    const rendered = Math.min(size, LIBRARY_PAGE_SIZE)
    const results = {
      size,
      browser: await context.browser().version(),
      mode: 'local-dev-with-emulators',
      renderedCards: rendered,
    }
    let start = performance.now()
    await page.goto('/#/library')
    await expect(page.locator('.manga-grid > .manga-card')).toHaveCount(rendered, {
      timeout: 90000,
    })
    await expect(page.getByRole('status')).toContainText('Última instantánea')
    results.loadMs = Math.round(performance.now() - start)
    await client.send('HeapProfiler.collectGarbage')
    results.loaded = {
      ...(await client.send('Memory.getDOMCounters')),
      metrics: (await client.send('Performance.getMetrics')).metrics.filter(({ name }) =>
        ['JSHeapUsedSize', 'JSHeapTotalSize'].includes(name),
      ),
    }
    expect(results.loaded.nodes).toBeLessThan(12000)
    const targetsBefore = listenTargets
    expect(targetsBefore).toBeGreaterThan(0)
    const search = page.getByRole('textbox', { name: 'Buscar en la biblioteca', exact: true })
    start = performance.now()
    await search.fill('0099')
    await expect(page.getByRole('heading', { name: 'Obra 0099', exact: true })).toBeVisible()
    await expect(page.locator('.manga-grid > .manga-card')).toHaveCount(1)
    results.searchMs = Math.round(performance.now() - start)
    start = performance.now()
    await page.getByRole('button', { name: 'Sumar un capítulo', exact: true }).click()
    await expect(
      page.getByRole('button', { name: 'Editar capítulo actual: 100', exact: true }),
    ).toBeVisible()
    await expect(page.getByRole('status')).toContainText('Última instantánea')
    results.updateMs = Math.round(performance.now() - start)
    start = performance.now()
    await search.fill('')
    await expect(page.locator('.manga-grid > .manga-card')).toHaveCount(rendered, {
      timeout: 90000,
    })
    results.clearSearchMs = Math.round(performance.now() - start)
    const top = page.getByRole('navigation', {
      name: 'Páginas de la biblioteca al inicio',
      exact: true,
    })
    await expect(top).toBeVisible()
    const seen = new Set()
    start = performance.now()
    const pages = Math.ceil(size / LIBRARY_PAGE_SIZE)
    for (let current = 1; current <= pages; current++) {
      const names = await page.locator('.manga-card__title').allTextContents()
      for (const name of names) {
        expect(seen.has(name)).toBe(false)
        seen.add(name)
      }
      if (current < pages) {
        await top.getByRole('button', { name: 'Página siguiente', exact: true }).click()
        await expect(page.locator('.library-page-summary')).toContainText(
          `Página ${current + 1} de ${pages}`,
        )
        await expect(page.locator('.library-page-summary')).toBeFocused()
      }
    }
    results.traverseMs = Math.round(performance.now() - start)
    expect(seen.size).toBe(size)
    await expect(top.getByRole('button', { name: 'Página siguiente', exact: true })).toBeDisabled()
    await search.fill('0099')
    await expect(page.locator('.library-page-summary')).toContainText('Página 1 de 1')
    await expect(page.getByRole('heading', { name: 'Obra 0099', exact: true })).toBeVisible()
    await search.fill('')
    await expect(top).toBeVisible()
    await top.getByRole('button', { name: 'Última página', exact: true }).click()
    await page.getByRole('combobox', { name: 'Estado de lectura', exact: true }).click()
    await page.getByRole('option', { name: 'Siguiendo', exact: true }).click()
    await expect(page.locator('.library-page-summary')).toContainText(
      `de ${size / 2} obras · Página 1`,
    )
    await page.getByRole('switch', { name: 'Solo favoritos', exact: true }).click()
    await expect(page.locator('.library-page-summary')).toContainText(
      `de ${size / 10} obras · Página 1`,
    )
    await page.getByRole('combobox', { name: 'Géneros', exact: true }).click()
    await page.getByRole('option', { name: 'Aventura', exact: true }).click()
    await page.keyboard.press('Escape')
    await expect(
      page.getByRole('heading', { name: 'No hay coincidencias', exact: true }),
    ).toBeVisible()
    await page
      .locator('.filters-card')
      .getByRole('button', { name: 'Limpiar filtros', exact: true })
      .click()
    await expect(page.locator('.library-page-summary')).toContainText(`de ${size} obras · Página 1`)
    await top.getByRole('button', { name: 'Última página', exact: true }).click()
    await page.getByRole('combobox', { name: 'Ordenar', exact: true }).click()
    await page.getByRole('option', { name: 'Nombre A-Z', exact: true }).click()
    await expect(page.locator('.library-page-summary')).toContainText('Página 1')
    await expect(page.locator('.manga-card__title').first()).toHaveText('Obra 0000')
    expect(listenTargets).toBe(targetsBefore)
    results.additionalListenTargetsForInteractions = listenTargets - targetsBefore
    // A filtered single-card page must never turn export into a partial library copy.
    await search.fill('0099')
    await expect(page.locator('.library-page-summary')).toContainText('Página 1 de 1')
    await page.goto('/#/settings/import-export')
    await expect(
      page.getByRole('heading', { name: 'Importar / Exportar', exact: true }),
    ).toBeVisible({ timeout: 90000 })
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Descargar JSON', exact: true }).click()
    const exported = JSON.parse(await readFile(await (await download).path(), 'utf8'))
    expect(exported.mangas).toHaveLength(size)
    expect(exported.mangas.find(({ name }) => name === 'Obra 0099').chapter).toBe('100')
    results.exportedRecords = exported.mangas.length
    if (size === 1000) {
      const mobile = await context.newPage()
      mobile.on('pageerror', (error) => errors.push(error.message))
      try {
        await mobile.setViewportSize({ width: 320, height: 740 })
        await mobile.goto('/#/library')
        await expect(mobile.locator('.manga-grid > .manga-card')).toHaveCount(LIBRARY_PAGE_SIZE)
        expect(
          await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        ).toBe(true)
        await expect(mobile.locator('.q-notification')).toHaveCount(0)
        const audit = await new AxeBuilder({ page: mobile })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'])
          .analyze()
        await writeFile(
          testInfo.outputPath('library-pagination-accessibility-320.json'),
          JSON.stringify(audit, null, 2),
        )
        expect(audit.violations).toEqual([])
        const mobileNav = mobile.getByRole('navigation', {
          name: 'Páginas de la biblioteca al inicio',
          exact: true,
        })
        await mobileNav.getByRole('button', { name: 'Página siguiente', exact: true }).click()
        await expect(mobile.locator('.library-page-summary')).toContainText('Página 2 de 42')
        await expect(mobile.locator('.library-page-summary')).toBeFocused()
        for (let step = 0; step < 3; step++) await mobile.keyboard.press('Tab')
        await expect(
          mobileNav.getByRole('button', { name: 'Página siguiente', exact: true }),
        ).toBeFocused()
        await mobile.keyboard.press('Enter')
        await expect(mobile.locator('.library-page-summary')).toContainText('Página 3 de 42')
        await mobile.screenshot({
          path: testInfo.outputPath('library-pagination-320.png'),
          fullPage: false,
          animations: 'disabled',
        })
      } finally {
        await mobile.close()
      }
    }
    const path = testInfo.outputPath(`library-scale-${size}.json`)
    await writeFile(path, JSON.stringify(results, null, 2))
    await testInfo.attach(`library-scale-${size}`, { path, contentType: 'application/json' })
    console.log(JSON.stringify(results))
    expect(errors).toEqual([])
    expect(external).toEqual([])
  })
}

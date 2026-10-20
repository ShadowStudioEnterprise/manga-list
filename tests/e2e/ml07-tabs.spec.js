import { randomUUID } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { test, expect } from '@playwright/test'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, writeBatch, Timestamp } from 'firebase/firestore'

for (const size of [100, 1000, 2500, 5000, 10000]) {
  test(`ML-07: ${size} works share a listener across tabs and recover ownership`, async ({
    page,
    context,
  }, testInfo) => {
    test.setTimeout(300000)
    expect(process.env.FIRESTORE_EMULATOR_HOST).toBe('127.0.0.1:8188')
    expect(process.env.FIREBASE_AUTH_EMULATOR_HOST).toBe('127.0.0.1:9199')
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
      .fill(`ml07-${randomUUID()}@example.test`)
    await page.getByLabel('Contraseña', { exact: true }).fill('Local-ml07-123!')
    await page.getByLabel('Repite la contraseña', { exact: true }).fill('Local-ml07-123!')
    const signup = page.waitForResponse((response) => response.url().includes('/accounts:signUp'))
    await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click()
    const { localId: uid } = await (await signup).json()
    await expect(page.getByRole('heading', { name: 'Biblioteca', exact: true })).toBeVisible({
      timeout: 90000,
    })
    await page.close()
    const env = await initializeTestEnvironment({
      projectId: 'demo-mangalist',
      firestore: { host: '127.0.0.1', port: 8188 },
    })
    try {
      await env.withSecurityRulesDisabled(async (c) => {
        const db = c.firestore()
        for (let offset = 0; offset < size; offset += 400) {
          const batch = writeBatch(db)
          for (let i = offset; i < Math.min(size, offset + 400); i++) {
            batch.set(doc(db, 'users', uid, 'mangas', String(i).padStart(6, '0')), {
              schemaVersion: 1,
              name: `Synthetic ${i}`,
              normalizedName: `synthetic-${i}`,
              chapter: '1',
              type: 'manga',
              genres: [],
              readingStatus: 'following',
              publicationStatus: 'unknown',
              sources: [],
              notes: '',
              favorite: false,
              createdAt: Timestamp.fromMillis(1700000000000),
              updatedAt: Timestamp.fromMillis(1700000000000),
            })
          }
          await batch.commit()
        }
      })
    } finally {
      await env.cleanup()
    }
    const tabs = []
    const initialTargetsPerTab = []
    for (let i = 0; i < 2; i++) {
      const tab = await context.newPage()
      const row = { page: tab, targets: 0 }
      tab.on('request', (request) => {
        if (!request.url().includes('google.firestore.v1.Firestore/Listen')) return
        const data = new URLSearchParams(request.postData() || '')
        for (const value of data.values()) if (value.includes('"addTarget"')) row.targets++
      })
      tabs.push(row)
      await tab.goto('/#/library')
      await expect(tab.locator('.library-page-summary')).toContainText(`de ${size} obras`, {
        timeout: 90000,
      })
      await expect(tab.getByRole('status')).toContainText('Última instantánea')
      expect(row.targets).toBe(i === 0 ? (size > 5000 ? 3 : 1) : 0)
      initialTargetsPerTab.push(row.targets)
    }
    for (const { page: tab } of tabs) {
      await tab
        .getByRole('textbox', { name: 'Buscar en la biblioteca', exact: true })
        .fill('Synthetic 0')
      await expect(tab.locator('.manga-grid > .manga-card')).toHaveCount(1)
    }
    await tabs[1].page.getByRole('button', { name: 'Sumar un capítulo', exact: true }).click()
    for (const row of tabs) {
      await expect(
        row.page.getByRole('button', { name: 'Editar capítulo actual: 2', exact: true }),
      ).toBeVisible()
      expect(row.targets).toBe(initialTargetsPerTab[tabs.indexOf(row)])
    }
    const extraTargetsForSearchAndUpdate = tabs.map(
      (row, index) => row.targets - initialTargetsPerTab[index],
    )
    const beforeReload = tabs[0].targets
    await tabs[0].page.reload()
    await expect(tabs[0].page.locator('.library-page-summary')).toContainText(`de ${size} obras`, {
      timeout: 90000,
    })
    await expect(tabs[0].page.getByRole('status')).toContainText('Última instantánea')
    const reloadTargets = tabs[0].targets - beforeReload
    expect(reloadTargets).toBe(0)
    expect(tabs[1].targets).toBe(size > 5000 ? 3 : 1)
    await tabs[1].page.close()
    await expect.poll(() => tabs[0].targets).toBe(beforeReload + (size > 5000 ? 3 : 1))
    await tabs[0].page
      .getByRole('textbox', { name: 'Buscar en la biblioteca', exact: true })
      .fill('Synthetic 0')
    await expect(
      tabs[0].page.getByRole('button', { name: 'Editar capítulo actual: 2', exact: true }),
    ).toBeVisible()
    expect(external).toEqual([])
    const result = {
      size,
      measuredAt: new Date().toISOString(),
      project: testInfo.project.name,
      browser: await context.browser().version(),
      initialTargetsPerTab,
      extraTargetsForSearchAndUpdate,
      reloadTargets,
      leaderCloseTargets: tabs[0].targets - beforeReload,
      productionRequests: external.length,
      scope: 'Actual same-origin tabs; WebChannel addTarget messages, NOT billed reads',
    }
    await writeFile(testInfo.outputPath('ml07-tabs.json'), JSON.stringify(result, null, 2) + '\n')
    console.log(JSON.stringify(result))
  })
}

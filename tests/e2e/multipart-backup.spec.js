import { randomUUID, createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { test, expect } from '@playwright/test'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { collection, doc, getDocs, limit, query, updateDoc, writeBatch } from 'firebase/firestore'
import { recoveryFixture } from '../../scripts/model-ml08-recovery.mjs'

for (const count of [70, 1000]) {
  test(`ML-08: ${count} works download, validate and resume after reload`, async ({
    page,
    context,
  }, testInfo) => {
    test.setTimeout(420000)
    expect(process.env.FIRESTORE_EMULATOR_HOST).toBe('127.0.0.1:8188')
    expect(process.env.FIREBASE_AUTH_EMULATOR_HOST).toBe('127.0.0.1:9199')
    const external = [],
      errors = [],
      blockedProbes = []
    await context.route('**/*', (route) => {
      const url = new URL(route.request().url())
      if (url.hostname === '127.0.0.1' && ['9100', '8188', '9199'].includes(url.port))
        return route.continue()
      if (url.hostname === 'www.google.com' && url.pathname === '/images/cleardot.gif') {
        blockedProbes.push(url.pathname)
        return route.abort()
      }
      external.push(url.origin + url.pathname)
      return route.abort()
    })
    page.on('pageerror', (error) => errors.push(error.message))
    async function register(target) {
      await target.goto('/#/register')
      await target
        .getByLabel('Correo electrónico', { exact: true })
        .fill(`ml08-${randomUUID()}@example.test`)
      await target.getByLabel('Contraseña', { exact: true }).fill('Local-ml08-123!')
      await target.getByLabel('Repite la contraseña', { exact: true }).fill('Local-ml08-123!')
      const signup = target.waitForResponse((response) =>
        response.url().includes('/accounts:signUp'),
      )
      await target.getByRole('button', { name: 'Crear cuenta', exact: true }).click()
      const { localId } = await (await signup).json()
      await expect(target.getByRole('heading', { name: 'Biblioteca', exact: true })).toBeVisible({
        timeout: 90000,
      })
      return localId
    }
    const sourceUid = await register(page)
    const env = await initializeTestEnvironment({
      projectId: 'demo-mangalist',
      firestore: { host: '127.0.0.1', port: 8188 },
    })
    const records = recoveryFixture(count, 5000)
    let targetContext
    try {
      await env.withSecurityRulesDisabled(async (c) => {
        const db = c.firestore()
        for (let offset = 0; offset < records.length; offset += 400) {
          const batch = writeBatch(db)
          for (const record of records.slice(offset, offset + 400)) {
            const { id, ...data } = record
            batch.set(doc(db, 'users', sourceUid, 'mangas', id), data)
          }
          await batch.commit()
        }
      })
      await page.reload()
      await expect(page.locator('.library-page-summary')).toContainText(`de ${count} obras`, {
        timeout: 90000,
      })
      await page.goto('/#/settings/import-export')
      const panel = page.locator('section[aria-labelledby="multipart-heading"]')
      await expect(
        panel.getByRole('button', { name: 'Preparar copia dividida', exact: true }),
      ).toBeEnabled()
      await panel.getByRole('button', { name: 'Preparar copia dividida', exact: true }).click()
      const partCount = count === 1000 ? 2 : 1
      await expect(
        panel.getByText(`${count} obras · ${partCount} partes.`, { exact: false }),
      ).toBeVisible()
      const paths = []
      const contents = []
      for (const name of [
        'Descargar manifiesto',
        ...Array.from({ length: partCount }, (_, i) => `Descargar parte ${i + 1}`),
      ]) {
        const pending = page.waitForEvent('download')
        await panel.getByRole('button', { name, exact: true }).click()
        const download = await pending
        const path = testInfo.outputPath(download.suggestedFilename())
        await download.saveAs(path)
        paths.push(path)
        contents.push(await readFile(path))
      }
      const manifest = JSON.parse(contents[0])
      for (let i = 0; i < manifest.parts.length; i++) {
        expect(contents[i + 1].length).toBe(manifest.parts[i].bytes)
        expect(
          createHash('sha256')
            .update(contents[i + 1])
            .digest('hex'),
        ).toBe(manifest.parts[i].sha256)
        expect(contents[i + 1].length).toBeLessThanOrEqual(4 * 1024 * 1024)
      }
      await page.close()
      targetContext = await context.browser().newContext({ baseURL: 'http://127.0.0.1:9100' })
      await targetContext.route('**/*', (route) => {
        const url = new URL(route.request().url())
        if (url.hostname === '127.0.0.1' && ['9100', '8188', '9199'].includes(url.port))
          return route.continue()
        if (url.hostname === 'www.google.com' && url.pathname === '/images/cleardot.gif') {
          blockedProbes.push(url.pathname)
          return route.abort()
        }
        external.push(url.origin + url.pathname)
        return route.abort()
      })
      const target = await targetContext.newPage()
      target.on('pageerror', (error) => errors.push(error.message))
      let time = Date.now()
      // Advance Date.now between manual resumes; timers and SDK callbacks remain real.
      // This checks local admission logic, not elapsed production time or billed quotas.
      await target.clock.setFixedTime(time)
      const targetUid = await register(target)
      await target.goto('http://127.0.0.1:9100/#/settings/import-export')
      const recovery = target.locator('section[aria-labelledby="multipart-heading"]')
      const input = recovery.locator('input[type="file"]')
      const check = recovery.getByRole('button', { name: 'Comprobar copia', exact: true })
      await input.setInputFiles([paths[0]])
      await check.click()
      await expect(
        recovery.getByRole('button', { name: 'Recuperar obras', exact: true }),
      ).toHaveCount(0)
      await expect(recovery.getByRole('status')).toContainText('manifiesto y todas las partes')
      await input.setInputFiles(paths)
      await check.click()
      await recovery.getByRole('button', { name: 'Recuperar obras', exact: true }).click()
      const pause = recovery.getByRole('button', { name: 'Pausar recuperación', exact: true })
      if (count === 1000) {
        await expect(
          recovery.getByRole('status').filter({ hasText: 'obras recuperadas' }),
        ).toContainText(/[1-9]\d* de 1000 obras recuperadas/, { timeout: 120000 })
        await pause.click()
      }
      const resume = recovery.getByRole('button', { name: 'Continuar recuperación', exact: true })
      await expect(resume).toBeVisible({ timeout: 180000 })
      let savedBeforeReload = 0
      await env.withSecurityRulesDisabled(async (c) => {
        savedBeforeReload = (
          await getDocs(query(collection(c.firestore(), 'users', targetUid, 'mangas'), limit(5001)))
        ).size
      })
      expect(savedBeforeReload).toBeGreaterThan(0)
      expect(savedBeforeReload).toBeLessThan(count)
      await target.reload()
      await input.setInputFiles(paths)
      await check.click()
      await expect(
        recovery.getByRole('status').filter({ hasText: 'obras recuperadas' }),
      ).toContainText(`${savedBeforeReload} de ${count}`)
      if (count === 1000) {
        await resume.click()
        await pause.click()
        await expect(resume).toBeVisible({ timeout: 180000 })
        expect(external).toEqual([])
        expect(errors).toEqual([])
        await writeFile(
          testInfo.outputPath('ml08-multipart-large.json'),
          JSON.stringify(
            {
              scope: 'Local demo; large file verified; partial recovery and reload only',
              project: testInfo.project.name,
              totalRecords: count,
              parts: manifest.parts,
              savedBeforeReload,
              completeRecoveryTested: false,
              productionRequests: 0,
              blockedConnectivityProbes: blockedProbes.length,
            },
            null,
            2,
          ),
        )
        return
      }
      let pauses = 1
      for (let attempt = 0; attempt < 22; attempt++) {
        time += 61000
        await target.clock.setFixedTime(time)
        await expect(resume).toBeEnabled({ timeout: 10000 })
        await resume.click()
        await expect(
          recovery.getByRole('button', { name: 'Pausar recuperación', exact: true }),
        ).toBeHidden({ timeout: 60000 })
        if (await recovery.getByText('Recuperación completa.', { exact: true }).isVisible()) break
        pauses++
      }
      await expect(recovery.getByText('Recuperación completa.', { exact: true })).toBeVisible()
      await env.withSecurityRulesDisabled(async (c) => {
        const db = c.firestore()
        const snapshot = await getDocs(
          query(collection(db, 'users', targetUid, 'mangas'), limit(5001)),
        )
        expect(snapshot.size).toBe(count)
        expect(new Set(snapshot.docs.map((item) => item.id)).size).toBe(count)
        const restored = snapshot.docs
          .map((item) => item.data())
          .sort((a, b) => a.name.localeCompare(b.name))
        const originals = [...records].sort((a, b) => a.name.localeCompare(b.name))
        for (let i = 0; i < restored.length; i++) {
          for (const field of ['name', 'chapter', 'notes', 'favorite', 'genres'])
            expect(restored[i][field]).toEqual(originals[i][field])
          expect(restored[i].createdAt.toMillis()).toBeGreaterThan(records[i].createdAt.getTime())
        }
        await updateDoc(snapshot.docs[0].ref, { chapter: '99' })
      })
      await check.click()
      await expect(resume).toBeEnabled()
      await resume.click()
      await expect(recovery.getByText('Recuperación completa.', { exact: true })).toBeVisible()
      await env.withSecurityRulesDisabled(async (c) => {
        const snapshot = await getDocs(
          query(collection(c.firestore(), 'users', targetUid, 'mangas'), limit(5001)),
        )
        expect(snapshot.size).toBe(count)
        expect(snapshot.docs.some((item) => item.data().chapter === '99')).toBe(true)
      })
      expect(external).toEqual([])
      expect(errors).toEqual([])
      await target.screenshot({
        path: testInfo.outputPath('multipart-complete.png'),
        fullPage: true,
      })
      await writeFile(
        testInfo.outputPath('ml08-multipart.json'),
        JSON.stringify(
          {
            scope:
              'Local demo emulators; accelerated Date.now between manual resumes; not billed quota',
            project: testInfo.project.name,
            totalRecords: count,
            parts: manifest.parts,
            savedBeforeReload,
            pauses,
            recovered: count,
            replayPreservedEdit: true,
            missingPartRejected: true,
            productionRequests: external.length,
            blockedConnectivityProbes: blockedProbes.length,
            pageErrors: errors,
          },
          null,
          2,
        ),
      )
    } finally {
      await targetContext?.close()
      await env.cleanup()
    }
  })
}

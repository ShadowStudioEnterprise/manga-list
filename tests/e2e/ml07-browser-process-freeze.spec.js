import { randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { chromium, test, expect } from '@playwright/test'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, writeBatch, updateDoc, getDocFromServer, Timestamp } from 'firebase/firestore'

function processTable() {
  return execFileSync('ps', ['-eo', 'pid=,ppid=,pgid=,stat=,comm='], { encoding: 'utf8' })
    .trim()
    .split('\n')
    .map((line) => {
      const [pid, parent, group, state, command] = line.trim().split(/\s+/)
      return { pid: Number(pid), parent: Number(parent), group: Number(group), state, command }
    })
}

test('ML-07: complete isolated browser process freeze preserves synchronization @chromium-only', async ({
  browserName,
}, testInfo) => {
  test.skip(process.platform !== 'linux', 'Process group suspension is verified on Linux CI only')
  test.setTimeout(180000)
  expect(browserName).toBe('chromium')
  expect(process.env.FIRESTORE_EMULATOR_HOST).toBe('127.0.0.1:8188')
  expect(process.env.FIREBASE_AUTH_EMULATOR_HOST).toBe('127.0.0.1:9199')
  const server = await chromium.launchServer({ channel: 'chromium' })
  const pid = server.process().pid
  const browser = await chromium.connect(server.wsEndpoint())
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:9100' })
  const env = await initializeTestEnvironment({
    projectId: 'demo-mangalist',
    firestore: { host: '127.0.0.1', port: 8188 },
  })
  let suspended = false,
    watchdog,
    watchdogResumed = false
  const external = []
  const diagnostics = { pid, stages: [] }
  const resume = () => {
    if (!suspended) return
    try {
      process.kill(-pid, 'SIGCONT')
    } catch (error) {
      if (error.code !== 'ESRCH') throw error
    } finally {
      suspended = false
    }
  }
  try {
    await context.tracing.start({ screenshots: true, snapshots: true, sources: true })
    await context.route('**/*', (route) => {
      const url = new URL(route.request().url())
      if (url.hostname === '127.0.0.1' && ['9100', '8188', '9199'].includes(url.port))
        return route.continue()
      external.push(url.origin)
      return route.abort()
    })
    const controller = await context.newPage()
    await controller.goto('/#/register')
    await controller
      .getByLabel('Correo electrónico', { exact: true })
      .fill(`process-${randomUUID()}@example.test`)
    await controller.getByLabel('Contraseña', { exact: true }).fill('Local-process-123!')
    await controller.getByLabel('Repite la contraseña', { exact: true }).fill('Local-process-123!')
    const signup = controller.waitForResponse((response) =>
      response.url().includes('/accounts:signUp'),
    )
    await controller.getByRole('button', { name: 'Crear cuenta', exact: true }).click()
    const { localId: uid } = await (await signup).json()
    await expect(controller.getByRole('heading', { name: 'Biblioteca', exact: true })).toBeVisible()
    await controller.goto('about:blank')
    await env.withSecurityRulesDisabled(async (c) => {
      const db = c.firestore()
      for (let offset = 0; offset < 500; offset += 400) {
        const batch = writeBatch(db)
        for (let i = offset; i < Math.min(500, offset + 400); i++) {
          batch.set(doc(db, 'users', uid, 'mangas', String(i).padStart(6, '0')), {
            schemaVersion: 1,
            name: `Process ${i}`,
            normalizedName: `process-${i}`,
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
    const tabs = []
    for (let i = 0; i < 2; i++) {
      const page = await context.newPage(),
        row = { page, targets: 0 }
      page.on('request', (request) => {
        if (!request.url().includes('google.firestore.v1.Firestore/Listen')) return
        for (const value of new URLSearchParams(request.postData() || '').values())
          if (value.includes('"addTarget"')) row.targets++
      })
      tabs.push(row)
      await page.goto('/#/library')
      await expect(page.locator('.library-page-summary')).toContainText('de 500 obras')
      await expect(page.getByRole('status')).toContainText('Última instantánea')
      expect(row.targets).toBe(i === 0 ? 1 : 0)
      await page
        .getByRole('textbox', { name: 'Buscar en la biblioteca', exact: true })
        .fill('Process 0')
      await expect(page.locator('.manga-grid > .manga-card')).toHaveCount(1)
    }
    const rows = processTable(),
      root = rows.find((row) => row.pid === pid)
    // The PID comes directly from this test's BrowserServer. Refuse a shared group.
    expect(Number.isSafeInteger(pid) && pid > 1 && pid !== process.pid).toBe(true)
    expect(root?.group).toBe(pid)
    expect(rows.find((row) => row.pid === process.pid)?.group).not.toBe(pid)
    const descendants = new Set([pid])
    let changed = true
    while (changed) {
      changed = false
      for (const row of rows)
        if (descendants.has(row.parent) && !descendants.has(row.pid)) {
          descendants.add(row.pid)
          changed = true
        }
    }
    expect(rows.filter((row) => descendants.has(row.pid)).every((row) => row.group === pid)).toBe(
      true,
    )
    const group = () => processTable().filter((row) => row.group === pid)
    expect(group().length).toBeGreaterThan(2)
    const frozenAt = Date.now()
    suspended = true
    // Stop only the verified dedicated Chromium group, including renderers/network.
    process.kill(-pid, 'SIGSTOP')
    watchdog = setTimeout(() => {
      watchdogResumed = true
      resume()
    }, 45000)
    await expect.poll(() => group().every((row) => row.state.startsWith('T'))).toBe(true)
    diagnostics.stages.push({ stage: 'frozen', at: Date.now(), processes: group() })
    let confirmedChapter
    // An external emulator fixture acts while ALL browser tabs and processes stop.
    // This does not represent a follower remaining active inside the stopped browser.
    await env.withSecurityRulesDisabled(async (c) => {
      const ref = doc(c.firestore(), 'users', uid, 'mangas', '000000')
      await updateDoc(ref, { chapter: '2', updatedAt: Timestamp.now() })
      confirmedChapter = (await getDocFromServer(ref)).data()?.chapter
    })
    expect(confirmedChapter).toBe('2')
    diagnostics.externalWriteConfirmedAt = Date.now()
    await new Promise((resolve) =>
      setTimeout(resolve, Math.max(0, 20000 - (Date.now() - frozenAt))),
    )
    expect(watchdogResumed).toBe(false)
    const stopped = group()
    expect(stopped.length).toBeGreaterThan(2)
    expect(stopped.every((row) => row.state.startsWith('T'))).toBe(true)
    diagnostics.stages.push({ stage: 'before-resume', at: Date.now(), processes: stopped })
    resume()
    clearTimeout(watchdog)
    const resumedAt = Date.now()
    for (const { page } of tabs) {
      await expect(
        page.getByRole('button', { name: 'Editar capítulo actual: 2', exact: true }),
      ).toBeVisible({ timeout: 60000 })
      await expect(page.getByRole('status')).toContainText('Última instantánea')
      await expect(
        page.getByRole('textbox', { name: 'Buscar en la biblioteca', exact: true }),
      ).toHaveValue('Process 0')
    }
    diagnostics.stages.push({ stage: 'resumed', at: Date.now(), processes: group() })
    const resumedTargets = tabs.map((row) => row.targets)
    // A server reconnect can re-open the owner query; the follower remains shared.
    expect(resumedTargets[0]).toBeGreaterThanOrEqual(1)
    expect(resumedTargets[0]).toBeLessThanOrEqual(2)
    expect(resumedTargets[1]).toBe(0)
    const follower = tabs[1].page
    await follower.goto('/#/settings/import-export')
    const download = follower.waitForEvent('download')
    await follower.getByRole('button', { name: 'Descargar JSON', exact: true }).click()
    const exported = JSON.parse(await readFile(await (await download).path(), 'utf8'))
    expect(exported.mangas).toHaveLength(500)
    expect(exported.mangas.find((item) => item.name === 'Process 0').chapter).toBe('2')
    const afterExport = tabs[1].targets
    await follower.goto('/#/library')
    await follower.getByRole('textbox', { name: 'Buscar en la biblioteca', exact: true }).fill('')
    await expect(follower.locator('.library-page-summary')).toContainText('de 500 obras')
    await tabs[0].page.close()
    await expect.poll(() => tabs[1].targets).toBe(afterExport + 1)
    await expect(follower.getByRole('status')).toContainText('Última instantánea')
    await expect(follower.locator('.library-page-summary')).toContainText('de 500 obras')
    expect(external).toEqual([])
    const result = {
      sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      sourceDirty: Boolean(
        execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim(),
      ),
      size: 500,
      browser: browser.version(),
      measuredAt: new Date().toISOString(),
      mechanism: 'SIGSTOP/SIGCONT on the verified dedicated Linux Chromium process group',
      scope: 'Complete isolated browser process suspension; not system sleep, Windows or Firefox',
      frozenDurationMs: resumedAt - frozenAt,
      processStages: diagnostics.stages,
      externalWriteConfirmedAt: diagnostics.externalWriteConfirmedAt,
      confirmedConcurrentChapter: confirmedChapter,
      resumedTargets,
      exportedRecords: exported.mangas.length,
      handoffAdditionalTargets: tabs[1].targets - afterExport,
      externalRequests: external.length,
      watchdogResumed,
      fixtureReadsExcludedFromApplicationTargets: true,
    }
    await writeFile(
      testInfo.outputPath('ml07-browser-process-freeze.json'),
      JSON.stringify(result, null, 2) + '\n',
    )
    console.log(JSON.stringify(result))
  } finally {
    clearTimeout(watchdog)
    resume()
    await writeFile(
      testInfo.outputPath('ml07-browser-process-diagnostics.json'),
      JSON.stringify(diagnostics, null, 2) + '\n',
    )
    await context.tracing
      .stop({ path: testInfo.outputPath('browser-process-trace.zip') })
      .catch(() => {})
    await browser.close().catch(() => {})
    await server.close()
    await env.cleanup()
  }
})

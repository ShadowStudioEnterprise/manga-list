import { randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { test, expect } from '@playwright/test'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, getDocFromServer, setDoc, deleteDoc, writeBatch, Timestamp } from 'firebase/firestore'
import { createHiddenTarget } from './helpers/hidden-target.js'

// The complete Chromium browser supports hidden targets and their native lifecycle.
test.use({ channel: 'chromium' })

test('ML-07: real freeze/resume preserves 500 works, a concurrent write and ownership @chromium-only', async ({
  page,
  context,
  browser,
}, testInfo) => {
  test.setTimeout(360000)
  expect(process.env.FIRESTORE_EMULATOR_HOST).toBe('127.0.0.1:8188')
  expect(process.env.FIREBASE_AUTH_EMULATOR_HOST).toBe('127.0.0.1:9199')
  const external = []
  const allowed = (url) =>
    url.hostname === '127.0.0.1' && ['9100', '8188', '9199'].includes(url.port)
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url())
    if (allowed(url)) return route.continue()
    external.push(url.origin)
    return route.abort()
  })
  const env = await initializeTestEnvironment({
    projectId: 'demo-mangalist',
    firestore: { host: '127.0.0.1', port: 8188 },
  })
  let owner, ownerPageAfterResume
  const lifecycle = []
  const coordination = []
  const ownerConsole = []
  const ownerNavigations = []
  const ownerSockets = []
  const ownerSocketAttempts = []
  const ownerRequests = []
  const followerRequests = []
  let ownerTargets = 0,
    followerTargets = 0
  try {
    const warmupRef = ['_testWarmup', 'freeze']
    await env.withSecurityRulesDisabled(async (c) => {
      const ref = doc(c.firestore(), ...warmupRef)
      await setDoc(ref, { ready: true })
      await getDocFromServer(ref)
      await deleteDoc(ref)
    })
    await page.goto('/#/register')
    await page
      .getByLabel('Correo electrónico', { exact: true })
      .fill(`freeze-${randomUUID()}@example.test`)
    await page.getByLabel('Contraseña', { exact: true }).fill('Local-freeze-123!')
    await page.getByLabel('Repite la contraseña', { exact: true }).fill('Local-freeze-123!')
    const signup = page.waitForResponse((response) => response.url().includes('/accounts:signUp'))
    await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click()
    const { localId: uid } = await (await signup).json()
    await expect(page.getByRole('heading', { name: 'Biblioteca', exact: true })).toBeVisible({
      timeout: 90000,
    })
    // Unload the app and its listener, keeping an empty controller page alive.
    await page.goto('about:blank')
    await env.withSecurityRulesDisabled(async (c) => {
      const db = c.firestore()
      for (let offset = 0; offset < 500; offset += 400) {
        const batch = writeBatch(db)
        for (let i = offset; i < Math.min(500, offset + 400); i++) {
          batch.set(doc(db, 'users', uid, 'mangas', String(i).padStart(6, '0')), {
            schemaVersion: 1,
            name: `Freeze ${i}`,
            normalizedName: `freeze-${i}`,
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
    owner = await createHiddenTarget(browser, context, page)
    owner.on('Fetch.requestPaused', async ({ requestId, request }) => {
      const url = new URL(request.url)
      if (allowed(url)) await owner.send('Fetch.continueRequest', { requestId })
      else {
        external.push(url.origin)
        await owner.send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' })
      }
    })
    owner.on('Page.frameNavigated', ({ frame }) => {
      if (!frame.parentId && frame.url.startsWith('http://127.0.0.1:9100/'))
        ownerNavigations.push({ at: Date.now(), url: frame.url })
    })
    owner.on('Network.webSocketCreated', ({ requestId, url }) =>
      ownerSocketAttempts.push({ requestId, url: url.split('?')[0] }),
    )
    owner.on('Network.webSocketHandshakeResponseReceived', ({ requestId, response }) => {
      if (response.status === 101)
        ownerSockets.push(
          ownerSocketAttempts.find((a) => a.requestId === requestId)?.url || requestId,
        )
    })
    owner.on('Network.requestWillBeSent', ({ request }) => {
      if (!request.url.includes('google.firestore.v1.Firestore/Listen')) return
      const body = new URLSearchParams(request.postData || '')
      for (const value of body.values())
        if (value.includes('"addTarget"')) {
          ownerTargets++
          ownerRequests.push({ at: Date.now(), target: JSON.parse(value).addTarget })
        }
    })
    owner.on('Runtime.exceptionThrown', ({ exceptionDetails }) => {
      ownerConsole.push({
        at: Date.now(),
        exception: exceptionDetails.text,
        description: exceptionDetails.exception?.description,
      })
    })
    owner.on('Runtime.consoleAPICalled', ({ args, type }) => {
      if (args[0]?.value !== 'ML07_LIFECYCLE')
        ownerConsole.push({ at: Date.now(), type, args: args.map((a) => a.value || a.description) })
      if (args[0]?.value === 'ML07_LIFECYCLE') lifecycle.push(JSON.parse(args[1].value))
    })
    await owner.send('Page.enable')
    await owner.send('Runtime.enable')
    await owner.send('Network.enable')
    await owner.send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] })
    await owner.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
      window.__ml07Probe={ticks:0};setInterval(()=>__ml07Probe.ticks++,250);
      for(const type of ['freeze','resume']) document.addEventListener(type,()=>
        console.info('ML07_LIFECYCLE',JSON.stringify({type,ticks:__ml07Probe.ticks,at:Date.now(),visibility:document.visibilityState})));
    `,
    })
    await owner.send('Page.navigate', { url: 'http://127.0.0.1:9100/#/library' })
    await expect
      .poll(() => owner.evaluate('document.querySelector("[role=status]")?.textContent'), {
        timeout: 90000,
      })
      .toContain('Última instantánea')
    await expect
      .poll(() => owner.evaluate('document.querySelector(".library-page-summary")?.textContent'))
      .toContain('de 500 obras')
    expect(ownerTargets).toBe(1)
    expect(ownerSockets).toEqual([])
    expect(ownerNavigations).toHaveLength(1)
    const follower = await context.newPage()
    follower.on('request', (request) => {
      if (!request.url().includes('google.firestore.v1.Firestore/Listen')) return
      const body = new URLSearchParams(request.postData() || '')
      for (const value of body.values())
        if (value.includes('"addTarget"')) {
          followerTargets++
          followerRequests.push({ at: Date.now(), target: JSON.parse(value).addTarget })
        }
    })
    await follower.goto('/#/library')
    await expect(follower.locator('.library-page-summary')).toContainText('de 500 obras')
    await expect(follower.getByRole('status')).toContainText('Última instantánea')
    await follower
      .getByRole('textbox', { name: 'Buscar en la biblioteca', exact: true })
      .fill('Freeze 0')
    await expect(follower.locator('.manga-grid > .manga-card')).toHaveCount(1)
    expect(followerTargets).toBe(0)
    const recordCoordination = async (stage) =>
      coordination.push({
        stage,
        at: Date.now(),
        locks: await follower.evaluate(() => navigator.locks.query()),
      })
    await recordCoordination('before-freeze')
    await owner.send('Page.setWebLifecycleState', { state: 'frozen' })
    await expect.poll(() => lifecycle.filter((e) => e.type === 'freeze').length).toBe(1)
    const freezeObservedAt = Date.now()
    const recover = follower.getByRole('button', {
      name: 'Reintentar',
      exact: true,
    })
    await expect(recover).toBeVisible({ timeout: 30000 })
    // The suspended owner retires its listener and broadcasts a terminal error.
    // Keep it frozen for a real interval before the independent concurrent write.
    await new Promise((resolve) =>
      setTimeout(resolve, Math.max(0, 20000 - (Date.now() - freezeObservedAt))),
    )
    expect(lifecycle.some((event) => event.type === 'resume')).toBe(false)
    await recordCoordination('frozen-before-write')
    const concurrentWriteStartedAt = Date.now()
    await follower.getByRole('button', { name: 'Sumar un capítulo', exact: true }).click()
    // This is a separate emulator fixture confirmation, not an application listener.
    await expect
      .poll(async () => {
        let chapter
        // withSecurityRulesDisabled deliberately returns void, not the callback result.
        await env.withSecurityRulesDisabled(async (c) => {
          chapter = (
            await getDocFromServer(doc(c.firestore(), 'users', uid, 'mangas', '000000'))
          ).data()?.chapter
        })
        return chapter
      })
      .toBe('2')
    expect(followerTargets).toBe(0)
    await recover.click()
    const recoveryRequested = true
    await expect.poll(() => followerTargets).toBe(1)
    await recordCoordination('before-active-command')
    const resumedBeforeExplicitCommand = lifecycle.some((event) => event.type === 'resume')
    await owner.send('Page.setWebLifecycleState', { state: 'active' })
    await expect.poll(() => lifecycle.filter((e) => e.type === 'resume').length).toBe(1)
    await expect(
      follower.getByRole('button', { name: 'Editar capítulo actual: 2', exact: true }),
    ).toBeVisible({ timeout: 90000 })
    await expect(follower.getByRole('status')).toContainText('Última instantánea')
    await expect(recover).toBeHidden()
    await expect(
      follower.getByRole('textbox', { name: 'Buscar en la biblioteca', exact: true }),
    ).toHaveValue('Freeze 0')
    const freeze = lifecycle.find((e) => e.type === 'freeze'),
      resume = lifecycle.find((e) => e.type === 'resume')
    expect(freeze.visibility).toBe('hidden')
    expect(resume.ticks).toBe(freeze.ticks)
    expect(resume.at - freeze.at).toBeGreaterThan(15000)
    await recordCoordination('after-resume')
    ownerPageAfterResume = await owner
      .evaluate(
        `({url: location.href, heading: document.querySelector('h1')?.textContent, alert: document.querySelector('[role=alert]')?.textContent, status: document.querySelector('[role=status]')?.textContent, summary: document.querySelector('.library-page-summary')?.textContent})`,
      )
      .catch((error) => ({ error: error.message }))
    expect(ownerNavigations).toHaveLength(1)
    expect(ownerSockets).toEqual([])
    expect(coordination.at(-1).locks.held).toHaveLength(1)
    expect(ownerPageAfterResume.alert).toContain('suspendido')
    const resumeTargets = { owner: ownerTargets, follower: followerTargets }
    expect(followerTargets).toBe(1)
    await follower.goto('/#/settings/import-export')
    const download = follower.waitForEvent('download')
    await follower.getByRole('button', { name: 'Descargar JSON', exact: true }).click()
    const { readFile } = await import('node:fs/promises')
    const exported = JSON.parse(await readFile(await (await download).path(), 'utf8'))
    expect(exported.mangas).toHaveLength(500)
    expect(exported.mangas.find((item) => item.name === 'Freeze 0').chapter).toBe('2')
    const targetsAfterExport = followerTargets
    await follower.goto('/#/library')
    await expect(follower.getByRole('status')).toContainText('Última instantánea')
    await expect(
      follower.getByRole('textbox', { name: 'Buscar en la biblioteca', exact: true }),
    ).toHaveValue('Freeze 0')
    await follower.getByRole('textbox', { name: 'Buscar en la biblioteca', exact: true }).fill('')
    await expect(follower.locator('.library-page-summary')).toContainText('de 500 obras')
    await owner.send('Page.setWebLifecycleState', { state: 'frozen' })
    await expect.poll(() => lifecycle.filter((e) => e.type === 'freeze').length).toBe(2)
    await owner.close()
    // Closing the retired owner must not reopen the recovered listener.
    await new Promise((resolve) => setTimeout(resolve, 500))
    expect(followerTargets).toBe(targetsAfterExport)
    await expect(follower.getByRole('status')).toContainText('Última instantánea')
    await expect(follower.locator('.library-page-summary')).toContainText('de 500 obras')
    expect(external).toEqual([])
    expect(owner.errors).toEqual([])
    const result = {
      sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      sourceDirty: Boolean(
        execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim(),
      ),
      size: 500,
      browser: browser.version(),
      measuredAt: new Date().toISOString(),
      mechanism:
        'Native CDP Page.setWebLifecycleState on a hidden target in the isolated browser context',
      scope: 'Real document freeze/resume; not OS sleep, process suspension or Firefox lifecycle',
      lifecycle,
      coordination,
      ownerNavigations,
      ownerSockets,
      ownerSocketAttempts,
      frozenDurationMs: resume.at - freeze.at,
      frozenTimerTicks: resume.ticks - freeze.ticks,
      concurrentWriteStartedAt,
      recoveryRequested,
      resumedBeforeExplicitCommand,
      initialTargets: { owner: 1, follower: 0 },
      resumeTargets,
      confirmedConcurrentChapter: '2',
      exportedRecords: exported.mangas.length,
      targetsAfterExport,
      frozenOwnerCloseAdditionalTargets: followerTargets - targetsAfterExport,
      externalRequests: external.length,
      fixtureReadsExcludedFromApplicationTargets: true,
    }
    await writeFile(testInfo.outputPath('ml07-freeze.json'), JSON.stringify(result, null, 2) + '\n')
    console.log(JSON.stringify(result))
  } finally {
    await writeFile(
      testInfo.outputPath('ml07-freeze-diagnostics.json'),
      JSON.stringify(
        {
          lifecycle,
          coordination,
          ownerConsole,
          ownerNavigations,
          ownerSockets,
          ownerSocketAttempts,
          ownerPageAfterResume,
          ownerRequests,
          followerRequests,
          ownerTargets,
          followerTargets,
        },
        null,
        2,
      ) + '\n',
    )
    if (owner) {
      await owner.send('Page.setWebLifecycleState', { state: 'active' }).catch(() => {})
      await owner.close()
    }
    await env.cleanup()
  }
})

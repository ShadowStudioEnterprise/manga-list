import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve, relative, extname, isAbsolute } from 'node:path'
import { chromium, firefox } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Compiled public pages only. External requests fail the test; no Firebase startup.
const root = resolve(import.meta.dirname, '../docs/.vitepress/dist')
const evidence = resolve(import.meta.dirname, '../test-results/public-landing')
await mkdir(evidence, { recursive: true })
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
}
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    let file = resolve(root, `.${pathname}`)
    const local = relative(root, file)
    assert(!local.startsWith('..') && !isAbsolute(local))
    if (pathname.endsWith('/')) file = resolve(file, 'index.html')
    else if (!extname(file)) file += '.html'
    res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream')
    res.end(await readFile(file))
  } catch {
    res.writeHead(404).end('Not found')
  }
})
await new Promise((done) => server.listen(0, '127.0.0.1', done))
const origin = `http://127.0.0.1:${server.address().port}`
const results = { layouts: [], errors: [], externalRequests: [], failedRequests: [] }
let browser
try {
  for (const [name, engine] of [
    ['chromium', chromium],
    ['firefox', firefox],
  ]) {
    browser = await engine.launch()
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    await context.route('**/*', (route) => {
      if (new URL(route.request().url()).origin !== origin) {
        results.externalRequests.push(route.request().url())
        return route.abort()
      }
      return route.continue()
    })
    const page = await context.newPage()
    page.on('pageerror', (error) => results.errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') results.errors.push(message.text())
    })
    page.on('response', (response) => {
      if (response.status() >= 400) results.failedRequests.push(response.url())
    })
    page.setDefaultTimeout(15000)
    for (const mode of ['light', 'dark']) {
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.emulateMedia({ colorScheme: mode, reducedMotion: 'reduce' })
        await page.goto(origin)
        await page.locator('.lp-hero').waitFor()
        await page.evaluate(
          (mode) => document.documentElement.classList.toggle('dark', mode === 'dark'),
          mode,
        )
        await page.evaluate(() => document.fonts.ready)
        // Firefox does not start decoding an offscreen lazy image until it is requested.
        for (const image of await page.locator('.ml-landing img').all()) {
          await image.scrollIntoViewIfNeeded()
        }
        await page.waitForFunction(() =>
          [...document.querySelectorAll('.ml-landing img')].every(
            (img) => img.complete && img.naturalWidth > 0,
          ),
        )
        assert.equal(await page.locator('h1').count(), 1)
        assert.equal(await page.getByRole('main').count(), 1, 'One main landmark')
        assert.equal(await page.getByRole('main').locator('h1').count(), 1)
        assert(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          `${name}/${mode}/${width}: overflow ${JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.ml-landing *')].filter((el) => el.getBoundingClientRect().right > innerWidth + 1).map((el) => ({ tag: el.tagName, cls: el.className, right: el.getBoundingClientRect().right }))))}`,
        )
        assert(
          await page.locator('.ml-landing img').evaluateAll(async (images) => {
            await Promise.all(images.map((img) => img.decode()))
            return images.every((img) => img.naturalWidth > 0 && img.alt.length > 30)
          }),
        )
        const scan = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze()
        assert.deepEqual(scan.violations, [], JSON.stringify(scan.violations))
        for (const link of await page.locator('.lp-section-nav a').all()) {
          const hash = await link.getAttribute('href')
          await link.click()
          assert.equal(new URL(page.url()).hash, hash)
          assert(await page.locator(hash).isVisible())
        }
        for (const detail of await page.locator('.lp-questions details').all()) {
          await detail.locator('summary').focus()
          await page.keyboard.press('Enter')
          assert(await detail.evaluate((element) => element.open), 'FAQ opens by keyboard')
          assert(await detail.locator('p').isVisible())
          await page.keyboard.press('Space')
          assert(!(await detail.evaluate((element) => element.open)), 'FAQ closes by keyboard')
        }
        if (name === 'chromium') {
          await page.evaluate(() => window.scrollTo(0, 0))
          await page.screenshot({
            path: resolve(evidence, `${name}-${mode}-${width}.png`),
            fullPage: true,
          })
        }
        results.layouts.push({ browser: name, mode, width, violations: 0, overflow: false })
      }
    }
    await page.goto(origin)
    await page.keyboard.press('Tab')
    assert.equal((await page.locator(':focus').textContent()).trim(), 'Saltar al contenido')
    await page.keyboard.press('Enter')
    assert.equal(new URL(page.url()).hash, '#VPContent')
    const cta = page.getByRole('link', { name: 'Abrir MangaList Beta' })
    assert.equal(await cta.getAttribute('href'), 'https://mangalist-61bb8.web.app')
    assert.equal(
      await page.getByRole('link', { name: 'Empezar en MangaList Beta' }).getAttribute('href'),
      'https://mangalist-61bb8.web.app',
    )
    await cta.focus()
    assert(await cta.evaluate((element) => getComputedStyle(element).outlineStyle !== 'none'))
    await page.keyboard.press('ControlOrMeta+k')
    await page.locator('#localsearch-input').fill('sincronización')
    await page.locator('.VPLocalSearchBox .result').first().waitFor()
    await page.keyboard.press('Escape')
    await page.locator('.VPLocalSearchBox').waitFor({ state: 'hidden' })
    await page.getByRole('link', { name: 'Portal técnico', exact: true }).last().click()
    await page.waitForURL('**/project/')
    await page.locator('.ml-hero').waitFor()
    await page.locator('.ml-primary').click()
    await page.waitForURL('**/guide/introduction')
    await page.locator('.vp-doc h1').waitFor()
    // Readable, semantic content and FAQ before hydration / with JavaScript disabled.
    const staticPage = await browser.newPage({ javaScriptEnabled: false })
    await staticPage.goto(origin)
    assert.equal(await staticPage.locator('h1').count(), 1)
    assert.equal(await staticPage.getByRole('main').count(), 1)
    assert.equal(await staticPage.getByRole('main').locator('h1').count(), 1)
    await staticPage.locator('.lp-questions summary').first().click()
    assert(
      await staticPage
        .locator('.lp-questions details')
        .first()
        .evaluate((el) => el.open),
    )
    assert.equal(
      await staticPage.locator('link[rel="canonical"]').getAttribute('href'),
      'https://mangalist-docs.web.app/',
    )
    for (const selector of [
      'meta[name="description"]',
      'meta[property="og:title"]',
      'meta[property="og:description"]',
      'meta[property="og:url"]',
      'meta[property="og:image"]',
      'meta[name="twitter:card"]',
    ]) {
      assert((await staticPage.locator(selector).getAttribute('content')).length > 10)
    }
    await staticPage.close()
    await browser.close()
    browser = null
  }
  assert.deepEqual(results.errors, [])
  assert.deepEqual(results.externalRequests, [])
  assert.deepEqual(results.failedRequests, [])
  console.log(
    `PASS: ${results.layouts.length} layouts; Chromium/Firefox; WCAG AA scans; FAQ keyboard; skip link; CTA destinations; portal/guide; SSR/SEO; zero external requests`,
  )
} catch (error) {
  results.failure = error.message
  throw error
} finally {
  await writeFile(resolve(evidence, 'results.json'), JSON.stringify(results, null, 2))
  await browser?.close()
  await new Promise((done) => server.close(done))
}

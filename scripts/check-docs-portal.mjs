import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { resolve, extname, relative, sep } from 'node:path'
import { chromium, firefox } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Local, compiled portal only. No Firebase credentials, API calls or deployment.
const root = resolve(import.meta.dirname, '..')
const output = resolve(root, process.env.DOCS_EVIDENCE_DIR || 'test-results/docs-portal')
await mkdir(output, { recursive: true })
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
}
async function serve(folder) {
  const server = createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
      let path = resolve(folder, `.${pathname}`)
      assert(!relative(folder, path).startsWith('..'))
      if (pathname.endsWith('/')) path = resolve(path, 'index.html')
      else if (!extname(path)) path += '.html'
      res.setHeader('Content-Type', mime[extname(path)] || 'application/octet-stream')
      res.end(await readFile(path))
    } catch {
      res.writeHead(404).end('Not found')
    }
  })
  await new Promise((done) => server.listen(0, '127.0.0.1', done))
  return {
    origin: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((done) => server.close(done)),
  }
}
const errors = []
const blocked = []
const results = { browsers: [], accessibility: [], layouts: [], links: 0, pages: 0 }
const site = await serve(resolve(root, 'docs/.vitepress/dist'))
let browser
try {
  browser = await chromium.launch()
  const context = await browser.newContext()
  context.setDefaultTimeout(15000)
  context.setDefaultNavigationTimeout(15000)
  await context.route('**/*', (route) => {
    if (new URL(route.request().url()).origin !== site.origin) {
      blocked.push(route.request().url())
      return route.abort()
    }
    return route.continue()
  })
  const page = await context.newPage()
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  for (const mode of ['light', 'dark']) {
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      await page.emulateMedia({ colorScheme: mode, reducedMotion: 'reduce' })
      await page.goto(site.origin)
      await page.locator('.ml-hero').waitFor()
      await page.evaluate((theme) => {
        document.documentElement.classList.toggle('dark', theme === 'dark')
      }, mode)
      await page.evaluate(() => document.fonts.ready)
      assert.equal(await page.locator('h1').count(), 1)
      assert.equal(await page.locator('#sobre-mangalist').count(), 1, 'Historical home anchor')
      await page.screenshot({ path: resolve(output, `after-${mode}-${width}.png`), fullPage: true })
      if (!(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))) {
        console.log(
          await page.evaluate(() =>
            [...document.querySelectorAll('body *')]
              .filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
              .map((e) => ({
                tag: e.tagName,
                class: e.className,
                width: e.getBoundingClientRect().width,
                right: e.getBoundingClientRect().right,
              })),
          ),
        )
      }
      assert(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `Overflow ${mode}/${width}`,
      )
      const axe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
      results.accessibility.push({ page: '/', mode, width, violations: axe.violations })
      assert.equal(axe.violations.length, 0, JSON.stringify(axe.violations))
      results.layouts.push({ mode, width, overflow: false })
      await page.screenshot({ path: resolve(output, `after-${mode}-${width}.png`), fullPage: true })
    }
  }
  console.log('PASS: eight home layouts and WCAG AA scans')
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto(site.origin)
  await page.getByRole('switch', { name: 'Cambiar a modo oscuro' }).click()
  await page.locator('html.dark').waitFor()
  await page.reload()
  await page.locator('html.dark').waitFor()
  await page.getByRole('switch', { name: 'Cambiar a modo claro' }).click()
  await page.locator('html:not(.dark)').waitFor()
  await page.goto(site.origin)
  await page.keyboard.press('Tab')
  assert.equal(await page.locator(':focus').textContent(), 'Saltar al contenido')
  await page.keyboard.press('Enter')
  assert.equal(await page.evaluate(() => location.hash), '#VPContent')
  await page.locator('.ml-primary').focus()
  assert(
    await page
      .locator('.ml-primary')
      .evaluate((element) => getComputedStyle(element).outlineStyle !== 'none'),
  )
  await page.locator('.ml-primary').click()
  await page.waitForURL('**/guide/introduction')
  await page.locator('.vp-doc h1').waitFor()
  await page.getByRole('button', { name: 'Buscar en la documentación' }).click()
  await page.locator('#localsearch-input').fill('sincronización')
  await page.locator('.VPLocalSearchBox .result').first().waitFor()
  await page.screenshot({ path: resolve(output, 'search.png') })
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await page.locator('.VPLocalSearchBox').waitFor({ state: 'hidden' })
  assert(new URL(page.url()).pathname !== '/', 'Search opens a document')
  for (const mode of ['light', 'dark']) {
    await page.goto(`${site.origin}/guide/introduction`)
    await page.evaluate(
      (theme) => document.documentElement.classList.toggle('dark', theme === 'dark'),
      mode,
    )
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    results.accessibility.push({ page: '/guide/introduction', mode, violations: axe.violations })
    assert.equal(axe.violations.length, 0, JSON.stringify(axe.violations))
    await page.screenshot({ path: resolve(output, `guide-${mode}.png`), fullPage: true })
  }
  console.log('PASS: keyboard, search and document WCAG AA scans')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(site.origin)
  await page.getByRole('button', { name: 'mobile navigation' }).click()
  await page.locator('.VPNavScreen').getByRole('link', { name: 'Guía', exact: true }).click()
  await page.waitForURL('**/guide/introduction')
  await page.getByRole('button', { name: 'Secciones' }).click()
  console.log('Mobile sidebar opened')
  await page.locator('.VPSidebar').getByRole('link', { name: 'Instalación', exact: true }).click()
  await page.waitForURL('**/development/installation')
  console.log('PASS: mobile navigation and sidebar')

  // ML-03: compiled original SVGs and document layouts, entirely local.
  const diagramPaths = [
    'components',
    'data',
    'auth',
    'sync',
    'loading',
    'import',
    'export',
    'deletion',
    'manual',
  ]
  results.diagrams = []
  for (const id of diagramPaths) {
    const response = await context.request.get(`${site.origin}/diagrams/${id}.svg`)
    assert(response.ok(), `Missing diagram ${id}`)
    const source = await response.text()
    const svgCheck = await page.evaluate((source) => {
      const doc = new DOMParser().parseFromString(source, 'image/svg+xml')
      const svg = doc.documentElement
      if (doc.querySelector('parsererror')) return { error: 'Invalid XML' }
      const forbidden = doc.querySelector('script, foreignObject, image, a, style')
      // Namespace URL is a declaration, not a network resource.
      const cleanUnsafe = [...doc.querySelectorAll('*')].some((element) =>
        [...element.attributes].some(
          (attribute) =>
            attribute.name !== 'xmlns' &&
            (/^on/i.test(attribute.name) || /(?:https?:|javascript:)/i.test(attribute.value)),
        ),
      )
      if (forbidden || cleanUnsafe) return { error: 'Active or external SVG content' }
      if (!doc.querySelector('title')?.textContent || !doc.querySelector('desc')?.textContent)
        return { error: 'Missing accessible SVG name/description' }
      const holder = document.createElement('div')
      holder.style.cssText = 'position:absolute;left:-10000px;width:320px'
      const mounted = document.importNode(svg, true)
      holder.append(mounted)
      document.body.append(holder)
      const clipped = [...mounted.querySelectorAll('text')]
        .filter((text) => {
          const box = text.getBBox()
          return box.x < 16 || box.x + box.width > 304
        })
        .map((text) => text.textContent)
      holder.remove()
      return { error: null, clipped }
    }, source)
    assert.equal(svgCheck.error, null, `${id}: ${svgCheck.error}`)
    assert.deepEqual(svgCheck.clipped, [], `Clipped labels: ${id}`)
    results.diagrams.push({ id, valid: true, clipped: false })
  }
  // Fixed SVG palette: normal text, accent labels and arrows against their surfaces.
  const luminance = (hex) => {
    const rgb = hex.match(/../g).map((pair) => parseInt(pair, 16) / 255)
    const linear = rgb.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722
  }
  results.diagramContrast = [
    ['222139', 'ffffff'],
    ['4338ca', 'ffffff'],
    ['4338ca', 'f1f0fa'],
  ].map(([foreground, background]) => {
    const ratio = (luminance(background) + 0.05) / (luminance(foreground) + 0.05)
    assert(ratio >= 4.5)
    return { foreground, background, ratio }
  })
  for (const mode of ['light', 'dark']) {
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto(`${site.origin}/architecture/diagrams`)
      await page.locator('.ml-diagram').first().waitFor()
      await page.evaluate((theme) => {
        document.documentElement.classList.toggle('dark', theme === 'dark')
      }, mode)
      assert.equal(await page.locator('.ml-diagram img').count(), diagramPaths.length)
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      const images = await page.locator('.ml-diagram img').evaluateAll(async (images) => {
        await Promise.all(images.map((img) => img.decode()))
        return images.every((img) => img.naturalWidth > 0 && img.alt.length > 30)
      })
      assert(images, 'All diagram images must decode and have meaningful alternatives')
      const smallestNodeTextPx = await page
        .locator('.ml-diagram img')
        .evaluateAll((images) =>
          Math.min(...images.map((img) => (14.5 * img.getBoundingClientRect().width) / 320)),
        )
      assert(smallestNodeTextPx >= 12, 'Diagram node text must remain readable on mobile')
      const axe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
      results.accessibility.push({
        page: '/architecture/diagrams',
        mode,
        width,
        violations: axe.violations,
      })
      assert.equal(axe.violations.length, 0, JSON.stringify(axe.violations))
      results.layouts.push({
        page: '/architecture/diagrams',
        mode,
        width,
        overflow: false,
        smallestNodeTextPx,
      })
      if ([320, 1440].includes(width)) {
        await page.screenshot({
          path: resolve(output, `diagrams-${mode}-${width}.png`),
          fullPage: true,
        })
      }
      if (width === 320) {
        await page
          .locator('.ml-diagram')
          .first()
          .screenshot({
            path: resolve(output, `component-detail-${mode}.png`),
          })
        await page
          .locator('.ml-diagram')
          .last()
          .screenshot({
            path: resolve(output, `manual-detail-${mode}.png`),
          })
      }
    }
  }
  console.log('PASS: nine SVGs, label bounds, contrast, eight diagram layouts and WCAG AA scans')

  // Check every compiled HTML link, including hrefs rendered by Vue components,
  // canonical legal pages, historical routes and measurement downloads.
  const folder = resolve(root, 'docs/.vitepress/dist')
  const htmlFiles = (await readdir(folder, { recursive: true })).filter((file) =>
    file.endsWith('.html'),
  )
  const checkedLinks = new Set()
  for (const file of htmlFiles) {
    const url = `${site.origin}/${file.split(sep).join('/')}`
    const links = await page.evaluate(async (url) => {
      const doc = new DOMParser().parseFromString(await (await fetch(url)).text(), 'text/html')
      return [...doc.querySelectorAll('a[href]')].map(
        (a) => new URL(a.getAttribute('href'), url).href,
      )
    }, url)
    for (const link of new Set(links)) {
      const target = new URL(link)
      if (target.origin !== site.origin) continue
      if (checkedLinks.has(link)) continue
      const response = await context.request.get(link)
      assert(response.ok(), `${file}: ${link}: ${response.status()}`)
      if (target.hash && response.headers()['content-type']?.includes('text/html')) {
        const exists = await page.evaluate(
          ({ html, hash }) => {
            const doc = new DOMParser().parseFromString(html, 'text/html')
            return Boolean(doc.getElementById(decodeURIComponent(hash.slice(1))))
          },
          { html: await response.text(), hash: target.hash },
        )
        assert(exists, `Missing anchor ${file}: ${link}`)
      }
      results.links++
      checkedLinks.add(link)
    }
    results.pages++
  }
  console.log(`PASS: ${results.links} internal links across ${results.pages} HTML pages`)
  results.browsers.push(
    'Chromium: layouts, WCAG AA, keyboard, search, mobile navigation, sidebar, links',
  )
  await browser.close()
  browser = await firefox.launch()
  const ffPage = await browser.newPage({ viewport: { width: 390, height: 844 } })
  ffPage.setDefaultTimeout(15000)
  await ffPage.route('**/*', (route) =>
    new URL(route.request().url()).origin === site.origin ? route.continue() : route.abort(),
  )
  ffPage.on('pageerror', (error) => errors.push(error.message))
  await ffPage.goto(site.origin)
  await ffPage.locator('.ml-primary').click()
  await ffPage.waitForURL('**/guide/introduction')
  assert(await ffPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  results.browsers.push('Firefox: mobile guide navigation and overflow')
  await ffPage.goto(`${site.origin}/architecture/diagrams`)
  await ffPage.locator('.ml-diagram img').last().waitFor()
  assert.equal(await ffPage.locator('.ml-diagram img').count(), 9)
  assert(await ffPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  results.browsers.push('Firefox: mobile diagram route, images and overflow')
  assert.deepEqual(errors, [])
  assert.deepEqual(blocked, [])
  results.errors = errors
  results.externalRequests = blocked

  if (process.env.DOCS_BASELINE_DIR) {
    const baselineFiles = (
      await readdir(resolve(process.env.DOCS_BASELINE_DIR), { recursive: true })
    ).filter((file) => file.endsWith('.html'))
    assert(
      baselineFiles.every((file) => htmlFiles.includes(file)),
      'A historical HTML route was removed',
    )
    results.preservedBaselineRoutes = baselineFiles.length
    await browser.close()
    browser = await chromium.launch()
    const baseline = await serve(resolve(process.env.DOCS_BASELINE_DIR))
    try {
      for (const width of [390, 1440]) {
        const before = await browser.newPage({
          viewport: { width, height: 1000 },
          colorScheme: 'light',
        })
        await before.goto(baseline.origin)
        await before.locator('.VPHero').waitFor()
        await before.screenshot({ path: resolve(output, `before-${width}.png`), fullPage: true })
        await before.close()
      }
    } finally {
      await baseline.close()
    }
  }
  console.log(JSON.stringify(results, null, 2))
} catch (error) {
  results.failure = error.message
  throw error
} finally {
  await writeFile(resolve(output, 'results.json'), JSON.stringify(results, null, 2))
  await browser?.close()
  await site.close()
}

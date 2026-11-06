import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, relative, resolve, sep } from 'node:path'
import { gzipSync } from 'node:zlib'
import { chromium } from '@playwright/test'

const [spa = 'dist/spa', pwa = 'dist/pwa', docs = 'docs/.vitepress/dist'] = process.argv.slice(2)
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.woff2': 'font/woff2',
}

async function measure(browser, directory, routes) {
  const root = resolve(directory)
  const assets = new Map()
  for (const file of await readdir(root, { recursive: true })) {
    if (!['.js', '.css'].includes(extname(file))) continue
    const bytes = await readFile(resolve(root, file))
    assets.set(file.split(sep).join('/'), { raw: bytes.length, gzip: gzipSync(bytes).length })
  }
  function summarize(files) {
    return {
      files: files.length,
      raw: files.reduce((total, file) => total + assets.get(file).raw, 0),
      gzip: files.reduce((total, file) => total + assets.get(file).gzip, 0),
    }
  }

  const server = createServer(async (request, response) => {
    try {
      let pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
      if (pathname.endsWith('/')) pathname += 'index.html'
      else if (!extname(pathname)) pathname += '.html'
      const file = resolve(root, `.${pathname}`)
      assert(!relative(root, file).startsWith('..'))
      const bytes = await readFile(file)
      response.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream')
      response.end(bytes)
    } catch {
      response.writeHead(404).end()
    }
  })
  await new Promise((done) => server.listen(0, '127.0.0.1', done))
  const origin = `http://127.0.0.1:${server.address().port}`
  const entrypoints = {}
  try {
    for (const [route, heading] of routes) {
      const context = await browser.newContext({ serviceWorkers: 'block' })
      try {
        const external = []
        await context.route('**/*', (requestRoute) => {
          const url = new URL(requestRoute.request().url())
          if (url.origin === origin) return requestRoute.continue()
          external.push(url.origin)
          return requestRoute.abort()
        })
        const files = new Set()
        const page = await context.newPage()
        page.on('response', (response) => {
          const file = decodeURIComponent(new URL(response.url()).pathname.slice(1))
          if (response.ok() && assets.has(file)) files.add(file)
        })
        await page.goto(origin + route, { waitUntil: 'networkidle' })
        await page.getByRole('heading', { level: 1, name: heading }).waitFor()
        assert.deepEqual(external, [], `Unexpected requests from ${route}`)
        entrypoints[route] = summarize([...files])
      } finally {
        await context.close()
      }
    }
  } finally {
    await new Promise((done) => server.close(done))
  }
  const largestJs = [...assets]
    .filter(([file]) => file.endsWith('.js'))
    .sort(([, left], [, right]) => right.raw - left.raw)
    .slice(0, 3)
    .map(([file, sizes]) => ({ file, ...sizes }))
  return { all: summarize([...assets.keys()]), entrypoints, largestJs }
}

const browser = await chromium.launch()
try {
  const appRoutes = [['/#/login', 'Inicia sesión']]
  const results = {
    spa: await measure(browser, spa, appRoutes),
    pwa: await measure(browser, pwa, appRoutes),
    docs: await measure(browser, docs, [
      ['/', /Cada lectura/i],
      ['/project/', /Cada lectura/i],
      ['/operations/deployment', 'Despliegues'],
    ]),
  }
  console.log(JSON.stringify(results, null, 2))
} finally {
  await browser.close()
}

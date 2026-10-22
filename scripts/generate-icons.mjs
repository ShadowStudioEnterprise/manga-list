import { chromium } from '@playwright/test'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const source = readFileSync(resolve(root, 'public/icons/mangalist.svg'), 'utf8')
const sizes = {
  'apple-icon-120x120.png': 120,
  'apple-icon-152x152.png': 152,
  'apple-icon-167x167.png': 167,
  'apple-icon-180x180.png': 180,
  'favicon-128x128.png': 128,
  'favicon-16x16.png': 16,
  'favicon-32x32.png': 32,
  'favicon-96x96.png': 96,
  'icon-128x128.png': 128,
  'icon-192x192.png': 192,
  'icon-256x256.png': 256,
  'icon-384x384.png': 384,
  'icon-512x512.png': 512,
  'ms-icon-144x144.png': 144,
}
const hash = (buffer) => createHash('sha256').update(buffer).digest('hex')
const browser = await chromium.launch()
const files = {}
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 })
  await page.route('**/*', (route) => route.abort())
  for (const [name, size] of Object.entries(sizes)) {
    await page.setViewportSize({ width: size, height: size })
    await page.setContent(
      `<style>html,body{margin:0}svg{display:block;width:100vw;height:100vh}</style>${source}`,
    )
    const png = await page.screenshot({ omitBackground: true })
    writeFileSync(resolve(root, 'public/icons', name), png)
    files[`public/icons/${name}`] = { width: size, height: size, sha256: hash(png) }
  }
} finally {
  await browser.close()
}

// ICO containing the original 32px PNG; no external conversion or artwork.
const png = readFileSync(resolve(root, 'public/icons/favicon-32x32.png'))
const header = Buffer.alloc(22)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(1, 4)
header[6] = 32
header[7] = 32
header.writeUInt16LE(1, 10)
header.writeUInt16LE(32, 12)
header.writeUInt32LE(png.length, 14)
header.writeUInt32LE(22, 18)
const ico = Buffer.concat([header, png])
writeFileSync(resolve(root, 'public/favicon.ico'), ico)
files['public/favicon.ico'] = { width: 32, height: 32, sha256: hash(ico) }

const mask =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M76 142c58-20 120-13 180 23 60-36 122-43 180-23v228c-61-19-119-12-180 22-61-34-119-41-180-22Z"/></svg>\n'
writeFileSync(resolve(root, 'public/icons/safari-pinned-tab.svg'), mask)
files['public/icons/safari-pinned-tab.svg'] = { sha256: hash(mask) }
writeFileSync(
  resolve(root, 'docs/measurements/ml14-original-icons.json'),
  JSON.stringify(
    {
      source: 'public/icons/mangalist.svg',
      sourceSha256: hash(source),
      method:
        'Original geometric SVG created for MangaList with Codex assistance; local Chromium rasterization, no external images, fonts or network.',
      license: 'Apache-2.0',
      files,
    },
    null,
    2,
  ) + '\n',
)
console.log('Generated original MangaList icons and provenance hashes.')

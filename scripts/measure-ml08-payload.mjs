import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

// Offline desktop Chromium microbenchmark. A mobile viewport is NOT mobile hardware.
const browser = await chromium.launch({ headless: true })
const source = await readFile('src/services/export-service.js', 'utf8')
const results = []
try {
  for (const profile of ['notes1k', 'notes5k', 'maxUnicode']) {
    const sizes = profile === 'maxUnicode' ? [100, 500, 1000] : [100, 500, 1000, 2500, 5000, 10000]
    for (const size of sizes) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
      // No network is permitted; all data and the real export module are supplied locally.
      await context.route('**/*', (route) => route.abort())
      const page = await context.newPage()
      const cdp = await context.newCDPSession(page)
      await cdp.send('HeapProfiler.collectGarbage')
      const before = await cdp.send('Runtime.getHeapUsage')
      const row = await page.evaluate(
        async ({ source, profile, size }) => {
          const service = await import(`data:text/javascript;base64,${btoa(source)}`)
          const start = performance.now()
          const large = profile === 'maxUnicode'
          const char = large ? '界' : 'a'
          const items = Array.from({ length: size }, (_, i) => ({
            id: String(i).padStart(6, '0'),
            schemaVersion: 1,
            name: `Synthetic ${i}`,
            normalizedName: `synthetic-${i}`,
            chapter: '1',
            type: 'manga',
            genres: large
              ? Array.from({ length: 20 }, (_, j) => `${j}`.padEnd(60, char))
              : ['Acción'],
            readingStatus: 'following',
            publicationStatus: 'unknown',
            sources: large
              ? Array.from({ length: 10 }, (_, j) => ({
                  id: `source-${j}`.padEnd(100, char),
                  name: `Source ${j}`.padEnd(100, char),
                  url: `https://example.invalid/${j}/`.padEnd(2048, char),
                  isPrimary: j === 0,
                }))
              : [],
            notes: `${i}:`.padEnd(profile === 'notes1k' ? 1000 : 5000, char),
            favorite: false,
            createdAt: new Date('2026-01-01T00:00:00Z'),
            updatedAt: new Date('2026-01-01T00:00:00Z'),
          }))
          const rawBytes = new TextEncoder().encode(JSON.stringify(items)).byteLength
          // Hold independent copies, as separate tabs/broadcast consumers may do.
          const copies = [structuredClone(items), structuredClone(items)]
          const serializeStart = performance.now()
          const exported = service.exportLibraryToJson(items)
          const exportMs = performance.now() - serializeStart
          const parsed = JSON.parse(exported)
          if (parsed.length !== size || parsed.at(-1).id !== items.at(-1).id)
            throw new Error('Lost export data')
          globalThis.ml08Held = { items, copies, exported, parsed }
          return {
            profile,
            size,
            rawJsonBytes: rawBytes,
            bytesPerWorkIncludingJsonEnvelope: rawBytes / size,
            prettyExportBytes: new TextEncoder().encode(exported).byteLength,
            generationCloneExportParseMs: performance.now() - start,
            exportMs,
            retainedRepresentations:
              'library, two structured clones, pretty export string, parsed export',
          }
        },
        { source, profile, size },
      )
      await cdp.send('HeapProfiler.collectGarbage')
      const after = await cdp.send('Runtime.getHeapUsage')
      assert.ok(row.rawJsonBytes > 0)
      results.push({ ...row, retainedHeapDeltaBytes: after.usedSize - before.usedSize })
      await context.close()
    }
  }
  const result = {
    measuredAt: new Date().toISOString(),
    browser: browser.version(),
    scope:
      'Synthetic offline desktop Chromium, 390x844 viewport. NOT mobile device RAM, app/SDK peak heap, wire bytes, Firestore storage or billed bandwidth.',
    largeProfileCap:
      'maxUnicode measured only through 1000 to bound the benchmark; larger libraries require extrapolation or a physical device test',
    results,
  }
  const output = process.argv[process.argv.indexOf('--output') + 1]
  assert.ok(process.argv.includes('--output') && output, 'Use --output path')
  await writeFile(output, JSON.stringify(result, null, 2) + '\n')
  console.log(`Recorded ${results.length} offline synthetic samples; no production access.`)
} finally {
  await browser.close()
}

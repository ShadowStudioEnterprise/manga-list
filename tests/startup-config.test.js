import test from 'node:test'
import assert from 'node:assert/strict'
import { loadModule } from './helpers/load-module.js'

const { default: configure } = await loadModule('quasar.config.js', {
  './scripts/build-info.mjs': {
    collectBuildInfo: () => ({}),
    buildInfoPlugin: () => ({ name: 'build-info' }),
  },
  './scripts/legal-notices.mjs': { legalNoticesPlugin: () => ({ name: 'legal' }) },
})
const appPaths = { resolve: { app: (path) => path } }

test('SPA development prebundles boot SDKs without changing existing discovery or HMR', () => {
  const config = {
    optimizeDeps: { entries: ['index.html'], include: ['existing'], exclude: ['excluded'] },
    server: { hmr: true },
  }
  configure({ dev: true, mode: { spa: true }, appPaths }).build.extendViteConf(config)
  for (const sdk of ['firebase/app', 'firebase/auth', 'firebase/firestore', 'vue-i18n']) {
    assert.ok(config.optimizeDeps.include.includes(sdk))
  }
  assert.ok(config.optimizeDeps.include.includes('existing'))
  assert.deepEqual(config.optimizeDeps.entries, ['index.html'])
  assert.deepEqual(config.optimizeDeps.exclude, ['excluded'])
  assert.equal(config.server.hmr, true)
  assert.equal(config.optimizeDeps.noDiscovery, undefined)
  assert.equal(config.optimizeDeps.force, undefined)
})

test('production and other development modes retain their optimizer configuration', () => {
  for (const ctx of [
    { dev: false, mode: { spa: true } },
    { dev: false, mode: { pwa: true } },
    { dev: true, mode: { pwa: true } },
  ]) {
    const config = { optimizeDeps: { entries: ['original'], include: ['original'] } }
    configure({ ...ctx, appPaths }).build.extendViteConf(config)
    assert.deepEqual(config.optimizeDeps, { entries: ['original'], include: ['original'] })
  }
})

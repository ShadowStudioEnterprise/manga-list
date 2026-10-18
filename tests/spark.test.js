import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join, delimiter } from 'node:path'
import { spawnSync } from 'node:child_process'
import {
  validateConfig,
  validateRemote,
  validateClientSource,
  validateDependencyManifest,
  checkLocal,
} from '../scripts/check-spark.mjs'
import { createSparkBudget } from '../src/utils/spark-budget.js'
import { loadModule } from './helpers/load-module.js'
import * as firestore from 'firebase/firestore'

const config = JSON.parse(readFileSync(new URL('../firebase.json', import.meta.url)))
const policy = JSON.parse(readFileSync(new URL('../spark-policy.json', import.meta.url)))

test('deployment guard CLI accepts only successful unlinked evidence and fails closed', () => {
  const folder = mkdtempSync(join(tmpdir(), 'mangalist-spark-'))
  const database = {
    name: `projects/${policy.project}/databases/(default)`,
    type: 'FIRESTORE_NATIVE',
    databaseEdition: 'STANDARD',
  }
  try {
    for (const enabled of [false, true, null]) {
      const billing = { name: `projects/${policy.project}/billingInfo`, billingEnabled: enabled }
      const mock =
        process.platform === 'win32'
          ? `@echo off\r\nif "%~1"=="billing" echo ${JSON.stringify(billing)}\r\nif "%~1"=="firestore" echo ${JSON.stringify(database)}\r\n`
          : `#!/bin/sh\ncase "$1" in\nbilling) printf '%s\\n' '${JSON.stringify(billing)}';;\nfirestore) printf '%s\\n' '${JSON.stringify(database)}';;\nesac\n`
      writeFileSync(join(folder, process.platform === 'win32' ? 'gcloud.cmd' : 'gcloud'), mock, {
        mode: 0o755,
      })
      const env = { ...process.env }
      const pathKey = Object.keys(env).find((key) => key.toLowerCase() === 'path') || 'PATH'
      env[pathKey] = `${folder}${delimiter}${env[pathKey] || ''}`
      delete env.GCLOUD_PROJECT
      const result = spawnSync(process.execPath, ['scripts/check-spark.mjs', '--remote'], {
        cwd: resolve(import.meta.dirname, '..'),
        env,
        encoding: 'utf8',
        timeout: 10000,
      })
      assert.equal(result.status, enabled === false ? 0 : 1, result.stderr)
    }
  } finally {
    assert.ok(resolve(folder).startsWith(resolve(tmpdir())))
    rmSync(folder, { recursive: true, force: true })
  }
})

test('Spark policy rejects paid services, dynamic rewrites, changed targets and missing guard', () => {
  checkLocal()
  for (const mutate of [
    (c) => {
      c.functions = {}
    },
    (c) => {
      c.storage = {}
    },
    (c) => {
      c.extensions = {}
    },
    (c) => {
      c.apphosting = {}
    },
    (c) => {
      c.hosting.rewrites = [{ source: '**', run: { serviceId: 'api' } }]
    },
    (c) => {
      c.hosting.predeploy = []
    },
    (c) => {
      c.hosting.site = 'other'
    },
    (c) => {
      c.hosting.source = '.'
    },
  ]) {
    const changed = structuredClone(config)
    mutate(changed)
    assert.throws(() => validateConfig(changed, policy))
  }
  assert.throws(() => validateConfig(config, { ...policy, billingAllowed: true }))
})

test('remote deployment evidence must be explicit, current project, unlinked billing and Standard', () => {
  const billing = { name: `projects/${policy.project}/billingInfo`, billingEnabled: false }
  const database = {
    name: `projects/${policy.project}/databases/(default)`,
    type: 'FIRESTORE_NATIVE',
    databaseEdition: 'STANDARD',
  }
  validateRemote(billing, database, policy.project)
  for (const bad of [
    {},
    { ...billing, billingEnabled: true },
    { ...billing, billingAccountName: 'billingAccounts/test' },
    { ...billing, name: 'other' },
  ]) {
    assert.throws(() => validateRemote(bad, database, policy.project))
  }
  for (const bad of [
    {},
    { ...database, databaseEdition: 'ENTERPRISE' },
    { ...database, name: 'other' },
  ]) {
    assert.throws(() => validateRemote(billing, bad, policy.project))
  }
})

test('admission budgets stop bursts and reset only after the time window', () => {
  let time = 0
  const budget = createSparkBudget(() => time)
  for (const [kind, max] of [
    ['read', 60],
    ['write', 120],
    ['listen', 3],
    ['auth', 10],
  ]) {
    for (let i = 0; i < max; i++) budget.take(kind)
    assert.throws(() => budget.take(kind), { code: 'app/request-budget' })
  }
  time = 60000
  budget.take('read')
  budget.record({ code: 'resource-exhausted' })
  for (const kind of ['read', 'write', 'listen', 'auth'])
    assert.throws(() => budget.take(kind), { code: 'app/quota-paused' })
  time += 15 * 60000
  budget.take('read')
})

test('oversized listener rejects partial data and unsubscribes; quota blocks reconnect before SDK', async () => {
  let receive,
    fail,
    subscriptions = 0,
    stops = 0
  const service = await loadModule('src/services/manga-service.js', {
    '@/boot/firebase': { db: {}, requireFirebase() {} },
    'firebase/firestore': {
      ...firestore,
      collection: () => ({}),
      limit: (value) => {
        assert.equal(value, 1001)
        return {}
      },
      query: () => ({}),
      onSnapshot: (_ref, data, error) => {
        subscriptions++
        receive = data
        fail = error
        return () => {
          stops++
        }
      },
    },
  })
  let delivered = 0,
    error
  service.subscribeToMangas(
    'alice',
    () => {
      delivered++
    },
    (value) => {
      error = value
    },
  )
  receive({ docs: Array.from({ length: 1001 }, () => ({})) })
  assert.equal(error.code, 'app/library-budget')
  assert.equal(stops, 1)
  assert.equal(delivered, 0)
  service.subscribeToMangas(
    'alice',
    () => {
      delivered++
    },
    (value) => {
      error = value
    },
  )
  fail({ code: 'resource-exhausted' })
  assert.equal(error.code, 'resource-exhausted')
  assert.throws(() => service.subscribeToMangas('alice', () => {}), { code: 'app/quota-paused' })
  assert.equal(subscriptions, 2)
})

test('client scan rejects side-effect imports, literal dynamic imports, reexports and internal SDKs', () => {
  for (const source of [
    "import 'firebase/storage'",
    'import "firebase/functions"',
    "import { getStorage } from 'firebase/storage'",
    "export * from 'firebase/compat/app'",
    "import('firebase/storage')",
    'import(`firebase/functions`)',
    "require('firebase-admin')",
    "import { getStorage } from '@firebase/storage'",
  ])
    assert.throws(() => validateClientSource(source), /Unsupported SDK/)
  for (const source of [
    "import { getAuth } from 'firebase/auth'",
    "import('firebase/firestore')",
    "export { initializeApp } from 'firebase/app'",
    "import { ref } from 'vue'",
  ])
    assert.doesNotThrow(() => validateClientSource(source))
})

test('server dependency scan checks root manifests and transitive lockfile package paths', () => {
  for (const manifest of [
    { dependencies: { 'firebase-functions': '^1' } },
    { devDependencies: { 'firebase-admin': '^1' } },
    { packages: { 'node_modules/@google-cloud/storage': { version: '1' } } },
    { packages: { 'node_modules/parent/node_modules/firebase-admin': { version: '1' } } },
  ])
    assert.throws(() => validateDependencyManifest(manifest), /Server dependency/)
  assert.doesNotThrow(() =>
    validateDependencyManifest({
      dependencies: { firebase: '^12' },
      packages: { 'node_modules/@firebase/functions': { version: '1' } },
    }),
  )
})

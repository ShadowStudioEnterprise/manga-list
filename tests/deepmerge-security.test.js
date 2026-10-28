import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import merge from '../vendor/deepmerge-safe/index.cjs'

const payload = () =>
  JSON.parse(
    '{"__proto__":{"syntheticPoison":true},"constructor":{"prototype":{"syntheticPoison":true}},"prototype":{"syntheticPoison":true}}',
  )

function safe(result) {
  assert.equal(Object.getPrototypeOf(result), Object.prototype)
  assert.equal(result.syntheticPoison, undefined)
  for (const key of ['__proto__', 'constructor', 'prototype'])
    assert.equal(Object.hasOwn(result, key), false)
  assert.equal(Object.prototype.syntheticPoison, undefined)
}

test('Rollup resolves the local hardened dependency after clean installation; Workbox remains v7', () => {
  const require = createRequire(
    resolve('src-pwa/node_modules/@rollup/plugin-node-resolve/package.json'),
  )
  const entry = require.resolve('deepmerge')
  const metadata = JSON.parse(readFileSync(resolve(dirname(entry), 'package.json'), 'utf8'))
  assert.equal(metadata.name, '@mangalist/deepmerge-safe')
  assert.equal(readFileSync(entry, 'utf8'), readFileSync('vendor/deepmerge-safe/index.cjs', 'utf8'))
  safe(require('deepmerge')(Object.create(null), payload()))
  const workbox = JSON.parse(
    readFileSync('src-pwa/node_modules/workbox-build/package.json', 'utf8'),
  )
  assert.match(workbox.version, /^7\./)
})

for (const clone of [true, false]) {
  for (const shape of ['null-prototype', 'own-key', 'plain', 'nested-null']) {
    test(`prototype poisoning blocked in source and target, ${shape}, clone=${clone}`, () => {
      const target =
        shape === 'null-prototype'
          ? Object.create(null)
          : shape === 'own-key'
            ? JSON.parse('{"__proto__":null}')
            : shape === 'nested-null'
              ? { session: null }
              : {}
      safe(merge(target, payload(), { clone }))
      safe(merge(payload(), target, { clone }))
      const nested = merge({ session: null }, { session: payload() }, { clone: true })
      safe(nested.session)
      safe(merge.all([target, payload(), { allowed: true }], { clone }))
    })
  }
}

test('nested own forbidden keys and array-contained objects are sanitized during normal cloning', () => {
  const source = { session: payload(), list: [payload()] }
  const result = merge({}, source)
  safe(result.session)
  safe(result.list[0])
  assert.notEqual(result.session, source.session)
  // clone:false explicitly retains unmerged nested references, as upstream does.
  // It is not promised as recursive sanitization of arbitrary source objects.
})

test('proxy target that rejects inspection fails closed', () => {
  const target = new Proxy(
    {},
    {
      has() {
        throw Error('Synthetic denied inspection')
      },
    },
  )
  assert.throws(() => merge(target, { ordinary: true }), /Cannot safely inspect/)
})

test('normal recursive merge and arrays preserve data without mutating inputs', () => {
  const target = { a: { first: 1 }, values: [{ a: 1 }], enabled: false }
  const source = { a: { second: 2 }, values: [{ b: 2 }], enabled: true }
  const beforeTarget = structuredClone(target)
  const beforeSource = structuredClone(source)
  assert.deepEqual(merge(target, source), {
    a: { first: 1, second: 2 },
    values: [{ a: 1 }, { b: 2 }],
    enabled: true,
  })
  assert.deepEqual(target, beforeTarget)
  assert.deepEqual(source, beforeSource)
})

test('symbols, special objects, clone option, custom array merge and custom merge retain their API', () => {
  const key = Symbol('owned')
  const date = new Date('2026-10-28T00:00:00Z')
  const regex = /demo/i
  const source = { [key]: { a: 1 }, date, regex }
  const result = merge({}, source)
  assert.deepEqual(result[key], { a: 1 })
  assert.notEqual(result[key], source[key])
  assert.equal(result.date, date)
  assert.equal(result.regex, regex)
  assert.equal(merge({}, source, { clone: false })[key], source[key])
  assert.deepEqual(merge([1], [2], { arrayMerge: (_a, b) => b }), [2])
  assert.deepEqual(
    merge(
      { total: { n: 1 } },
      { total: { n: 2 } },
      { customMerge: (key) => (key === 'total' ? (a, b) => ({ n: a.n + b.n }) : undefined) },
    ),
    { total: { n: 3 } },
  )
  assert.deepEqual(merge.all([{ a: 1 }, { b: 2 }]), { a: 1, b: 2 })
  assert.throws(() => merge.all({}), /array/)
})

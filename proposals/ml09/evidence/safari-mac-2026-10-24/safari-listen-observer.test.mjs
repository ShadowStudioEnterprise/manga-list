import { test } from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFile } from 'node:fs/promises'
const script = await readFile(new URL('safari-listen-observer.js', import.meta.url), 'utf8')
const endpoint = 'http://127.0.0.1:8188/google.firestore.v1.Firestore/Listen/channel'
function setup() {
  const calls = []
  const sentinel = Promise.resolve({ original: true })
  class XHR {
    open(...args) {
      calls.push(['open', this, args])
      return 'opened'
    }
    send(...args) {
      calls.push(['send', this, args])
      return 'sent'
    }
  }
  const context = {
    URL,
    URLSearchParams,
    Request,
    ArrayBuffer,
    TextDecoder,
    Date,
    WeakMap,
    XMLHttpRequest: XHR,
    location: {
      href: 'http://127.0.0.1:9314/#/login',
      origin: 'http://127.0.0.1:9314',
      pathname: '/',
      hash: '#/login',
    },
    navigator: { userAgent: 'test' },
    fetch(...args) {
      calls.push(['fetch', this, args])
      return sentinel
    },
  }
  context.window = context
  vm.runInNewContext(`(function(){${script}})()`, context)
  return { context, calls, sentinel }
}
const payload = (...messages) =>
  new URLSearchParams(messages.map((m, i) => [`req${i}___data__`, JSON.stringify(m)])).toString()
test('fetch counts decoded protocol messages and forwards original arguments/result unchanged', () => {
  const { context, calls, sentinel } = setup()
  const init = {
    method: 'POST',
    body: payload({ addTarget: { targetId: 1002 } }, { removeTarget: 1002 }),
  }
  assert.equal(context.fetch(endpoint, init), sentinel)
  assert.equal(calls[0][2][1], init)
  assert.equal(context.listenProbe.counters.addTarget, 1)
  assert.equal(context.listenProbe.counters.removeTarget, 1)
})
test('XHR remains measured and original calls retain receiver, arguments and return values', () => {
  const { context, calls } = setup()
  const xhr = new context.XMLHttpRequest()
  assert.equal(xhr.open('POST', endpoint), 'opened')
  const raw = payload({ addTarget: { targetId: 1004 } })
  assert.equal(xhr.send(raw), 'sent')
  assert.equal(calls[0][1], xhr)
  assert.equal(calls[1][1], xhr)
  assert.equal(calls[1][2][0], raw)
  assert.equal(context.listenProbe.counters.addTarget, 1)
  assert.equal(context.listenProbe.counters.xhr, 1)
})
test('unrelated requests and nested text do not create false target counts or leak auth bodies', () => {
  const { context } = setup()
  context.fetch(
    'http://127.0.0.1:9199/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword',
    { method: 'POST', body: 'SECRET' },
  )
  context.fetch('https://example.com/google.firestore.v1.Firestore/Listen', {
    method: 'POST',
    body: payload({ addTarget: { targetId: 9 } }),
  })
  context.fetch(endpoint, { method: 'POST', body: payload({ text: '"addTarget": {}' }) })
  assert.equal(context.listenProbe.counters.addTarget, 0)
  assert.equal(context.listenProbe.counters.fetch, 1)
  assert.ok(!JSON.stringify(context.listenProbe.snapshot()).includes('SECRET'))
})
test('Request bodies are read from a clone without consuming the original', async () => {
  const { context, calls } = setup()
  const request = new Request(endpoint, {
    method: 'POST',
    body: payload({ addTarget: { targetId: 1006 } }),
  })
  context.fetch(request)
  for (let i = 0; i < 30 && context.listenProbe.counters.addTarget === 0; i++)
    await new Promise((r) => setTimeout(r, 10))
  assert.equal(context.listenProbe.counters.addTarget, 1)
  assert.equal(request.bodyUsed, false)
  assert.equal(calls[0][2][0], request)
})
test('unreadable or malformed payloads are explicitly reported rather than counted as success', () => {
  const { context } = setup()
  context.fetch(endpoint, {
    method: 'POST',
    body: new URLSearchParams([['req0___data__', 'invalid json']]).toString(),
  })
  context.fetch(endpoint, { method: 'POST', body: { unsupported: true } })
  assert.equal(context.listenProbe.counters.addTarget, 0)
  assert.equal(context.listenProbe.counters.unreadableBodies, 2)
})

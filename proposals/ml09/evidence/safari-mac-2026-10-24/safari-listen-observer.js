return (() => {
  if (window.listenProbe) throw Error('Observer already installed')
  const events = []
  const counters = { addTarget: 0, removeTarget: 0, fetch: 0, xhr: 0, unreadableBodies: 0 }
  const record = (kind, data = {}) => events.push({ at: new Date().toISOString(), kind, ...data })
  const listenUrl = (url) => {
    try {
      const u = new URL(url, location.href)
      return (
        u.origin === 'http://127.0.0.1:8188' &&
        u.pathname.includes('google.firestore.v1.Firestore/Listen')
      )
    } catch {
      return false
    }
  }
  function body(value, transport) {
    if (value == null) return
    if (value instanceof URLSearchParams) value = value.toString()
    if (value instanceof ArrayBuffer) value = new TextDecoder().decode(value)
    if (ArrayBuffer.isView(value)) value = new TextDecoder().decode(value)
    if (typeof value !== 'string') {
      counters.unreadableBodies++
      record('unreadable-body', { transport, type: Object.prototype.toString.call(value) })
      return
    }
    const params = new URLSearchParams(value)
    let parsed = 0
    for (const [key, raw] of params) {
      if (!/^req\d+___data__$/.test(key)) continue
      try {
        const message = JSON.parse(raw)
        parsed++
        if (message.addTarget) {
          counters.addTarget++
          record('addTarget', { transport, target: message.addTarget })
        }
        if (message.removeTarget !== undefined) {
          counters.removeTarget++
          record('removeTarget', { transport, targetId: message.removeTarget })
        }
      } catch {
        counters.unreadableBodies++
        record('parse-error', { transport, key })
      }
    }
    record('body-observed', { transport, bytes: value.length, messages: parsed })
  }
  const originalFetch = window.fetch
  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (listenUrl(url)) {
      counters.fetch++
      record('request', { transport: 'fetch', method: init?.method || input.method || 'GET' })
      if (init?.body !== undefined) body(init.body, 'fetch')
      else if (input instanceof Request && !['GET', 'HEAD'].includes(input.method))
        input
          .clone()
          .text()
          .then(
            (v) => body(v, 'fetch'),
            () => {
              counters.unreadableBodies++
            },
          )
    }
    return Reflect.apply(originalFetch, this, arguments)
  }
  const originalOpen = XMLHttpRequest.prototype.open
  const originalSend = XMLHttpRequest.prototype.send
  const urls = new WeakMap()
  XMLHttpRequest.prototype.open = function (method, url) {
    urls.set(this, { method, url: String(url) })
    return Reflect.apply(originalOpen, this, arguments)
  }
  XMLHttpRequest.prototype.send = function (value) {
    const request = urls.get(this)
    if (request && listenUrl(request.url)) {
      counters.xhr++
      record('request', { transport: 'xhr', method: request.method })
      body(value, 'xhr')
    }
    return Reflect.apply(originalSend, this, arguments)
  }
  record('attached', {
    href: location.origin + location.pathname + location.hash,
    userAgent: navigator.userAgent,
    scope:
      'Outgoing Listen protocol via fetch and XMLHttpRequest. Original transports forwarded unchanged. No auth requests or tokens recorded. Native clock.',
  })
  window.listenProbe = {
    events,
    counters,
    snapshot: () => ({ counters: { ...counters }, events: [...events] }),
  }
  return { installed: true, counters }
})()

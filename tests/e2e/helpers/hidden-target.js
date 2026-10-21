// Hidden targets have no tab strip entry and are not wrapped as Playwright Pages.
// Use their native CDP session so the browser can keep them hidden and frozen.
export async function createHiddenTarget(browser, context, page) {
  const pageSession = await context.newCDPSession(page)
  const { targetInfo } = await pageSession.send('Target.getTargetInfo')
  await pageSession.detach()
  if (!targetInfo.browserContextId) throw new Error('Expected the isolated test context')
  const root = await browser.newBrowserCDPSession()
  const { targetId } = await root.send('Target.createTarget', {
    url: 'about:blank',
    browserContextId: targetInfo.browserContextId,
    hidden: true,
    background: true,
  })
  const { sessionId } = await root.send('Target.attachToTarget', { targetId, flatten: false })
  const pending = new Map()
  const listeners = new Map()
  const errors = []
  let nextId = 0
  let closed = false
  root.on('Target.receivedMessageFromTarget', ({ sessionId: received, message }) => {
    if (received !== sessionId) return
    const data = JSON.parse(message)
    if (data.id) {
      const request = pending.get(data.id)
      if (!request) return
      pending.delete(data.id)
      clearTimeout(request.timer)
      if (data.error) request.reject(new Error(JSON.stringify(data.error)))
      else request.resolve(data.result)
    } else {
      for (const listener of listeners.get(data.method) || []) {
        Promise.resolve()
          .then(() => listener(data.params))
          .catch((error) => {
            if (!closed) errors.push(error.message)
          })
      }
    }
  })
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      if (closed) return reject(new Error('Hidden target closed'))
      const id = ++nextId
      const timer = setTimeout(() => {
        pending.delete(id)
        reject(new Error(`Hidden target timeout: ${method}`))
      }, 15000)
      pending.set(id, { resolve, reject, timer })
      root
        .send('Target.sendMessageToTarget', {
          sessionId,
          message: JSON.stringify({ id, method, params }),
        })
        .catch((error) => {
          clearTimeout(timer)
          pending.delete(id)
          reject(error)
        })
    })
  return {
    send,
    errors,
    on(method, listener) {
      listeners.set(method, [...(listeners.get(method) || []), listener])
    },
    async evaluate(expression) {
      const result = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      })
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
      return result.result.value
    },
    async close() {
      if (closed) return
      closed = true
      try {
        await root.send('Target.closeTarget', { targetId })
      } finally {
        for (const request of pending.values()) {
          clearTimeout(request.timer)
          request.reject(new Error('Hidden target closed'))
        }
        pending.clear()
        await root.detach()
      }
    },
  }
}

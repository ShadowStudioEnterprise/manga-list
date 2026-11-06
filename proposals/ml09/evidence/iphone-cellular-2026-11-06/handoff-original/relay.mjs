import http from 'node:http'
import { randomBytes, timingSafeEqual } from 'node:crypto'

// Lab transport only. This module starts no server or external connection on import.
// An Internet tunnel must be separately authorized before pointing it here.
const SHIM = `(()=>{
const rewrite=value=>{const s=String(value);for(const [port,path] of [[8188,'/lab-firestore'],[9199,'/lab-auth']]){const p='http://127.0.0.1:'+port;if(s.startsWith(p+'/'))return location.origin+path+s.slice(p.length)}return value};
const originalFetch=window.fetch;window.fetch=function(input,init){const url=input instanceof Request?input.url:input;const next=rewrite(url);if(next===url)return originalFetch.call(this,input,init);if(input instanceof Request)return originalFetch.call(this,new Request(next,input),{...init,credentials:'same-origin'});return originalFetch.call(this,next,{...init,credentials:'same-origin'})};
const originalOpen=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(method,url,...rest){return originalOpen.call(this,method,rewrite(url),...rest)};
window.ml09Transport=Object.freeze({kind:'same-origin relay to demo loopback',nativeClock:true});
})();`
const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'none'"

export function createLabRelay({ appPort = 9335, authPort = 9199, firestorePort = 8188,
  publicOrigin = null, token = randomBytes(32).toString('hex'), ttlMs = 45 * 60 * 1000,
  now = Date.now } = {}) {
  if (![appPort, authPort, firestorePort].every(p => Number.isInteger(p) && p > 1024 && p <= 65535)) throw Error('Invalid loopback port')
  if (!/^[a-f0-9]{64}$/.test(token)) throw Error('Expected random 256-bit lab token')
  if (!(ttlMs > 0 && ttlMs <= 45 * 60 * 1000)) throw Error('Maximum lifetime is 45 minutes')
  if (publicOrigin && !/^https:\/\/[a-z0-9]+(?:-[a-z0-9]+)*\.trycloudflare\.com$/.test(publicOrigin)) throw Error('Expected exact HTTPS temporary lab origin')
  const expires = now() + ttlMs, secret = Buffer.from(token), counts = new Map()
  let session = false
  const equal = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value) && timingSafeEqual(Buffer.from(value), secret)
  const server = http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Referrer-Policy', 'no-referrer')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Content-Security-Policy', CSP)
    const fail = code => { res.writeHead(code); res.end('Lab request unavailable') }
    if (now() >= expires) return fail(410)
    const address = server.address()
    const localHost = `127.0.0.1:${address.port}`
    const expectedHost = publicOrigin ? new URL(publicOrigin).host : localHost
    if (![expectedHost, localHost].includes(req.headers.host)) return fail(421)
    const origin = req.headers.host === expectedHost && publicOrigin ? publicOrigin : `http://${localHost}`
    if (req.headers.origin && req.headers.origin !== origin) return fail(403)
    let decoded
    try { decoded = decodeURIComponent(req.url.split('?')[0]) } catch { return fail(400) }
    if (decoded.includes('\\') || decoded.includes('\0') || decoded.split('/').some(p => p === '..' || p === '.')) return fail(403)
    const url = new URL(req.url, origin)
    if (url.pathname === '/lab-entry' && req.method === 'GET') {
      if (session || !equal(url.searchParams.get('key'))) return fail(403)
      session = true
      res.setHeader('Set-Cookie', `ml09cell=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor((expires-now())/1000)}${publicOrigin ? '; Secure' : ''}`)
      res.setHeader('Content-Type', 'text/html;charset=utf-8')
      res.end('<!doctype html><meta name="viewport" content="width=device-width"><title>Laboratorio ML-09</title><p>Acceso temporal autorizado.</p><a href="/">Abrir laboratorio</a><script>location.replace("/")</script>')
      return
    }
    const cookie = String(req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith('ml09cell='))?.slice(9)
    if (!session || !equal(cookie)) return fail(403)
    if (!['GET', 'POST', 'OPTIONS'].includes(req.method)) return fail(405)
    if (/^Bearer\s+owner$/i.test(req.headers.authorization || '')) return fail(403)
    const window = Math.floor(now()/60000), used = (counts.get(window)||0)+1
    counts.clear(); counts.set(window,used)
    if (used > 300) return fail(429)
    let port, target
    if (url.pathname.startsWith('/lab-firestore/')) {
      target = decoded.slice('/lab-firestore'.length)
      if (!/^\/google\.firestore\.v1\.Firestore\/(Listen|Write)\//.test(target)) return fail(403)
      const database = url.searchParams.get('database')
      if (database && database !== 'projects/demo-mangalist/databases/(default)') return fail(403)
      port = firestorePort
    } else if (url.pathname.startsWith('/lab-auth/')) {
      target = decoded.slice('/lab-auth'.length)
      if (!/^\/(identitytoolkit\.googleapis\.com\/v1\/accounts:(signUp|signInWithPassword|lookup|update)|securetoken\.googleapis\.com\/v1\/token)$/.test(target)) return fail(403)
      port = authPort
    } else {
      const staticPath = /\.(js|mjs|css|woff2?|ttf|svg|png|ico)$/.test(decoded)
      const modulePath = /^\/(src|node_modules|\.quasar)\//.test(decoded) && staticPath
      if (!(decoded === '/' || decoded === '/index.html' || decoded === '/favicon.ico' || decoded === '/@vite/client' || decoded.startsWith('/@id/') || modulePath)) return fail(403)
      if (req.method !== 'GET') return fail(405)
      port = appPort; target = decoded
    }
    const chunks = []; let size = 0
    try {
      for await (const chunk of req) { size += chunk.length; if (size > 256*1024) return fail(413); chunks.push(chunk) }
    } catch { if (!res.writableEnded) fail(400); return }
    const headers = { ...req.headers, host:`127.0.0.1:${port}` }
    for (const name of ['cookie','origin','referer','accept-encoding','connection','forwarded','x-forwarded-for','x-forwarded-host','x-forwarded-proto','cf-connecting-ip']) delete headers[name]
    const upstream = http.request({host:'127.0.0.1',port,path:target+url.search,method:req.method,headers}, response => {
      const outgoing = {...response.headers}
      for(const name of ['set-cookie','location','content-length','transfer-encoding','content-encoding','connection']) delete outgoing[name]
      outgoing['cache-control']='no-store'; outgoing['referrer-policy']='no-referrer'
      outgoing['content-security-policy']=CSP
      if (port === appPort && /text\/html/.test(String(outgoing['content-type']))) {
        let body=''
        response.setEncoding('utf8')
        response.on('data',chunk=>{body+=chunk;if(body.length > 2*1024*1024) response.destroy(Error('HTML response too large'))})
        response.on('end',()=>{if(!res.writableEnded){res.writeHead(response.statusCode,outgoing);res.end(body.replace('<head>','<head><script>'+SHIM+'</script>'))}})
      } else {res.writeHead(response.statusCode,outgoing);response.pipe(res)}
      response.on('error',()=>{if(!res.headersSent) fail(502);else res.destroy()})
    })
    upstream.on('error',()=>{if(!res.headersSent) fail(502);else res.destroy()})
    upstream.setTimeout(65000,()=>upstream.destroy(Error('Bounded upstream timeout')))
    req.on('aborted',()=>upstream.destroy())
    res.on('close',()=>upstream.destroy())
    upstream.end(Buffer.concat(chunks))
  })
  server.on('upgrade',(_req,socket)=>socket.destroy())
  server.headersTimeout=15000;server.requestTimeout=20000
  return {server,token,expires,listen:()=>new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve(server.address().port))})}
}

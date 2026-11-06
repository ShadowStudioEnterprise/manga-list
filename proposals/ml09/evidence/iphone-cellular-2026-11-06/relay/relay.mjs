import http from 'node:http'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import {realpathSync} from 'node:fs'
import {readFile,realpath} from 'node:fs/promises'
import {basename,isAbsolute,resolve,sep} from 'node:path'

// Lab transport only. This module starts no server or external connection on import.
// An Internet tunnel must be separately authorized before pointing it here.
const SHIM = `(()=>{
const rewrite=value=>{const s=String(value);for(const [port,path] of [[8188,'/lab-firestore'],[9199,'/lab-auth']]){const p='http://127.0.0.1:'+port;if(s.startsWith(p+'/'))return location.origin+path+s.slice(p.length)}return value};
const originalFetch=window.fetch;window.fetch=async function(input,init){const url=input instanceof Request?input.url:input;const next=rewrite(url);if(next===url)return originalFetch.call(this,input,init);if(input instanceof Request){const request=new Request(input,init);const options={method:request.method,headers:request.headers,signal:request.signal,credentials:'same-origin'};if(!['GET','HEAD'].includes(request.method))options.body=await request.arrayBuffer();return originalFetch.call(this,next,options)}return originalFetch.call(this,next,{...init,credentials:'same-origin'})};
const originalOpen=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(method,url,...rest){return originalOpen.call(this,method,rewrite(url),...rest)};
window.ml09Transport=Object.freeze({kind:'same-origin relay to demo loopback',nativeClock:true});
})();`
const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'none'"

export function createLabRelay({ appPort = 9335, authPort = 9199, firestorePort = 8188,
  publicOrigin = null, token = randomBytes(32).toString('hex'), ttlMs = 45 * 60 * 1000,
  now = Date.now, onEvent = () => {}, dependencyRoot = null, finiteBackchannel = false } = {}) {
  if (![appPort, authPort, firestorePort].every(p => Number.isInteger(p) && p > 1024 && p <= 65535)) throw Error('Invalid loopback port')
  if (!/^[a-f0-9]{64}$/.test(token)) throw Error('Expected random 256-bit lab token')
  if (!(ttlMs > 0 && ttlMs <= 45 * 60 * 1000)) throw Error('Maximum lifetime is 45 minutes')
  if (publicOrigin && !/^https:\/\/[a-z0-9]+(?:-[a-z0-9]+)*\.trycloudflare\.com$/.test(publicOrigin)) throw Error('Expected exact HTTPS temporary lab origin')
  if(dependencyRoot && (!isAbsolute(dependencyRoot)||basename(dependencyRoot)!=='node_modules'||realpathSync(dependencyRoot)!==dependencyRoot))throw Error('Expected canonical pinned dependency directory')
  const expires = now() + ttlMs, secret = Buffer.from(token), counts = new Map()
  let session = false
  let expired = false
  const sockets = new Set(), upstreams = new Set()
  const close = () => {
    expired = true
    onEvent({kind:'relay-close',at:new Date().toISOString(),activeSockets:sockets.size,activeUpstreams:upstreams.size})
    clearTimeout(expiryTimer)
    for (const upstream of upstreams) upstream.destroy()
    for (const socket of sockets) socket.destroy()
    return new Promise(resolve => server.close(() => resolve()))
  }
  const equal = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value) && timingSafeEqual(Buffer.from(value), secret)
  const server = http.createServer(async (req, res) => {
    res.once('finish',()=>onEvent({kind:'response',at:new Date().toISOString(),method:req.method,path:req.url.split('?')[0],status:res.statusCode}))
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Referrer-Policy', 'no-referrer')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Content-Security-Policy', CSP)
    const fail = (code,reason='policy') => { onEvent({kind:'denied',at:new Date().toISOString(),path:req.url.split('?')[0],status:code,reason,userAgent:String(req.headers['user-agent']||'').slice(0,300)});res.setHeader('Content-Type','text/plain; charset=utf-8');res.setHeader('Content-Disposition','inline');res.writeHead(code); res.end('Lab request unavailable') }
    if (expired || now() >= expires) return fail(410)
    const address = server.address()
    const localHost = `127.0.0.1:${address.port}`
    const expectedHost = publicOrigin ? new URL(publicOrigin).host : localHost
    if (![expectedHost, localHost].includes(req.headers.host)) return fail(421)
    const origin = publicOrigin || `http://${localHost}`
    if (req.headers.origin && req.headers.origin !== origin) return fail(403,'origin-mismatch')
    let decoded
    try { decoded = decodeURIComponent(req.url.split('?')[0]) } catch { return fail(400) }
    if (decoded.includes('\\') || decoded.includes('\0') || decoded.split('/').some(p => p === '..' || p === '.')) return fail(403)
    const url = new URL(req.url, origin)
    if (url.pathname === '/lab-entry' && ['GET','POST'].includes(req.method)) {
      const entryCookie=String(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('ml09cell='))?.slice(9)
      let key=url.searchParams.get('key')
      if(req.method==='POST'){
        let raw=''
        try{for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>1024)return fail(413,'entry-body-size')}}catch{return fail(400,'entry-body')}
        key=new URLSearchParams(raw).get('key')
      }
      if(!equal(key))return fail(403,'entry-invalid-key')
      if(session&&!equal(entryCookie))return fail(403,'entry-already-used')
      if(req.method==='GET'&&!session){
        res.setHeader('Content-Type','text/html;charset=utf-8')
        res.setHeader('Referrer-Policy','same-origin')
        res.end('<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Laboratorio ML-09</title><style>body{font:18px system-ui;max-width:32em;margin:3em auto;padding:1em}button{font:inherit;padding:.8em 1em}</style></head><body><h1>Laboratorio ML-09</h1><p>Abre esta página en Safari del iPhone, con Wi-Fi apagado y datos móviles activos.</p><form method="post" action="/lab-entry"><input type="hidden" name="key" value="'+token+'"><button id="ml09-enter" type="submit">Entrar al laboratorio demo</button></form></body></html>')
        return
      }
      if(req.method==='GET'){res.writeHead(303,{Location:'/'});res.end();return}
      session = true
      res.setHeader('Set-Cookie', `ml09cell=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor((expires-now())/1000)}${publicOrigin ? '; Secure' : ''}`)
      res.writeHead(303,{Location:'/'})
      res.end()
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
      if(finiteBackchannel&&req.method==='GET'&&target.includes('/Listen/')&&url.searchParams.get('RID')==='rpc'&&url.searchParams.get('CI')==='0'){
        url.searchParams.set('CI','1')
        onEvent({kind:'transport-adaptation',at:new Date().toISOString(),adaptation:'finite-webchannel-backchannel',candidateSourceChanged:false})
      }
    } else if (url.pathname.startsWith('/lab-auth/')) {
      target = decoded.slice('/lab-auth'.length)
      if (!/^\/(identitytoolkit\.googleapis\.com\/v1\/accounts:(signUp|signInWithPassword|lookup|update)|securetoken\.googleapis\.com\/v1\/token)$/.test(target)) return fail(403)
      port = authPort
    } else if(url.pathname.startsWith('/lab-deps/')) {
      const asset=decoded.slice('/lab-deps/'.length)
      const allowed=/^@quasar\/extras\/exports\/(roboto-font|material-icons)\/[a-zA-Z0-9_./-]+\.(css|woff2?|ttf)$/.test(asset)||asset==='quasar/dist/quasar.sass'||asset==='vite/dist/client/env.mjs'
      if(!dependencyRoot||!allowed||req.method!=='GET')return fail(403)
      if(/\.(woff2?|ttf)$/.test(asset)){
        try{
          const file=await realpath(resolve(dependencyRoot,asset))
          if(!file.startsWith(dependencyRoot+sep))return fail(403)
          if(expired||now()>=expires||res.destroyed)return
          const data=await readFile(file,{signal:AbortSignal.timeout(5000)})
          if(expired||now()>=expires||res.destroyed)return
          if(data.length>1024*1024)return fail(413)
          res.setHeader('Content-Type',asset.endsWith('.woff2')?'font/woff2':asset.endsWith('.woff')?'font/woff':'font/ttf')
          res.end(data);return
        }catch{if(!res.destroyed)fail(502);return}
      }
      port=appPort;target='/@fs'+dependencyRoot+'/'+asset
    } else {
      const staticPath = /\.(js|mjs|vue|css|scss|sass|json|woff2?|ttf|svg|png|ico)$/.test(decoded)
      const modulePath = /^\/(src|node_modules|\.quasar)\//.test(decoded) && staticPath
      const icon=/^\/icons\/favicon-[0-9]+x[0-9]+\.png$/.test(decoded)
      if (!(decoded === '/' || decoded === '/index.html' || decoded === '/favicon.ico' || decoded === '/@vite/client' || decoded === '/@vite-plugin-checker-runtime' || decoded.startsWith('/@id/') || modulePath || icon)) return fail(403)
      if (req.method !== 'GET') return fail(405)
      port = appPort; target = decoded
    }
    const chunks = []; let size = 0
    try {
      for await (const chunk of req) { size += chunk.length; if (size > 256*1024) return fail(413); chunks.push(chunk) }
    } catch { if (!res.writableEnded) fail(400); return }
    const headers = { ...req.headers, host:`127.0.0.1:${port}` }
    if(port===firestorePort)onEvent({kind:'rpc-start',at:new Date().toISOString(),method:req.method,path:url.pathname,bodyBytes:size,backchannel:url.searchParams.get('RID')==='rpc',hasSession:url.searchParams.has('SID'),streaming:url.searchParams.get('CI')})
    for (const name of ['cookie','origin','referer','accept-encoding','connection','forwarded','x-forwarded-for','x-forwarded-host','x-forwarded-proto','cf-connecting-ip']) delete headers[name]
    const upstream = http.request({host:'127.0.0.1',port,path:target+url.search,method:req.method,headers}, response => {
      if(port===firestorePort){onEvent({kind:'rpc-headers',at:new Date().toISOString(),path:url.pathname,status:response.statusCode,type:response.headers['content-type']});response.once('data',chunk=>onEvent({kind:'rpc-first-chunk',at:new Date().toISOString(),path:url.pathname,bytes:chunk.length}))}
      const outgoing = {...response.headers}
      for(const name of ['set-cookie','location','content-length','transfer-encoding','content-encoding','connection']) delete outgoing[name]
      outgoing['cache-control']='no-store, no-transform'; outgoing['referrer-policy']='no-referrer'
      if(port===firestorePort)outgoing['x-accel-buffering']='no'
      outgoing['content-security-policy']=CSP
      if (port === appPort && (/text\/html/.test(String(outgoing['content-type'])) || dependencyRoot && /javascript|text\/css/.test(String(outgoing['content-type'])))) {
        let body=''
        response.setEncoding('utf8')
        response.on('data',chunk=>{body+=chunk;if(Buffer.byteLength(body) > 8*1024*1024) response.destroy(Error('Transformed text response too large'))})
        response.on('end',()=>{if(!res.writableEnded){if(dependencyRoot)body=body.split('/@fs'+dependencyRoot+'/').join('/lab-deps/');if(/text\/html/.test(String(outgoing['content-type'])))body=body.replace('<head>','<head><script>'+SHIM+'</script>');res.writeHead(response.statusCode,outgoing);res.end(body)}})
      } else {res.writeHead(response.statusCode,outgoing);res.flushHeaders();response.pipe(res)}
      response.on('error',()=>{if(!res.headersSent) fail(502);else res.destroy()})
    })
    upstreams.add(upstream)
    upstream.once('close', () => upstreams.delete(upstream))
    upstream.on('error',()=>{if(!res.headersSent) fail(502);else res.destroy()})
    upstream.setTimeout(65000,()=>upstream.destroy(Error('Bounded upstream timeout')))
    req.on('aborted',()=>upstream.destroy())
    res.on('close',()=>upstream.destroy())
    upstream.end(Buffer.concat(chunks))
  })
  server.on('connection', socket => {
    sockets.add(socket)
    socket.once('close', () => sockets.delete(socket))
    if (expired) socket.destroy()
  })
  const expiryTimer = setTimeout(() => { void close() }, ttlMs)
  expiryTimer.unref()
  server.once('close', () => clearTimeout(expiryTimer))
  server.on('upgrade',(_req,socket)=>socket.destroy())
  server.headersTimeout=15000;server.requestTimeout=20000
  return {server,token,expires,close,listen:()=>new Promise((resolve,reject)=>{if(expired) return reject(Error('Lab expired'));server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve(server.address().port))})}
}

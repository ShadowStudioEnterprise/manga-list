import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import vm from 'node:vm'
import {mkdtemp,mkdir,realpath,rm,writeFile,symlink} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createLabRelay} from './relay.mjs'
const rawStatus=(url,headers)=>new Promise((resolve,reject)=>{const request=http.get(url,{headers},response=>{response.resume();response.on('end',()=>resolve(response.statusCode))});request.on('error',reject)})

async function fixture(run,options={}){
 const received=[]
 const app=http.createServer((req,res)=>{received.push({url:req.url,cookie:req.headers.cookie,authorization:req.headers.authorization});res.setHeader('Content-Type',req.url==='/'?'text/html':'application/javascript');res.end(options.appBody||(req.url==='/'?'<html><head></head><body>demo</body></html>':'export const demo=true'))})
 await new Promise(r=>app.listen(0,'127.0.0.1',r))
 const port=app.address().port,relay=createLabRelay({appPort:port,authPort:port,firestorePort:port,...options})
 const relayPort=await relay.listen(),base=`http://127.0.0.1:${relayPort}`
 try{await run({base,relay,received,async authorize(headers={}){const landing=await fetch(base+'/lab-entry?key='+relay.token,{headers});assert.equal(landing.status,200);assert.equal(landing.headers.get('set-cookie'),null);const response=await fetch(base+'/lab-entry',{method:'POST',headers:{...headers,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({key:relay.token}).toString(),redirect:'manual'});assert.equal(response.status,303);return response.headers.get('set-cookie')}})}finally{relay.server.closeAllConnections();app.closeAllConnections();await Promise.all([new Promise(r=>relay.server.close(r)),new Promise(r=>app.close(r))])}
}
test('unknown/unauthenticated requests never reach any upstream',()=>fixture(async({base,received})=>{for(const p of ['/','/src/boot/firebase.js','/lab-auth/identitytoolkit.googleapis.com/v1/accounts:signUp'])assert.equal((await fetch(base+p)).status,403);assert.equal(received.length,0)}))
test('entry is single use and cookie is HttpOnly, strict and Secure for public HTTPS',()=>fixture(async({base,relay,authorize})=>{const host='review-only.trycloudflare.com';const cookie=await authorize({Host:host});for(const text of ['HttpOnly','SameSite=Strict','Secure'])assert.ok(cookie.includes(text));assert.equal((await fetch(base+'/lab-entry?key='+relay.token,{headers:{Host:host}})).status,403)},{publicOrigin:'https://review-only.trycloudflare.com'}))
test('allowed app modules preserve content, strip lab cookie and inject transport only in HTML',()=>fixture(async({base,authorize,received})=>{const cookie=await authorize();const page=await fetch(base+'/',{headers:{Cookie:cookie}});assert.equal(page.status,200);assert.match(await page.text(),/ml09Transport/);const module=await fetch(base+'/src/boot/firebase.js',{headers:{Cookie:cookie}});assert.equal(await module.text(),'export const demo=true');assert.equal(received.at(-1).cookie,undefined)}))
test('filesystem, emulator admin, production database and owner bypass are blocked',()=>fixture(async({base,authorize,received})=>{const cookie=await authorize();for(const p of ['/.env','/.git/config','/@fs/C:/private','/src/%2e%2e%2f.env','/src/x%5cy.js','/lab-firestore/v1/projects/demo-mangalist/databases/(default)/documents','/lab-auth/emulator/v1/projects/demo-mangalist/accounts','/lab-firestore/google.firestore.v1.Firestore/Listen/channel?database=projects/real/databases/(default)'])assert.ok([400,403].includes((await fetch(base+p,{headers:{Cookie:cookie}})).status),p);assert.equal((await fetch(base+'/src/boot/firebase.js',{headers:{Cookie:cookie,Authorization:'Bearer owner'}})).status,403);assert.equal(received.length,0)}))
test('host and cross-site requests rejected without forwarding',()=>fixture(async({base,authorize,received})=>{const cookie=await authorize();assert.equal(await rawStatus(base+'/',{Cookie:cookie,Host:'attacker.example'}),421);assert.equal((await fetch(base+'/',{headers:{Cookie:cookie,Origin:'https://attacker.example'}})).status,403);assert.equal(received.length,0)}))
test('expired timestamp rejects new requests; no automatic renewal',async()=>{let time=0;await fixture(async({base,authorize,received})=>{const cookie=await authorize();time=1001;assert.equal((await fetch(base+'/',{headers:{Cookie:cookie}})).status,410);assert.equal(received.length,0)},{now:()=>time,ttlMs:1000})})
test('demo SDK channels and sign-in forwarded only to fixed loopback upstreams',()=>fixture(async({base,authorize,received})=>{const cookie=await authorize();for(const p of ['/lab-firestore/google.firestore.v1.Firestore/Listen/channel?database=projects/demo-mangalist/databases/(default)','/lab-auth/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-mangalist-key'])assert.equal((await fetch(base+p,{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:'{}'})).status,200);assert.equal(received.length,2);assert.ok(received[0].url.startsWith('/google.firestore.v1.Firestore/Listen/channel'));assert.equal(received[1].cookie,undefined)}))
test('oversized requests fail before forwarding and invalid configuration fails closed',()=>fixture(async({base,authorize,received})=>{const cookie=await authorize();assert.equal((await fetch(base+'/lab-auth/identitytoolkit.googleapis.com/v1/accounts:signUp',{method:'POST',headers:{Cookie:cookie},body:'x'.repeat(256*1024+1)})).status,413);assert.equal(received.length,0);assert.throws(()=>createLabRelay({publicOrigin:'http://example.com'}));assert.throws(()=>createLabRelay({ttlMs:3600000}));assert.throws(()=>createLabRelay({token:'weak'}))}))
test('malformed cookies cannot crash relay or reach upstream; public policy blocks external app connections',()=>fixture(async({base,authorize,received})=>{await authorize();for(const cookie of ['ml09cell='+'é'.repeat(64),'ml09cell='+'f'.repeat(63),'ml09cell='+'a'.repeat(65)])assert.equal(await rawStatus(base+'/',{Cookie:cookie}),403);const response=await fetch(base+'/');assert.equal(response.status,403);assert.match(response.headers.get('content-security-policy'),/connect-src 'self'/);assert.equal(received.length,0)}))

test('absolute expiry closes an active stream, its upstream and the listener', {timeout:5000}, async()=>{
 const app=http.createServer((_req,res)=>{res.writeHead(200,{'Content-Type':'text/event-stream'});res.write('open\n')})
 await new Promise(r=>app.listen(0,'127.0.0.1',r))
 const relay=createLabRelay({appPort:app.address().port,ttlMs:500})
 const port=await relay.listen(),base=`http://127.0.0.1:${port}`
 try{
  const entry=await fetch(base+'/lab-entry',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({key:relay.token}).toString(),redirect:'manual'})
  const cookie=entry.headers.get('set-cookie')
  await entry.text()
  const upstreamClosed=new Promise(r=>app.once('connection',s=>s.once('close',r)))
  const clientClosed=new Promise((resolve,reject)=>{
   const req=http.get(base+'/src/stream.js',{headers:{Cookie:cookie}},res=>{
    res.on('data',()=>{});res.once('close',resolve);res.once('error',()=>{})
   });req.once('error',reject)
  })
  await Promise.all([clientClosed,upstreamClosed])
  assert.equal(relay.server.listening,false)
  await assert.rejects(fetch(base+'/'))
 }finally{await relay.close();app.closeAllConnections();await new Promise(r=>app.close(r))}
})

test('Vite Vue and Sass modules stay inside the explicit source prefixes',()=>fixture(async({base,authorize,received})=>{
 const cookie=await authorize()
 for(const path of ['/src/App.vue','/src/css/app.scss','/node_modules/quasar/src/css/index.sass','/.quasar/dev-spa/client-entry.js'])assert.equal((await fetch(base+path,{headers:{Cookie:cookie}})).status,200)
 assert.equal(received.length,4)
 for(const path of ['/@fs/etc/passwd','/private/config.json','/.env','/package-lock.json'])assert.equal((await fetch(base+path,{headers:{Cookie:cookie}})).status,403)
 assert.equal(received.length,4)
}))

test('Request body rewrite uses ArrayBuffer and preserves an explicit init override',()=>fixture(async({base,authorize})=>{
 const cookie=await authorize();const html=await(await fetch(base+'/',{headers:{Cookie:cookie}})).text()
 const script=html.match(/<script>([\s\S]*?)<\/script>/)[1]
 const captured=[];const window={fetch:async(input,init)=>{captured.push({input,init});return {ok:true}}}
 class XHR{open(){}}
 vm.runInNewContext(script,{window,Request,XMLHttpRequest:XHR,location:{origin:base}})
 await window.fetch(new Request('http://127.0.0.1:9199/identitytoolkit.googleapis.com/v1/accounts:lookup',{method:'POST',body:'old',headers:{'Content-Type':'application/json'}}),{body:'new'})
 assert.equal(captured[0].input,base+'/lab-auth/identitytoolkit.googleapis.com/v1/accounts:lookup')
 assert.equal(Buffer.from(captured[0].init.body).toString(),'new')
 assert.equal(captured[0].init.credentials,'same-origin')
 assert.equal(captured[0].init.method,'POST')
}))

test('dependency aliases rewrite a pinned root and never enable arbitrary filesystem reads',async()=>{
 const temporary=await mkdtemp(join(tmpdir(),'ml09-relay-'))
 await mkdir(join(temporary,'node_modules'))
 const dependencyRoot=await realpath(join(temporary,'node_modules'))
 try{await fixture(async({base,authorize,received})=>{
  const cookie=await authorize(),headers={Cookie:cookie}
  const text=await(await fetch(base+'/',{headers})).text()
  assert.ok(text.includes('/lab-deps/quasar/dist/quasar.sass'))
  assert.ok(text.length>4*1024*1024)
  assert.ok(!text.includes('/@fs'+dependencyRoot))
  assert.equal((await fetch(base+'/lab-deps/quasar/dist/quasar.sass',{headers})).status,200)
  assert.equal(received.at(-1).url,'/@fs'+dependencyRoot+'/quasar/dist/quasar.sass')
  for(const path of ['/@fs'+dependencyRoot+'/quasar/dist/quasar.sass','/lab-deps/eslint/package.json','/lab-deps/@quasar/extras/exports/roboto-font/%2e%2e%2f.env','/lab-deps/quasar/dist/unknown.js'])assert.equal((await fetch(base+path,{headers})).status,403)
 },{dependencyRoot,appBody:`<html><head></head><body>${'x'.repeat(4*1024*1024)}/@fs${dependencyRoot}/quasar/dist/quasar.sass</body></html>`})}
 finally{await rm(temporary,{recursive:true})}
})

test('only authenticated pinned font bytes are served; symlink escapes stay blocked',async()=>{
 const temporary=await mkdtemp(join(tmpdir(),'ml09-fonts-'))
 const directory=join(temporary,'node_modules/@quasar/extras/exports/roboto-font/web-font')
 await mkdir(directory,{recursive:true});await writeFile(join(directory,'demo.woff2'),Buffer.from([1,2,3,4]))
 await writeFile(join(temporary,'outside.woff2'),'outside');await symlink(join(temporary,'outside.woff2'),join(directory,'escape.woff2'))
 const dependencyRoot=await realpath(join(temporary,'node_modules'))
 try{await fixture(async({base,authorize,received})=>{
  const path='/lab-deps/@quasar/extras/exports/roboto-font/web-font/demo.woff2'
  assert.equal((await fetch(base+path)).status,403)
  const cookie=await authorize(),headers={Cookie:cookie}
  const response=await fetch(base+path,{headers});assert.equal(response.status,200)
  assert.equal(response.headers.get('content-type'),'font/woff2')
  assert.deepEqual(Buffer.from(await response.arrayBuffer()),Buffer.from([1,2,3,4]))
  assert.equal((await fetch(base+path.replace('demo','escape'),{headers})).status,403)
  assert.equal(received.length,0)
 },{dependencyRoot})}finally{await rm(temporary,{recursive:true})}
})

test('HTTPS browser Origin remains authoritative when a tunnel forwards loopback Host',()=>fixture(async({base,authorize,received})=>{
 const cookie=await authorize(),headers={Cookie:cookie,Origin:'https://review-only.trycloudflare.com'}
 assert.equal((await fetch(base+'/src/boot/firebase.js',{headers})).status,200)
 assert.equal(received.length,1)
 assert.equal((await fetch(base+'/src/boot/firebase.js',{headers:{...headers,Origin:base}})).status,403)
 assert.equal(received.length,1)
},{publicOrigin:'https://review-only.trycloudflare.com'}))

test('optional finite backchannel changes only Listen GET streaming flag',()=>fixture(async({base,authorize,received})=>{
 const cookie=await authorize(),headers={Cookie:cookie}
 await fetch(base+'/lab-firestore/google.firestore.v1.Firestore/Listen/channel?RID=rpc&SID=synthetic&CI=0',{headers})
 assert.equal(new URL(received.at(-1).url,'http://localhost').searchParams.get('CI'),'1')
 await fetch(base+'/lab-firestore/google.firestore.v1.Firestore/Write/channel?RID=rpc&CI=0',{headers})
 assert.equal(new URL(received.at(-1).url,'http://localhost').searchParams.get('CI'),'0')
 await fetch(base+'/lab-firestore/google.firestore.v1.Firestore/Listen/channel?CI=0',{method:'POST',headers,body:'count=0'})
 assert.equal(new URL(received.at(-1).url,'http://localhost').searchParams.get('CI'),'0')
},{finiteBackchannel:true}))

test('used entry stays closed to a different browser but works with its existing cookie; denials render inline',()=>fixture(async({base,relay,authorize})=>{
 const cookie=await authorize()
 const denied=await fetch(base+'/lab-entry?key='+relay.token)
 assert.equal(denied.status,403)
 assert.equal(denied.headers.get('content-type'),'text/plain; charset=utf-8')
 assert.equal(denied.headers.get('content-disposition'),'inline')
 const sameBrowser=await fetch(base+'/lab-entry?key='+relay.token,{headers:{Cookie:cookie}})
 assert.equal(sameBrowser.status,200)
 assert.match(sameBrowser.headers.get('content-type'),/text\/html/)
}))

test('link previews never consume an entry; explicit POST is required',()=>fixture(async({base,relay,authorize})=>{for(let i=0;i<3;i++){const page=await fetch(base+'/lab-entry?key='+relay.token);assert.equal(page.status,200);assert.equal(page.headers.get('set-cookie'),null);assert.match(await page.text(),/ml09-enter/)}assert.equal((await fetch(base+'/')).status,403);const cookie=await authorize();assert.ok(cookie);assert.equal((await fetch(base+'/',{headers:{Cookie:cookie}})).status,200)}))

test('entry form allows same-origin referrer for Safari POST while rejecting null or foreign Origins',()=>fixture(async({base,relay,authorize})=>{
 const page=await fetch(base+'/lab-entry?key='+relay.token)
 assert.equal(page.headers.get('referrer-policy'),'same-origin')
 for(const origin of ['null','https://attacker.example']){
  const r=await fetch(base+'/lab-entry',{method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({key:relay.token}).toString(),redirect:'manual'})
  assert.equal(r.status,403)
 }
 const cookie=await authorize();assert.ok(cookie)
}))

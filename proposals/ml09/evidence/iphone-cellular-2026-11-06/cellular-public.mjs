import assert from 'node:assert/strict'
import http from 'node:http'
import {readFileSync,writeFileSync,appendFileSync,existsSync,realpathSync} from 'node:fs'
import {readFile,writeFile} from 'node:fs/promises'
import {spawn,execFileSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import {createLabRelay} from './relay/relay.mjs'
import {buildProbe} from './cellular-probe.mjs'

const toolRoot=fileURLToPath(new URL('./',import.meta.url))
const root=toolRoot+'cellular-live-20261106/'
const candidate=fileURLToPath(new URL('../ML09-Cellular-2026-10-25/candidate/',import.meta.url))
const head='28d876d394dc3e5bf458303abd181f10ecb33b3b'
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:candidate,encoding:'utf8'}).trim(),head)
assert.equal(execFileSync('git',['status','--porcelain'],{cwd:candidate,encoding:'utf8'}).trim(),'')
const fixture=JSON.parse(readFileSync(root+'fixture-private.json'))
const services=JSON.parse(readFileSync(root+'private/services.json'))
assert.equal(fixture.head,head);assert.equal(fixture.project,'demo-mangalist');assert.equal(fixture.ready,true)
assert.ok(fixture.email.endsWith('@example.test'));assert.equal(services.head,head);process.kill(services.pid,0)
let stage='preflight',origin=null,relay=null,relayPort=null,stopping=false,guardian,timer,monitor
const localOnly=process.argv.includes('--local-only')
const finiteBackchannel=process.argv.includes('--finite-backchannel')
const sockets=new Set(),upstreams=new Set()
const log=value=>appendFileSync(root+'evidence/public-lifecycle.jsonl',JSON.stringify({at:new Date().toISOString(),...value})+'\n')
const writeJson=(path,value)=>writeFileSync(root+path,JSON.stringify(value,null,2)+'\n',{mode:0o600})
function track(server){server.on('connection',socket=>{sockets.add(socket);socket.once('close',()=>sockets.delete(socket))});server.on('upgrade',(_req,socket)=>socket.destroy());return server}
function forward(req,res,port,headers,transformHtml=false){
 const upstream=http.request({host:'127.0.0.1',port,path:req.url,method:req.method,headers},response=>{
  if(transformHtml&&String(response.headers['content-type']).includes('text/html')){
   const h={...response.headers};delete h['content-length'];delete h['content-encoding'];delete h['transfer-encoding']
   let body='';response.setEncoding('utf8');response.on('data',part=>{body+=part;if(body.length>1024*1024)response.destroy()})
   response.on('end',()=>{if(!res.destroyed){res.writeHead(response.statusCode,h);res.end(body.replace('<head>','<head><script type="module" src="/src/ml09-cellular-probe.js"></script>'))}})
  }else{res.writeHead(response.statusCode,response.headers);res.flushHeaders();response.pipe(res)}
  response.on('error',()=>res.destroy())
 })
 upstreams.add(upstream);upstream.once('close',()=>upstreams.delete(upstream))
 upstream.on('error',()=>{if(!res.headersSent)res.writeHead(502);res.end('Demo transport upstream unavailable')})
 upstream.setTimeout(65000,()=>upstream.destroy());res.on('close',()=>upstream.destroy());req.pipe(upstream)
}
const instrumentedApp=track(http.createServer(async(req,res)=>{
 res.setHeader('Cache-Control','no-store')
 const url=new URL(req.url,'http://localhost')
 if(url.pathname==='/src/ml09-cellular-probe.js'){
  if(req.method!=='GET'){res.writeHead(405);res.end();return}
  res.setHeader('Content-Type','application/javascript');res.end(buildProbe({...fixture,phase:stage}));return
 }
 if(url.pathname==='/src/ml09-cellular-telemetry.json'){
  if(req.method!=='GET'||req.url.length>14000){res.writeHead(413);res.end();return}
  try{
   const packet=JSON.parse(url.searchParams.get('data'))
   if(packet.version!==1||packet.run!==fixture.run||!['preflight','phone'].includes(packet.phase)||!Array.isArray(packet.events)||packet.events.length>3)throw Error('Invalid telemetry')
   appendFileSync(root+'evidence/cellular-telemetry.jsonl',JSON.stringify({receivedAt:new Date().toISOString(),...packet})+'\n')
   res.writeHead(204);res.end()
  }catch{res.writeHead(400);res.end()}
  return
 }
 const headers={...req.headers,host:'127.0.0.1:'+services.ports.app};delete headers['accept-encoding']
 forward(req,res,services.ports.app,headers,true)
}))
const bridge=track(http.createServer((req,res)=>{
 if(stopping||!relayPort||!origin){res.writeHead(503);res.end('Lab preparing');return}
 const localHost='127.0.0.1:'+bridge.address().port
 if(![localHost,new URL(origin).host].includes(req.headers.host)){res.writeHead(421);res.end();return}
 const headers={...req.headers,host:new URL(origin).host}
 forward(req,res,relayPort,headers)
}))
const listen=server=>new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve(server.address().port))})
const appPort=await listen(instrumentedApp),bridgePort=await listen(bridge)
const windowFile=root+'private/'+(localOnly?'local-window.json':'window.json')
const window=existsSync(windowFile)?JSON.parse(readFileSync(windowFile)):{startedAt:Date.now(),deadline:Date.now()+45*60*1000,authorizedProvider:'Cloudflare Quick Tunnel',maxMinutes:45}
assert.ok(window.deadline>Date.now(),'The authorized exposure window has expired')
writeFileSync(windowFile,JSON.stringify(window,null,2),{mode:0o600})
async function stop(reason){
 if(stopping)return;stopping=true;clearTimeout(timer);clearInterval(monitor)
 log({kind:'stop',reason,deadline:window.deadline})
 for(const socket of sockets)socket.destroy();for(const request of upstreams)request.destroy()
 await relay?.close();bridge.close();instrumentedApp.close();guardian?.kill('SIGINT')
 if(!localOnly)try{process.kill(services.pid,'SIGINT')}catch{}
 writeJson('private/public-state.json',{closed:true,reason,origin,deadline:window.deadline,closedAt:new Date().toISOString()})
}
process.once('SIGINT',()=>void stop('operator-stop'));process.once('SIGTERM',()=>void stop('operator-stop'))
process.once('uncaughtException',error=>{log({kind:'controller-error',message:String(error.message).slice(0,240)});void stop('controller-error')})
process.once('unhandledRejection',()=>void stop('controller-rejection'))
if(!localOnly){
await writeFile(root+'private/empty-cloudflared.yml','{}\n',{mode:0o600})
writeJson('private/guardian-config.json',{ownerPid:process.pid,deadline:window.deadline,binary:'/Users/francisconavarrete/.codex/tmp/ml09-cloudflared-20261026/cloudflared',localUrl:`http://127.0.0.1:${bridgePort}`,providerConfigFile:root+'private/empty-cloudflared.yml',stateFile:root+'private/guardian-state.json',logFile:root+'private/cloudflared.log'})
guardian=spawn(process.execPath,[toolRoot+'tunnel-guardian.mjs',root+'private/guardian-config.json'],{stdio:['ignore','ignore','pipe']})
guardian.stderr.on('data',chunk=>appendFileSync(root+'private/guardian-error.log',chunk))
guardian.once('exit',()=>{if(!stopping)void stop('guardian-exited')})
}
timer=setTimeout(()=>void stop('absolute-deadline'),window.deadline-Date.now())
async function activate(nextStage){
 const old=relay;relayPort=null;await old?.close();stage=nextStage
 const {createLabRelay:factory}=await import('./relay/relay.mjs?revision='+Date.now())
 relay=factory({appPort,authPort:services.ports.auth,firestorePort:services.ports.firestore,publicOrigin:localOnly?null:origin,ttlMs:window.deadline-Date.now(),finiteBackchannel,dependencyRoot:realpathSync(candidate+'node_modules'),onEvent:event=>appendFileSync(root+'evidence/public-relay-requests.jsonl',JSON.stringify({stage,localOnly,finiteBackchannel,...event})+'\n')})
 relayPort=await relay.listen()
 if(localOnly)origin='http://127.0.0.1:'+relayPort
 writeJson('private/entry-'+stage+'.json',{entry:origin+'/lab-entry?key='+relay.token,origin,deadline:window.deadline,stage,head,run:fixture.run})
 writeJson('private/public-state.json',{pid:process.pid,guardianPid:guardian?.pid,stage,origin,deadline:window.deadline,closed:false,localOnly})
 log({kind:'activated',stage,origin,deadline:window.deadline,head,run:fixture.run,finiteBackchannel})
}
const until=Date.now()+60000
if(localOnly)origin='local'
while(!localOnly&&!stopping&&Date.now()<until){
 if(existsSync(root+'private/guardian-state.json')){
  const state=JSON.parse(readFileSync(root+'private/guardian-state.json'))
  if(state.pid!==guardian.pid){await new Promise(resolve=>setTimeout(resolve,200));continue}
  if(state.closed){await stop('tunnel-failed');throw Error('Tunnel did not become ready')}
  if(state.origin&&state.connected){origin=state.origin;break}
 }
 await new Promise(resolve=>setTimeout(resolve,500))
}
if(!origin){await stop('tunnel-start-timeout');throw Error('No connected tunnel within 60 seconds')}
await activate('preflight')
let lastControl=''
monitor=setInterval(()=>{
 if(stopping)return
 try{process.kill(services.pid,0)}catch{void stop('demo-services-exited');return}
 try{
  if(!localOnly){const state=JSON.parse(readFileSync(root+'private/guardian-state.json'));if(state.pid===guardian.pid&&state.closed){void stop('guardian-closed');return}}
  const controlFile=root+'private/'+(localOnly?'control-local.json':'control.json')
  if(existsSync(controlFile)){
   const control=readFileSync(controlFile,'utf8')
   if(control!==lastControl){lastControl=control;const command=JSON.parse(control).command
    if(command==='phone-ready'&&stage==='preflight')void activate('phone').catch(()=>void stop('rotation-failed'))
    if(command==='renew-phone'&&stage==='phone')void activate('phone').catch(()=>void stop('rotation-failed'))
    if(command==='retry-preflight'&&stage==='preflight')void activate('preflight').catch(()=>void stop('rotation-failed'))
    if(command==='stop')void stop('operator-stop')
   }
  }
 }catch{}
},500)
console.log('HTTPS tunnel prepared for protected preflight; phone entry not yet issued')

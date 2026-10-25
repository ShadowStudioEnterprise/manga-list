import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {readFile,writeFile} from 'node:fs/promises'
const out='../deliveries/ml09-redmi-2026-10-25'
const prep=JSON.parse(await readFile(out+'/preparation.json','utf8'))
const adb='C:/Users/fran_/AppData/Local/Android/Sdk/platform-tools/adb.exe'
const evidence={head:prep.head,synthetic:true,method:'Physical screen lock; native clocks; direct CDP, USB demo transport; no forced doze or battery changes',power:[],targets:0,errors:[],wholeSystemSuspensionProven:false}
const tabs=await(await fetch('http://127.0.0.1:58585/json/list')).json()
const tab=tabs.find(t=>t.url.startsWith(prep.origin+'/'));assert.ok(tab)
const ws=new WebSocket(tab.webSocketDebuggerUrl)
await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true})})
let id=0;const pending=new Map()
function send(method,params={}){return new Promise((resolve,reject)=>{const key=++id,timer=setTimeout(()=>{pending.delete(key);reject(Error('CDP timeout '+method))},20000);pending.set(key,{resolve,reject,timer});ws.send(JSON.stringify({id:key,method,params}))})}
ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(m.error.message)):p.resolve(m.result)}}else if(m.method==='Network.requestWillBeSent'&&m.params.request.url.includes('google.firestore.v1.Firestore/Listen')){for(const v of new URLSearchParams(m.params.request.postData||'').values())if(v.includes('"addTarget"'))evidence.targets++}})
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value}
function power(){const text=execFileSync(adb,['shell','dumpsys','power'],{encoding:'utf8',timeout:10000});return {at:new Date().toISOString(),wakefulness:text.match(/mWakefulness=(\w+)/)?.[1],powered:text.match(/mIsPowered=(\w+)/)?.[1],wakeLockSummary:text.match(/mWakeLockSummary=(\w+)/)?.[1]}}
const sleep=ms=>new Promise(r=>setTimeout(r,ms))
async function snapshot(){return evaluate(`(async()=>{const {useMangaStore}=await import('/src/stores/manga-store.js');const s=useMangaStore();return {at:Date.now(),count:s.mangas.length,unique:new Set(s.mangas.map(x=>x.id)).size,chapter:s.mangas.find(x=>x.id==='probe-0')?.chapter,error:s.syncError,status:document.querySelector('[role=status]')?.textContent,search:document.querySelector('input[aria-label="Buscar por nombre"]')?.value,visibility:document.visibilityState}})()`)}
try{
 await send('Network.enable');await send('Page.enable');await send('Runtime.enable')
 await send('Emulation.setFocusEmulationEnabled',{enabled:false})
 assert.equal(await evaluate("(async()=>{const {firebaseApp}=await import('/src/boot/firebase.js');return firebaseApp.options.projectId})()"),'demo-mangalist')
 evidence.before=await snapshot();assert.equal(evidence.before.count,500);assert.equal(evidence.before.chapter,'1')
 await evaluate("globalThis.__ml09Physical={events:[],ticks:0,maxGap:0,last:Date.now()};globalThis.__ml09Physical.timer=setInterval(()=>{const n=Date.now();__ml09Physical.maxGap=Math.max(__ml09Physical.maxGap,n-__ml09Physical.last);__ml09Physical.last=n;__ml09Physical.ticks++},250);for(const t of ['freeze','resume','visibilitychange'])document.addEventListener(t,()=>__ml09Physical.events.push({type:t,at:Date.now(),visibility:document.visibilityState}));true")
 console.log('READY: waiting for physical screen lock, maximum 5 minutes')
 let asleepAt=null
 for(let n=0;n<60;n++){const p=power();evidence.power.push(p);if(p.wakefulness==='Asleep'||p.wakefulness==='Dozing'){asleepAt=Date.now();break}if(n%6===0)console.log('Waiting for screen lock');await sleep(5000)}
 assert.ok(asleepAt,'Physical screen lock was not observed within 5 minutes')
 const response=await fetch('http://127.0.0.1:8188/v1/projects/demo-mangalist/databases/(default)/documents/users/'+encodeURIComponent(prep.uid)+'/mangas/probe-0?updateMask.fieldPaths=chapter',{method:'PATCH',headers:{Authorization:'Bearer owner','Content-Type':'application/json'},body:JSON.stringify({fields:{chapter:{stringValue:'2'}}}),signal:AbortSignal.timeout(10000)})
 assert.equal(response.status,200);assert.equal((await response.json()).fields.chapter.stringValue,'2')
 evidence.concurrentServerWrite='2';console.log('LOCK OBSERVED: concurrent synthetic chapter 2 committed; waiting for unlock')
 let awakeAt=null
 for(let n=0;n<72;n++){await sleep(5000);const p=power();evidence.power.push(p);if(p.wakefulness==='Awake'){awakeAt=Date.now();break}if(n%6===0)console.log('Screen remains locked; elapsed '+Math.round((Date.now()-asleepAt)/1000)+'s')}
 assert.ok(awakeAt,'No wake observed within 6 minutes');evidence.observedScreenLockMs=awakeAt-asleepAt
 evidence.resumed=await snapshot();evidence.lifecycle=await evaluate('__ml09Physical');delete evidence.lifecycle.timer
 console.log('AWAKE: checking recovery; no synthetic freeze or clock advance was used')
 evidence.observations=[]
 for(let n=0;n<70;n++){
  const current=await snapshot();evidence.observations.push(current)
  if(current.error&&!evidence.manualRetry){const clicked=await evaluate("(()=>{const b=[...document.querySelectorAll('main [role=alert] button')].find(b=>b.textContent.includes('Reintentar'));if(!b||b.disabled)return false;b.click();return true})()");if(clicked){evidence.manualRetry=true;console.log('One explicit recovery requested')}}
  if(current.chapter==='2'&&current.status?.includes('Última instantánea')&&!current.error)break
  await sleep(1000)
 }
 const final=evidence.observations.at(-1);assert.equal(final.chapter,'2');assert.equal(final.count,500);assert.equal(final.unique,500);assert.match(final.status,/Última instantánea/)
 evidence.exported=await evaluate("(async()=>{const {auth}=await import('/src/boot/firebase.js');const {fetchLibraryForExport}=await import('/src/services/manga-service.js');const {mangas}=await fetchLibraryForExport(auth.currentUser.uid);return {count:mangas.length,unique:new Set(mangas.map(x=>x.id)).size,chapter:mangas.find(x=>x.id==='probe-0')?.chapter}})()")
 assert.deepEqual(evidence.exported,{count:500,unique:500,chapter:'2'})
 evidence.targetsAtRecovery=evidence.targets;console.log('Library and export verified; observing 60 seconds stability')
 await sleep(30000);evidence.stable30=await snapshot();console.log('Stability observation: 30 seconds')
 await sleep(30000);evidence.stable60=await snapshot();assert.equal(evidence.targets,evidence.targetsAtRecovery);assert.equal(evidence.stable60.chapter,'2');assert.equal(evidence.stable60.count,500);assert.match(evidence.stable60.status,/Última instantánea/)
 evidence.result='passed-screen-lock-scope-only'
}catch(error){evidence.result='failed-or-blocked';evidence.failure=error.message;process.exitCode=1}
finally{await evaluate('clearInterval(globalThis.__ml09Physical?.timer);true').catch(()=>{});ws.close();evidence.timestamp=new Date().toISOString();await writeFile(out+'/screen-lock.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify({result:evidence.result,failure:evidence.failure,observedScreenLockMs:evidence.observedScreenLockMs,exported:evidence.exported,wholeSystemSuspensionProven:false}))}

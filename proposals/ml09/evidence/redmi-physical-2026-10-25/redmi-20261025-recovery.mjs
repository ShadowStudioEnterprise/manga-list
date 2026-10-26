import assert from 'node:assert/strict'
import {writeFile} from 'node:fs/promises'
const out='../deliveries/ml09-redmi-2026-10-25'
const result={stage:'Separate follow-up; does not replace interrupted lock attempt',head:'b435371af8d75071857667daaab69852543a9c42',addTargets:0}
const tabs=await(await fetch('http://127.0.0.1:58585/json/list')).json()
const tab=tabs.find(t=>t.url.startsWith('http://127.0.0.1:9325/'));assert.ok(tab)
const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true})})
let id=0;const pending=new Map()
function send(method,params={}){return new Promise((resolve,reject)=>{const key=++id,timer=setTimeout(()=>{pending.delete(key);reject(Error('CDP timeout '+method))},15000);pending.set(key,{resolve,reject,timer});ws.send(JSON.stringify({id:key,method,params}))})}
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(m.error.message)):p.resolve(m.result)}}else if(m.method==='Network.requestWillBeSent'&&m.params.request.url.includes('google.firestore.v1.Firestore/Listen'))for(const v of new URLSearchParams(m.params.request.postData||'').values())if(v.includes('"addTarget"'))result.addTargets++})
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value}
async function snapshot(){return evaluate("(async()=>{const {useMangaStore}=await import('/src/stores/manga-store.js');const s=useMangaStore();return{at:Date.now(),count:s.mangas.length,unique:new Set(s.mangas.map(x=>x.id)).size,chapter:s.mangas.find(x=>x.id==='probe-0')?.chapter,error:s.syncError,status:document.querySelector('[role=status]')?.textContent,search:document.querySelector('input[aria-label=\"Buscar por nombre\"]')?.value,visibility:document.visibilityState}})()")}
try{
 await send('Network.enable');await send('Page.bringToFront');console.log('Own demo tab brought to front; no reload or transport reset')
 result.before=await snapshot();result.lifecycle=await evaluate('globalThis.__ml09Physical');if(result.lifecycle)delete result.lifecycle.timer
 assert.equal(result.before.chapter,'2');assert.equal(result.before.count,500);assert.equal(result.before.unique,500);assert.equal(result.before.search,'ML09 física 0000');assert.match(result.before.error,/suspendido/);assert.equal(result.before.status,undefined);await evaluate("(()=>{const b=[...document.querySelectorAll('main [role=alert] button')].find(b=>b.textContent.includes('Reintentar'));if(!b||b.disabled)throw Error('Missing enabled retry');b.click();return true})()");result.manualRetry=true;for(let n=0;n<60;n++){result.recovered=await snapshot();if(result.recovered.chapter==='2'&&result.recovered.status?.includes('Última instantánea')&&!result.recovered.error)break;await new Promise(r=>setTimeout(r,1000))};assert.match(result.recovered.status,/Última instantánea/);assert.equal(result.recovered.error,null)
 for(let n=1;n<=3;n++){await new Promise(r=>setTimeout(r,20000));result['after'+(n*20)]=await snapshot();console.log('Stability '+(n*20)+' seconds')}
 assert.equal(result.after60.chapter,'2');assert.equal(result.after60.count,500);assert.equal(result.after60.unique,500);assert.equal(result.after60.search,'ML09 física 0000');assert.match(result.after60.status,/Última instantánea/);assert.equal(result.addTargets,1)
 result.exported=await evaluate("(async()=>{const {auth}=await import('/src/boot/firebase.js');const {fetchLibraryForExport}=await import('/src/services/manga-service.js');const {mangas}=await fetchLibraryForExport(auth.currentUser.uid);return {count:mangas.length,unique:new Set(mangas.map(x=>x.id)).size,chapter:mangas.find(x=>x.id==='probe-0')?.chapter}})()")
 assert.deepEqual(result.exported,{count:500,unique:500,chapter:'2'});result.result='passed-explicit-recovery-only'
}catch(error){result.result='failed-or-blocked';result.failure=error.message;process.exitCode=1}
finally{await evaluate('clearInterval(globalThis.__ml09Physical?.timer);true').catch(()=>{});ws.close();result.timestamp=new Date().toISOString();await writeFile(out+'/recovery.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result))}



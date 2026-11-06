import assert from 'node:assert/strict'
import {readFile,writeFile,appendFile} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
const root=fileURLToPath(new URL('./cellular-live-20261106/',import.meta.url))
const entry=JSON.parse(await readFile(root+'private/entry-preflight.json'))
const fixture=JSON.parse(await readFile(root+'fixture-private.json'))
const label=process.env.ML09_PREFLIGHT_LABEL||'https'
assert.match(label,/^[a-z-]+$/)
let session
async function request(path,body,method=body===undefined?'GET':'POST'){
 const response=await fetch('http://127.0.0.1:4445'+path,{method,headers:{'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(90000)})
 const result=await response.json();if(result.value?.error)throw Error(result.value.error+': '+result.value.message);return result.value
}
const wd=(path,body,method)=>request('/session/'+session+path,body,method)
const js=(script,args=[])=>wd('/execute/sync',{script,args})
const log=value=>appendFile(root+'evidence/'+label+'-preflight.jsonl',JSON.stringify({at:new Date().toISOString(),...value})+'\n')
try{
 const anonymous=await fetch(entry.origin+'/',{signal:AbortSignal.timeout(20000)})
 assert.equal(anonymous.status,403);assert.match(await anonymous.text(),/Lab request unavailable/)
 await log({kind:'anonymous-denied',status:403})
 const created=await request('/session',{capabilities:{alwaysMatch:{browserName:'safari'}}})
 session=created.sessionId
 await wd('/timeouts',{pageLoad:60000,script:30000,implicit:0})
 await writeFile(root+'private/preflight-safari.json',JSON.stringify({session}),{mode:0o600})
 await wd('/url',{url:entry.entry})
 const confirmed=await js("const button=document.getElementById('ml09-enter');if(!button)return false;button.click();return true");assert.equal(confirmed,true)
 await log({kind:'navigation-complete',capabilities:created.capabilities})
 const until=Date.now()+70000
 let state
 while(Date.now()<until){
  state=await js('return window.ml09Cellular?.snapshot()||null')
  if(state?.count===500&&state.unique===500&&state.fromCache===false&&!state.pending&&!state.loading&&!state.error)break
  await new Promise(resolve=>setTimeout(resolve,1000))
 }
 assert.equal(state?.count,500);assert.equal(state.unique,500);assert.equal(state.fromCache,false);assert.equal(state.pending,false);assert.equal(state.error,null)
 const identity=await wd('/execute/async',{script:"const done=arguments[arguments.length-1];import('/src/boot/firebase.js').then(f=>done({project:f.firebaseApp.options.projectId,expectedAccount:f.auth.currentUser?.uid===arguments[0]}),e=>done({error:String(e)}))",args:[fixture.uid]})
 assert.equal(identity.project,'demo-mangalist');assert.equal(identity.expectedAccount,true)
 const screenshot=await wd('/screenshot');await writeFile(root+'evidence/'+label+'-preflight-500.png',Buffer.from(screenshot,'base64'))
 const result={passed:true,at:new Date().toISOString(),head:entry.head,origin:entry.origin,deadline:entry.deadline,scope:entry.origin.startsWith('https:')?'Native Mac Safari through real public HTTPS; not physical cellular':'Local instrumented proxy diagnostic only',state,identity,ml09Complete:false}
 await writeFile(root+'evidence/'+label+'-preflight-result.json',JSON.stringify(result,null,2)+'\n');await log({kind:'passed',state,identity});console.log('HTTPS preflight passed: 500 unique, demo account, server confirmed')
}catch(error){
 await log({kind:'failed',message:String(error.message).slice(0,500)})
 if(session){try{const data=await wd('/screenshot');await writeFile(root+'evidence/'+label+'-preflight-failed.png',Buffer.from(data,'base64'))}catch{}}
 throw error
}finally{if(session)await wd('',undefined,'DELETE').catch(()=>{})}

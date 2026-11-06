import assert from 'node:assert/strict'
import {readFile,writeFile,mkdir} from 'node:fs/promises'
import {appendFileSync,realpathSync} from 'node:fs'
import {createWriteStream} from 'node:fs'
import {execFileSync,spawn} from 'node:child_process'
import {randomUUID,createHash} from 'node:crypto'
import {fileURLToPath} from 'node:url'
import {createLabRelay} from './relay/relay.mjs'

const toolRoot=fileURLToPath(new URL('./',import.meta.url))
const root=fileURLToPath(new URL('./cellular-live-20261106/',import.meta.url))
const candidate=fileURLToPath(new URL('../ML09-Cellular-2026-10-25/candidate/',import.meta.url))
const head='28d876d394dc3e5bf458303abd181f10ecb33b3b'
const project='demo-mangalist'
const json=async(path,value)=>writeFile(root+path,JSON.stringify(value,null,2)+'\n',{mode:0o600})
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:candidate,encoding:'utf8'}).trim(),head)
assert.equal(execFileSync('git',['status','--porcelain'],{cwd:candidate,encoding:'utf8'}).trim(),'')
const original=JSON.parse(await readFile(toolRoot+'handoff-original/manifest-sha256.json'))
for(const entry of original){const bytes=await readFile(toolRoot+'handoff-original/'+entry.path);assert.equal(bytes.length,entry.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256)}

const ports={app:9335,auth:9299,firestore:8288,hub:4501,logging:4601,websocket:9250}
const api=async(path,body,auth=false)=>{
 const port=auth?ports.auth:ports.firestore
 assert.ok(path.startsWith('/v1/projects/demo-mangalist/')||auth&&path.startsWith('/identitytoolkit.googleapis.com/'))
 const r=await fetch(`http://127.0.0.1:${port}${path}`,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(!auth?{Authorization:'Bearer owner'}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(30000)})
 if(!r.ok) throw Error(`Demo emulator ${r.status}: ${await r.text()}`)
 return r.json()
}
export async function documents(uid){
 const docs=[];let token=''
 do{const page=await api(`/v1/projects/${project}/databases/(default)/documents/users/${encodeURIComponent(uid)}/mangas?pageSize=500${token?'&pageToken='+encodeURIComponent(token):''}`);docs.push(...page.documents||[]);assert.ok(docs.length<=500);token=page.nextPageToken||''}while(token)
 assert.equal(docs.length,500);assert.equal(new Set(docs.map(d=>d.name)).size,500);return docs
}
export async function changeChapter(chapter){
 assert.match(chapter,/^\d{1,3}$/)
 const f=JSON.parse(await readFile(root+'fixture-private.json'))
 assert.equal(f.head,head)
 return api(`/v1/projects/${project}/databases/(default)/documents:commit`,{writes:[{update:{name:`projects/${project}/databases/(default)/documents/users/${f.uid}/mangas/ml09-0000`,fields:{chapter:{stringValue:chapter}}},updateMask:{fieldPaths:['chapter']},currentDocument:{exists:true}}]})
}
const children=[]
let activeRelay
let stopping=false
let servicesWatchdog
function start(args,name,env={}){
 const output=createWriteStream(root+'evidence/'+name+'.log',{flags:'a',mode:0o600})
 const child=spawn(process.execPath,args,{cwd:candidate,env:{...process.env,...env},stdio:['ignore','pipe','pipe']})
 child.stdout.pipe(output);child.stderr.pipe(output);children.push(child)
 child.once('exit',(code,signal)=>{
  if(stopping)return
  appendFileSync(root+'evidence/service-exits.jsonl',JSON.stringify({at:new Date().toISOString(),name,code,signal})+'\n')
  stopping=true
  clearTimeout(servicesWatchdog)
  void activeRelay?.close()
  for(const other of children)if(other!==child)other.kill('SIGINT')
 })
 return child
}
async function ready(url,child){
 const until=Date.now()+120000
 while(Date.now()<until){if(child.exitCode!==null)throw Error('Service exited: '+child.exitCode);try{if((await fetch(url,{signal:AbortSignal.timeout(1500)})).ok)return}catch{}await new Promise(r=>setTimeout(r,500))}
 throw Error('Service did not become ready: '+url)
}
async function openRelay(){
 const relay=createLabRelay({appPort:ports.app,authPort:ports.auth,firestorePort:ports.firestore,dependencyRoot:realpathSync(candidate+'node_modules'),onEvent:event=>appendFileSync(root+'evidence/relay-requests.jsonl',JSON.stringify(event)+'\n')})
 const port=await relay.listen()
 await json('entry-private.json',{entry:`http://127.0.0.1:${port}/lab-entry?key=${relay.token}`,expires:relay.expires})
 appendFileSync(root+'evidence/relay-requests.jsonl',JSON.stringify({kind:'relay-open',at:new Date().toISOString(),implementationSha256:createHash('sha256').update(await readFile(root+'relay/relay.mjs')).digest('hex'),port,expires:relay.expires})+'\n')
 return relay
}
async function launch(){
 await mkdir(root+'evidence',{recursive:true})
 // Probe all ports before starting; never reuse another laboratory.
 const {createServer}=await import('node:net')
 for(const port of Object.values(ports))await new Promise((resolve,reject)=>{const s=createServer();s.once('error',reject);s.listen(port,'127.0.0.1',()=>s.close(resolve))})
 await json('firebase-local.json',{firestore:{rules:candidate+'firestore.rules'},emulators:{auth:{host:'127.0.0.1',port:ports.auth},firestore:{host:'127.0.0.1',port:ports.firestore,websocketPort:ports.websocket},hub:{host:'127.0.0.1',port:ports.hub},logging:{host:'127.0.0.1',port:ports.logging},ui:{enabled:false}}})
 const emulator=start(['/Users/francisconavarrete/.npm/_npx/ba4f1959e38407b5/node_modules/firebase-tools/lib/bin/firebase.js','emulators:start','--config',root+'firebase-local.json','--project',project,'--only','auth,firestore'],'emulators',{CI:'true',FIREBASE_CLI_DISABLE_UPDATE_CHECK:'true'})
 await ready(`http://127.0.0.1:${ports.firestore}/`,emulator)
 await ready(`http://127.0.0.1:${ports.auth}/emulator/v1/projects/${project}/config`,emulator)
 const app=start(['node_modules/@quasar/app-vite/bin/quasar.js','dev','--hostname','127.0.0.1','--port',String(ports.app)],'application',{QCLI_FIREBASE_EMULATORS:'true',MANGALIST_E2E_NO_HMR:'true',VITE_FIREBASE_API_KEY:'demo-mangalist-key',VITE_FIREBASE_AUTH_DOMAIN:'demo-mangalist.firebaseapp.com',VITE_FIREBASE_PROJECT_ID:project,VITE_FIREBASE_STORAGE_BUCKET:'demo-mangalist.appspot.com',VITE_FIREBASE_MESSAGING_SENDER_ID:'123456789',VITE_FIREBASE_APP_ID:'1:123456789:web:demo'})
 await ready(`http://127.0.0.1:${ports.app}/`,app)
 const run=randomUUID(),email=`ml09-cellular-${run}@example.test`,password=`Demo-only-${randomUUID()}!`
 const account=await api('/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-mangalist-key',{email,password,returnSecureToken:true},true)
 const fixture={head,project,run,email,password,uid:account.localId,ready:false}
 await json('fixture-private.json',fixture)
 for(let offset=0;offset<500;offset+=400){const writes=[]
  for(let i=offset;i<Math.min(offset+400,500);i++){
   const fields=Object.fromEntries(Object.entries({name:`ML09 Celular ${String(i).padStart(4,'0')}`,normalizedName:`ml09-celular-${String(i).padStart(4,'0')}`,chapter:'1',type:'manga',readingStatus:'following',publicationStatus:'unknown',notes:''}).map(([k,v])=>[k,{stringValue:v}]))
   Object.assign(fields,{schemaVersion:{integerValue:'1'},genres:{arrayValue:{values:[]}},sources:{arrayValue:{values:[]}},favorite:{booleanValue:false},createdAt:{timestampValue:'2026-10-26T00:00:00Z'},updatedAt:{timestampValue:'2026-10-26T00:00:00Z'}})
   writes.push({update:{name:`projects/${project}/databases/(default)/documents/users/${fixture.uid}/mangas/ml09-${String(i).padStart(4,'0')}`,fields},currentDocument:{exists:false}})
  }
  await api(`/v1/projects/${project}/databases/(default)/documents:commit`,{writes})
 }
 await json('evidence/seed-snapshot.json',await documents(fixture.uid));fixture.ready=true;await json('fixture-private.json',fixture)
 await json('private/services.json',{head,ports,run,pid:process.pid,ready:true,startedAt:new Date().toISOString()})
 console.log('Isolated demo services and 500 synthetic works prepared; browser/public integration pending')
 const stop=()=>{stopping=true;clearTimeout(servicesWatchdog);for(const child of children)child.kill('SIGINT')}
 servicesWatchdog=setTimeout(stop,60*60*1000)
 process.once('SIGINT',stop);process.once('SIGTERM',stop)

}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 if(process.argv[2]==='chapter')await changeChapter(process.argv[3])
 else try{await launch()}catch(error){for(const child of children)child.kill('SIGINT');throw error}
}

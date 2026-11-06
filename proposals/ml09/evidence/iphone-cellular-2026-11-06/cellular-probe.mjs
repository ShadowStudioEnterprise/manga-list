// Test instrumentation only; served behind the lab cookie, outside candidate source.
export function buildProbe(config){
 return `(${probe.toString()})(${JSON.stringify(config)})`
}
function probe(config){
 const storageKey='ml09-cellular-events:'+config.run+':'+config.phase
 let history=[];try{history=JSON.parse(sessionStorage.getItem(storageKey)||'[]')}catch{}
 const clientId=crypto.randomUUID(),queue=[]
 let store,auth,loginAttempted=false,sending=false,latest={waiting:true},lastSuccess=null,lastFailure=null
 const save=()=>{try{sessionStorage.setItem(storageKey,JSON.stringify(history.slice(-1200)))}catch{}}
 function record(kind,value={}){const entry={kind,at:new Date().toISOString(),...value};history.push(entry);queue.push(entry);if(queue.length>300)queue.shift();save();return entry}
 const banner=document.createElement('div')
 Object.assign(banner.style,{position:'fixed',bottom:'4px',left:'4px',zIndex:99999,background:'#171526',color:'white',font:'12px system-ui',padding:'6px 9px',borderRadius:'8px',maxWidth:'95vw',pointerEvents:'none'})
 banner.textContent='ML-09 · demo · preparando registro';document.body.appendChild(banner)
 const clean=value=>String(value||'').replace(/https?:\/\/\S+/g,'[url]').slice(0,240)
 for(const type of ['online','offline','pageshow','pagehide'])addEventListener(type,()=>record('lifecycle',{type,online:navigator.onLine,visibility:document.visibilityState}))
 for(const type of ['visibilitychange','freeze','resume'])document.addEventListener(type,()=>record('lifecycle',{type,online:navigator.onLine,visibility:document.visibilityState}))
 addEventListener('error',event=>record('browser-error',{message:clean(event.message)}))
 addEventListener('unhandledrejection',event=>record('unhandled-rejection',{message:clean(event.reason?.message||event.reason)}))
 const create=URL.createObjectURL.bind(URL)
 URL.createObjectURL=function(blob){
  const result=create(blob)
  if(blob instanceof Blob&&/json/.test(blob.type))void blob.text().then(async text=>{
   const data=JSON.parse(text)
   if(data.formatVersion!==2||!Array.isArray(data.mangas))return
   const bytes=new TextEncoder().encode(text),digest=await crypto.subtle.digest('SHA-256',bytes)
   record('export-generated',{bytes:bytes.length,sha256:[...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join(''),count:data.mangas.length,unique:new Set(data.mangas.map(m=>m.id)).size,verification:data.verification,nativeFileSaved:false})
  }).catch(()=>{})
  return result
 }
 async function tick(){
  try{
   if(!auth){const fb=await import('/src/boot/firebase.js');if(fb.firebaseApp?.options.projectId!=='demo-mangalist')throw Error('Outside demo project');auth=fb.auth}
   if(!loginAttempted&&!auth.currentUser){
    const email=document.querySelector('input[type=email]'),password=document.querySelector('input[type=password]')
    if(email&&password&&email.value===''){
     loginAttempted=true
     for(const [el,value]of[[email,config.email],[password,config.password]]){el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}))}
     email.closest('form').requestSubmit();record('synthetic-ui-login-submitted')
    }
   }
   if(auth.currentUser&&auth.currentUser.uid!==config.uid)throw Error('Account does not match synthetic fixture')
   if(auth.currentUser){
    if(!store){const m=await import('/src/stores/manga-store.js');store=m.useMangaStore()}
    latest={count:store.mangas.length,unique:new Set(store.mangas.map(m=>m.id)).size,chapter:store.mangas.find(m=>m.id==='ml09-0000')?.chapter,favorite:store.mangas.find(m=>m.id==='ml09-0000')?.favorite,fromCache:store.snapshotFromCache,loading:store.loading,pending:store.hasPendingWrites,pendingOperations:store.pendingOperations,error:store.syncError,search:store.searchQuery,status:store.syncStatusMessage,online:navigator.onLine,visibility:document.visibilityState,clientAt:new Date().toISOString(),lastProbeSuccess:lastSuccess,lastProbeFailure:lastFailure}
    record('state',latest)
    banner.textContent='ML-09 · demo · '+latest.count+' obras · '+(latest.pending?'pendiente':latest.error?'revisar aviso':latest.fromCache?'datos locales':'servidor')
   }
  }catch(error){record('instrument-error',{message:clean(error.message)});banner.textContent='ML-09 · revisar registro de prueba'}
  if(sending)return
  sending=true
  const batch=queue.slice(0,3)
  try{
   const packet={version:1,run:config.run,phase:config.phase,clientId,userAgent:navigator.userAgent,latest,events:batch}
   const r=await fetch('/src/ml09-cellular-telemetry.json?data='+encodeURIComponent(JSON.stringify(packet)),{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(1500)})
   if(!r.ok)throw Error('Telemetry HTTP '+r.status)
   queue.splice(0,batch.length);lastSuccess=new Date().toISOString()
  }catch{lastFailure=new Date().toISOString()}
  finally{sending=false}
 }
 window.ml09Cellular={snapshot:()=>({...latest}),history:()=>history.slice(),clientId,scope:'Passive lab probe; does not disable SDK or change clock'}
 record('probe-start',{head:config.head,userAgent:navigator.userAgent,phase:config.phase,nativeClock:true,physicalNetworkEvidence:false})
 void tick();setInterval(()=>void tick(),2000)
}

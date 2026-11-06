import http from 'node:http'
import {writeFile} from 'node:fs/promises'
const body='count=0'
function check(kind){return new Promise(resolve=>{
 const started=Date.now();let result={kind};let finished=false
 const finish=extra=>{if(finished)return;finished=true;clearTimeout(timer);req.destroy();resolve({...result,...extra,elapsedMs:Date.now()-started})}
 const path='/google.firestore.v1.Firestore/Listen/channel?'+new URLSearchParams({VER:'8',database:'projects/demo-mangalist/databases/(default)',RID:String(Math.floor(Math.random()*100000)),CVER:'22','X-HTTP-Session-Id':'gsessionid',t:'1'})
 const headers={'Content-Type':'application/x-www-form-urlencoded',...(kind==='chunked'?{'Transfer-Encoding':'chunked'}:{'Content-Length':Buffer.byteLength(body)})}
 const req=http.request({host:'127.0.0.1',port:8288,path,method:'POST',headers},res=>{result.status=res.statusCode;result.headersAtMs=Date.now()-started;res.once('data',data=>finish({firstChunkBytes:data.length}));res.once('end',()=>finish({ended:true}))})
 req.once('error',error=>finish({error:error.code}))
 const timer=setTimeout(()=>finish({timedOut:true}),3500)
 req.end(body)
})}
const result=await Promise.all([check('content-length'),check('chunked')])
await writeFile(new URL('./cellular-live-20261106/evidence/request-framing-diagnostic.json',import.meta.url),JSON.stringify(result,null,2)+'\n')
console.log(JSON.stringify(result))

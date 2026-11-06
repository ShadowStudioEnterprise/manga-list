import assert from 'node:assert/strict'
import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {fileURLToPath} from 'node:url'
import {documents} from './services-run.mjs'
const root=fileURLToPath(new URL('./cellular-live-20261106/',import.meta.url))
const decode=value=>{
 if('stringValue'in value)return value.stringValue
 if('booleanValue'in value)return value.booleanValue
 if('integerValue'in value)return Number(value.integerValue)
 if('doubleValue'in value)return value.doubleValue
 if('timestampValue'in value)return new Date(value.timestampValue).toISOString()
 if('nullValue'in value)return null
 if('arrayValue'in value)return(value.arrayValue.values||[]).map(decode)
 if('mapValue'in value)return Object.fromEntries(Object.entries(value.mapValue.fields||{}).map(([k,v])=>[k,decode(v)]))
 throw Error('Unknown emulator value')
}
export function verify(data,snapshot){
 assert.equal(data.formatVersion,2)
 assert.equal(data.verification.source,'server')
 assert.equal(data.verification.hasPendingWrites,false)
 assert.ok(Number.isFinite(Date.parse(data.verification.observedAtClient)))
 assert.equal(data.mangas.length,500);assert.equal(snapshot.length,500)
 assert.equal(new Set(data.mangas.map(m=>m.id)).size,500)
 const expected=new Map(snapshot.map(d=>[d.name.split('/').at(-1),{id:d.name.split('/').at(-1),...Object.fromEntries(Object.entries(d.fields).map(([k,v])=>[k,decode(v)]))}]))
 for(const manga of data.mangas)assert.deepEqual(manga,expected.get(manga.id),manga.id)
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const file=process.argv[2];assert.ok(file,'Expected actual downloaded JSON path')
 const fixture=JSON.parse(await readFile(root+'fixture-private.json'))
 const raw=await readFile(file),data=JSON.parse(raw),snapshot=await documents(fixture.uid)
 await writeFile(root+'evidence/export-server-snapshot.json',JSON.stringify(snapshot,null,2)+'\n')
 verify(data,snapshot)
 const partial=structuredClone(data);partial.mangas.pop();assert.throws(()=>verify(partial,snapshot))
 const altered=structuredClone(data);altered.mangas[0].notes+='altered';assert.throws(()=>verify(altered,snapshot))
 const record={head:fixture.head,checkedAt:new Date().toISOString(),sourceFile:file,sha256:createHash('sha256').update(raw).digest('hex'),count:500,unique:500,allFieldsMatch:true,partialRejected:true,alteredRejected:true,scope:'Artifact comparison; physical attribution requires session and native-save evidence',ml09Complete:false}
 await writeFile(root+'evidence/export-verification.json',JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify(record))
}

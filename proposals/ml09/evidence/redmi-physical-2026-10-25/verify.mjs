import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
const json=async name=>JSON.parse((await readFile(new URL(name,import.meta.url),'utf8')).replace(/^\uFEFF/,''))
const prep=await json('preparation.json'),attempt=await json('screen-lock.json'),followup=await json('followup.json'),recovery=await json('recovery.json')
for(const r of [prep,attempt,followup,recovery])assert.equal(r.head,'b435371af8d75071857667daaab69852543a9c42')
assert.equal(prep.result,'prepared');assert.equal(prep.project,'demo-mangalist')
assert.equal(attempt.result,'failed-or-blocked');assert.match(attempt.failure,/CDP timeout/)
assert.equal(followup.result,'failed-or-blocked');assert.match(followup.before.error,/suspendido/)
assert.equal(recovery.result,'passed-explicit-recovery-only');assert.equal(recovery.manualRetry,true);assert.equal(recovery.addTargets,1)
assert.match(recovery.before.error,/suspendido/);assert.equal(recovery.before.status,undefined)
for(const name of ['recovered','after20','after40','after60']){const r=recovery[name];assert.equal(r.count,500);assert.equal(r.unique,500);assert.equal(r.chapter,'2');assert.equal(r.search,'ML09 física 0000');assert.equal(r.error,null);assert.match(r.status,/Última instantánea/)}
assert.deepEqual(recovery.exported,{count:500,unique:500,chapter:'2'})
const freeze=recovery.lifecycle.events.find(e=>e.type==='freeze'),resume=recovery.lifecycle.events.find(e=>e.type==='resume')
assert.equal(resume.at-freeze.at,187030);assert.equal(recovery.after60.at-recovery.recovered.at,60082)
assert.equal(attempt.wholeSystemSuspensionProven,false)
const manifest=await json('manifest-sha256.json')
for(const entry of manifest){const bytes=await readFile(new URL(entry.path,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256,entry.path)}
console.log(JSON.stringify({verified:true,files:manifest.length,scope:'native tab freeze and separate explicit recovery; not whole-system suspend',ml09Complete:false}))

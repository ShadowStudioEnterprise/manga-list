import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=new URL('./',import.meta.url);
const rows=(await readFile(new URL('ios-validation.jsonl',root),'utf8')).trim().split('\n').map(JSON.parse);
const driver=(await readFile(new URL('ios-2026-10-24.jsonl',root),'utf8')).trim().split('\n').map(JSON.parse);
const stage=label=>{const r=rows.find(r=>r.label===label);assert.ok(r,'Missing '+label);return {at:r.at,...r.value};};
const query='ML09 Safari 0000';
const confirmed=(v,chapter)=>{assert.equal(v.state.count,500);assert.equal(v.state.unique,500);assert.equal(v.state.chapter,chapter);assert.equal(v.state.fromCache,false);assert.equal(v.state.pending,false);assert.equal(v.state.pendingOperations,0);assert.equal(v.state.error,null);assert.equal(v.secure,true);};
const before=stage('busqueda-aplicada');confirmed(before,'1');assert.equal(before.state.search,query);assert.equal(before.network.counters.addTarget,1);
const quota=stage('cuota-inyectada');assert.equal(quota.state.count,500);assert.equal(quota.network.counters.removeTarget,1);const add=quota.network.events.find(e=>e.kind==='addTarget');const remove=quota.network.events.find(e=>e.kind==='removeTarget');assert.equal(remove.targetId,add.target.targetId);
for(const label of ['recarga-durante-cuota','reintento-anticipado']){const v=stage(label);assert.equal(v.state.count,0);assert.equal(v.state.search,query);assert.ok(v.state.error);assert.ok(v.state.remainingQuotaPauseMs>0);assert.equal(v.network.counters.addTarget,0);}
const blocked=stage('exportacion-bloqueada-durante-cuota');assert.ok(blocked.buttons.every(e=>e.disabled));assert.equal(blocked.network.counters.addTarget,0);
const expired=stage('cuota-vencida-sin-reintento');assert.equal(expired.state.remainingQuotaPauseMs,0);assert.equal(expired.network.counters.addTarget,0);assert.equal(expired.state.search,query);
const realWaitMs=Date.parse(expired.at)-Date.parse(quota.at);assert.ok(realWaitMs>=905000);
const after=stage('recuperacion-confirmada');confirmed(after,'2');assert.equal(after.state.search,query);assert.equal(after.network.counters.addTarget,1);
const ui=stage('busqueda-recuperada-en-interfaz');assert.equal(ui.input,query);assert.equal(ui.selection.query,query);assert.deepEqual(Object.keys(ui.selection).sort(),['query','uid','version']);
const stable=stage('recuperacion-estable-61s');confirmed(stable,'2');assert.equal(stable.network.counters.addTarget,1);assert.ok(Date.parse(stable.at)-Date.parse(after.at)>=60000);
const follower=driver.find(r=>r.action==='measure'&&r.result?.value?.label==='ios-seguidora-tras-reactivar')?.result.value;assert.ok(follower);assert.equal(follower.state.count,500);assert.equal(follower.network.counters.addTarget,0);
for(const r of rows){if(r.value?.network)assert.equal(r.value.network.counters.unreadableBodies,0);}
const exported=stage('exportacion-json-generada-por-interfaz');assert.equal(exported.records,500);
let rawExport;try{rawExport=await readFile(new URL('ios-export-capitulo-2.json',root));}catch(e){if(e.code!=='ENOENT')throw e;rawExport=execFileSync('unzip',['-p',fileURLToPath(new URL('raw-export.zip',root)),'ios-export-capitulo-2.json']);}
const payload=JSON.parse(rawExport);assert.equal(payload.mangas.length,500);assert.equal(new Set(payload.mangas.map(m=>m.id)).size,500);assert.equal(payload.verification.source,'server');assert.equal(payload.mangas.find(m=>m.id==='ml09-0000').chapter,'2');
const logout=stage('logout-borra-busqueda');assert.equal(logout.route,'#/login');assert.equal(logout.selection,null);
const login=stage('login-nuevo');confirmed(login,'2');assert.equal(login.state.search,'');
const checks={realDevice:true,syntheticQuota:true,realWaitMs,searchSurvivesQuotaReload:true,libraryNotPersistedAcrossReload:true,oneSharedListener:true,followerNeedsOwnerReactivationObserved:true,noAutomaticReopen:true,retryOneTargetStable60s:true,export500:true,nativeFilesAppNotInspected:true,logoutClearsSearch:true};
await writeFile(new URL('verification-ios.json',root),JSON.stringify({passed:true,checkedAt:new Date().toISOString(),checks,limitations:['Local HTTPS relay and demo emulators; not production networking or billed quota','No OS suspension, physical loss of connectivity, Files download UI or daily quota reset certified']},null,2)+'\n');console.log(JSON.stringify(checks,null,2));

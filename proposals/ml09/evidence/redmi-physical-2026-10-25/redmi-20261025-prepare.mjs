import {chromium,expect} from '@playwright/test'
import {initializeTestEnvironment} from '@firebase/rules-unit-testing'
import {doc,writeBatch,Timestamp} from 'firebase/firestore'
import {normalizeTitle} from '../../src/utils/normalize-title.js'
import {mkdir,writeFile} from 'node:fs/promises'
import {execFileSync} from 'node:child_process'
import assert from 'node:assert/strict'
const out='../deliveries/ml09-redmi-2026-10-25'
await mkdir(out,{recursive:true})
const result={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),synthetic:true,project:'demo-mangalist',port:58585,origin:'http://127.0.0.1:9325',stage:'preparation'}
const browser=await chromium.connectOverCDP('http://127.0.0.1:58585')
const page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url().startsWith(result.origin+'/'))
assert.ok(page,'Only our demo tab may be used')
page.setDefaultTimeout(60000)
try{
 result.browser=browser.version()
 await page.route('**/*',r=>{const u=new URL(r.request().url());return u.hostname==='127.0.0.1'&&['9325','8188','9199'].includes(u.port)?r.continue():r.abort()})
 await page.goto(result.origin+'/#/register')
 const project=await page.evaluate(async()=>{const {firebaseApp}=await import('/src/boot/firebase.js');return firebaseApp.options.projectId})
 assert.equal(project,'demo-mangalist')
 await page.getByLabel('Correo electrónico',{exact:true}).fill('ml09-physical-'+Date.now()+'@example.test')
 await page.getByLabel('Contraseña',{exact:true}).fill('Local-ML09-physical!')
 await page.getByLabel('Repite la contraseña',{exact:true}).fill('Local-ML09-physical!')
 const signup=page.waitForResponse(r=>r.url().includes('/accounts:signUp'))
 await page.getByRole('button',{name:'Crear cuenta',exact:true}).click()
 const {localId:uid}=await (await signup).json();assert.ok(uid)
 result.uid=uid
 await expect(page.getByRole('status')).toContainText('Última instantánea')
 await page.goto(result.origin+'/#/settings')
 const env=await initializeTestEnvironment({projectId:'demo-mangalist',firestore:{host:'127.0.0.1',port:8188}})
 try{await env.withSecurityRulesDisabled(async context=>{
  const db=context.firestore()
  for(let offset=0;offset<500;offset+=400){const batch=writeBatch(db)
   for(let i=offset;i<Math.min(offset+400,500);i++){const name='ML09 física '+String(i).padStart(4,'0');batch.set(doc(db,'users',uid,'mangas','probe-'+i),{schemaVersion:1,name,normalizedName:normalizeTitle(name),chapter:'1',type:'manga',genres:['Aventura'],readingStatus:'pending',publicationStatus:'publishing',sources:[],notes:'Synthetic local test',favorite:false,createdAt:Timestamp.fromMillis(1700000000000+i),updatedAt:Timestamp.fromMillis(1700000000000+i)})}
   await batch.commit()
  }
 })}finally{await env.cleanup()}
 await page.goto(result.origin+'/#/library')
 await expect(page.locator('.library-page-summary')).toContainText('de 500 obras')
 await expect(page.getByRole('status')).toContainText('Última instantánea')
 await page.getByRole('textbox',{name:'Buscar por nombre',exact:true}).fill('ML09 física 0000')
 await expect(page.locator('.manga-grid > .manga-card')).toHaveCount(1)
 await page.screenshot({path:out+'/ready.png'})
 result.result='prepared';result.count=500
}catch(error){result.result='failed';result.failure=error.message;process.exitCode=1}
finally{await page.unroute('**/*').catch(()=>{});await browser.close();result.timestamp=new Date().toISOString();await writeFile(out+'/preparation.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result))}

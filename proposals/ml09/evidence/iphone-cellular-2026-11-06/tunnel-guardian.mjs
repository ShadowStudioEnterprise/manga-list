import {spawn} from 'node:child_process'
import {readFileSync,writeFileSync,appendFileSync,renameSync} from 'node:fs'
const file=process.argv[2],config=JSON.parse(readFileSync(file))
if(!(config.deadline>Date.now()&&config.deadline-Date.now()<=45*60*1000))throw Error('Invalid absolute tunnel deadline')
let stopped=false,timer,monitor,origin=null,connected=false
const stateFile=config.stateFile
const write=extra=>{writeFileSync(stateFile+'.tmp',JSON.stringify({pid:process.pid,childPid:child?.pid,origin,connected,deadline:config.deadline,...extra},null,2),{mode:0o600});renameSync(stateFile+'.tmp',stateFile)}
const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!/^TUNNEL_|^CLOUDFLARED_|^CF_/.test(key)))
const child=spawn(config.binary,['tunnel','--config',config.providerConfigFile,'--no-autoupdate','--url',config.localUrl,'--protocol','http2','--edge-ip-version','4','--metrics','127.0.0.1:0'],{stdio:['ignore','pipe','pipe'],env})
function stop(reason){
 if(stopped)return;stopped=true;clearTimeout(timer);clearInterval(monitor)
 child.kill('SIGKILL');write({closed:true,reason,closedAt:new Date().toISOString()})
}
function output(chunk){
 const text=String(chunk);appendFileSync(config.logFile,text,{mode:0o600})
 const match=[...text.matchAll(/https:\/\/[a-z0-9]+(?:-[a-z0-9]+)*\.trycloudflare\.com\b/g)].find(m=>!m[0].includes('//api.'))
 if(match&&!origin)origin=match[0]
 if(text.includes('Registered tunnel connection'))connected=true
 write({closed:stopped})
}
child.stdout.on('data',output);child.stderr.on('data',output)
child.once('error',error=>{stop('spawn-error:'+error.code)})
child.once('exit',(code,signal)=>{if(!stopped)stop('cloudflared-exit:'+code+':'+signal)})
timer=setTimeout(()=>stop('absolute-deadline'),config.deadline-Date.now())
monitor=setInterval(()=>{try{process.kill(config.ownerPid,0)}catch{stop('owner-exited')}},500)
process.once('SIGINT',()=>stop('operator-stop'));process.once('SIGTERM',()=>stop('operator-stop'))
write({closed:false})

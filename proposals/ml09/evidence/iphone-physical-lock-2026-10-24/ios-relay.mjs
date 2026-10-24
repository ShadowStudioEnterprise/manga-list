import https from 'node:https';
import http from 'node:http';
import {readFileSync,writeFileSync,appendFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
const base=new URL('./',import.meta.url);
let token=randomBytes(32).toString('hex');
if(process.env.ML09_REUSE_LAB_TOKEN==='true'){const prior=JSON.parse(readFileSync(new URL('ios-relay-private.json',base)));const saved=new URL(prior.entry).searchParams.get('lab');if(/^[a-f0-9]{64}$/.test(saved))token=saved;}
const labAddress=process.env.ML09_LAN_ADDRESS;
if(!labAddress)throw Error('Set ML09_LAN_ADDRESS');
const origin='https://'+labAddress+':9443';
writeFileSync(new URL('ios-relay-private.json',base),JSON.stringify({origin,entry:origin+'/?lab='+token}),{mode:0o600});
const shim=`(() => {
 const rewrite=value=>{const s=String(value);for(const [port,path] of [[8188,'/lab-firestore'],[9199,'/lab-auth']]){const p='http://127.0.0.1:'+port;if(s.startsWith(p+'/'))return location.origin+path+s.slice(p.length);}return value;};
 const f=window.fetch;window.fetch=async function(input,init){const url=input instanceof Request?input.url:input;const next=rewrite(url);if(next===url)return f.call(this,input,init);if(input instanceof Request){const options={method:input.method,headers:input.headers,signal:input.signal,...init,credentials:'same-origin'};if(!['GET','HEAD'].includes(options.method)&&!init?.body)options.body=await input.clone().arrayBuffer();return f.call(this,next,options);}return f.call(this,next,{...init,credentials:'same-origin'});};
 const o=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(method,url,...rest){return o.call(this,method,rewrite(url),...rest);};
 window.ml09Transport={kind:'HTTPS same-origin relay to loopback demo emulators',nativeClock:true};
})();`;
const observer=readFileSync(new URL('safari-listen-observer.js',base),'utf8').replace(/^return /,'');
const telemetry=readFileSync(new URL('ios-lock-telemetry.js',base),'utf8');
const manual=process.env.ML09_MANUAL_LOCK==='true';
const manualLogin=manual?readFileSync(new URL('ios-manual-login.js',base),'utf8'):'';
const server=https.createServer({key:readFileSync(new URL('ios-key.pem',base)),cert:readFileSync(new URL('ios-cert.pem',base))},(req,res)=>{
 const url=new URL(req.url,origin);
 if(url.searchParams.get('lab')===token){res.writeHead(200,{'Set-Cookie':`ml09lab=${token}; Secure; HttpOnly; SameSite=Strict; Path=/`,'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store'});res.end('<!doctype html><meta name="viewport" content="width=device-width"><title>Laboratorio ML09</title><p>Abriendo laboratorio local…</p><a href="/#/login">Abrir MangaList</a><script>location.replace("/#/login")</script>');return;}
 if(!String(req.headers.cookie||'').split(';').some(x=>x.trim()==='ml09lab='+token)){res.writeHead(403);res.end('Lab authorization required');return;}
 if(manual&&url.pathname==='/lab-login'&&req.method==='GET'){const f=JSON.parse(readFileSync(new URL('fixture-local.json',base)));if(!f.ready||f.project!=='demo-mangalist'||!f.email.endsWith('@example.test')){res.writeHead(403);res.end();return;}res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({email:f.email,password:f.password}));return;}
 if(url.pathname==='/lab-telemetry'&&req.method==='POST'){let raw='';req.setEncoding('utf8');req.on('data',v=>{raw+=v;if(raw.length>100000)req.destroy();});req.on('end',()=>{try{const value=JSON.parse(raw);appendFileSync(new URL(manual?'ios-lock-manual-telemetry.jsonl':'ios-lock-repeat-telemetry.jsonl',base),JSON.stringify({receivedAt:new Date().toISOString(),value})+'\n');res.writeHead(204);res.end();}catch{res.writeHead(400);res.end();}});return;}
 let port=9414,path=req.url;
 if(url.pathname.startsWith('/lab-firestore/')){port=8188;path=req.url.slice('/lab-firestore'.length);if(!path.startsWith('/google.firestore.v1.Firestore/')){res.writeHead(403);res.end();return;}}
 if(url.pathname.startsWith('/lab-auth/')){port=9199;path=req.url.slice('/lab-auth'.length);if(!/^\/(identitytoolkit|securetoken)\.googleapis\.com\//.test(path)){res.writeHead(403);res.end();return;}}
 const headers={...req.headers,host:'127.0.0.1:'+port};delete headers.cookie;delete headers['accept-encoding'];delete headers.origin;delete headers.referer;
 const upstream=http.request({host:'127.0.0.1',port,path,method:req.method,headers},r=>{
 if(port!==9414)console.log(req.method,port,new URL(path,'http://localhost').pathname,r.statusCode);
 const h={...r.headers};delete h['content-length'];delete h['transfer-encoding'];delete h['content-encoding'];h['cache-control']='no-store';
 const isHtml=port===9414&&String(h['content-type']).includes('text/html');
 const controls=port===9414&&url.pathname==='/capacity-results/ml09/mac-lab/controles.js';
 if(isHtml||controls){let body='';r.setEncoding('utf8');r.on('data',x=>body+=x);r.on('end',()=>{if(isHtml)body=body.replace('<head>','<head><script>'+shim+'\n'+observer+'\n'+telemetry+'\n'+manualLogin+'</script>');if(controls)body=body.replace('http://127.0.0.1:9314',origin).replace('http://127.0.0.1:9414',origin);res.writeHead(r.statusCode,h);res.end(body);});}
 else{res.writeHead(r.statusCode,h);r.pipe(res);}
 });upstream.on('error',e=>{res.writeHead(502);res.end('Local lab upstream unavailable');});req.pipe(upstream);res.on('close',()=>upstream.destroy());
});
server.listen(9443,labAddress,()=>console.log('Protected HTTPS lab relay ready'));

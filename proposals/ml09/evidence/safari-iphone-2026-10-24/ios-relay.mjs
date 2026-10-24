import https from 'node:https';
import http from 'node:http';
import {readFileSync,writeFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
const base=new URL('./',import.meta.url);
const token=randomBytes(32).toString('hex');
const labAddress=process.env.ML09_LAN_ADDRESS;
if(!labAddress)throw Error('Set ML09_LAN_ADDRESS to the private Mac LAN address');
const origin='https://'+labAddress+':9443';
writeFileSync(new URL('ios-relay-private.json',base),JSON.stringify({origin,entry:origin+'/?lab='+token}),{mode:0o600});
const shim=`(() => {
 const rewrite=value=>{const s=String(value);for(const [port,path] of [[8188,'/lab-firestore'],[9199,'/lab-auth']]){const p='http://127.0.0.1:'+port;if(s.startsWith(p+'/'))return location.origin+path+s.slice(p.length);}return value;};
 const f=window.fetch;window.fetch=async function(input,init){const url=input instanceof Request?input.url:input;const next=rewrite(url);if(next===url)return f.call(this,input,init);if(input instanceof Request){const options={method:input.method,headers:input.headers,signal:input.signal,...init,credentials:'same-origin'};if(!['GET','HEAD'].includes(options.method)&&!init?.body)options.body=await input.clone().arrayBuffer();return f.call(this,next,options);}return f.call(this,next,{...init,credentials:'same-origin'});};
 const o=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(method,url,...rest){return o.call(this,method,rewrite(url),...rest);};
 window.ml09Transport={kind:'HTTPS same-origin relay to loopback demo emulators',nativeClock:true};
})();`;
const observer=readFileSync(new URL('safari-listen-observer.js',base),'utf8').replace(/^return /,'');
const server=https.createServer({key:readFileSync(new URL('ios-key.pem',base)),cert:readFileSync(new URL('ios-cert.pem',base))},(req,res)=>{
 const url=new URL(req.url,origin);
 if(url.searchParams.get('lab')===token){res.writeHead(303,{'Set-Cookie':`ml09lab=${token}; Secure; HttpOnly; SameSite=Strict; Path=/`,'Location':'/#/login'});res.end();return;}
 if(!String(req.headers.cookie||'').split(';').some(x=>x.trim()==='ml09lab='+token)){res.writeHead(403);res.end('Lab authorization required');return;}
 let port=9414,path=req.url;
 if(url.pathname.startsWith('/lab-firestore/')){port=8188;path=req.url.slice('/lab-firestore'.length);if(!path.startsWith('/google.firestore.v1.Firestore/')){res.writeHead(403);res.end();return;}}
 if(url.pathname.startsWith('/lab-auth/')){port=9199;path=req.url.slice('/lab-auth'.length);if(!/^\/(identitytoolkit|securetoken)\.googleapis\.com\//.test(path)){res.writeHead(403);res.end();return;}}
 const headers={...req.headers,host:'127.0.0.1:'+port};delete headers.cookie;delete headers['accept-encoding'];delete headers.origin;delete headers.referer;
 const upstream=http.request({host:'127.0.0.1',port,path,method:req.method,headers},r=>{
 if(port!==9414)console.log(req.method,port,new URL(path,'http://localhost').pathname,r.statusCode);
 const h={...r.headers};delete h['content-length'];delete h['transfer-encoding'];delete h['content-encoding'];h['cache-control']='no-store';
 const isHtml=port===9414&&String(h['content-type']).includes('text/html');
 const controls=port===9414&&url.pathname==='/capacity-results/ml09/mac-lab/controles.js';
 if(isHtml||controls){let body='';r.setEncoding('utf8');r.on('data',x=>body+=x);r.on('end',()=>{if(isHtml)body=body.replace('<head>','<head><script>'+shim+'\n'+observer+'</script>');if(controls)body=body.replace('http://127.0.0.1:9314',origin).replace('http://127.0.0.1:9414',origin);res.writeHead(r.statusCode,h);res.end(body);});}
 else{res.writeHead(r.statusCode,h);r.pipe(res);}
 });upstream.on('error',e=>{res.writeHead(502);res.end('Local lab upstream unavailable');});req.pipe(upstream);res.on('close',()=>upstream.destroy());
});
server.listen(9443,labAddress,()=>console.log('Protected HTTPS lab relay ready'));

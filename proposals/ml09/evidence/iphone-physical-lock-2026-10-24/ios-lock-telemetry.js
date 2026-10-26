(() => {
 const p=window.lockTelemetry={pageId:crypto.randomUUID(),armedAt:Date.now(),ticks:0,lastTick:Date.now(),maxGapMs:0,events:[],lastState:null};
 const transmit=reason=>{const payload={reason,clientAt:Date.now(),pageId:p.pageId,armedAt:p.armedAt,ticks:p.ticks,maxGapMs:p.maxGapMs,events:p.events,state:p.lastState,visibility:document.visibilityState,network:window.listenProbe?{...listenProbe.counters}:null};const raw=JSON.stringify(payload);navigator.sendBeacon('/lab-telemetry',new Blob([raw],{type:'application/json'}));};
 const event=e=>{p.events.push({name:e.type,at:Date.now(),trusted:e.isTrusted,visibility:document.visibilityState,persisted:e.persisted});transmit(e.type);};
 for(const name of ['visibilitychange','freeze','resume'])document.addEventListener(name,event);
 for(const name of ['pagehide','pageshow'])window.addEventListener(name,event);
 setInterval(()=>{const now=Date.now();p.maxGapMs=Math.max(p.maxGapMs,now-p.lastTick);p.lastTick=now;p.ticks++;},1000);
 let busy=false;
 setInterval(async()=>{if(busy)return;busy=true;try{const boot=await import('/src/boot/firebase.js');const config=await(await fetch('/capacity-results/ml09/mac-lab/config.json')).json();if(boot.firebaseApp?.options?.projectId!=='demo-mangalist'||boot.auth.currentUser?.uid!==config.uid)return;window.ml09 ||= await import('/capacity-results/ml09/mac-lab/controles.js');p.lastState=await ml09.estado('telemetria-bloqueo');transmit('sample');}catch{}finally{busy=false}},5000);
})();

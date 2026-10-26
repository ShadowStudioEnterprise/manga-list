(() => {
 let attempted=false;
 const timer=setInterval(async()=>{
  if(attempted)return;
  const email=document.querySelector('input[type=email]'),password=document.querySelector('input[type=password]');
  if(!email||!password)return;
  attempted=true;clearInterval(timer);
  try{const credentials=await(await fetch('/lab-login')).json();for(const [el,value]of [[email,credentials.email],[password,credentials.password]]){el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));}email.closest('form').requestSubmit();}catch{}
 },1000);
 setTimeout(()=>clearInterval(timer),120000);
})();

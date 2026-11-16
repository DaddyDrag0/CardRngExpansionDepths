(function CardRngDepthsHeader(){
"use strict";
function ready(){
 const root=document.getElementById('root');if(!root)return;
 // Depths only. The retired cheese makers are saved under archive/cheese.
 const header=document.createElement('header');header.id='crx-mini-header';
 header.innerHTML='<div class="crx-mini-inner"><a class="crx-mini-brand" href="?calc=depths">CardRng <b>Calculators</b></a></div>';
 document.body.prepend(header);
 const container=document.createElement('div');container.id='crx-simple-body';
 root.before(container);container.appendChild(root);
 // Treat old cheese and tower URLs as the Depths home.
 const url=new URL(location.href);if(url.searchParams.has('calc')&&url.searchParams.get('calc')!=='depths'||url.searchParams.has('view')){
  url.searchParams.set('calc','depths');url.searchParams.delete('view');
  history.replaceState(history.state,'',url.pathname+url.search+url.hash);
 }
 setTimeout(()=>{
  const stalled=root.querySelector(':scope > .loading');if(!stalled)return;
  stalled.classList.add('crx-load-error');
  stalled.innerHTML='<div><b>Depths failed to initialize</b><p>Refresh to retry.</p><button type="button" data-crx-retry>Reload Depths</button></div>';
  stalled.querySelector('[data-crx-retry]')?.addEventListener('click',()=>location.reload());
 },10000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
})();

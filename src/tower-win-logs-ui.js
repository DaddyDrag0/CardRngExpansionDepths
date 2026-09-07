(()=>{
  'use strict';

  let latestResult=null;
  let renderQueued=false;
  const NativeWorker=window.Worker;

  const esc=(value='')=>String(value).replace(/[&<>"']/g,(char)=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[char]);
  const full=(value)=>Number(value||0).toLocaleString('en-US');

  function isTowerWorker(url){return /(?:^|\/)tower-worker\.js(?:\?|$)/.test(String(url||''));}

  function queueRender(){
    if(renderQueued)return;
    renderQueued=true;
    requestAnimationFrame(()=>{renderQueued=false;renderPanel();});
  }

  function removePanel(){document.querySelector('#tower-winning-log-panel')?.remove();}

  function wrapWorker(url,options){
    const worker=new NativeWorker(url,options);
    if(!isTowerWorker(url))return worker;

    const nativePost=worker.postMessage.bind(worker);
    worker.postMessage=(message,...rest)=>{
      if(message?.kind==='tower-batch'){
        latestResult=null;
        removePanel();
      }
      return nativePost(message,...rest);
    };
    worker.addEventListener('message',(event)=>{
      const data=event.data;
      if(data?.kind!=='tower-result')return;
      latestResult=data.ok?data.result:null;
      queueRender();
    });
    return worker;
  }

  function WorkerProxy(url,options){return wrapWorker(url,options);}
  WorkerProxy.prototype=NativeWorker.prototype;
  try{Object.setPrototypeOf(WorkerProxy,NativeWorker);}catch(_){}
  window.Worker=WorkerProxy;

  function logText(log,index){
    const debug=log?.debug||{};
    const lines=[
      `TOWER WIN LOG ${index+1}`,
      `Seen: ×${full(log?.occurrences||1)} · Turns: ${full(log?.turns||0)} · Seed: ${log?.seed||0}`,
      `Survivors: ${(log?.survivingAllies||[]).join(' / ')||'none'}`,
      `Fallen allies: ${(log?.fallenAllies||[]).join(' / ')||'none'}`,
    ];

    if(log?.eventsTruncated)lines.push(`Events: showing ${full(debug.events?.length||0)} of ${full(log.eventCount||0)} (middle omitted)`);

    if(debug.initialAllies?.length){
      lines.push('','YOUR TEAM');
      for(const card of debug.initialAllies)lines.push(`  ${card.name} · ${card.ability||'No ability'} · ${Math.ceil(card.hp)} HP · ${Math.ceil(card.damage)} ATK`);
    }
    if(debug.initialEnemies?.length){
      lines.push('','ENEMY TEAM');
      for(const card of debug.initialEnemies)lines.push(`  ${card.name} · ${card.ability||'No ability'} · ${Math.ceil(card.hp)} HP · ${Math.ceil(card.damage)} ATK`);
    }

    const events=debug.events||[];
    let lastTurn=null;
    for(let i=0;i<events.length;i++){
      if(log?.eventsTruncated&&i===Math.floor(events.length/2)){
        lines.push('','... MIDDLE EVENTS OMITTED FOR LOG SIZE ...','');
        lastTurn=null;
      }
      const event=events[i];
      if(event.turn!==lastTurn){lastTurn=event.turn;lines.push('',`TURN ${event.turn}`);}
      lines.push(`  [${event.team==='Allies'?'PLAYER':'ENEMY'} ${String(event.type||'event').toUpperCase()}] ${event.card}: ${event.detail||''}`);
    }

    if(debug.finalAllies?.length){
      lines.push('','FINAL PLAYER CARDS');
      for(const card of debug.finalAllies)lines.push(`  ${card.name} · ${Math.ceil(card.hp)}/${Math.ceil(card.maxHp)} HP · ${Math.ceil(card.damage)} ATK`);
    }
    if(debug.finalEnemies?.length){
      lines.push('','FINAL ENEMY CARDS');
      for(const card of debug.finalEnemies)lines.push(`  ${card.name} · ${Math.ceil(card.hp)}/${Math.ceil(card.maxHp)} HP · ${Math.ceil(card.damage)} ATK`);
    }
    return lines.join('\n');
  }

  async function copyText(text,button){
    try{
      await navigator.clipboard.writeText(text);
      if(button){const old=button.textContent;button.textContent='Copied!';setTimeout(()=>{if(button.isConnected)button.textContent=old;},900);}
    }catch(_){prompt('Copy Tower winning log:',text);}
  }

  function openLog(index){
    const log=latestResult?.winningLogs?.[index];
    if(!log)return;
    const dialog=document.createElement('dialog');
    dialog.className='tower-winlog-dialog';
    dialog.innerHTML=`<div class="tower-winlog-shell"><header><div><span>WINNING RUN DEBUG</span><b>Pattern ${index+1} · seen ×${full(log.occurrences||1)}</b><small>${full(log.turns||0)} turns · seed ${esc(log.seed||0)}</small></div><div><button type="button" data-copy>Copy log</button><button type="button" data-close>Close</button></div></header><pre></pre></div>`;
    dialog.querySelector('pre').textContent=logText(log,index);
    document.body.appendChild(dialog);
    const close=()=>{if(dialog.open)dialog.close();dialog.remove();};
    dialog.querySelector('[data-close]').addEventListener('click',close);
    dialog.querySelector('[data-copy]').addEventListener('click',(event)=>copyText(logText(log,index),event.currentTarget));
    dialog.addEventListener('cancel',(event)=>{event.preventDefault();close();});
    dialog.showModal();
  }

  function renderPanel(){
    const host=document.querySelector('.tower-sim-panel');
    if(!host){removePanel();return;}
    const result=latestResult;
    if(!result||!Array.isArray(result.winningLogs)){removePanel();return;}

    let panel=document.querySelector('#tower-winning-log-panel');
    if(!panel){panel=document.createElement('section');panel.id='tower-winning-log-panel';panel.className='tower-winlog-panel';host.appendChild(panel);}
    const logs=result.winningLogs;
    const patterns=Number(result.winningPatternCount||logs.length||0);

    panel.innerHTML=`<div class="tower-winlog-head"><div><b>Winning run logs</b><small>${result.wins?`${logs.length} detailed pattern${logs.length===1?'':'s'} from ${full(result.wins)} wins · ${full(patterns)} unique win pattern${patterns===1?'':'s'}`:'No wins to log'}</small></div>${logs.length?'<button type="button" data-copy-all>Copy all logs</button>':''}</div>${logs.length?`<div class="tower-winlog-list">${logs.map((log,index)=>`<button type="button" data-log-index="${index}"><span><b>Pattern ${index+1}</b><small>Seen ×${full(log.occurrences||1)} · ${full(log.turns||0)} turns</small></span><em>${esc((log.survivingAllies||[]).join(' / ')||'No survivors')}</em></button>`).join('')}</div><p>Only wins are logged. Duplicate outcomes are grouped. Up to 8 representative wins are expanded: the most common patterns plus fastest/slowest wins. Full debug is generated only for those selected seeds.${result.winningLogsTruncated?' More unique win patterns existed but were not expanded.':''}</p>`:'<p>No winning runs were recorded, so there are no logs.</p>'}`;

    panel.querySelectorAll('[data-log-index]').forEach((button)=>button.addEventListener('click',()=>openLog(Number(button.dataset.logIndex))));
    panel.querySelector('[data-copy-all]')?.addEventListener('click',(event)=>{
      const text=logs.map((log,index)=>logText(log,index)).join(`\n\n${'='.repeat(72)}\n\n`);
      copyText(text,event.currentTarget);
    });
  }

  const style=document.createElement('style');
  style.textContent=`
    .tower-winlog-panel{margin-top:12px;padding:10px;border:1px solid #263445;border-radius:11px;background:#0b1119}.tower-winlog-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.tower-winlog-head b{display:block;color:#cbd6e2;font-size:10px}.tower-winlog-head small{display:block;margin-top:3px;color:#657487;font-size:8px;line-height:1.4}.tower-winlog-head button,.tower-winlog-dialog button{border:1px solid #2b3949;background:#101823;color:#aeb9c6;border-radius:8px;padding:6px 9px;font-size:8px;cursor:pointer}.tower-winlog-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:6px;margin-top:9px}.tower-winlog-list>button{display:flex;align-items:center;justify-content:space-between;gap:9px;text-align:left;border:1px solid #202c3a;background:#0e151f;color:#9aa8b8;border-radius:9px;padding:8px;cursor:pointer}.tower-winlog-list>button:hover{border-color:#396c67;background:#111b26}.tower-winlog-list b{display:block;color:#c8d3df;font-size:9px}.tower-winlog-list small{display:block;margin-top:2px;color:#718094;font-size:7px}.tower-winlog-list em{max-width:48%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-style:normal;color:#64c5b8;font-size:7px;text-align:right}.tower-winlog-panel p{margin:8px 0 0;color:#647286;font-size:8px;line-height:1.5}.tower-winlog-dialog{width:min(1000px,96vw);height:min(850px,94vh);padding:0;border:1px solid #2a394a;border-radius:14px;background:#070c12;color:#d2dbe5;box-shadow:0 25px 90px rgba(0,0,0,.7)}.tower-winlog-dialog::backdrop{background:rgba(0,0,0,.76)}.tower-winlog-shell{height:100%;display:flex;flex-direction:column}.tower-winlog-dialog header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-bottom:1px solid #1f2a37;background:#0a1119}.tower-winlog-dialog header span{display:block;color:#70cfc0;font-size:7px;font-weight:850;letter-spacing:.12em}.tower-winlog-dialog header b{display:block;margin-top:3px;color:#e0e7ef;font-size:12px}.tower-winlog-dialog header small{display:block;margin-top:3px;color:#6d7b8c;font-size:8px}.tower-winlog-dialog header>div:last-child{display:flex;gap:6px}.tower-winlog-dialog pre{flex:1;overflow:auto;margin:0;padding:14px;white-space:pre-wrap;word-break:break-word;color:#aeb9c6;font:9px/1.55 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;background:#070c12}@media(max-width:620px){.tower-winlog-head,.tower-winlog-dialog header{align-items:flex-start;flex-direction:column}.tower-winlog-list{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  new MutationObserver(queueRender).observe(document.documentElement,{childList:true,subtree:true});
  queueRender();
})();

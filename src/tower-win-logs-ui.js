(()=>{
  'use strict';

  const PAGE_SIZE=50;
  let latestResult=null;
  let latestBatchRequest=null;
  let activeTowerWorker=null;
  let renderQueued=false;
  let currentPage=0;
  let sortMode='run';
  let searchQuery='';
  let orderedRuns=[];
  let replayRequestId=-1000000;
  const replayPending=new Map();
  const NativeWorker=window.Worker;

  const esc=(value='')=>String(value).replace(/[&<>"']/g,(char)=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[char]);
  const full=(value)=>Number(value||0).toLocaleString('en-US');
  const stat=(value)=>Math.ceil(Number(value||0)).toLocaleString('en-US');

  function isTowerWorker(url){return /(?:^|\/)tower-worker\.js(?:\?|$)/.test(String(url||''));}

  function queueRender(){
    if(renderQueued)return;
    renderQueued=true;
    requestAnimationFrame(()=>{renderQueued=false;renderPanel();});
  }

  function removePanel(){document.querySelector('#tower-winning-log-panel')?.remove();}

  function rememberBatch(message,worker){
    latestResult=null;
    activeTowerWorker=worker;
    latestBatchRequest={
      loadout:JSON.parse(JSON.stringify(message.loadout)),
      enemyNames:[...(message.enemyNames||[])],
      floor:message.floor,
      difficulty:message.difficulty,
    };
    currentPage=0;
    searchQuery='';
    sortMode='run';
    orderedRuns=[];
    removePanel();
  }

  function wrapWorker(url,options){
    const worker=new NativeWorker(url,options);
    if(!isTowerWorker(url))return worker;

    const nativePost=worker.postMessage.bind(worker);
    worker.postMessage=(message,...rest)=>{
      if(message?.kind==='tower-batch')rememberBatch(message,worker);
      return nativePost(message,...rest);
    };

    worker.addEventListener('message',(event)=>{
      const data=event.data;
      if(data?.kind==='tower-win-debug-result'){
        const pending=replayPending.get(data.id);
        if(!pending)return;
        replayPending.delete(data.id);
        clearTimeout(pending.timeout);
        if(data.ok)pending.resolve(data.result);
        else pending.reject(new Error(data.error||'Could not replay Tower battle.'));
        return;
      }
      if(data?.kind!=='tower-result')return;
      latestResult=data.ok?data.result:null;
      currentPage=0;
      queueRender();
    });
    return worker;
  }

  function WorkerProxy(url,options){return wrapWorker(url,options);}
  WorkerProxy.prototype=NativeWorker.prototype;
  try{Object.setPrototypeOf(WorkerProxy,NativeWorker);}catch(_){}
  window.Worker=WorkerProxy;

  function requestReplay(run){
    if(!activeTowerWorker||!latestBatchRequest)return Promise.reject(new Error('The Tower worker is unavailable. Run the simulation again.'));
    const id=replayRequestId--;
    return new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>{
        replayPending.delete(id);
        reject(new Error('Battle replay timed out. Try opening it again.'));
      },20000);
      replayPending.set(id,{resolve,reject,timeout});
      activeTowerWorker.postMessage({
        id,
        kind:'tower-win-debug',
        loadout:latestBatchRequest.loadout,
        enemyNames:latestBatchRequest.enemyNames,
        floor:latestBatchRequest.floor,
        difficulty:latestBatchRequest.difficulty,
        seed:run.seed,
        run:run.run,
      });
    });
  }

  function battleText(run,replay){
    const debug=replay?.debug||{};
    const lines=[
      `TOWER WINNING BATTLE #${full(run.run)}`,
      `Simulation run: ${full(run.run)} / ${full(latestResult?.runs||0)}`,
      `Seed: ${run.seed||0}`,
      `Turns: ${full(replay?.turns||run.turns||0)}`,
      `Winner: ${replay?.winner==='Allies'?'PLAYER':String(replay?.winner||'Unknown')}`,
      `Outcome pattern: ${full(run.patternId||0)}`,
      `Survivors: ${(run.survivingAllies||[]).join(' / ')||'none'}`,
      `Fallen allies: ${(run.fallenAllies||[]).join(' / ')||'none'}`,
    ];

    if(debug.initialAllies?.length){
      lines.push('','YOUR TEAM');
      for(const card of debug.initialAllies)lines.push(`  ${card.name} · ${card.ability||'No ability'} · ${stat(card.hp)} HP · ${stat(card.damage)} ATK`);
    }
    if(debug.initialEnemies?.length){
      lines.push('','ENEMY TEAM');
      for(const card of debug.initialEnemies)lines.push(`  ${card.name} · ${card.ability||'No ability'} · ${stat(card.hp)} HP · ${stat(card.damage)} ATK`);
    }

    let lastTurn=null;
    for(const event of debug.events||[]){
      if(event.turn!==lastTurn){lastTurn=event.turn;lines.push('',`TURN ${event.turn}`);}
      const hp=Number.isFinite(event.hp)?` · HP ${stat(event.hp)}${Number.isFinite(event.maxHp)?`/${stat(event.maxHp)}`:''}`:'';
      lines.push(`  [${event.team==='Allies'?'PLAYER':'ENEMY'} ${String(event.type||'event').toUpperCase()}] ${event.card}: ${event.detail||''}${hp}`);
    }

    if(debug.finalAllies?.length){
      lines.push('','FINAL PLAYER CARDS');
      for(const card of debug.finalAllies)lines.push(`  ${card.name} · ${stat(card.hp)}/${stat(card.maxHp)} HP · ${stat(card.damage)} ATK`);
    }
    if(debug.finalEnemies?.length){
      lines.push('','FINAL ENEMY CARDS');
      for(const card of debug.finalEnemies)lines.push(`  ${card.name} · ${stat(card.hp)}/${stat(card.maxHp)} HP · ${stat(card.damage)} ATK`);
    }
    return lines.join('\n');
  }

  async function copyText(text,button){
    try{
      await navigator.clipboard.writeText(text);
      if(button){const old=button.textContent;button.textContent='Copied!';setTimeout(()=>{if(button.isConnected)button.textContent=old;},900);}
    }catch(_){prompt('Copy Tower battle log:',text);}
  }

  function teamCards(cards){
    if(!cards?.length)return '<div class="tower-winlog-none">None</div>';
    return `<div class="tower-winlog-teamcards">${cards.map((card)=>`<div><b>${esc(card.name)}</b><span>${esc(card.ability||'No ability')}</span><small>${stat(card.hp)} HP · ${stat(card.damage)} ATK</small></div>`).join('')}</div>`;
  }

  function eventTimeline(events){
    if(!events?.length)return '<div class="tower-winlog-none">No debug events were recorded.</div>';
    const groups=[];
    let group=null;
    for(const event of events){
      if(!group||group.turn!==event.turn){group={turn:event.turn,events:[]};groups.push(group);}
      group.events.push(event);
    }
    return groups.map((entry)=>`<section class="tower-winlog-turn"><h4>Turn ${full(entry.turn)}</h4><div>${entry.events.map((event)=>{
      const player=event.team==='Allies';
      const hp=Number.isFinite(event.hp)?`<em>HP ${stat(event.hp)}${Number.isFinite(event.maxHp)?` / ${stat(event.maxHp)}`:''}</em>`:'';
      return `<article class="tower-winlog-event ${player?'player':'enemy'}"><span>${player?'PLAYER':'ENEMY'}</span><div><b>${esc(event.card||'Unknown')}</b><small>${esc(String(event.type||'event').toUpperCase())} · ${esc(event.detail||'')}</small></div>${hp}</article>`;
    }).join('')}</div></section>`).join('');
  }

  function finalCards(cards){
    if(!cards?.length)return '<div class="tower-winlog-none">None remaining</div>';
    return `<div class="tower-winlog-finalcards">${cards.map((card)=>`<div><b>${esc(card.name)}</b><span>${stat(card.hp)} / ${stat(card.maxHp)} HP</span><small>${stat(card.damage)} ATK</small></div>`).join('')}</div>`;
  }

  function navIndex(run){return orderedRuns.findIndex((item)=>item.run===run.run&&item.seed===run.seed);}

  function closeExistingDialog(){document.querySelector('.tower-winlog-dialog')?.remove();}

  async function openBattle(run){
    if(!run)return;
    closeExistingDialog();
    const index=navIndex(run);
    const dialog=document.createElement('dialog');
    dialog.className='tower-winlog-dialog';
    dialog.innerHTML=`<div class="tower-winlog-shell"><header><div><span>INDIVIDUAL WINNING BATTLE</span><b>Battle #${full(run.run)}</b><small>Run ${full(run.run)} of ${full(latestResult?.runs||0)} · ${full(run.turns)} turns · seed ${esc(run.seed||0)} · pattern ${full(run.patternId||0)}</small></div><div><button type="button" data-prev ${index<=0?'disabled':''}>← Previous</button><button type="button" data-next ${index<0||index>=orderedRuns.length-1?'disabled':''}>Next →</button><button type="button" data-close>Close</button></div></header><main class="tower-winlog-loading"><div class="tower-winlog-spinner"></div><b>Replaying exact seed…</b><small>Full debug is generated only for this battle.</small></main></div>`;
    document.body.appendChild(dialog);
    const close=()=>{if(dialog.open)dialog.close();dialog.remove();};
    dialog.querySelector('[data-close]').addEventListener('click',close);
    dialog.querySelector('[data-prev]')?.addEventListener('click',()=>{const next=orderedRuns[index-1];close();openBattle(next);});
    dialog.querySelector('[data-next]')?.addEventListener('click',()=>{const next=orderedRuns[index+1];close();openBattle(next);});
    dialog.addEventListener('cancel',(event)=>{event.preventDefault();close();});
    dialog.showModal();

    try{
      const replay=await requestReplay(run);
      if(!dialog.isConnected)return;
      const debug=replay.debug||{};
      const mismatch=replay.winner!=='Allies'?`<div class="tower-winlog-warning">Replay result was ${esc(replay.winner)} instead of Allies. The seed should be deterministic, so this is worth checking.</div>`:'';
      const unsupported=replay.unsupportedAbilities?.length?`<div class="tower-winlog-warning">Unsupported: ${esc(replay.unsupportedAbilities.join(', '))}</div>`:'';
      const main=dialog.querySelector('main');
      main.className='tower-winlog-content';
      main.innerHTML=`${mismatch}${unsupported}<div class="tower-winlog-summary"><div><span>Winner</span><b>${replay.winner==='Allies'?'PLAYER':esc(replay.winner)}</b></div><div><span>Turns</span><b>${full(replay.turns)}</b></div><div><span>Seed</span><b>${esc(replay.seed)}</b></div><div><span>Pattern</span><b>${full(run.patternId||0)}</b></div></div><div class="tower-winlog-copybar"><span>This is the exact winning run, replayed from its original seed.</span><button type="button" data-copy-battle>Copy battle log</button></div><div class="tower-winlog-teams"><section><h3>Your starting team</h3>${teamCards(debug.initialAllies)}</section><section><h3>Enemy starting team</h3>${teamCards(debug.initialEnemies)}</section></div><section class="tower-winlog-timeline"><div class="tower-winlog-section-head"><h3>Battle timeline</h3><span>${full(debug.events?.length||0)} events</span></div>${eventTimeline(debug.events||[])}</section><div class="tower-winlog-teams tower-winlog-final"><section><h3>Final player cards</h3>${finalCards(debug.finalAllies)}</section><section><h3>Final enemy cards</h3>${finalCards(debug.finalEnemies)}</section></div>`;
      main.querySelector('[data-copy-battle]')?.addEventListener('click',(event)=>copyText(battleText(run,replay),event.currentTarget));
    }catch(error){
      if(!dialog.isConnected)return;
      const main=dialog.querySelector('main');
      main.className='tower-winlog-loading error';
      main.innerHTML=`<b>Could not load this battle.</b><small>${esc(error.message||String(error))}</small>`;
    }
  }

  function filteredAndSortedRuns(runs){
    const query=searchQuery.trim().toLowerCase();
    let output=query?runs.filter((run)=>{
      const haystack=[run.run,run.seed,run.turns,run.patternId,...(run.survivingAllies||[]),...(run.fallenAllies||[])].join(' ').toLowerCase();
      return haystack.includes(query);
    }):[...runs];
    if(sortMode==='fastest')output.sort((a,b)=>a.turns-b.turns||a.run-b.run);
    else if(sortMode==='slowest')output.sort((a,b)=>b.turns-a.turns||a.run-b.run);
    else if(sortMode==='pattern')output.sort((a,b)=>a.patternId-b.patternId||a.run-b.run);
    else output.sort((a,b)=>a.run-b.run);
    return output;
  }

  function compactBattleList(runs){
    return runs.map((run)=>`Battle #${run.run} · seed ${run.seed} · ${run.turns} turns · pattern ${run.patternId} · survivors ${(run.survivingAllies||[]).join(' / ')||'none'}`).join('\n');
  }

  function renderPanel(){
    const host=document.querySelector('.tower-sim-panel');
    if(!host){removePanel();return;}
    const result=latestResult;
    if(!result||!Array.isArray(result.winningRuns)){removePanel();return;}

    let panel=document.querySelector('#tower-winning-log-panel');
    if(!panel){panel=document.createElement('section');panel.id='tower-winning-log-panel';panel.className='tower-winlog-panel';host.appendChild(panel);}

    const runs=result.winningRuns;
    orderedRuns=filteredAndSortedRuns(runs);
    const pageCount=Math.max(1,Math.ceil(orderedRuns.length/PAGE_SIZE));
    currentPage=Math.max(0,Math.min(currentPage,pageCount-1));
    const start=currentPage*PAGE_SIZE;
    const visible=orderedRuns.slice(start,start+PAGE_SIZE);
    const from=orderedRuns.length?start+1:0;
    const to=Math.min(start+PAGE_SIZE,orderedRuns.length);
    const patterns=Number(result.winningPatternCount||0);

    panel.innerHTML=`<div class="tower-winlog-head"><div><b>Winning battles</b><small>${result.wins?`${full(runs.length)} individual winning battle${runs.length===1?'':'s'} recorded · ${full(patterns)} outcome pattern${patterns===1?'':'s'}`:'No wins to log'}</small></div>${runs.length?'<button type="button" data-copy-list>Copy battle list</button>':''}</div>${runs.length?`<div class="tower-winlog-toolbar"><label><span>Find battle</span><input type="search" data-win-search value="${esc(searchQuery)}" placeholder="Run #, seed, card, pattern…"></label><label><span>Sort</span><select data-win-sort><option value="run" ${sortMode==='run'?'selected':''}>Run order</option><option value="fastest" ${sortMode==='fastest'?'selected':''}>Fastest wins</option><option value="slowest" ${sortMode==='slowest'?'selected':''}>Slowest wins</option><option value="pattern" ${sortMode==='pattern'?'selected':''}>Outcome pattern</option></select></label></div><div class="tower-winlog-pagebar"><span>Showing ${full(from)}–${full(to)} of ${full(orderedRuns.length)} matching wins</span><div><button type="button" data-page-first ${currentPage===0?'disabled':''}>First</button><button type="button" data-page-prev ${currentPage===0?'disabled':''}>← Prev</button><b>Page ${full(currentPage+1)} / ${full(pageCount)}</b><button type="button" data-page-next ${currentPage>=pageCount-1?'disabled':''}>Next →</button><button type="button" data-page-last ${currentPage>=pageCount-1?'disabled':''}>Last</button></div></div><div class="tower-winlog-list">${visible.length?visible.map((run)=>`<button type="button" data-win-run="${run.run}" data-win-seed="${run.seed}"><span><b>Battle #${full(run.run)}</b><small>Run ${full(run.run)} · ${full(run.turns)} turns · seed ${esc(run.seed)}</small><i>Pattern ${full(run.patternId||0)} · survivors: ${esc((run.survivingAllies||[]).join(' / ')||'none')}</i></span><em>Open battle →</em></button>`).join(''):'<div class="tower-winlog-none">No winning battles match that search.</div>'}</div><p><b>Every win is listed individually.</b> Opening one replays that exact seed and shows the full turn-by-turn battle. The 10,000-run simulation itself stays lightweight because full debug is generated only for the battle you open.</p>`:'<p>No winning runs were recorded, so there are no battle logs.</p>'}`;

    panel.querySelectorAll('[data-win-run]').forEach((button)=>button.addEventListener('click',()=>{
      const runNumber=Number(button.dataset.winRun),seed=Number(button.dataset.winSeed);
      openBattle(orderedRuns.find((run)=>run.run===runNumber&&run.seed===seed));
    }));
    panel.querySelector('[data-copy-list]')?.addEventListener('click',(event)=>copyText(compactBattleList(runs),event.currentTarget));
    panel.querySelector('[data-page-first]')?.addEventListener('click',()=>{currentPage=0;renderPanel();});
    panel.querySelector('[data-page-prev]')?.addEventListener('click',()=>{currentPage=Math.max(0,currentPage-1);renderPanel();});
    panel.querySelector('[data-page-next]')?.addEventListener('click',()=>{currentPage=Math.min(pageCount-1,currentPage+1);renderPanel();});
    panel.querySelector('[data-page-last]')?.addEventListener('click',()=>{currentPage=pageCount-1;renderPanel();});
    panel.querySelector('[data-win-sort]')?.addEventListener('change',(event)=>{sortMode=event.target.value;currentPage=0;renderPanel();});
    panel.querySelector('[data-win-search]')?.addEventListener('input',(event)=>{
      searchQuery=event.target.value;
      currentPage=0;
      renderPanel();
      requestAnimationFrame(()=>{const input=panel.querySelector('[data-win-search]');if(input){input.focus();input.setSelectionRange(input.value.length,input.value.length);}});
    });
  }

  const style=document.createElement('style');
  style.textContent=`
    .tower-winlog-panel{margin-top:12px;padding:11px;border:1px solid #263445;border-radius:11px;background:#0b1119}.tower-winlog-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.tower-winlog-head b{display:block;color:#cbd6e2;font-size:10px}.tower-winlog-head small{display:block;margin-top:3px;color:#657487;font-size:8px;line-height:1.4}.tower-winlog-head button,.tower-winlog-pagebar button,.tower-winlog-dialog button,.tower-winlog-copybar button{border:1px solid #2b3949;background:#101823;color:#aeb9c6;border-radius:8px;padding:6px 9px;font-size:8px;cursor:pointer}.tower-winlog-head button:hover,.tower-winlog-pagebar button:hover,.tower-winlog-dialog button:hover,.tower-winlog-copybar button:hover{border-color:#3f776f;color:#cdeae5}.tower-winlog-head button:disabled,.tower-winlog-pagebar button:disabled,.tower-winlog-dialog button:disabled{opacity:.35;cursor:not-allowed}.tower-winlog-toolbar{display:grid;grid-template-columns:minmax(220px,1fr) 180px;gap:8px;margin-top:10px}.tower-winlog-toolbar label span{display:block;margin:0 0 4px 2px;color:#647286;font-size:7px;text-transform:uppercase;letter-spacing:.08em}.tower-winlog-toolbar input,.tower-winlog-toolbar select{width:100%;box-sizing:border-box;border:1px solid #263445;background:#0e151f;color:#aeb9c6;border-radius:8px;padding:8px 9px;font-size:8px;outline:none}.tower-winlog-toolbar input:focus,.tower-winlog-toolbar select:focus{border-color:#3b6d68}.tower-winlog-pagebar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:9px;color:#647286;font-size:8px}.tower-winlog-pagebar>div{display:flex;align-items:center;gap:5px}.tower-winlog-pagebar b{min-width:86px;text-align:center;color:#8f9dae;font-size:8px}.tower-winlog-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:6px;margin-top:9px}.tower-winlog-list>button{display:flex;align-items:center;justify-content:space-between;gap:10px;text-align:left;border:1px solid #202c3a;background:#0e151f;color:#9aa8b8;border-radius:9px;padding:9px;cursor:pointer}.tower-winlog-list>button:hover{border-color:#396c67;background:#111b26;transform:translateY(-1px)}.tower-winlog-list b{display:block;color:#d1dae4;font-size:9px}.tower-winlog-list small{display:block;margin-top:2px;color:#718094;font-size:7px}.tower-winlog-list i{display:block;margin-top:3px;color:#5f6f82;font-size:7px;font-style:normal}.tower-winlog-list em{white-space:nowrap;font-style:normal;color:#70cfc0;font-size:7px;font-weight:750}.tower-winlog-panel p{margin:9px 0 0;color:#647286;font-size:8px;line-height:1.5}.tower-winlog-panel p b{color:#8fa2b5}.tower-winlog-none{grid-column:1/-1;padding:18px;border:1px dashed #263445;border-radius:9px;color:#647286;text-align:center;font-size:8px}.tower-winlog-dialog{width:min(1180px,96vw);height:min(900px,94vh);padding:0;border:1px solid #2a394a;border-radius:14px;background:#070c12;color:#d2dbe5;box-shadow:0 25px 90px rgba(0,0,0,.7)}.tower-winlog-dialog::backdrop{background:rgba(0,0,0,.78)}.tower-winlog-shell{height:100%;display:flex;flex-direction:column}.tower-winlog-dialog header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-bottom:1px solid #1f2a37;background:#0a1119}.tower-winlog-dialog header span{display:block;color:#70cfc0;font-size:7px;font-weight:850;letter-spacing:.12em}.tower-winlog-dialog header b{display:block;margin-top:3px;color:#e0e7ef;font-size:12px}.tower-winlog-dialog header small{display:block;margin-top:3px;color:#6d7b8c;font-size:8px}.tower-winlog-dialog header>div:last-child{display:flex;gap:6px}.tower-winlog-loading{flex:1;display:grid;place-content:center;justify-items:center;gap:8px;color:#9aa8b8;text-align:center}.tower-winlog-loading b{font-size:11px;color:#cbd6e2}.tower-winlog-loading small{font-size:8px;color:#647286}.tower-winlog-loading.error b{color:#df9ca7}.tower-winlog-spinner{width:24px;height:24px;border:2px solid #263445;border-top-color:#70cfc0;border-radius:50%;animation:tower-winlog-spin .7s linear infinite}@keyframes tower-winlog-spin{to{transform:rotate(360deg)}}.tower-winlog-content{flex:1;overflow:auto;padding:13px;background:#070c12}.tower-winlog-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.tower-winlog-summary>div{border:1px solid #202c3a;background:#0c131c;border-radius:9px;padding:9px}.tower-winlog-summary span{display:block;color:#607084;font-size:7px;text-transform:uppercase;letter-spacing:.08em}.tower-winlog-summary b{display:block;margin-top:3px;color:#cbd6e2;font-size:11px}.tower-winlog-copybar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:8px;border:1px solid #1f2b38;background:#0a1119;border-radius:9px;padding:8px 9px;color:#6f7e90;font-size:8px}.tower-winlog-teams{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px}.tower-winlog-teams>section,.tower-winlog-timeline{border:1px solid #202c3a;background:#0a1018;border-radius:10px;padding:10px}.tower-winlog-teams h3,.tower-winlog-section-head h3{margin:0 0 8px;color:#bdc9d6;font-size:9px}.tower-winlog-teamcards,.tower-winlog-finalcards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.tower-winlog-teamcards>div,.tower-winlog-finalcards>div{border:1px solid #1d2936;background:#0d151e;border-radius:8px;padding:8px}.tower-winlog-teamcards b,.tower-winlog-finalcards b{display:block;color:#cbd6e2;font-size:8px}.tower-winlog-teamcards span,.tower-winlog-finalcards span{display:block;margin-top:2px;color:#72c9bd;font-size:7px}.tower-winlog-teamcards small,.tower-winlog-finalcards small{display:block;margin-top:3px;color:#637286;font-size:7px}.tower-winlog-timeline{margin-top:10px}.tower-winlog-section-head{display:flex;align-items:center;justify-content:space-between}.tower-winlog-section-head span{color:#627184;font-size:7px}.tower-winlog-turn{margin-top:8px}.tower-winlog-turn h4{margin:0;padding:6px 8px;border-left:2px solid #386d67;background:#0d151e;color:#8fa2b5;font-size:8px}.tower-winlog-turn>div{display:grid;gap:4px;margin-top:4px}.tower-winlog-event{display:grid;grid-template-columns:54px minmax(0,1fr) auto;align-items:center;gap:8px;border:1px solid #1c2733;background:#0b121a;border-radius:7px;padding:7px 8px}.tower-winlog-event>span{display:inline-grid;place-items:center;border:1px solid #2f655f;background:#10211f;color:#73d1c4;border-radius:999px;padding:3px 5px;font-size:6px;font-weight:850}.tower-winlog-event.enemy>span{border-color:#643641;background:#211116;color:#d58d9b}.tower-winlog-event b{display:block;color:#bfcbd7;font-size:8px}.tower-winlog-event small{display:block;margin-top:2px;color:#758397;font-size:7px;line-height:1.4}.tower-winlog-event em{font-style:normal;color:#8190a1;font-size:7px;white-space:nowrap}.tower-winlog-warning{margin-bottom:8px;border:1px solid #67402c;background:#1d130d;color:#d5a16f;border-radius:8px;padding:8px 9px;font-size:8px}.tower-winlog-final{margin-bottom:2px}@media(max-width:720px){.tower-winlog-head,.tower-winlog-pagebar,.tower-winlog-dialog header,.tower-winlog-copybar{align-items:flex-start;flex-direction:column}.tower-winlog-toolbar,.tower-winlog-teams{grid-template-columns:1fr}.tower-winlog-list{grid-template-columns:1fr}.tower-winlog-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.tower-winlog-dialog header>div:last-child{flex-wrap:wrap}.tower-winlog-event{grid-template-columns:48px minmax(0,1fr)}.tower-winlog-event em{grid-column:2}}
  `;
  document.head.appendChild(style);

  const observer=new MutationObserver((mutations)=>{
    const relevant=mutations.some((mutation)=>{
      const target=mutation.target;
      return !(target instanceof Element && target.closest('#tower-winning-log-panel,.tower-winlog-dialog'));
    });
    if(relevant)queueRender();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  queueRender();
})();

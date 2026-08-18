from pathlib import Path

p = Path('index.html')
s = p.read_text()

def rep(old, new, count=1):
    global s
    if old not in s:
        raise SystemExit('missing patch target: ' + old[:120])
    s = s.replace(old, new, count)

rep("towerAbilityAura:'',towerAbilityAuraBorder:''};", "towerAbilityAura:'',towerAbilityAuraBorder:'',towerSearch:null,towerSearchRunning:false,towerSearchLabel:''};")

css = r'''
    .tower-search-panel{margin:0 16px 16px;border:1px solid #263142;border-radius:13px;background:#0a0f16;padding:12px}.tower-search-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px}.tower-search-head b{font-size:11px;color:#d7e0e9}.tower-search-head span{font-size:8px;color:#748397}.tower-search-progress{display:grid;gap:7px;color:#8b99a9;font-size:9px}.tower-search-bar{height:6px;border-radius:999px;background:#17212d;overflow:hidden}.tower-search-bar i{display:block;height:100%;background:#477b76}.tower-search-list{display:grid;gap:8px}.tower-search-rec{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid #202b3a;border-radius:11px;background:#0d141d;padding:9px}.tower-search-team{display:flex;gap:6px;align-items:center;min-width:0}.tower-search-card{display:flex;gap:5px;align-items:center;min-width:0}.tower-search-card .mini-portrait{flex:0 0 auto}.tower-search-card span{min-width:0}.tower-search-card b,.tower-search-card small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tower-search-card b{font-size:8px;color:#d2dae4}.tower-search-card small{font-size:7px;color:#6f7e90}.tower-search-meta{display:flex;gap:10px;flex-wrap:wrap;margin-top:6px;color:#748397;font-size:8px}.tower-search-meta b{color:#badbd4}.tower-search-load{border:1px solid #477b76;background:#17302d;color:#d6f1ec;border-radius:9px;padding:8px 10px;font-size:9px;font-weight:750;cursor:pointer}.tower-search-note{color:#667588;font-size:8px;line-height:1.45;margin-top:8px}@media(max-width:900px){.tower-search-rec{grid-template-columns:1fr}.tower-search-team{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.tower-search-load{width:100%}}
'''
rep('</style>', css + '\n  </style>')

rep("let resultHtml='<div class=\"tower-empty\">Choose the floor and enemy lineup, then press Make Team.</div>';", "let resultHtml='<div class=\"tower-empty\">Search the known cheese pool, then load a recommendation for the full simulator.</div>';")

marker = "    root.innerHTML=`<main class=\"shell\"><header class=\"topbar\""
insert = r'''    const search=state.towerSearch;
    const searchPct=state.towerSearchRunning&&search?.progress?.total?Math.min(100,Math.round((search.progress.completed/search.progress.total)*100)):0;
    let towerSearchHtml='';
    if(state.towerSearchRunning){
      const pg=search?.progress||{};
      const phase=pg.phase==='quick'?'Testing combinations':pg.phase==='order'?'Optimizing order':pg.phase==='aura'?'Testing auras':pg.phase==='final'?'Verifying finalists':'Starting search';
      towerSearchHtml=`<div class=\"tower-search-panel\"><div class=\"tower-search-head\"><b>${phase}</b><span>${full(pg.battleSimulations||0)} battles tested</span></div><div class=\"tower-search-progress\"><span>${full(pg.completed||0)} / ${full(pg.total||0)}</span><div class=\"tower-search-bar\"><i style=\"width:${searchPct}%\"></i></div></div></div>`;
    }else if(search?.error){
      towerSearchHtml=`<div class=\"tower-search-panel tower-error\">${esc(search.error)}</div>`;
    }else if(search?.recommendations?.length){
      const anchors=(search.anchorCards||[]).length?`Required counters: ${(search.anchorCards||[]).map(esc).join(' · ')}`:'No hard counter required for this enemy team.';
      towerSearchHtml=`<div class=\"tower-search-panel\"><div class=\"tower-search-head\"><div><b>Recommended cheese decks</b><span>${anchors}</span></div><span>${full(search.combinations||0)} combinations · ${full(search.battleSimulations||0)} battles</span></div><div class=\"tower-search-list\">${search.recommendations.map((rec,index)=>`<div class=\"tower-search-rec\"><div><div class=\"tower-search-team\">${rec.loadout.cards.map((slot,i)=>{const card=cardByName(slot.cardName);return `<div class=\"tower-search-card\">${portrait(card)}<span><b>${i+1}. ${esc(slot.cardName)}</b><small>${esc(card?.ability||'No ability')}</small></span></div>`}).join('')}</div><div class=\"tower-search-meta\"><span>Aura: <b>${esc(rec.loadout.abilityAura?.auraName||'None')}</b></span><span>Search sample: <b>${pct((rec.winRate||0)*100)}% wins</b></span><span>Battle progress: <b>${pct((rec.progress||0)*100)}%</b></span></div></div><button class=\"tower-search-load\" data-load-cheese-result=\"${index}\">Load &amp; Simulate</button></div>`).join('')}</div><div class=\"tower-search-note\">This is an unranked shortlist from repeated battle tests. Load a deck, then use the existing 10,000-run simulation for the final check.</div></div>`;
    }
'''
if marker not in s:
    raise SystemExit('missing render marker')
s = s.replace(marker, insert + marker, 1)

old_row = '<div class="tower-build-row"><button class="tower-make" data-make-tower-team>Make Team</button></div><div class="tower-result">${resultHtml}</div>'
new_row = '<div class="tower-build-row"><button class="tower-make" data-make-tower-team ${state.towerSearchRunning||state.towerSimRunning?\'disabled\':\'\'}>${state.towerSearchRunning?esc(state.towerSearchLabel||\'Searching…\'):\'Search Cheese Decks\'}</button></div>${towerSearchHtml}<div class="tower-result">${resultHtml}</div>'
rep(old_row, new_row)

old_make = "root.querySelector('[data-make-tower-team]')?.addEventListener('click',()=>{const inputs=[...root.querySelectorAll('[data-tower-enemy]')];state.towerEnemies=inputs.map(el=>el.value.trim());const missing=state.towerEnemies.find(name=>!cardByName(name));if(missing!==undefined){state.towerResult={error:missing?`Unknown card: ${missing}. Choose a card from the list.`:'All four enemy cards are required.'};state.towerSim=null;render();return}state.towerResult=makeTowerCheese(state.towerEnemies);state.towerSim=null;state.towerOverrides=['','','',''];state.towerBorders=Array.from({length:4},()=>[]);state.towerAbilityAura=state.towerResult.endTimesNeeded?'End Times':'';state.towerAbilityAuraBorder='';render()});"
rep(old_make, "root.querySelector('[data-make-tower-team]')?.addEventListener('click',runTowerCheeseSearch);root.querySelectorAll('[data-load-cheese-result]').forEach(el=>el.addEventListener('click',()=>loadTowerCheeseRecommendation(Number(el.dataset.loadCheeseResult))));")

rep("state.towerResult=null;state.towerSim=null;state.towerOverrides=['','','',''];state.towerBorders=Array.from({length:4},()=>[]);state.towerAbilityAura='';state.towerAbilityAuraBorder='';render()});", "state.towerResult=null;state.towerSim=null;state.towerSearch=null;state.towerSearchRunning=false;state.towerSearchLabel='';state.towerOverrides=['','','',''];state.towerBorders=Array.from({length:4},()=>[]);state.towerAbilityAura='';state.towerAbilityAuraBorder='';render()});", 1)
rep("root.querySelector('#towerDifficulty')?.addEventListener('change',e=>{state.towerDifficulty=e.target.value;state.towerSim=null;render()});", "root.querySelector('#towerDifficulty')?.addEventListener('change',e=>{state.towerDifficulty=e.target.value;state.towerSim=null;state.towerSearch=null;render()});")

old_worker = r'''        if(e.data.kind==='tower-progress'){
          state.towerSimLabel=`${full(e.data.completed||0)} / ${full(e.data.total||state.towerRuns)}`;
          render();
          return;
        }
        state.towerSimRunning=false;state.towerSimLabel='';towerPendingId=0;
        if(e.data.ok)state.towerSim={...e.data.result,elapsedMs:e.data.elapsedMs};
        else state.towerSim={error:e.data.error||'Tower simulation failed.'};
        render();'''
new_worker = r'''        if(e.data.kind==='tower-progress'){
          state.towerSimLabel=`${full(e.data.completed||0)} / ${full(e.data.total||state.towerRuns)}`;
          render();
          return;
        }
        if(e.data.kind==='tower-cheese-progress'){
          state.towerSearchRunning=true;state.towerSearchLabel=`${e.data.phase||'search'} ${full(e.data.completed||0)} / ${full(e.data.total||0)}`;
          state.towerSearch={...(state.towerSearch||{}),progress:e.data};render();return;
        }
        if(e.data.kind==='tower-cheese-result'){
          state.towerSearchRunning=false;state.towerSearchLabel='';towerPendingId=0;
          state.towerSearch=e.data.ok?e.data.result:{error:e.data.error||'Tower cheese search failed.'};render();return;
        }
        state.towerSimRunning=false;state.towerSimLabel='';towerPendingId=0;
        if(e.data.ok)state.towerSim={...e.data.result,elapsedMs:e.data.elapsedMs};
        else state.towerSim={error:e.data.error||'Tower simulation failed.'};
        render();'''
rep(old_worker, new_worker)

old_error = "towerWorker.onerror=e=>{state.towerSimRunning=false;state.towerSimLabel='';towerPendingId=0;state.towerSim={error:e.message||'Tower simulation worker failed.'};render()};"
new_error = "towerWorker.onerror=e=>{const searching=state.towerSearchRunning;state.towerSimRunning=false;state.towerSimLabel='';state.towerSearchRunning=false;state.towerSearchLabel='';towerPendingId=0;if(searching)state.towerSearch={error:e.message||'Tower cheese search worker failed.'};else state.towerSim={error:e.message||'Tower simulation worker failed.'};render()};"
rep(old_error, new_error)

marker2 = "  function towerLoadout(){"
functions = r'''  function runTowerCheeseSearch(){
    if(state.towerSearchRunning||state.towerSimRunning)return;
    const inputs=[...root.querySelectorAll('[data-tower-enemy]')];state.towerEnemies=inputs.map(el=>el.value.trim());
    const missing=state.towerEnemies.find(name=>!cardByName(name));
    if(missing!==undefined){state.towerSearch={error:missing?`Unknown card: ${missing}. Choose a card from the list.`:'All four enemy cards are required.'};render();return}
    if(!towerWorker)startTowerWorker();
    if(!towerWorker){state.towerSearch={error:'Tower search worker is unavailable. Refresh and try again.'};render();return}
    const seedWords=new Uint32Array(1);crypto.getRandomValues(seedWords);const seed=seedWords[0]||((Date.now()^Math.floor(performance.now()*1000))>>>0);
    state.towerResult=null;state.towerSim=null;state.towerSearch={progress:{phase:'quick',completed:0,total:0,battleSimulations:0}};state.towerSearchRunning=true;state.towerSearchLabel='Starting search…';
    towerPendingId=++towerRequestId;
    towerWorker.postMessage({id:towerPendingId,kind:'tower-cheese-search',enemyNames:[...state.towerEnemies],floor:state.towerFloor,difficulty:state.towerDifficulty,seed});
    render();
  }
  function loadTowerCheeseRecommendation(index){
    const rec=state.towerSearch?.recommendations?.[index];if(!rec)return;
    state.towerResult={picks:rec.loadout.cards.map((slot,i)=>{const enemy=cardByName(state.towerEnemies[i]);return {enemy:state.towerEnemies[i],enemyAbility:enemy?.ability||'No ability',pick:slot.cardName,reason:'Selected by simulated Tower cheese search.',threat:{}}}),endTimesNeeded:rec.loadout.abilityAura?.auraName==='End Times',blockers:0,prophetIndex:-1,parallaxIndex:-1,kuchisakeIndex:-1,overflowBufferIndex:-1};
    state.towerOverrides=['','','',''];state.towerBorders=Array.from({length:4},()=>[]);state.towerAbilityAura=rec.loadout.abilityAura?.auraName||'';state.towerAbilityAuraBorder='';state.towerSim=null;render();
  }
'''
if marker2 not in s:
    raise SystemExit('missing towerLoadout marker')
s = s.replace(marker2, functions + marker2, 1)

p.write_text(s)

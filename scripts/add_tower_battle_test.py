from pathlib import Path

path=Path('index.html')
html=path.read_text(encoding='utf-8')

if 'tower-sim-panel' in html:
    print('Tower battle test already present.')
    raise SystemExit(0)

css=r'''
    .tower-controls{grid-template-columns:170px 190px minmax(0,1fr)}.tower-floor select{width:100%;border:1px solid #263142;border-radius:10px;background:#0a0f16;color:#dce5ee;padding:10px 11px;outline:none}.tower-floor select:focus{border-color:#477b76}.tower-sim-panel{margin-top:12px;border:1px solid #263345;border-radius:13px;background:#0a1018;padding:12px}.tower-sim-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.tower-sim-head b{display:block;font-size:11px}.tower-sim-head small{display:block;color:#728197;font-size:8px;margin-top:3px}.tower-sim-button{border:1px solid #477b76;background:#17302d;color:#d6f1ec;border-radius:9px;padding:9px 12px;font-size:9px;font-weight:750;cursor:pointer;white-space:nowrap}.tower-sim-button:disabled{opacity:.55;cursor:default}.tower-sim-results{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:10px}.tower-sim-results>div{border:1px solid #1f2a38;border-radius:10px;background:#090e15;padding:9px}.tower-sim-results span{display:block;color:#66768a;font-size:7px;text-transform:uppercase;letter-spacing:.06em}.tower-sim-results b{display:block;margin-top:4px;font-size:13px;color:#dce5ee}.tower-winbar{height:5px;border-radius:999px;background:#151f2a;overflow:hidden;margin-top:10px}.tower-winbar i{display:block;height:100%;background:#477b76}.tower-sim-note{margin-top:8px;color:#718095;font-size:8px;line-height:1.45}.tower-sim-error{margin-top:9px;border:1px solid #523039;background:#160e11;color:#d7a7b0;border-radius:9px;padding:8px 10px;font-size:9px}@media(max-width:640px){.tower-controls{grid-template-columns:1fr}.tower-sim-head{align-items:flex-start;flex-direction:column}.tower-sim-results{grid-template-columns:repeat(2,minmax(0,1fr))}}
'''
html=html.replace('  </style>',css+'  </style>',1)

old_state="const state={cards:[],auras:[],abilities:{},thumbs:{},teams:Array.from({length:5},blankTeam),activeTeam:0,activeSlot:0,query:'',runs:15,cap:50000,seed:1000,running:false,runningLabel:'',workerReady:false,lastProgressRender:0,view:'depths',towerFloor:105,towerEnemies:['','','',''],towerResult:null};"
new_state="const state={cards:[],auras:[],abilities:{},thumbs:{},teams:Array.from({length:5},blankTeam),activeTeam:0,activeSlot:0,query:'',runs:15,cap:50000,seed:1000,running:false,runningLabel:'',workerReady:false,lastProgressRender:0,view:'depths',towerFloor:105,towerEnemies:['','','',''],towerResult:null,towerDifficulty:'Impossible',towerRuns:1000,towerSim:null,towerSimRunning:false,towerSimLabel:''};"
if old_state not in html: raise SystemExit('state anchor missing')
html=html.replace(old_state,new_state,1)

root_anchor='''    root.innerHTML=`<main class="shell"><header class="topbar"><div><p class="kicker">CARD RNG EXPANSION</p><h1>Tower Cheese Maker</h1></div></header>'''
if root_anchor not in html: raise SystemExit('tower root anchor missing')
sim_insert=r'''    if(result&&!result.error){
      const sim=state.towerSim;
      const simBody=sim?.error?`<div class="tower-sim-error">${esc(sim.error)}</div>`:sim?`<div class="tower-sim-results"><div><span>Wins</span><b>${full(sim.wins)} / ${full(sim.runs)}</b></div><div><span>Win rate</span><b>${(sim.winRate*100).toFixed(1)}%</b></div><div><span>Losses</span><b>${full(sim.losses)}</b></div><div><span>Avg turns</span><b>${one(sim.averageTurns)}</b></div></div><div class="tower-winbar"><i style="width:${Math.max(0,Math.min(100,sim.winRate*100))}%"></i></div><div class="tower-sim-note">${sim.draws?`${full(sim.draws)} draws · `:''}${sim.elapsedMs<1000?`${Math.round(sim.elapsedMs)} ms`:`${(sim.elapsedMs/1000).toFixed(2)} s`} compute${sim.unsupportedAbilities?.length?` · Unsupported: ${esc(sim.unsupportedAbilities.join(', '))}`:''}</div>`:'';
      resultHtml+=`<div class="tower-sim-panel"><div class="tower-sim-head"><div><b>Test this cheese team</b><small>${esc(state.towerDifficulty)} Tower · ${full(state.towerRuns)} battles · base cheese cards${result.endTimesNeeded?' + Base End Times aura':''}</small></div><button class="tower-sim-button" data-sim-tower ${state.towerSimRunning?'disabled':''}>${state.towerSimRunning?esc(state.towerSimLabel||'Simulating…'):`Simulate ${full(state.towerRuns)}`}</button></div>${simBody}</div>`;
    }
'''
html=html.replace(root_anchor,sim_insert+root_anchor,1)

old_controls=r'''<div class="tower-controls"><label class="tower-floor"><span>Floor</span><input id="towerFloor" type="number" min="1" max="105" value="${state.towerFloor}"></label><div class="tower-preset-note">'''
new_controls=r'''<div class="tower-controls"><label class="tower-floor"><span>Floor</span><input id="towerFloor" type="number" min="1" max="105" value="${state.towerFloor}"></label><label class="tower-floor"><span>Difficulty</span><select id="towerDifficulty">${['Normal','Hard','Extreme','Hell','Impossible'].map(d=>`<option value="${d}" ${state.towerDifficulty===d?'selected':''}>${d}</option>`).join('')}</select></label><div class="tower-preset-note">'''
if old_controls not in html: raise SystemExit('tower controls anchor missing')
html=html.replace(old_controls,new_controls,1)

html=html.replace("state.towerEnemies=fixed||['','','',''];state.towerResult=null;render()", "state.towerEnemies=fixed||['','','',''];state.towerResult=null;state.towerSim=null;render()",1)
html=html.replace("state.towerEnemies[Number(el.dataset.towerEnemy)]=el.value;state.towerResult=null", "state.towerEnemies[Number(el.dataset.towerEnemy)]=el.value;state.towerResult=null;state.towerSim=null",2)
html=html.replace("state.towerResult=makeTowerCheese(state.towerEnemies);render()", "state.towerResult=makeTowerCheese(state.towerEnemies);state.towerSim=null;render()",1)

bind_end="""    root.querySelector('[data-make-tower-team]')?.addEventListener('click',()=>{const inputs=[...root.querySelectorAll('[data-tower-enemy]')];state.towerEnemies=inputs.map(el=>el.value.trim());const missing=state.towerEnemies.find(name=>!cardByName(name));if(missing!==undefined){state.towerResult={error:missing?`Unknown card: ${missing}. Choose a card from the list.`:'All four enemy cards are required.'};render();return}state.towerResult=makeTowerCheese(state.towerEnemies);state.towerSim=null;render()});
  }
"""
if bind_end not in html: raise SystemExit('tower bind end missing')
bind_new="""    root.querySelector('[data-make-tower-team]')?.addEventListener('click',()=>{const inputs=[...root.querySelectorAll('[data-tower-enemy]')];state.towerEnemies=inputs.map(el=>el.value.trim());const missing=state.towerEnemies.find(name=>!cardByName(name));if(missing!==undefined){state.towerResult={error:missing?`Unknown card: ${missing}. Choose a card from the list.`:'All four enemy cards are required.'};state.towerSim=null;render();return}state.towerResult=makeTowerCheese(state.towerEnemies);state.towerSim=null;render()});
    root.querySelector('#towerDifficulty')?.addEventListener('change',e=>{state.towerDifficulty=e.target.value;state.towerSim=null;render()});
    root.querySelector('[data-sim-tower]')?.addEventListener('click',runTowerSimulation);
  }
"""
html=html.replace(bind_end,bind_new,1)

worker_anchor="  let worker=null,requestId=0;const pending=new Map();"
if worker_anchor not in html: raise SystemExit('worker anchor missing')
tower_worker=r'''  let towerWorker=null,towerRequestId=0,towerPendingId=0;
  function startTowerWorker(){
    try{
      towerWorker=new Worker('./browser/tower-worker.js');
      towerWorker.onmessage=e=>{
        if(e.data?.id!==towerPendingId)return;
        if(e.data.kind==='tower-progress'){
          state.towerSimLabel=`${full(e.data.completed||0)} / ${full(e.data.total||state.towerRuns)}`;
          render();
          return;
        }
        state.towerSimRunning=false;state.towerSimLabel='';towerPendingId=0;
        if(e.data.ok)state.towerSim={...e.data.result,elapsedMs:e.data.elapsedMs};
        else state.towerSim={error:e.data.error||'Tower simulation failed.'};
        render();
      };
      towerWorker.onerror=e=>{state.towerSimRunning=false;state.towerSimLabel='';towerPendingId=0;state.towerSim={error:e.message||'Tower simulation worker failed.'};render()};
    }catch(_){towerWorker=null}
  }
  function towerLoadout(){
    const result=state.towerResult;if(!result?.picks)return null;
    return {cards:result.picks.map(p=>({cardName:p.pick,borders:[]})),statAura:null,abilityAura:result.endTimesNeeded?{auraName:'End Times',border:null}:null};
  }
  function runTowerSimulation(){
    if(state.towerSimRunning||!state.towerResult?.picks)return;
    if(!towerWorker)startTowerWorker();
    if(!towerWorker){state.towerSim={error:'Tower simulation worker is unavailable. Refresh and try again.'};render();return}
    const loadout=towerLoadout();if(!loadout)return;
    const seedWords=new Uint32Array(1);crypto.getRandomValues(seedWords);const seed=seedWords[0]||((Date.now()^Math.floor(performance.now()*1000))>>>0);
    const id=++towerRequestId;towerPendingId=id;state.towerSimRunning=true;state.towerSim=null;state.towerSimLabel=`0 / ${full(state.towerRuns)}`;render();
    towerWorker.postMessage({id,kind:'tower-batch',loadout,enemyNames:[...state.towerEnemies],floor:state.towerFloor,difficulty:state.towerDifficulty,runs:state.towerRuns,seed});
  }
'''
html=html.replace(worker_anchor,tower_worker+worker_anchor,1)

load_anchor="state.thumbs=thumbs||{};restore();startWorker();render();liveThumbs()"
if load_anchor not in html: raise SystemExit('load anchor missing')
html=html.replace(load_anchor,"state.thumbs=thumbs||{};restore();startWorker();startTowerWorker();render();liveThumbs()",1)

path.write_text(html,encoding='utf-8')
print('Tower battle test UI added.')

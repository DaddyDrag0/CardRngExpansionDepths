from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 anchor, found {count}')
    return text.replace(old, new, 1)

# ---------------- engine ----------------
p = Path('src/engine/tower.ts')
t = p.read_text()

t = replace_once(
    t,
    "interface SampleScore {\n",
    "export interface TowerCheesePoolOptions {\n  excludedCards?: readonly string[]\n  addedCards?: readonly string[]\n}\n\nexport interface TowerCheeseIntensiveOptions extends TowerCheesePoolOptions {\n  shardIndex?: number\n  shardCount?: number\n}\n\ninterface SampleScore {\n",
    'tower pool interfaces',
)

t = replace_once(
    t,
    "export function towerCheeseCandidatePool(): string[] {\n  const resolved = CHEESE_CARD_ALIASES.map(resolveCheeseCard).filter((name): name is string => Boolean(name))\n  return [...new Set(resolved)]\n}\n",
    "export function towerCheeseCandidatePool(options: TowerCheesePoolOptions = {}): string[] {\n  const resolved = CHEESE_CARD_ALIASES.map(resolveCheeseCard).filter((name): name is string => Boolean(name))\n  const excluded = new Set((options.excludedCards || []).map((name) => String(name)))\n  const added = (options.addedCards || [])\n    .map((name) => CARD_BY_NAME.get(String(name)))\n    .filter((card) => Boolean(card && !card.unobtainable))\n    .map((card) => card!.name)\n  return [...new Set([...resolved, ...added])].filter((name) => !excluded.has(name))\n}\n",
    'custom candidate pool',
)

t = replace_once(
    t,
    "  onProgress?: (progress: TowerCheeseSearchProgress) => void,\n): TowerCheeseSearchResult {\n  const enemies = buildTowerEnemies(enemyNames, floor, difficulty)\n  const pool = towerCheeseCandidatePool()\n  const anchors = towerCheeseAnchors(enemyNames)\n",
    "  onProgress?: (progress: TowerCheeseSearchProgress) => void,\n  poolOptions: TowerCheesePoolOptions = {},\n): TowerCheeseSearchResult {\n  const enemies = buildTowerEnemies(enemyNames, floor, difficulty)\n  const pool = towerCheeseCandidatePool(poolOptions)\n  const anchors = towerCheeseAnchors(enemyNames).filter((name) => pool.includes(name))\n",
    'quick search pool options',
)

t = replace_once(
    t,
    "function intensiveSearchSpace() {\n  const pool = towerCheeseCandidatePool()\n  const orderedTeams = orderedCheeseTeams(pool)\n  const auraVariants = intensiveCheeseAuraVariants()\n  const variants = orderedTeams.length * auraVariants.length\n  const runsPerVariant = Math.max(1, Math.ceil(1_000_000 / Math.max(1, variants)))\n  return { pool, orderedTeams, auraVariants, variants, runsPerVariant }\n}\n\nexport function towerCheeseIntensivePlan(): TowerCheeseIntensivePlan {\n  const space = intensiveSearchSpace()\n",
    "function intensiveSearchSpace(poolOptions: TowerCheesePoolOptions = {}) {\n  const pool = towerCheeseCandidatePool(poolOptions)\n  const orderedTeams = orderedCheeseTeams(pool)\n  const auraVariants = intensiveCheeseAuraVariants()\n  const variants = orderedTeams.length * auraVariants.length\n  const runsPerVariant = Math.max(1, Math.ceil(1_000_000 / Math.max(1, variants)))\n  return { pool, orderedTeams, auraVariants, variants, runsPerVariant }\n}\n\nexport function towerCheeseIntensivePlan(poolOptions: TowerCheesePoolOptions = {}): TowerCheeseIntensivePlan {\n  const space = intensiveSearchSpace(poolOptions)\n",
    'intensive search pool options',
)

t = replace_once(
    t,
    "  seed = 1,\n  onProgress?: (progress: TowerCheeseSearchProgress) => void,\n): TowerCheeseSearchResult {\n  const enemies = buildTowerEnemies(enemyNames, floor, difficulty)\n  const { pool, orderedTeams, auraVariants, variants, runsPerVariant } = intensiveSearchSpace()\n  if (!pool.length) throw new Error('Tower cheese candidate pool is empty.')\n\n  const simulations = { value: 0 }\n",
    "  seed = 1,\n  onProgress?: (progress: TowerCheeseSearchProgress) => void,\n  options: TowerCheeseIntensiveOptions = {},\n): TowerCheeseSearchResult {\n  const enemies = buildTowerEnemies(enemyNames, floor, difficulty)\n  const { pool, orderedTeams, auraVariants, variants, runsPerVariant } = intensiveSearchSpace(options)\n  if (!pool.length) throw new Error('Tower cheese candidate pool is empty.')\n\n  const shardCount = Math.max(1, Math.floor(Number(options.shardCount) || 1))\n  const shardIndex = Math.max(0, Math.min(shardCount - 1, Math.floor(Number(options.shardIndex) || 0)))\n  const assignedTeams = shardCount === 1 ? orderedTeams : orderedTeams.filter((_, index) => index % shardCount === shardIndex)\n  const assignedVariants = assignedTeams.length * auraVariants.length\n  if (!assignedVariants) throw new Error('Tower cheese search shard has no variants.')\n\n  const simulations = { value: 0 }\n",
    'intensive shard signature',
)

t = replace_once(
    t,
    "  for (const names of orderedTeams) {\n",
    "  for (const names of assignedTeams) {\n",
    'assigned intensive teams',
)

t = replace_once(
    t,
    "      if (completed % 200 === 0 || completed === variants) {\n        onProgress?.({ phase: 'exhaustive', completed, total: variants, battleSimulations: simulations.value })\n      }\n",
    "      if (completed % 1_000 === 0 || completed === assignedVariants) {\n        onProgress?.({ phase: 'exhaustive', completed, total: assignedVariants, battleSimulations: simulations.value })\n      }\n",
    'sharded intensive progress',
)

t = replace_once(
    t,
    "  const verifyPool = contenders.slice(0, Math.min(24, contenders.length))\n  const recommendations: TowerCheeseCandidate[] = []\n  for (let index = 0; index < verifyPool.length; index++) {\n    const entry = verifyPool[index]\n    const score = sampleLoadout(entry.loadout, enemies, 2_000, nextSeed(), simulations)\n",
    "  const verifyLimit = shardCount > 1 ? 8 : 24\n  const verifyRuns = shardCount > 1 ? 1_000 : 2_000\n  const verifyPool = contenders.slice(0, Math.min(verifyLimit, contenders.length))\n  const recommendations: TowerCheeseCandidate[] = []\n  for (let index = 0; index < verifyPool.length; index++) {\n    const entry = verifyPool[index]\n    const score = sampleLoadout(entry.loadout, enemies, verifyRuns, nextSeed(), simulations)\n",
    'parallel finalist verification',
)

t = replace_once(
    t,
    "    combinations: variants,\n",
    "    combinations: assignedVariants,\n",
    'local shard combination count',
)

p.write_text(t)

# ---------------- worker ----------------
p = Path('src/tower-worker.ts')
t = p.read_text()

t = replace_once(
    t,
    "  intensive?: boolean\n}\n",
    "  intensive?: boolean\n  excludedCards?: string[]\n  addedCards?: string[]\n  shardIndex?: number\n  shardCount?: number\n}\n",
    'worker pool request fields',
)

old = """      const search = request.intensive ? searchTowerCheeseIntensive : searchTowerCheese\n      const result = search(\n        request.enemyNames,\n        request.floor,\n        request.difficulty,\n        request.seed,\n        (progress) => self.postMessage({ kind: 'tower-cheese-progress', id: request.id, ...progress }),\n      )\n"""
new = """      const progress = (update: Parameters<typeof searchTowerCheese>[4] extends (...args: infer P) => unknown ? P[0] : never) =>\n        self.postMessage({ kind: 'tower-cheese-progress', id: request.id, ...update })\n      const poolOptions = { excludedCards: request.excludedCards || [], addedCards: request.addedCards || [] }\n      const result = request.intensive\n        ? searchTowerCheeseIntensive(\n            request.enemyNames, request.floor, request.difficulty, request.seed, progress,\n            { ...poolOptions, shardIndex: request.shardIndex, shardCount: request.shardCount },\n          )\n        : searchTowerCheese(request.enemyNames, request.floor, request.difficulty, request.seed, progress, poolOptions)\n"""
t = replace_once(t, old, new, 'worker search dispatch')
p.write_text(t)

# ---------------- UI ----------------
p = Path('index.html')
t = p.read_text()

t = replace_once(
    t,
    ".tower-search-note{color:#667588;font-size:8px;line-height:1.45;margin-top:8px}@media(max-width:900px){.tower-search-rec{grid-template-columns:1fr}.tower-search-team{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.tower-search-load{width:100%}}\n",
    ".tower-search-note{color:#667588;font-size:8px;line-height:1.45;margin-top:8px}@media(max-width:900px){.tower-search-rec{grid-template-columns:1fr}.tower-search-team{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.tower-search-load{width:100%}}\n    .tower-pool-panel{margin:0 16px 14px;border:1px solid #263142;border-radius:12px;background:#0a0f16;padding:11px}.tower-pool-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.tower-pool-head b{display:block;font-size:10px;color:#d7e0e9}.tower-pool-head small{display:block;margin-top:3px;color:#687789;font-size:8px;line-height:1.4}.tower-pool-head>span{color:#87d8ca;font-size:8px;white-space:nowrap}.tower-pool-chips{display:flex;gap:5px;flex-wrap:wrap;margin-top:9px}.tower-pool-chip{border:1px solid #355e5a;border-radius:999px;background:rgba(135,216,202,.06);color:#bfe0da;padding:5px 8px;font-size:8px;cursor:pointer}.tower-pool-chip.off{border-color:#493039;background:#160e11;color:#a97d86;text-decoration:line-through}.tower-pool-chip.added{border-color:#66548b;background:#181226;color:#d9ccf5}.tower-pool-add{position:relative;margin-top:9px}.tower-pool-add input{width:100%;box-sizing:border-box;border:1px solid #263142;border-radius:9px;background:#0d141d;color:#d7e0e9;padding:8px 9px;font-size:9px;outline:none}.tower-pool-add input:focus{border-color:#477b76}.tower-pool-suggestions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;margin-top:6px}.tower-pool-suggestions button{border:1px solid #253142;border-radius:8px;background:#0c121a;color:#aeb9c6;padding:7px 8px;text-align:left;font-size:8px;cursor:pointer}.tower-pool-suggestions button small{display:block;margin-top:2px;color:#647286;font-size:7px}.tower-pool-warning{margin-top:7px;color:#6e7d8f;font-size:7px;line-height:1.4}@media(max-width:640px){.tower-pool-suggestions{grid-template-columns:1fr}}\n",
    'tower pool styles',
)

t = replace_once(
    t,
    "towerSearchMode:'quick'};\n\n  const TOWER_FIXED={",
    "towerSearchMode:'quick',towerExcludedCards:[],towerAddedCards:[],towerPoolQuery:''};\n\n  const TOWER_DEFAULT_CHEESE_CARDS=['Judgment Day','Robin Hood','Parallax','Pandora','Kuchisake-onna','Fate Seamstress','Kira','Surtr','Control Freak',\"Hell's Army\",'Noveau Riche','True Prophet'];\n\n  const TOWER_FIXED={",
    'tower pool state',
)

t = replace_once(
    t,
    "    const fixed=Boolean(fixedTowerTeam(state.towerFloor)),variants=TOWER_FIXED_VARIANTS[state.towerFloor]||[],names=state.cards.filter(c=>!c.unobtainable).map(c=>c.name).sort((a,b)=>a.localeCompare(b)),allCardNames=state.cards.map(c=>c.name).sort((a,b)=>a.localeCompare(b));\n    const previews=state.towerEnemies.map((name,i)=>",
    "    const fixed=Boolean(fixedTowerTeam(state.towerFloor)),variants=TOWER_FIXED_VARIANTS[state.towerFloor]||[],names=state.cards.filter(c=>!c.unobtainable).map(c=>c.name).sort((a,b)=>a.localeCompare(b)),allCardNames=state.cards.map(c=>c.name).sort((a,b)=>a.localeCompare(b));\n    const defaultPool=TOWER_DEFAULT_CHEESE_CARDS.filter(name=>cardByName(name)),activePool=[...new Set([...defaultPool,...state.towerAddedCards])].filter(name=>!state.towerExcludedCards.includes(name)),poolQ=state.towerPoolQuery.trim().toLowerCase(),poolSuggestions=poolQ?towerAutocompleteCards(poolQ,false).filter(card=>!defaultPool.includes(card.name)&&!state.towerAddedCards.includes(card.name)).slice(0,8):[];\n    const poolPanel=`<div class=\"tower-pool-panel\"><div class=\"tower-pool-head\"><div><b>Search card pool</b><small>Click a default card you do not own to disable it. Add any other card you want the search to try.</small></div><span>${activePool.length} active cards</span></div><div class=\"tower-pool-chips\">${defaultPool.map(name=>`<button type=\"button\" class=\"tower-pool-chip ${state.towerExcludedCards.includes(name)?'off':''}\" data-tower-pool-toggle=\"${esc(name)}\">${esc(name)}${state.towerExcludedCards.includes(name)?' · OFF':''}</button>`).join('')}${state.towerAddedCards.map(name=>`<button type=\"button\" class=\"tower-pool-chip added\" data-tower-pool-remove=\"${esc(name)}\">+ ${esc(name)} ×</button>`).join('')}</div><div class=\"tower-pool-add\"><input id=\"towerPoolSearch\" value=\"${esc(state.towerPoolQuery)}\" placeholder=\"Add another card to the search…\" autocomplete=\"off\">${poolQ?`<div class=\"tower-pool-suggestions\">${poolSuggestions.length?poolSuggestions.map(card=>`<button type=\"button\" data-tower-pool-add=\"${esc(card.name)}\"><b>${esc(card.name)}</b><small>${esc(card.ability||'No ability')}</small></button>`).join(''):'<button type=\"button\" disabled>No matching addable cards</button>'}</div>`:''}</div><div class=\"tower-pool-warning\">Adding cards increases the exhaustive search space very quickly. Intensive mode uses multiple CPU workers automatically.</div></div>`;\n    const previews=state.towerEnemies.map((name,i)=>",
    'tower pool render data',
)

t = replace_once(
    t,
    "</div><div class=\"tower-enemies\">${previews}</div><div class=\"tower-build-row\"><button class=\"tower-make\"",
    "</div><div class=\"tower-enemies\">${previews}</div>${poolPanel}<div class=\"tower-build-row\"><button class=\"tower-make\"",
    'tower pool panel placement',
)

t = replace_once(
    t,
    "    root.querySelectorAll('[data-tower-enemy]').forEach(el=>bindTowerAutocomplete(el,'enemy',Number(el.dataset.towerEnemy)));\n    root.querySelector('[data-make-tower-team]')?.addEventListener('click',()=>runTowerCheeseSearch('quick'));",
    "    root.querySelectorAll('[data-tower-enemy]').forEach(el=>bindTowerAutocomplete(el,'enemy',Number(el.dataset.towerEnemy)));\n    root.querySelectorAll('[data-tower-pool-toggle]').forEach(el=>el.addEventListener('click',()=>{const name=el.dataset.towerPoolToggle;if(!name)return;state.towerExcludedCards=state.towerExcludedCards.includes(name)?state.towerExcludedCards.filter(x=>x!==name):[...state.towerExcludedCards,name];state.towerSearch=null;persist();render()}));\n    root.querySelectorAll('[data-tower-pool-remove]').forEach(el=>el.addEventListener('click',()=>{const name=el.dataset.towerPoolRemove;state.towerAddedCards=state.towerAddedCards.filter(x=>x!==name);state.towerSearch=null;persist();render()}));\n    root.querySelectorAll('[data-tower-pool-add]').forEach(el=>el.addEventListener('click',()=>{const name=el.dataset.towerPoolAdd,card=cardByName(name);if(!card||card.unobtainable||TOWER_DEFAULT_CHEESE_CARDS.includes(name)||state.towerAddedCards.includes(name))return;state.towerAddedCards=[...state.towerAddedCards,name];state.towerPoolQuery='';state.towerSearch=null;persist();render()}));\n    const poolSearch=root.querySelector('#towerPoolSearch');poolSearch?.addEventListener('input',()=>{state.towerPoolQuery=poolSearch.value;render();requestAnimationFrame(()=>{const n=root.querySelector('#towerPoolSearch');n?.focus();n?.setSelectionRange(n.value.length,n.value.length)})});\n    root.querySelector('[data-make-tower-team]')?.addEventListener('click',()=>runTowerCheeseSearch('quick'));",
    'tower pool events',
)

t = replace_once(
    t,
    "function persist(){try{localStorage.setItem(STORAGE,JSON.stringify({teams:state.teams.map(t=>({cards:t.cards,statAura:t.statAura,statAuraBorder:t.statAuraBorder,abilityAura:t.abilityAura,abilityAuraBorder:t.abilityAuraBorder})),activeTeam:state.activeTeam,depthBans:state.depthBans,bountifulDepths:state.bountifulDepths,battleSpeedStructureLevel:state.battleSpeedStructureLevel,runs:state.runs,cap:state.cap,seed:state.seed}))}catch(_){}}",
    "function persist(){try{localStorage.setItem(STORAGE,JSON.stringify({teams:state.teams.map(t=>({cards:t.cards,statAura:t.statAura,statAuraBorder:t.statAuraBorder,abilityAura:t.abilityAura,abilityAuraBorder:t.abilityAuraBorder})),activeTeam:state.activeTeam,depthBans:state.depthBans,bountifulDepths:state.bountifulDepths,battleSpeedStructureLevel:state.battleSpeedStructureLevel,runs:state.runs,cap:state.cap,seed:state.seed,towerExcludedCards:state.towerExcludedCards,towerAddedCards:state.towerAddedCards}))}catch(_){}}",
    'persist tower pool',
)

t = replace_once(
    t,
    "state.rebanLegacyDepths=false;state.depthBans=Array.isArray(s.depthBans)?[...new Set(s.depthBans.map(String))].filter(name=>depthBanEligible(cardByName(name))).slice(0,MAX_DEPTH_BANS):[];}catch(_){}}",
    "state.rebanLegacyDepths=false;state.depthBans=Array.isArray(s.depthBans)?[...new Set(s.depthBans.map(String))].filter(name=>depthBanEligible(cardByName(name))).slice(0,MAX_DEPTH_BANS):[];state.towerExcludedCards=Array.isArray(s.towerExcludedCards)?[...new Set(s.towerExcludedCards.map(String))].filter(name=>TOWER_DEFAULT_CHEESE_CARDS.includes(name)):[];state.towerAddedCards=Array.isArray(s.towerAddedCards)?[...new Set(s.towerAddedCards.map(String))].filter(name=>{const card=cardByName(name);return Boolean(card&&!card.unobtainable&&!TOWER_DEFAULT_CHEESE_CARDS.includes(name))}):[];}catch(_){}}",
    'restore tower pool',
)

t = replace_once(
    t,
    "  let towerWorker=null,towerRequestId=0,towerPendingId=0;\n",
    "  let towerWorker=null,towerRequestId=0,towerPendingId=0,towerSearchWorkers=[],towerSearchToken=0,towerSearchLastRender=0;\n",
    'parallel worker state',
)

parallel_helpers = r'''  function combineTowerSearchResults(results){
    const recommendations=[],candidatePool=new Set();let combinations=0,battleSimulations=0;
    for(const result of results){if(!result)continue;combinations+=Number(result.combinations)||0;battleSimulations+=Number(result.battleSimulations)||0;for(const name of result.candidatePool||[])candidatePool.add(name);for(const rec of result.recommendations||[])recommendations.push(rec)}
    recommendations.sort((a,b)=>(Number(b.winRate)||0)-(Number(a.winRate)||0)||(Number(b.progress)||0)-(Number(a.progress)||0)||(Number(a.averageTurns)||0)-(Number(b.averageTurns)||0));
    return {recommendations:recommendations.slice(0,10),anchorCards:[],candidatePool:[...candidatePool],combinations,battleSimulations};
  }
  function startParallelTowerCheeseSearch(seed){
    const workerCount=Math.min(8,Math.max(2,Number(navigator.hardwareConcurrency)||4)),token=++towerSearchToken,results=Array(workerCount).fill(null),progress=Array.from({length:workerCount},()=>({completed:0,total:0,battleSimulations:0}));let finished=0,failed=false;
    towerSearchWorkers.forEach(worker=>worker.terminate());towerSearchWorkers=[];towerSearchLastRender=0;
    const refreshProgress=phase=>{const completed=progress.reduce((sum,p)=>sum+(Number(p.completed)||0),0),total=progress.reduce((sum,p)=>sum+(Number(p.total)||0),0),battles=progress.reduce((sum,p)=>sum+(Number(p.battleSimulations)||0),0);state.towerSearch={...(state.towerSearch||{}),progress:{phase:phase||'exhaustive',completed,total,battleSimulations:battles,workers:workerCount}};state.towerSearchLabel=`${workerCount} workers · ${full(completed)} / ${full(total)}`;const now=performance.now();if(now-towerSearchLastRender>120){towerSearchLastRender=now;render()}};
    const fail=message=>{if(failed||token!==towerSearchToken)return;failed=true;towerSearchWorkers.forEach(worker=>worker.terminate());towerSearchWorkers=[];state.towerSearchRunning=false;state.towerSearchLabel='';state.towerSearch={error:message||'Parallel Tower cheese search failed.'};render()};
    for(let shardIndex=0;shardIndex<workerCount;shardIndex++){
      const worker=new Worker(versioned('./browser/tower-worker.js'));towerSearchWorkers.push(worker);
      worker.onmessage=e=>{if(failed||token!==towerSearchToken)return;const data=e.data||{};if(data.kind==='tower-cheese-progress'){progress[shardIndex]={completed:data.completed||0,total:data.total||0,battleSimulations:data.battleSimulations||0};refreshProgress(data.phase);return}if(data.kind!=='tower-cheese-result')return;if(!data.ok){fail(data.error);return}results[shardIndex]=data.result;finished+=1;worker.terminate();if(finished<workerCount){refreshProgress('verify');return}towerSearchWorkers=[];state.towerSearchRunning=false;state.towerSearchLabel='';state.towerSearch=combineTowerSearchResults(results);render()};
      worker.onerror=e=>fail(e.message||'Parallel Tower cheese search worker failed.');
      const shardSeed=(seed^Math.imul(shardIndex+1,0x9e3779b1))>>>0;
      worker.postMessage({id:token,kind:'tower-cheese-search',enemyNames:[...state.towerEnemies],floor:state.towerFloor,difficulty:state.towerDifficulty,seed:shardSeed||seed,intensive:true,excludedCards:[...state.towerExcludedCards],addedCards:[...state.towerAddedCards],shardIndex,shardCount:workerCount});
    }
    refreshProgress('exhaustive');
  }
'''
t = replace_once(t, "  function runTowerCheeseSearch(mode='quick'){\n", parallel_helpers + "  function runTowerCheeseSearch(mode='quick'){\n", 'parallel search helpers')

t = replace_once(
    t,
    "    towerPendingId=++towerRequestId;\n    towerWorker.postMessage({id:towerPendingId,kind:'tower-cheese-search',enemyNames:[...state.towerEnemies],floor:state.towerFloor,difficulty:state.towerDifficulty,seed,intensive:state.towerSearchMode==='intensive'});\n    render();\n",
    "    if(state.towerSearchMode==='intensive'){startParallelTowerCheeseSearch(seed);render();return}\n    towerPendingId=++towerRequestId;\n    towerWorker.postMessage({id:towerPendingId,kind:'tower-cheese-search',enemyNames:[...state.towerEnemies],floor:state.towerFloor,difficulty:state.towerDifficulty,seed,intensive:false,excludedCards:[...state.towerExcludedCards],addedCards:[...state.towerAddedCards]});\n    render();\n",
    'parallel intensive dispatch',
)

t = replace_once(
    t,
    "    if(towerWorker){towerWorker.terminate();towerWorker=null}\n    towerPendingId=0;state.towerSearchRunning=false;state.towerSearchLabel='';state.towerSearch={error:'Tower cheese search cancelled.'};startTowerWorker();render();\n",
    "    towerSearchToken+=1;if(towerSearchWorkers.length){towerSearchWorkers.forEach(worker=>worker.terminate());towerSearchWorkers=[]}else if(towerWorker){towerWorker.terminate();towerWorker=null}\n    towerPendingId=0;state.towerSearchRunning=false;state.towerSearchLabel='';state.towerSearch={error:'Tower cheese search cancelled.'};if(!towerWorker)startTowerWorker();render();\n",
    'cancel parallel search',
)

p.write_text(t)

# ---------------- regression ----------------
p = Path('scripts/tower-cheese-search-regression.ts')
t = p.read_text()
t = replace_once(
    t,
    "const intensivePlan = towerCheeseIntensivePlan()\n",
    "const customPool = towerCheeseCandidatePool({ excludedCards: ['Parallax'], addedCards: ['Behemoth'] })\nassert.equal(customPool.includes('Parallax'), false, 'Excluded cards must be removed from the cheese search pool')\nassert.equal(customPool.includes('Behemoth'), true, 'User-added cards must be included in the cheese search pool')\nconst intensivePlan = towerCheeseIntensivePlan()\nconst noParallaxPlan = towerCheeseIntensivePlan({ excludedCards: ['Parallax'] })\nassert.ok(noParallaxPlan.orderedTeams < intensivePlan.orderedTeams, 'Excluding a card should shrink the intensive search space')\n",
    'pool regression coverage',
)
p.write_text(t)

print('Faster parallel Tower cheese search and configurable card pool patch applied.')

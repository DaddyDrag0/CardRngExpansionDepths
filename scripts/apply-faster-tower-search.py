from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 anchor, found {count}")
    return text.replace(old, new, 1)

# Engine
p = Path('src/engine/tower.ts')
t = p.read_text()
t = replace_once(t, "export interface TowerCheesePoolOptions {\n  excludedCards?: readonly string[]\n  addedCards?: readonly string[]\n}\n", "export interface TowerCheesePoolOptions {\n  excludedCards?: readonly string[]\n  addedCards?: readonly string[]\n  hasEndTimes?: boolean\n}\n", 'pool option')
t = replace_once(t, "    for (const auraName of CHEESE_AURAS) {\n", "    const quickAuras = poolOptions.hasEndTimes === false ? CHEESE_AURAS.filter((auraName) => auraName !== 'End Times') : CHEESE_AURAS\n    for (const auraName of quickAuras) {\n", 'quick aura ownership')
t = replace_once(t, "function intensiveCheeseAuraVariants(): Array<TeamLoadout['abilityAura']> {\n", "function intensiveCheeseAuraVariants(hasEndTimes = true): Array<TeamLoadout['abilityAura']> {\n", 'intensive aura signature')
t = replace_once(t, "    .filter((aura) => !aura.unobtainable && aura.type === 'Skill')\n", "    .filter((aura) => !aura.unobtainable && aura.type === 'Skill' && (hasEndTimes || aura.name !== 'End Times'))\n", 'intensive End Times filter')
t = replace_once(t, "  const auraVariants = intensiveCheeseAuraVariants()\n", "  const auraVariants = intensiveCheeseAuraVariants(poolOptions.hasEndTimes !== false)\n", 'intensive aura ownership option')
p.write_text(t)

# Worker
p = Path('src/tower-worker.ts')
t = p.read_text()
t = replace_once(t, "  addedCards?: string[]\n  shardIndex?: number\n", "  addedCards?: string[]\n  hasEndTimes?: boolean\n  shardIndex?: number\n", 'worker request option')
t = replace_once(t, "      const poolOptions = { excludedCards: request.excludedCards || [], addedCards: request.addedCards || [] }\n", "      const poolOptions = { excludedCards: request.excludedCards || [], addedCards: request.addedCards || [], hasEndTimes: request.hasEndTimes !== false }\n", 'worker pool options')
p.write_text(t)

# UI
p = Path('index.html')
t = p.read_text()
t = replace_once(t, ".tower-pool-warning{margin-top:7px;color:#6e7d8f;font-size:7px;line-height:1.4}@media(max-width:640px){.tower-pool-suggestions{grid-template-columns:1fr}}\n", ".tower-pool-warning{margin-top:7px;color:#6e7d8f;font-size:7px;line-height:1.4}.tower-pool-options{display:flex;align-items:center;gap:7px;flex-wrap:wrap;justify-content:flex-end}.tower-pool-options>span{color:#87d8ca;font-size:8px;white-space:nowrap}.tower-endtimes-owned{border:1px solid #355e5a;border-radius:999px;background:rgba(135,216,202,.07);color:#c8e8e2;padding:5px 8px;font-size:8px;font-weight:750;cursor:pointer}.tower-endtimes-owned.off{border-color:#493039;background:#160e11;color:#b88a93}.tower-endtimes-owned:hover{filter:brightness(1.12)}@media(max-width:640px){.tower-pool-suggestions{grid-template-columns:1fr}.tower-pool-options{justify-content:flex-start}}\n", 'End Times toggle styles')
t = replace_once(t, "towerSearchMode:'quick',towerExcludedCards:[],towerAddedCards:[],towerPoolQuery:''};\n", "towerSearchMode:'quick',towerExcludedCards:[],towerAddedCards:[],towerPoolQuery:'',towerHasEndTimes:true};\n", 'End Times state')
t = replace_once(t, "<div class=\"tower-pool-head\"><div><b>Search card pool</b><small>Click a default card you do not own to disable it. Add any other card you want the search to try.</small></div><span>${activePool.length} active cards</span></div>", "<div class=\"tower-pool-head\"><div><b>Search card pool</b><small>Click a default card you do not own to disable it. Add any other card you want the search to try.</small></div><div class=\"tower-pool-options\"><span>${activePool.length} active cards</span><button type=\"button\" class=\"tower-endtimes-owned ${state.towerHasEndTimes?'':'off'}\" data-tower-end-times>${state.towerHasEndTimes?'End Times · OWNED':'End Times · NOT OWNED'}</button></div></div>", 'End Times pool toggle UI')
t = replace_once(t, "    const matches=state.auras.filter(a=>!a.unobtainable&&a.type==='Skill'&&(!q||a.name.toLowerCase().includes(q)||(a.skillName||'').toLowerCase().includes(q)));\n", "    const matches=state.auras.filter(a=>!a.unobtainable&&a.type==='Skill'&&(state.towerHasEndTimes||a.name!=='End Times')&&(!q||a.name.toLowerCase().includes(q)||(a.skillName||'').toLowerCase().includes(q)));\n", 'Tower aura autocomplete ownership')
t = replace_once(t, "      const exact=state.auras.find(a=>!a.unobtainable&&a.type==='Skill'&&a.name.toLowerCase()===input.value.trim().toLowerCase());\n", "      const exact=state.auras.find(a=>!a.unobtainable&&a.type==='Skill'&&(state.towerHasEndTimes||a.name!=='End Times')&&a.name.toLowerCase()===input.value.trim().toLowerCase());\n", 'Tower aura exact ownership')
t = replace_once(t, "    root.querySelectorAll('[data-tower-pool-toggle]').forEach(el=>el.addEventListener('click',()=>{const name=el.dataset.towerPoolToggle;if(!name)return;state.towerExcludedCards=state.towerExcludedCards.includes(name)?state.towerExcludedCards.filter(x=>x!==name):[...state.towerExcludedCards,name];state.towerSearch=null;persist();render()}));\n", "    root.querySelectorAll('[data-tower-pool-toggle]').forEach(el=>el.addEventListener('click',()=>{const name=el.dataset.towerPoolToggle;if(!name)return;state.towerExcludedCards=state.towerExcludedCards.includes(name)?state.towerExcludedCards.filter(x=>x!==name):[...state.towerExcludedCards,name];state.towerSearch=null;persist();render()}));\n    root.querySelector('[data-tower-end-times]')?.addEventListener('click',()=>{state.towerHasEndTimes=!state.towerHasEndTimes;if(!state.towerHasEndTimes&&state.towerAbilityAura==='End Times'){state.towerAbilityAura='';state.towerAbilityAuraBorder='';state.towerSim=null}state.towerSearch=null;persist();render()});\n", 'End Times toggle event')
t = replace_once(t, "seed:state.seed,towerExcludedCards:state.towerExcludedCards,towerAddedCards:state.towerAddedCards}))", "seed:state.seed,towerExcludedCards:state.towerExcludedCards,towerAddedCards:state.towerAddedCards,towerHasEndTimes:state.towerHasEndTimes}))", 'persist End Times ownership')
t = replace_once(t, "state.towerAddedCards=Array.isArray(s.towerAddedCards)?[...new Set(s.towerAddedCards.map(String))].filter(name=>{const card=cardByName(name);return Boolean(card&&!card.unobtainable&&!TOWER_DEFAULT_CHEESE_CARDS.includes(name))}):[];}catch(_){}", "state.towerAddedCards=Array.isArray(s.towerAddedCards)?[...new Set(s.towerAddedCards.map(String))].filter(name=>{const card=cardByName(name);return Boolean(card&&!card.unobtainable&&!TOWER_DEFAULT_CHEESE_CARDS.includes(name))}):[];state.towerHasEndTimes=s.towerHasEndTimes!==false;}catch(_){}", 'restore End Times ownership')
t = replace_once(t, "intensive:true,excludedCards:[...state.towerExcludedCards],addedCards:[...state.towerAddedCards],shardIndex,shardCount:workerCount});\n", "intensive:true,excludedCards:[...state.towerExcludedCards],addedCards:[...state.towerAddedCards],hasEndTimes:state.towerHasEndTimes,shardIndex,shardCount:workerCount});\n", 'parallel request ownership')
t = replace_once(t, "intensive:false,excludedCards:[...state.towerExcludedCards],addedCards:[...state.towerAddedCards]});\n", "intensive:false,excludedCards:[...state.towerExcludedCards],addedCards:[...state.towerAddedCards],hasEndTimes:state.towerHasEndTimes});\n", 'quick request ownership')
p.write_text(t)

# Regression
p = Path('scripts/tower-cheese-search-regression.ts')
t = p.read_text()
t = replace_once(t, "assert.ok(intensivePlan.auraVariants > 4, 'Intensive cheese search should test many Ability Aura/border variants')\n", "assert.ok(intensivePlan.auraVariants > 4, 'Intensive cheese search should test many Ability Aura/border variants')\nconst noEndTimesPlan = towerCheeseIntensivePlan({ hasEndTimes: false })\nassert.equal(noEndTimesPlan.auraVariants, intensivePlan.auraVariants - 4, 'Disabling End Times should remove its Base/Platinum/Crystal/Galaxy variants')\n", 'End Times regression')
p.write_text(t)

print('End Times ownership toggle applied.')

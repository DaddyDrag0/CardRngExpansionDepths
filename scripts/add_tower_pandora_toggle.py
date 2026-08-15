from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')

# Add per-slot Tower overrides to state.
old="towerSim:null,towerSimRunning:false,towerSimLabel:''};"
new="towerSim:null,towerSimRunning:false,towerSimLabel:'',towerOverrides:['','','','']};"
if old not in s:
    raise SystemExit('state anchor missing')
s=s.replace(old,new,1)

# Add toggle styling.
css_anchor='    .tower-controls{grid-template-columns:170px 190px minmax(0,1fr)}'
css="    .tower-pandora-toggle{margin-top:8px;width:100%;border:1px solid #39475a;background:#0d141d;color:#9faebe;border-radius:8px;padding:6px 8px;font-size:8px;font-weight:700;cursor:pointer}.tower-pandora-toggle:hover{border-color:#66548b;color:#d3c7ee}.tower-pandora-toggle.on{border-color:#765ca6;background:#181226;color:#e2d5ff}.tower-pandora-toggle:disabled{opacity:.5;cursor:default}\n"
if css_anchor not in s:
    raise SystemExit('css anchor missing')
s=s.replace(css_anchor,css+css_anchor,1)

# Make each result slot use an optional Pandora override and expose a toggle.
old_line="const lineup=result.picks.map((pick,i)=>{const enemy=cardByName(pick.enemy),answer=cardByName(pick.pick);return `<div class=\"tower-pick\"><div class=\"tower-pick-head\">${portrait(enemy)}<span><b>${i+1}. ${esc(pick.enemy)}</b><small>${esc(pick.enemyAbility)}</small></span></div><div class=\"tower-arrow\">USE</div><div class=\"tower-answer\">${portrait(answer)}<span><b>${esc(pick.pick)}</b><small>${answer?esc(answer.ability||'No ability'):''}</small></span></div><div class=\"tower-reason\">${esc(pick.reason)}</div></div>`}).join('');"
new_line="const lineup=result.picks.map((pick,i)=>{const enemy=cardByName(pick.enemy),chosen=state.towerOverrides[i]||pick.pick,answer=cardByName(chosen),canSwap=pick.pick!=='Pandora';return `<div class=\"tower-pick\"><div class=\"tower-pick-head\">${portrait(enemy)}<span><b>${i+1}. ${esc(pick.enemy)}</b><small>${esc(pick.enemyAbility)}</small></span></div><div class=\"tower-arrow\">USE</div><div class=\"tower-answer\">${portrait(answer)}<span><b>${esc(chosen)}</b><small>${answer?esc(answer.ability||'No ability'):''}</small></span></div><div class=\"tower-reason\">${chosen==='Pandora'&&pick.pick!=='Pandora'?`Manual Pandora swap. Original recommendation: ${esc(pick.pick)}.`:esc(pick.reason)}</div>${canSwap?`<button class=\"tower-pandora-toggle ${chosen==='Pandora'?'on':''}\" data-tower-pandora=\"${i}\">${chosen==='Pandora'?`Restore ${esc(pick.pick)}`:'Use Pandora'}</button>`:`<button class=\"tower-pandora-toggle on\" disabled>Pandora recommended</button>`}</div>`}).join('');"
if old_line not in s:
    raise SystemExit('lineup anchor missing')
s=s.replace(old_line,new_line,1)

# Ensure changing floor/enemy/rebuilding clears manual swaps.
s=s.replace("state.towerEnemies=fixed||['','','',''];state.towerResult=null;state.towerSim=null;render()", "state.towerEnemies=fixed||['','','',''];state.towerResult=null;state.towerSim=null;state.towerOverrides=['','','',''];render()",1)
s=s.replace("state.towerEnemies[Number(el.dataset.towerEnemy)]=el.value;state.towerResult=null;state.towerSim=null", "state.towerEnemies[Number(el.dataset.towerEnemy)]=el.value;state.towerResult=null;state.towerSim=null;state.towerOverrides=['','','','']",2)
s=s.replace("state.towerResult=makeTowerCheese(state.towerEnemies);state.towerSim=null;render()", "state.towerResult=makeTowerCheese(state.towerEnemies);state.towerSim=null;state.towerOverrides=['','','',''];render()",1)

# Add per-slot toggle event before the simulation button event.
event_anchor="    root.querySelector('[data-sim-tower]')?.addEventListener('click',runTowerSimulation);"
event_code="    root.querySelectorAll('[data-tower-pandora]').forEach(el=>el.addEventListener('click',()=>{const i=Number(el.dataset.towerPandora),recommended=state.towerResult?.picks?.[i]?.pick||'';if(!recommended||recommended==='Pandora')return;state.towerOverrides[i]=state.towerOverrides[i]==='Pandora'?'':'Pandora';state.towerSim=null;render()}));\n"
if event_anchor not in s:
    raise SystemExit('event anchor missing')
s=s.replace(event_anchor,event_code+event_anchor,1)

# Simulation must use the manually edited lineup.
old_load="return {cards:result.picks.map(p=>({cardName:p.pick,borders:[]})),statAura:null,abilityAura:result.endTimesNeeded?{auraName:'End Times',border:null}:null};"
new_load="return {cards:result.picks.map((p,i)=>({cardName:state.towerOverrides[i]||p.pick,borders:[]})),statAura:null,abilityAura:result.endTimesNeeded?{auraName:'End Times',border:null}:null};"
if old_load not in s:
    raise SystemExit('tower loadout anchor missing')
s=s.replace(old_load,new_load,1)

p.write_text(s,encoding='utf-8')
print('Tower Pandora per-slot toggles added.')

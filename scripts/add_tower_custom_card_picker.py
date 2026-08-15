from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')

css_anchor="    .tower-pandora-toggle{margin-top:8px;width:100%;border:1px solid #39475a;background:#0d141d;color:#9faebe;border-radius:8px;padding:6px 8px;font-size:8px;font-weight:700;cursor:pointer}.tower-pandora-toggle:hover{border-color:#66548b;color:#d3c7ee}.tower-pandora-toggle.on{border-color:#765ca6;background:#181226;color:#e2d5ff}.tower-pandora-toggle:disabled{opacity:.5;cursor:default}\n"
css_add="    .tower-custom-card{margin-top:7px;width:100%;border:1px solid #2a3544;background:#0b1119;color:#aeb9c7;border-radius:8px;padding:7px 8px;font-size:8px;outline:none}.tower-custom-card:focus{border-color:#477b76}.tower-custom-label{display:block;margin:7px 0 4px 1px;color:#66768a;font-size:7px;text-transform:uppercase;letter-spacing:.06em}\n"
if css_anchor not in s:
    raise SystemExit('Pandora CSS anchor missing')
s=s.replace(css_anchor,css_anchor+css_add,1)

old_decl="    const fixed=Boolean(fixedTowerTeam(state.towerFloor)),variants=TOWER_FIXED_VARIANTS[state.towerFloor]||[],names=state.cards.filter(c=>!c.unobtainable).map(c=>c.name).sort((a,b)=>a.localeCompare(b));"
new_decl="    const fixed=Boolean(fixedTowerTeam(state.towerFloor)),variants=TOWER_FIXED_VARIANTS[state.towerFloor]||[],names=state.cards.filter(c=>!c.unobtainable).map(c=>c.name).sort((a,b)=>a.localeCompare(b)),allCardNames=state.cards.map(c=>c.name).sort((a,b)=>a.localeCompare(b));"
if old_decl not in s:
    raise SystemExit('render declaration anchor missing')
s=s.replace(old_decl,new_decl,1)

old_line="      const lineup=result.picks.map((pick,i)=>{const enemy=cardByName(pick.enemy),chosen=state.towerOverrides[i]||pick.pick,answer=cardByName(chosen),canSwap=pick.pick!=='Pandora';return `<div class=\"tower-pick\"><div class=\"tower-pick-head\">${portrait(enemy)}<span><b>${i+1}. ${esc(pick.enemy)}</b><small>${esc(pick.enemyAbility)}</small></span></div><div class=\"tower-arrow\">USE</div><div class=\"tower-answer\">${portrait(answer)}<span><b>${esc(chosen)}</b><small>${answer?esc(answer.ability||'No ability'):''}</small></span></div><div class=\"tower-reason\">${chosen==='Pandora'&&pick.pick!=='Pandora'?`Manual Pandora swap. Original recommendation: ${esc(pick.pick)}.`:esc(pick.reason)}</div>${canSwap?`<button class=\"tower-pandora-toggle ${chosen==='Pandora'?'on':''}\" data-tower-pandora=\"${i}\">${chosen==='Pandora'?`Restore ${esc(pick.pick)}`:'Use Pandora'}</button>`:`<button class=\"tower-pandora-toggle on\" disabled>Pandora recommended</button>`}</div>`}).join('');"
new_line="      const lineup=result.picks.map((pick,i)=>{const override=state.towerOverrides[i]||'',enemy=cardByName(pick.enemy),chosen=override||pick.pick,answer=cardByName(chosen),canSwap=pick.pick!=='Pandora',reason=override?(chosen==='Pandora'&&pick.pick!=='Pandora'?`Manual Pandora swap. Original recommendation: ${esc(pick.pick)}.`:`Manual test swap to ${esc(chosen)}. Original recommendation: ${esc(pick.pick)}.`):esc(pick.reason);return `<div class=\"tower-pick\"><div class=\"tower-pick-head\">${portrait(enemy)}<span><b>${i+1}. ${esc(pick.enemy)}</b><small>${esc(pick.enemyAbility)}</small></span></div><div class=\"tower-arrow\">USE</div><div class=\"tower-answer\">${portrait(answer)}<span><b>${esc(chosen)}</b><small>${answer?esc(answer.ability||'No ability'):''}</small></span></div><div class=\"tower-reason\">${reason}</div>${canSwap?`<button class=\"tower-pandora-toggle ${chosen==='Pandora'?'on':''}\" data-tower-pandora=\"${i}\">${chosen==='Pandora'?`Restore ${esc(pick.pick)}`:'Use Pandora'}</button>`:`<button class=\"tower-pandora-toggle on\" disabled>Pandora recommended</button>`}<span class=\"tower-custom-label\">Try any card</span><select class=\"tower-custom-card\" data-tower-custom=\"${i}\"><option value=\"\">Use recommendation · ${esc(pick.pick)}</option>${allCardNames.map(name=>`<option value=\"${esc(name)}\" ${override===name?'selected':''}>${esc(name)}</option>`).join('')}</select></div>`}).join('');"
if old_line not in s:
    raise SystemExit('Tower lineup anchor missing')
s=s.replace(old_line,new_line,1)

event_anchor="    root.querySelectorAll('[data-tower-pandora]').forEach(el=>el.addEventListener('click',()=>{const i=Number(el.dataset.towerPandora),recommended=state.towerResult?.picks?.[i]?.pick||'';if(!recommended||recommended==='Pandora')return;state.towerOverrides[i]=state.towerOverrides[i]==='Pandora'?'':'Pandora';state.towerSim=null;render()}));\n"
event_add="    root.querySelectorAll('[data-tower-custom]').forEach(el=>el.addEventListener('change',()=>{const i=Number(el.dataset.towerCustom),name=el.value;if(name&&!cardByName(name))return;state.towerOverrides[i]=name;state.towerSim=null;render()}));\n"
if event_anchor not in s:
    raise SystemExit('Pandora event anchor missing')
s=s.replace(event_anchor,event_anchor+event_add,1)

p.write_text(s,encoding='utf-8')
print('Tower custom-card picker added.')

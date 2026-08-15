from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')

old_state="towerOverrides:['','','','']};"
new_state="towerOverrides:['','','',''],towerAbilityAura:'',towerAbilityAuraBorder:''};"
if old_state not in s:
    raise SystemExit('state anchor missing')
s=s.replace(old_state,new_state,1)

css="""
    .tower-aura-picker{margin-top:10px;border:1px solid #2b3747;background:#0a1018;border-radius:12px;padding:11px}.tower-aura-picker.recommended{border-color:#574729;background:#141108}.tower-aura-picker-head{display:flex;align-items:center;gap:9px}.tower-aura-picker-head .mini-portrait{flex:0 0 auto}.tower-aura-picker-head b{display:block;font-size:10px;color:#dce5ee}.tower-aura-picker.recommended .tower-aura-picker-head b{color:#e4c27e}.tower-aura-picker-head small{display:block;color:#738196;font-size:8px;margin-top:3px}.tower-aura-picker.recommended .tower-aura-picker-head small{color:#9c8a68}.tower-aura-picker .tower-custom-label{margin-top:10px}.tower-aura-picker .tower-autocomplete>input{width:100%;box-sizing:border-box;border:1px solid #2a3544;background:#0b1119;color:#c5d0dc;border-radius:9px;padding:9px 10px;font-size:9px;outline:none}.tower-aura-picker .tower-autocomplete>input:focus{border-color:#477b76}.tower-aura-picker .aura-border-pills{margin-top:8px}.tower-aura-description{margin-top:8px;border-top:1px solid #222d3b;padding-top:8px;color:#91a0b1;font-size:8px;line-height:1.5}.tower-aura-description b{display:block;color:#c5d0dc;font-size:9px;margin-bottom:3px}.tower-aura-picker.recommended .tower-aura-description{border-top-color:#40361f}.tower-aura-picker.recommended .tower-aura-description b{color:#e4c27e}
"""
if 'tower-aura-picker{' not in s:
    s=s.replace('  </style>',css+'  </style>',1)

pattern=re.compile(r"      const endAura=auraByName\('End Times'\);\n      resultHtml=`<div class=\"tower-result-top\">.*?;\n    }\n    if\(result&&!result\.error\)\{",re.S)
replacement="""      const selectedTowerAura=auraByName(state.towerAbilityAura),towerAuraBorder=state.towerAbilityAuraBorder||'';
      const towerAuraHtml=`<div class=\"tower-aura-picker ${result.endTimesNeeded?'recommended':''}\"><div class=\"tower-aura-picker-head\">${portrait(selectedTowerAura)}<span><b>Ability Aura${result.endTimesNeeded?' · End Times recommended':''}</b><small>${result.endTimesNeeded?'End Times is recommended for this lineup, but you can test any Ability Aura.':'Optional — choose any Ability Aura to test with this team.'}</small></span></div><span class=\"tower-custom-label\">Choose ability aura</span><div class=\"tower-autocomplete\"><input data-tower-ability-aura value=\"${esc(state.towerAbilityAura)}\" placeholder=\"Search ability aura...\" autocomplete=\"off\"><div class=\"tower-suggestions\" data-tower-suggestions=\"ability-aura\"></div></div>${selectedTowerAura?`<div class=\"aura-border-pills\"><button data-tower-aura-border=\"\" class=\"${!towerAuraBorder?'on':''}\">Base</button>${AURA_BORDERS.map(b=>`<button data-tower-aura-border=\"${b}\" class=\"${towerAuraBorder===b?'on':''}\">${b}</button>`).join('')}</div><div class=\"tower-aura-description\"><b>${esc(selectedTowerAura.skillName||selectedTowerAura.name)}</b>${auraSummary(selectedTowerAura,towerAuraBorder)}</div>`:''}</div>`;
      resultHtml=`<div class=\"tower-result-top\"><h3>Cheese team</h3><div class=\"tower-end-times ${result.endTimesNeeded?'needed':''}\">End Times: <b>${result.endTimesNeeded?'NEEDED':'NOT NEEDED'}</b></div></div><div class=\"tower-lineup\">${lineup}</div>${towerAuraHtml}`;
    }
    if(result&&!result.error){"""
s2,n=pattern.subn(replacement,s,count=1)
if n!=1:
    raise SystemExit(f'aura render block replacement failed: {n}')
s=s2

old_note="<small>${esc(state.towerDifficulty)} Tower · ${full(state.towerRuns)} battles · base cheese cards${result.endTimesNeeded?' + Base End Times aura':''}</small>"
new_note="<small>${esc(state.towerDifficulty)} Tower · ${full(state.towerRuns)} battles · base cheese cards${state.towerAbilityAura?` + ${esc(state.towerAbilityAura)} ${esc(state.towerAbilityAuraBorder||'Base')} aura`:''}</small>"
if old_note not in s:
    raise SystemExit('simulation note anchor missing')
s=s.replace(old_note,new_note,1)

anchor="""  function bindTowerAutocomplete(input,kind,index){
"""
if anchor not in s:
    raise SystemExit('autocomplete anchor missing')
aura_funcs="""  function towerAutocompleteAuras(query){
    const q=String(query||'').trim().toLowerCase();
    const matches=state.auras.filter(a=>!a.unobtainable&&a.type==='Skill'&&(!q||a.name.toLowerCase().includes(q)||(a.skillName||'').toLowerCase().includes(q)));
    matches.sort((a,b)=>{
      const an=a.name.toLowerCase(),bn=b.name.toLowerCase(),as=q&&an.startsWith(q),bs=q&&bn.startsWith(q);
      if(as!==bs)return as?-1:1;
      return a.name.localeCompare(b.name);
    });
    return matches.slice(0,45);
  }
  function bindTowerAuraAutocomplete(input){
    const box=input.parentElement?.querySelector('.tower-suggestions');if(!box)return;
    let active=-1,current=[];
    const paint=()=>{
      current=towerAutocompleteAuras(input.value);
      box.innerHTML=`<button type=\"button\" data-aura-none><b>No Ability Aura</b><small>Simulate without an Ability Aura</small></button>`+(current.length?current.map((a,i)=>`<button type=\"button\" data-aura-index=\"${i}\" class=\"${i===active?'active':''}\"><b>${esc(a.name)}</b><small>${esc(a.skillName||'Ability Aura')}</small></button>`).join(''):'');
      box.classList.add('open');
      box.querySelector('[data-aura-none]')?.addEventListener('mousedown',e=>{e.preventDefault();chooseNone()});
      box.querySelectorAll('[data-aura-index]').forEach(btn=>btn.addEventListener('mousedown',e=>{e.preventDefault();choose(Number(btn.dataset.auraIndex))}));
    };
    const choose=i=>{const aura=current[i];if(!aura)return;state.towerAbilityAura=aura.name;state.towerAbilityAuraBorder='';state.towerSim=null;render()};
    const chooseNone=()=>{state.towerAbilityAura='';state.towerAbilityAuraBorder='';state.towerSim=null;render()};
    input.addEventListener('focus',()=>{active=-1;paint()});
    input.addEventListener('input',()=>{active=-1;if(!input.value){state.towerAbilityAura='';state.towerAbilityAuraBorder='';state.towerSim=null}paint()});
    input.addEventListener('keydown',e=>{
      if(e.key==='ArrowDown'){e.preventDefault();active=Math.min(current.length-1,active+1);paint()}
      else if(e.key==='ArrowUp'){e.preventDefault();active=Math.max(0,active-1);paint()}
      else if(e.key==='Enter'){e.preventDefault();if(current.length)choose(active>=0?active:0);else chooseNone()}
      else if(e.key==='Escape')box.classList.remove('open');
    });
    input.addEventListener('blur',()=>setTimeout(()=>{
      box.classList.remove('open');
      const exact=state.auras.find(a=>!a.unobtainable&&a.type==='Skill'&&a.name.toLowerCase()===input.value.trim().toLowerCase());
      const next=exact?exact.name:'';
      if(state.towerAbilityAura!==next){state.towerAbilityAura=next;state.towerAbilityAuraBorder='';state.towerSim=null;render()}
    },100));
  }
"""
s=s.replace(anchor,aura_funcs+anchor,1)

# Reset aura when enemy/floor changes.
s=s.replace("state.towerResult=null;state.towerSim=null;state.towerOverrides=['','','',''];render()","state.towerResult=null;state.towerSim=null;state.towerOverrides=['','','',''];state.towerAbilityAura='';state.towerAbilityAuraBorder='';render()")
s=s.replace("state.towerEnemies[index]=input.value;state.towerResult=null;state.towerSim=null;state.towerOverrides=['','','','']","state.towerEnemies[index]=input.value;state.towerResult=null;state.towerSim=null;state.towerOverrides=['','','',''];state.towerAbilityAura='';state.towerAbilityAuraBorder=''",1)

old_make="state.towerResult=makeTowerCheese(state.towerEnemies);state.towerSim=null;state.towerOverrides=['','','',''];render()"
new_make="state.towerResult=makeTowerCheese(state.towerEnemies);state.towerSim=null;state.towerOverrides=['','','',''];state.towerAbilityAura=state.towerResult.endTimesNeeded?'End Times':'';state.towerAbilityAuraBorder='';render()"
if old_make not in s:
    raise SystemExit('make team anchor missing')
s=s.replace(old_make,new_make,1)

old_bind="    root.querySelectorAll('[data-tower-custom]').forEach(el=>bindTowerAutocomplete(el,'custom',Number(el.dataset.towerCustom)));\n    root.querySelector('[data-sim-tower]')?.addEventListener('click',runTowerSimulation);"
new_bind="    root.querySelectorAll('[data-tower-custom]').forEach(el=>bindTowerAutocomplete(el,'custom',Number(el.dataset.towerCustom)));\n    root.querySelector('[data-tower-ability-aura]')&&bindTowerAuraAutocomplete(root.querySelector('[data-tower-ability-aura]'));\n    root.querySelectorAll('[data-tower-aura-border]').forEach(el=>el.addEventListener('click',()=>{state.towerAbilityAuraBorder=el.dataset.towerAuraBorder||'';state.towerSim=null;render()}));\n    root.querySelector('[data-sim-tower]')?.addEventListener('click',runTowerSimulation);"
if old_bind not in s:
    raise SystemExit('event bind anchor missing')
s=s.replace(old_bind,new_bind,1)

old_loadout="return {cards:result.picks.map((p,i)=>({cardName:state.towerOverrides[i]||p.pick,borders:[]})),statAura:null,abilityAura:result.endTimesNeeded?{auraName:'End Times',border:null}:null};"
new_loadout="return {cards:result.picks.map((p,i)=>({cardName:state.towerOverrides[i]||p.pick,borders:[]})),statAura:null,abilityAura:state.towerAbilityAura?{auraName:state.towerAbilityAura,border:state.towerAbilityAuraBorder||null}:null};"
if old_loadout not in s:
    raise SystemExit('tower loadout anchor missing')
s=s.replace(old_loadout,new_loadout,1)

p.write_text(s,encoding='utf-8')
print('Added selectable Tower Ability Aura picker and simulation support.')

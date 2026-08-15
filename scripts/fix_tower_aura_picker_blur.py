from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')

old="""    const choose=i=>{const aura=current[i];if(!aura)return;state.towerAbilityAura=aura.name;state.towerAbilityAuraBorder='';state.towerSim=null;render()};
    const chooseNone=()=>{state.towerAbilityAura='';state.towerAbilityAuraBorder='';state.towerSim=null;render()};
"""
new="""    const choose=i=>{const aura=current[i];if(!aura)return;input.value=aura.name;state.towerAbilityAura=aura.name;state.towerAbilityAuraBorder='';state.towerSim=null;render()};
    const chooseNone=()=>{input.value='';state.towerAbilityAura='';state.towerAbilityAuraBorder='';state.towerSim=null;render()};
"""
if old not in s:
    raise SystemExit('choose block missing')
s=s.replace(old,new,1)

old_blur="""    input.addEventListener('blur',()=>setTimeout(()=>{
      box.classList.remove('open');
      const exact=state.auras.find(a=>!a.unobtainable&&a.type==='Skill'&&a.name.toLowerCase()===input.value.trim().toLowerCase());
      const next=exact?exact.name:'';
      if(state.towerAbilityAura!==next){state.towerAbilityAura=next;state.towerAbilityAuraBorder='';state.towerSim=null;render()}
    },100));
"""
new_blur="""    input.addEventListener('blur',()=>setTimeout(()=>{
      if(!input.isConnected)return;
      box.classList.remove('open');
      const exact=state.auras.find(a=>!a.unobtainable&&a.type==='Skill'&&a.name.toLowerCase()===input.value.trim().toLowerCase());
      const next=exact?exact.name:'';
      if(state.towerAbilityAura!==next){state.towerAbilityAura=next;state.towerAbilityAuraBorder='';state.towerSim=null;render()}
    },100));
"""
if old_blur not in s:
    raise SystemExit('blur block missing')
s=s.replace(old_blur,new_blur,1)

p.write_text(s,encoding='utf-8')
print('Fixed Tower Ability Aura picker stale blur reset.')

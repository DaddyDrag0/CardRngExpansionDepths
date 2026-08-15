from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')

if 'tower-suggestions' in s and 'bindTowerAutocomplete' in s:
    print('Tower autocomplete already present.')
    raise SystemExit(0)

css_anchor="    .tower-custom-card{margin-top:7px;width:100%;border:1px solid #2a3544;background:#0b1119;color:#aeb9c7;border-radius:8px;padding:7px 8px;font-size:8px;outline:none}.tower-custom-card:focus{border-color:#477b76}.tower-custom-label{display:block;margin:7px 0 4px 1px;color:#66768a;font-size:7px;text-transform:uppercase;letter-spacing:.06em}\n"
css_new="    .tower-custom-card{width:100%;border:1px solid #2a3544;background:#0b1119;color:#aeb9c7;border-radius:8px;padding:7px 8px;font-size:8px;outline:none}.tower-custom-card:focus{border-color:#477b76}.tower-custom-label{display:block;margin:7px 0 4px 1px;color:#66768a;font-size:7px;text-transform:uppercase;letter-spacing:.06em}.tower-autocomplete{position:relative;width:100%}.tower-autocomplete input{box-sizing:border-box}.tower-suggestions{display:none;position:absolute;z-index:1200;left:0;right:0;top:calc(100% + 5px);max-height:260px;overflow-y:auto;border:1px solid #2a394a;border-radius:10px;background:#0a1018;box-shadow:0 18px 45px rgba(0,0,0,.48);padding:5px}.tower-suggestions.open{display:block}.tower-suggestions button{display:block;width:100%;border:0;border-radius:7px;background:transparent;color:#b7c4d2;padding:8px 9px;text-align:left;font-size:9px;cursor:pointer}.tower-suggestions button:hover,.tower-suggestions button.active{background:#14202d;color:#e4edf5}.tower-suggestions button b{display:block;font-size:9px;color:inherit}.tower-suggestions button small{display:block;margin-top:2px;color:#65758a;font-size:7px}.tower-suggestions::-webkit-scrollbar{width:8px}.tower-suggestions::-webkit-scrollbar-track{background:#0a1018}.tower-suggestions::-webkit-scrollbar-thumb{background:#334154;border-radius:999px;border:2px solid #0a1018}.tower-enemy-field>.tower-autocomplete>input{width:100%;border:1px solid #263142;border-radius:10px;background:#0a0f16;color:#dce5ee;padding:10px 11px;outline:none}.tower-enemy-field>.tower-autocomplete>input:focus{border-color:#477b76}\n"
if css_anchor not in s:
    raise SystemExit('custom card CSS anchor missing')
s=s.replace(css_anchor,css_new,1)

old_preview="<input data-tower-enemy=\"${i}\" list=\"towerCards\" value=\"${esc(name)}\" ${fixed?'readonly':''} placeholder=\"Choose enemy card\">"
new_preview="<div class=\"tower-autocomplete\"><input data-tower-enemy=\"${i}\" value=\"${esc(name)}\" ${fixed?'readonly':''} placeholder=\"Choose enemy card\" autocomplete=\"off\">${fixed?'':`<div class=\"tower-suggestions\" data-tower-suggestions=\"enemy-${i}\"></div>`}</div>"
if old_preview not in s:
    raise SystemExit('enemy input anchor missing')
s=s.replace(old_preview,new_preview,1)

old_custom="<span class=\"tower-custom-label\">Try any card</span><select class=\"tower-custom-card\" data-tower-custom=\"${i}\"><option value=\"\">Use recommendation · ${esc(pick.pick)}</option>${allCardNames.map(name=>`<option value=\"${esc(name)}\" ${override===name?'selected':''}>${esc(name)}</option>`).join('')}</select>"
new_custom="<span class=\"tower-custom-label\">Try any card</span><div class=\"tower-autocomplete\"><input class=\"tower-custom-card\" data-tower-custom=\"${i}\" value=\"${esc(override)}\" placeholder=\"Search any card...\" autocomplete=\"off\"><div class=\"tower-suggestions\" data-tower-suggestions=\"custom-${i}\"></div></div>"
if old_custom not in s:
    raise SystemExit('custom select anchor missing')
s=s.replace(old_custom,new_custom,1)

old_datalist="<datalist id=\"towerCards\">${names.map(name=>`<option value=\"${esc(name)}\"></option>`).join('')}</datalist>"
if old_datalist not in s:
    raise SystemExit('tower datalist anchor missing')
s=s.replace(old_datalist,'',1)

# Insert reusable autocomplete helper before bindTowerEvents.
helper_anchor="  function bindTowerEvents(){\n"
helper=r'''  function towerAutocompleteCards(query,includeUnobtainable=false){
    const q=String(query||'').trim().toLowerCase();
    const pool=state.cards.filter(c=>includeUnobtainable||!c.unobtainable);
    const matches=pool.filter(c=>!q||c.name.toLowerCase().includes(q));
    matches.sort((a,b)=>{
      const an=a.name.toLowerCase(),bn=b.name.toLowerCase(),as=q&&an.startsWith(q),bs=q&&bn.startsWith(q);
      if(as!==bs)return as?-1:1;
      return a.name.localeCompare(b.name);
    });
    return matches.slice(0,45);
  }
  function bindTowerAutocomplete(input,kind,index){
    const box=input.parentElement?.querySelector('.tower-suggestions');
    if(!box||input.readOnly)return;
    let active=-1,current=[];
    const paint=()=>{
      current=towerAutocompleteCards(input.value,kind==='custom');
      box.innerHTML=current.length?current.map((card,i)=>`<button type="button" data-auto-index="${i}" class="${i===active?'active':''}"><b>${esc(card.name)}</b><small>${esc(card.ability||'No ability')}</small></button>`).join(''):'<button type="button" disabled><b>No matching cards</b></button>';
      box.classList.add('open');
      box.querySelectorAll('[data-auto-index]').forEach(btn=>btn.addEventListener('mousedown',e=>{e.preventDefault();choose(Number(btn.dataset.autoIndex))}));
    };
    const choose=i=>{
      const card=current[i];if(!card)return;
      input.value=card.name;
      box.classList.remove('open');
      if(kind==='enemy'){
        state.towerEnemies[index]=card.name;state.towerResult=null;state.towerSim=null;state.towerOverrides=['','','',''];render();
      }else{
        state.towerOverrides[index]=card.name;state.towerSim=null;render();
      }
    };
    input.addEventListener('focus',()=>{active=-1;paint()});
    input.addEventListener('input',()=>{
      active=-1;
      if(kind==='enemy'){state.towerEnemies[index]=input.value;state.towerResult=null;state.towerSim=null;state.towerOverrides=['','','','']}
      else if(!input.value){state.towerOverrides[index]='';state.towerSim=null}
      paint();
    });
    input.addEventListener('keydown',e=>{
      if(e.key==='ArrowDown'){e.preventDefault();active=Math.min(current.length-1,active+1);paint()}
      else if(e.key==='ArrowUp'){e.preventDefault();active=Math.max(0,active-1);paint()}
      else if(e.key==='Enter'){e.preventDefault();if(current.length)choose(active>=0?active:0)}
      else if(e.key==='Escape')box.classList.remove('open');
    });
    input.addEventListener('blur',()=>setTimeout(()=>{
      box.classList.remove('open');
      if(kind==='custom'){
        const exact=state.cards.find(c=>c.name.toLowerCase()===input.value.trim().toLowerCase());
        const next=exact?exact.name:'';
        if(state.towerOverrides[index]!==next){state.towerOverrides[index]=next;state.towerSim=null;render()}
      }
    },100));
  }
'''
if helper_anchor not in s:
    raise SystemExit('bindTowerEvents anchor missing')
s=s.replace(helper_anchor,helper+helper_anchor,1)

# Replace old custom change event with new bindings. Enemy inputs retain state typing but no native list.
old_enemy_events="    root.querySelectorAll('[data-tower-enemy]').forEach(el=>{el.addEventListener('input',()=>{state.towerEnemies[Number(el.dataset.towerEnemy)]=el.value;state.towerResult=null;state.towerSim=null;state.towerOverrides=['','','','']});el.addEventListener('change',()=>{state.towerEnemies[Number(el.dataset.towerEnemy)]=el.value;state.towerResult=null;state.towerSim=null;state.towerOverrides=['','','',''];render()})});\n"
new_enemy_events="    root.querySelectorAll('[data-tower-enemy]').forEach(el=>bindTowerAutocomplete(el,'enemy',Number(el.dataset.towerEnemy)));\n"
if old_enemy_events not in s:
    raise SystemExit('old enemy events anchor missing')
s=s.replace(old_enemy_events,new_enemy_events,1)

old_custom_events="    root.querySelectorAll('[data-tower-custom]').forEach(el=>el.addEventListener('change',()=>{const i=Number(el.dataset.towerCustom),name=el.value;if(name&&!cardByName(name))return;state.towerOverrides[i]=name;state.towerSim=null;render()}));\n"
new_custom_events="    root.querySelectorAll('[data-tower-custom]').forEach(el=>bindTowerAutocomplete(el,'custom',Number(el.dataset.towerCustom)));\n"
if old_custom_events not in s:
    raise SystemExit('old custom events anchor missing')
s=s.replace(old_custom_events,new_custom_events,1)

p.write_text(s,encoding='utf-8')
print('Tower native dropdowns replaced with themed autocomplete.')

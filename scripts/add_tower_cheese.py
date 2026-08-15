from pathlib import Path

path = Path('index.html')
html = path.read_text(encoding='utf-8')

if 'tower-cheese-page' in html:
    print('Tower cheese maker already present.')
    raise SystemExit(0)

css = r'''
    .tower-tab{min-width:105px!important}.tower-cheese-page{display:grid;gap:14px}.tower-cheese-card{border:1px solid var(--line);border-radius:18px;background:linear-gradient(180deg,rgba(17,24,36,.96),rgba(12,17,25,.96));overflow:hidden}.tower-cheese-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;padding:18px 20px;border-bottom:1px solid var(--line)}.tower-cheese-head h2{margin:4px 0 0;font-size:20px}.tower-cheese-head small{color:#708095;font-size:9px}.tower-controls{display:grid;grid-template-columns:180px minmax(0,1fr);gap:12px;padding:14px 16px}.tower-floor{display:block}.tower-floor span,.tower-enemy-field>span{display:block;color:#6f7e90;font-size:8px;text-transform:uppercase;letter-spacing:.08em;margin:0 0 5px 2px}.tower-floor input,.tower-enemy-field input{width:100%;border:1px solid #263142;border-radius:10px;background:#0a0f16;color:#dce5ee;padding:10px 11px;outline:none}.tower-floor input:focus,.tower-enemy-field input:focus{border-color:#477b76}.tower-preset-note{border:1px solid #223040;border-radius:10px;background:#0b1119;padding:10px 12px;color:#8290a1;font-size:10px;line-height:1.5}.tower-preset-note b{color:#c6d1dd}.tower-enemies{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:0 16px 16px}.tower-enemy-field{border:1px solid #202b3a;background:#0a0f16;border-radius:12px;padding:10px}.tower-enemy-preview{display:flex;align-items:center;gap:8px;margin-top:8px;min-height:39px}.tower-enemy-preview .mini-portrait{flex:0 0 auto}.tower-enemy-preview b{display:block;font-size:10px;color:#cbd5df}.tower-enemy-preview small{display:block;color:#667588;font-size:8px;margin-top:2px;line-height:1.35}.tower-fixed-tag{display:inline-block;margin-top:5px;border:1px solid #31504e;border-radius:999px;padding:3px 6px;color:#8fcfc4;font-size:7px}.tower-build-row{display:flex;justify-content:flex-end;padding:0 16px 16px}.tower-make{border:1px solid #477b76;background:#17302d;color:#d6f1ec;border-radius:10px;padding:11px 18px;font-size:11px;font-weight:750;cursor:pointer}.tower-make:hover{background:#1d3a36}.tower-result{padding:15px 16px 18px;border-top:1px solid var(--line)}.tower-result-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.tower-result-top h3{margin:0;font-size:14px}.tower-end-times{border:1px solid #314153;border-radius:999px;padding:6px 9px;font-size:9px;color:#9aabba;background:#0b1119}.tower-end-times.needed{border-color:#6c5530;color:#e4c27e;background:#17130c}.tower-lineup{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.tower-pick{border:1px solid #202b3a;background:#0a0f16;border-radius:12px;padding:10px;min-width:0}.tower-pick-head{display:flex;align-items:center;gap:8px}.tower-pick-head b{display:block;font-size:10px}.tower-pick-head small{display:block;color:#6f7e90;font-size:8px;margin-top:2px}.tower-arrow{color:#536173;font-size:9px;margin:7px 0}.tower-answer{display:flex;align-items:center;gap:8px}.tower-answer b{color:#dbe5ee}.tower-reason{color:#768598;font-size:8px;line-height:1.45;margin-top:7px}.tower-aura-callout{display:flex;align-items:center;gap:9px;margin-top:10px;border:1px solid #574729;background:#141108;border-radius:11px;padding:10px}.tower-aura-callout b{font-size:10px;color:#e4c27e}.tower-aura-callout small{display:block;color:#9c8a68;font-size:8px;margin-top:3px;line-height:1.4}.tower-empty{padding:22px 4px 8px;text-align:center;color:#677589;font-size:10px}.tower-error{border:1px solid #523039;background:#160e11;color:#d7a7b0;border-radius:10px;padding:10px 12px;font-size:10px}
    @media(max-width:980px){.tower-enemies,.tower-lineup{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:640px){.tower-controls{grid-template-columns:1fr}.tower-enemies,.tower-lineup{grid-template-columns:1fr}.tower-cheese-head{align-items:flex-start;flex-direction:column}}
'''
html = html.replace('  </style>', css + '  </style>', 1)

old_state = "  const state={cards:[],auras:[],abilities:{},thumbs:{},teams:Array.from({length:5},blankTeam),activeTeam:0,activeSlot:0,query:'',runs:15,cap:50000,seed:1000,running:false,runningLabel:'',workerReady:false,lastProgressRender:0};"
new_state = "  const state={cards:[],auras:[],abilities:{},thumbs:{},teams:Array.from({length:5},blankTeam),activeTeam:0,activeSlot:0,query:'',runs:15,cap:50000,seed:1000,running:false,runningLabel:'',workerReady:false,lastProgressRender:0,view:'depths',towerFloor:105,towerEnemies:['','','',''],towerResult:null};"
if old_state not in html:
    raise SystemExit('state anchor missing')
html = html.replace(old_state, new_state, 1)

helpers = r'''
  const TOWER_FIXED={
    5:['Good Boy','Good Boy','Good Boy','Shining Armor'],
    10:['Sorcerer','Sorcerer','Trainee','Trainee'],
    15:['Chronus The Hoarder','Greedy Belly','Greedy Belly','Arthur of Excalibur'],
    20:['Demon Hunter','Gunslinger','Stone Scientist','Darling'],
    25:['Black Cat','Black Cat','Black Cat','Black Cat'],
    30:['Crown Prince','Three-Legged Golden Crow','Leviathan','Malik The Sovereign'],
    35:['Ice Queen','Kitsune','A0-ON1','AK4-ON1'],
    40:['Zeus','Arcane Avian','Zeus','Arcane Avian'],
    45:['Frankenstein','Phoenix','Phoenix','Gideon The Insatiable'],
    50:['Admiral Ice','Ice Queen','Hoarfrost Phoenix','Ice Queen'],
    55:['Boreas','Wind Spirit','Wind Spirit','Wind Spirit'],
    60:['Bad Boys','Poseidon','Hades','Lilith The Enchantress'],
    65:['Astraeus','Astraeus','Astraeus','Astraeus'],
    70:['Cronus','Ixion','Cronus','Sciron'],
    75:['Deus Ex','Bad Boys','Bad Boys','Morpheus The Slumberer'],
    80:['Mastermind','Domain Master','Kira','Priest'],
    85:['Savior','Lucifer','Lucifer','Lucifer'],
    90:['Gilgamesh','Ragon','Fafnir','Raze The Destroyer'],
    95:['Shu','Sekhmet','Set','Ra'],
    100:['Shuten-dōji','Susanoo','Tsukuyomi','Amaterasu'],
    105:["Heaven's Armor","Hell's Army",'Judgment Day','Sable The Envious']
  };
  const TOWER_FIXED_VARIANTS={65:['Virgo','Scorpio','Taurus','Gemini']};
  const TOWER_FORCE_END_TIMES=new Set(['Honor','Order of the Cosmos','Unbothered','Nothing','God of Trickery','Hell\'s Curse','Erosion']);
  const TOWER_WEIRD_ABILITIES=new Set(['Revive','Eternity','Frozen Ashes','Flames of Rebirth','Beyond The Grave','Unholy Creature','Undying','Persistent',"Unpaid 'Interns'",'Better Days','Lotus Sutra','Gehenna','Mirror Image',"Pandora's Box",'Mutate','Shared Power','Heroes','Graveyard','Shapeshifter','Dance of Discord','Eternal Voyage']);
  function towerAbilityText(card){return `${card?.ability||''} ${state.abilities[card?.ability]||''}`.toLowerCase()}
  function towerThreat(card,index,enemies){
    const text=towerAbilityText(card),ability=card?.ability||'';
    let forceEndTimes=TOWER_FORCE_END_TIMES.has(ability)||/(cancel all abilities|can't use abilities|cannot use abilities|immune to other cards'? abilities|randomize enemy'?s ability|remove their ability on entry|cannot be killed by abilities)/i.test(text);
    let block=/(dodge attacks|dodge every other attack|dodge first lethal|evade attacks|evade lethal|evade first attack|chance to dodge|block first attack|block the first attack|nullify every other attack|invincible for|cannot take damage|damage can['’]?t exceed|damage cannot exceed|immune to damage from lower rarity|rng abilities always fail|making rng abilities fail|skip opponent['’]?s turn|enemy loses every other turn|survives lethal attack with 1 hp|stunned? on entry|blind target on entry)/i.test(text);
    if(ability==='Unlucky'||ability==='Hex'||ability==='Limitless'||ability==='Danger Sense'||ability==='Final Tail'||ability==='The Loser'||ability==='Divine Barrier'||ability==='Transcend Time'||ability==='Invisibility'||ability==='Blinding Flash'||ability==='Stalwart'||ability==='Shelter Obsession'||ability==='Heavenly Ruler'||ability==='Indestructible')block=true;
    if(Number(state.towerFloor)===65&&index===0)block=true;
    if(index>0&&enemies[index-1]?.ability==='Destiny Sight')block=true;
    if(forceEndTimes)block=true;
    const weird=!block&&(TOWER_WEIRD_ABILITIES.has(ability)||/(revive|must be defeated 3 times|survive for two turns once hp reaches zero|survives lethal attacks twice|survive 1 turn when dead|gain .*random abilit|becomes a different card)/i.test(text));
    return {block,weird,forceEndTimes};
  }
  function makeTowerCheese(enemyNames){
    const enemies=enemyNames.map(cardByName),threats=enemies.map((card,i)=>towerThreat(card,i,enemies));
    const blockers=threats.filter(t=>t.block).length,forced=threats.some(t=>t.forceEndTimes),endTimesNeeded=blockers>=2||forced;
    let parallaxUsed=false;
    const picks=enemies.map((enemy,index)=>{
      const threat=threats[index];let pick='Judgment Day',reason='No one-shot blocker detected, so use JD for the kill.';
      if(threat.weird){pick='Pandora';reason=`${enemy.ability||'This ability'} can survive, revive, change, or otherwise extend past a clean one-shot, so use Pandora as the fallback cheese.`}
      else if(threat.block&&!threat.forceEndTimes&&!parallaxUsed){pick='Parallax';parallaxUsed=true;reason=`${enemy.ability||'This ability'} can stop the direct kill. Use Parallax here; Paradox only covers one blocker.`}
      else if(threat.block){pick='Judgment Day';reason=endTimesNeeded?`${enemy.ability||'This ability'} can stop the direct kill. Parallax is already reserved for one blocker, so End Times is required for this one.`:'This card can stop the direct kill.'}
      return {enemy:enemy.name,enemyAbility:enemy.ability||'No ability',pick,reason,threat};
    });
    return {picks,endTimesNeeded,blockers};
  }
  function fixedTowerTeam(floor){const team=TOWER_FIXED[Number(floor)];return team?[...team]:null}
  function syncTowerPreset(){const fixed=fixedTowerTeam(state.towerFloor);if(fixed)state.towerEnemies=fixed}
  function towerTabs(){return `${state.teams.map((t,i)=>`<button data-tower-back-team="${i}"><span>Team ${i+1}</span><i>${t.result?`Range ${compact(t.result.estimatedFloorLow)}–${compact(t.result.estimatedFloorHigh)}`:complete(t)?'Ready':'Empty'}</i></button>`).join('')}<button class="on tower-tab"><span>Tower</span><i>Cheese maker</i></button>`}
  function renderTower(){
    syncTowerPreset();
    const fixed=Boolean(fixedTowerTeam(state.towerFloor)),variants=TOWER_FIXED_VARIANTS[state.towerFloor]||[],names=state.cards.filter(c=>!c.unobtainable).map(c=>c.name).sort((a,b)=>a.localeCompare(b));
    const previews=state.towerEnemies.map((name,i)=>{const card=cardByName(name);return `<label class="tower-enemy-field"><span>Enemy ${i+1}</span><input data-tower-enemy="${i}" list="towerCards" value="${esc(name)}" ${fixed?'readonly':''} placeholder="Choose enemy card"><div class="tower-enemy-preview">${card?portrait(card):portrait(null)}<div>${card?`<b>${esc(card.name)}</b><small>${esc(card.ability||'No ability')}</small>${variants[i]?`<i class="tower-fixed-tag">${esc(variants[i])}</i>`:''}`:'<b>No card selected</b><small>Choose the enemy for this position.</small>'}</div></div></label>`}).join('');
    const result=state.towerResult;
    let resultHtml='<div class="tower-empty">Choose the floor and enemy lineup, then press Make Team.</div>';
    if(result?.error)resultHtml=`<div class="tower-error">${esc(result.error)}</div>`;
    else if(result){
      const lineup=result.picks.map((pick,i)=>{const enemy=cardByName(pick.enemy),answer=cardByName(pick.pick);return `<div class="tower-pick"><div class="tower-pick-head">${portrait(enemy)}<span><b>${i+1}. ${esc(pick.enemy)}</b><small>${esc(pick.enemyAbility)}</small></span></div><div class="tower-arrow">USE</div><div class="tower-answer">${portrait(answer)}<span><b>${esc(pick.pick)}</b><small>${answer?esc(answer.ability||'No ability'):''}</small></span></div><div class="tower-reason">${esc(pick.reason)}</div></div>`}).join('');
      const endAura=auraByName('End Times');
      resultHtml=`<div class="tower-result-top"><h3>Cheese team</h3><div class="tower-end-times ${result.endTimesNeeded?'needed':''}">End Times: <b>${result.endTimesNeeded?'NEEDED':'NOT NEEDED'}</b></div></div><div class="tower-lineup">${lineup}</div>${result.endTimesNeeded?`<div class="tower-aura-callout">${portrait(endAura)}<span><b>Ability Aura: End Times</b><small>${endAura?esc(endAura.description):'Use End Times so additional dodge/block abilities can fail after Parallax has covered one.'}</small></span></div>`:''}`;
    }
    root.innerHTML=`<main class="shell"><header class="topbar"><div><p class="kicker">CARD RNG EXPANSION</p><h1>Tower Cheese Maker</h1></div></header><div class="team-tabs">${towerTabs()}</div><section class="tower-cheese-page"><article class="tower-cheese-card"><div class="tower-cheese-head"><div><span class="kicker">TOWER</span><h2>Build a cheese team</h2></div><small>Fixed stages auto-load every 5 floors.</small></div><div class="tower-controls"><label class="tower-floor"><span>Floor</span><input id="towerFloor" type="number" min="1" max="105" value="${state.towerFloor}"></label><div class="tower-preset-note">${fixed?`<b>Fixed Stage ${state.towerFloor}</b><br>The four enemy cards are loaded automatically.`:`<b>Stage ${state.towerFloor}</b><br>This is not a fixed stage. Enter the four enemy cards in their battle order.`}</div></div><datalist id="towerCards">${names.map(name=>`<option value="${esc(name)}"></option>`).join('')}</datalist><div class="tower-enemies">${previews}</div><div class="tower-build-row"><button class="tower-make" data-make-tower-team>Make Team</button></div><div class="tower-result">${resultHtml}</div></article></section><footer><span>Card RNG Expansion Tower Cheese Maker</span></footer></main>`;
    bindTowerEvents();bindTooltips();
  }
  function bindTowerEvents(){
    root.querySelectorAll('[data-tower-back-team]').forEach(el=>el.addEventListener('click',()=>{state.view='depths';state.activeTeam=Number(el.dataset.towerBackTeam);state.activeSlot=0;render()}));
    root.querySelector('#towerFloor')?.addEventListener('change',e=>{state.towerFloor=Math.min(105,Math.max(1,Number(e.target.value)||1));const fixed=fixedTowerTeam(state.towerFloor);state.towerEnemies=fixed||['','','',''];state.towerResult=null;render()});
    root.querySelectorAll('[data-tower-enemy]').forEach(el=>{el.addEventListener('input',()=>{state.towerEnemies[Number(el.dataset.towerEnemy)]=el.value;state.towerResult=null});el.addEventListener('change',()=>{state.towerEnemies[Number(el.dataset.towerEnemy)]=el.value;state.towerResult=null;render()})});
    root.querySelector('[data-make-tower-team]')?.addEventListener('click',()=>{const inputs=[...root.querySelectorAll('[data-tower-enemy]')];state.towerEnemies=inputs.map(el=>el.value.trim());const missing=state.towerEnemies.find(name=>!cardByName(name));if(missing!==undefined){state.towerResult={error:missing?`Unknown card: ${missing}. Choose a card from the list.`:'All four enemy cards are required.'};render();return}state.towerResult=makeTowerCheese(state.towerEnemies);render()});
  }
'''
anchor = "  const esc=(v='')=>String(v).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',\"'\":'&#39;','\"':'&quot;'}[c]));"
if anchor not in html:
    raise SystemExit('helper anchor missing')
html = html.replace(anchor, helpers + anchor, 1)

render_anchor = "  function render(){const team=current()"
if render_anchor not in html:
    raise SystemExit('render anchor missing')
html = html.replace(render_anchor, "  function render(){if(state.view==='tower')return renderTower();const team=current()", 1)

normal_tower_anchor = '<button data-duplicate class="tab-action">Duplicate</button>'
if normal_tower_anchor not in html:
    raise SystemExit('team tabs anchor missing')
html = html.replace(normal_tower_anchor, '<button data-tower-tab class="tower-tab"><span>Tower</span><i>Cheese maker</i></button><button data-duplicate class="tab-action">Duplicate</button>', 1)

bind_anchor = '  function bindEvents(){'
if bind_anchor not in html:
    raise SystemExit('bind anchor missing')
html = html.replace(bind_anchor, "  function bindEvents(){root.querySelector('[data-tower-tab]')?.addEventListener('click',()=>{state.view='tower';state.towerResult=null;render()});", 1)

path.write_text(html, encoding='utf-8')
print('Tower cheese maker added.')

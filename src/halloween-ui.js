(()=>{
  'use strict';
  const STORE='crx-halloween-tower-v1';
  const DEFAULT_POOL=['Triceratops','Pterodactylus','Mothman','Julius Leader','Anubis','Serket','Neighbor','Tarantula','Ghost','Crow','Grey Pumpkin','The Faceless','Living Armor','Eerie Tree','Pumpkin King','Scarecrow','Banshee','Witch','Poison Witch','Night Witch','Robin Hood','Kuchisake-onna'];
  const REPORTED=['Vampire Lord','Fuxi','Priest','Pandora','Black Plague','Wendigo','Glamour','Fate Seamstress','Behemoth','Parallax','Sable The Envious','Supreme Ozzy'];
  const UNAVAILABLE_EVENTS=['Santa Claus','Anubis & Hades','Supreme Frank'];
  const REISSUED_EVENTS=['Pestilence','Famine','War','Death'];
  const legacyCard=c=>UNAVAILABLE_EVENTS.includes(c.name)||
    (c.expires&&c.pack!=='Halloween3'&&!REISSUED_EVENTS.includes(c.name));
  const BORDER_MULT={Platinum:100,Crystal:10000,Ruby:100000,Galaxy:1000000};
  const BORDERS=Object.keys(BORDER_MULT);
  const fixedStages={5:['Zombie','Zombie','Zombie','Zombie'],10:['Zombie Nurse','Zombie Nurse','Zombie Nurse','Zombie Nurse'],
  15:['Sleep Paralysis','Michael M.','Knightmare','Zombie','Phantom'],
  20:['Headless Horseman','Witch','Headless Horseman','Witch'],
  25:['Walking Dead','Zombie','The Hanged Man','Dracula'],
  30:['Jason','Frankenstein','The Hanged Man','The Blood Countess','Phantom'],
  35:['Headless Horseman','Dracula','Witch','The Composer'],
  40:['Witch','Banshee','Witch','Banshee'],
  45:['Pestilence','Poison Witch','Zombie Dragon','Walking Dead','Phantom'],
  50:['Walking Dead','Walking Dead','Walking Dead','The Composer'],
  55:['Bloody Mary','Headless Horseman','Zombie Dragon','Flying Dutchman'],
  60:['Pestilence','Famine','Poison Witch','Zombie Dragon','Phantom'],
  65:['Nüwa','Tornado','Wind Spirit','Tornado'],
  70:['Cronus','Parallax','Cronus','Parallax'],
  75:['Pestilence','Famine','War','Zombie Dragon','Phantom'],
  80:['Hecate','Pandora','Set','Chaos','Berserker'],
  85:['Savior','Savior','The Blood Countess','Vampire Lord','Vampire Matron'],
  90:['Pestilence','Famine','War','Death'],
  95:["Hell's Army",'Heavenly Demon',"Heaven's Armor",'Judgment Day','End Times'],
  100:['Surtr','Odin','Thor','Loki'],
  105:['Savior','Bloody Mary','Abomination','Sable The Envious','End Times']};
  const fresh=()=>({floor:15,seed:41,enemies:[...fixedStages[15].slice(0,4)],manual:false,
    slots:['Triceratops','Pterodactylus','Mothman','Julius Leader'].map(cardName=>({cardName,borders:['Platinum','Crystal','Galaxy']})),
    defaultBorders:[],minimumRarity:1e15,poolMode:'all',searchRevision:3,includeLegacy:false,runs:100,extraBans:[],pool:[...DEFAULT_POOL],
    result:null,search:null,probe:null,editingBan:'',editingPool:''});
  let state=fresh(),root=null,all=[],thumbnails={},navigate=null,worker=null,requestId=0,busy='',loadingFloor=null;
  try{const saved=JSON.parse(localStorage.getItem(STORE)||'null');if(saved&&typeof saved==='object'){
    state={...fresh(),...saved,result:null,search:null,probe:null};
    // Previous version assumed every deck owns 3 high-tier borders. The new
    // catalog-wide baseline instead starts from a uniform 1qd stat floor.
    if(state.searchRevision!==2 && state.searchRevision!==3){
      state.poolMode='all';state.defaultBorders=[];state.minimumRarity=1e15;
    }
    state.searchRevision=3;
    state.includeLegacy=state.includeLegacy===true;
    state.poolMode=state.poolMode==='custom'?'custom':'all';
    state.minimumRarity=state.minimumRarity===1?1:1e15;
    if(!Array.isArray(state.slots)||state.slots.length!==4)state.slots=fresh().slots;
    state.slots=state.slots.map(c=>({cardName:String(c.cardName||''),borders:Array.isArray(c.borders)?c.borders.filter(b=>BORDERS.includes(b)):[]}));
    state.extraBans=Array.isArray(state.extraBans)?state.extraBans.filter(x=>typeof x==='string'):[];
    state.pool=Array.isArray(state.pool)?state.pool.filter(x=>typeof x==='string'):[...DEFAULT_POOL];
    state.defaultBorders=Array.isArray(state.defaultBorders)?state.defaultBorders.filter(x=>BORDERS.includes(x)):[...fresh().defaultBorders];
    state.floor=Math.max(1,Math.min(105,Math.floor(Number(state.floor)||15)));
  }}catch(_){}
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const card=name=>all.find(x=>x.name===name);
  const valid=name=>Boolean(card(name));
  const pretty=n=>Math.round(n).toLocaleString('en-US');
  const playerPower=slot=>{
    const c=card(slot.cardName);if(!c)return 0;
    let rarity=Math.max(1,c.rarity||1);for(const b of slot.borders)rarity*=BORDER_MULT[b]||1;
    return Math.ceil(200+10*Math.log10(Math.max(rarity,state.minimumRarity)));
  };
  const banReason=name=>{
    const c=card(name);if(!c)return 'Unknown card';
    if(c.unobtainable)return 'Unobtainable';
    if(c.weather==='Rapture')return 'Rapture (reported banned)';
    if(REPORTED.includes(name))return 'Reported banned';
    if(state.extraBans.includes(name))return 'Custom ban';
    if(UNAVAILABLE_EVENTS.includes(name))return 'Event-exclusive; no current owners reported';
    if(!state.includeLegacy&&legacyCard(c))return 'Old event-exclusive; not known re-released';
    return '';
  };
  const problems=()=>{
    const names=state.slots.map(s=>s.cardName),issues=names.filter(n=>!n||!valid(n)).map(x=>'Unknown or empty slot: '+(x||'empty'));
    for(const name of names){const why=banReason(name);if(why)issues.push(name+': '+why)}
    for(const name of [...new Set(names)]){
      if(names.filter(n=>n===name).length>1)issues.push(name+': duplicate cards are not allowed in Halloween Tower');
    }
    return [...new Set(issues)];
  };
  function save(){
    try{const {result,search,probe,...stored}=state;localStorage.setItem(STORE,JSON.stringify(stored))}catch(_){}
  }
  const art=c=>{
    if(!c)return '<div class="hwt-avatar hwt-missing">?</div>';
    const src=thumbnails[String(c.imageAssetId||'')];
    return src?'<img class="hwt-avatar" src="'+esc(src)+'" alt="">':'<div class="hwt-avatar hwt-missing">'+esc(c.name.slice(0,1))+'</div>';
  };
  function getWorker(){
    if(worker)return worker;
    try{
      const v=window.__CRX_SITE_VERSION||'';
      worker=new Worker('./browser/tower-worker.js'+(v?'?v='+encodeURIComponent(v):''));
      worker.onmessage=event=>{
        const msg=event.data||{};if(msg.id!==requestId)return;
        if(msg.kind==='halloween-progress'){
          busy=(busy.startsWith('Searching')?'Searching':busy.startsWith('Checking')?'Checking floors':'Testing')+' · '+msg.done+'/'+msg.total;
          render();return;
        }
        if(msg.kind==='halloween-stage-result'){
          loadingFloor=null;
          if(msg.ok&&!state.manual){
            state.enemies=msg.result.enemies.slice(0,4);
            state.result=null;state.search=null;save();
          }
          render();return;
        }
        if(msg.kind==='halloween-result'){
          const wasSearch=busy.startsWith('Searching'),wasProbe=busy.startsWith('Checking');
          busy='';
          if(msg.ok){if(wasSearch)state.search=msg.result;else if(wasProbe)state.probe=msg.result;else state.result=msg.result}
          else if(wasSearch)state.search={error:msg.error||'Halloween search failed'};
          else state.result={error:msg.error||'Halloween worker failed'};
          render();
        }
      };
      worker.onerror=event=>{busy='';state.result={error:event.message||'Worker error'};render()};
    }catch(e){state.result={error:'Browser workers are not available: '+String(e)}}
    return worker;
  }
  function previewStage(){
    state.manual=false;
    const request=getWorker();if(!request)return;
    const id=++requestId;loadingFloor=state.floor;
    request.postMessage({kind:'halloween-stage',id,floor:state.floor,seed:state.seed});
  }
  function send(kind){
    if(busy)return;
    if(problems().length&&kind!=='halloween-search'){state.result={error:problems().join(' · ')};render();return}
    if(kind!=='halloween-probe'&&state.enemies.some(x=>!valid(x))){state.result={error:'Select four valid enemy cards'};render();return}
    const w=getWorker();if(!w)return;
    const id=++requestId;busy=kind==='halloween-search'?'Searching · starting':kind==='halloween-probe'?'Checking floors · starting':'Testing · starting';
    const loadout={cards:state.slots.map(c=>({cardName:c.cardName,borders:[...c.borders]}))};
    const args={kind,id,floor:state.floor,enemyNames:[...state.enemies],seed:kind==='halloween-search'?state.seed:((Date.now()>>>0)||1),
      loadout,current:loadout,runs:state.runs,extraBans:[...state.extraBans],
      pool:state.poolMode==='all'?undefined:[...state.pool],borders:[...state.defaultBorders],minimumRarity:state.minimumRarity,includeLegacy:state.includeLegacy};
    if(kind==='halloween-search')state.search=null;else if(kind==='halloween-probe')state.probe=null;else state.result=null;
    w.postMessage(args);render();
  }
  function navigation(){
    return '<nav class="team-tabs hwt-tabs"><button data-hwt-nav="depths"><span>Depths</span><i>5 teams</i></button><button data-hwt-nav="tower"><span>Tower</span><i>Cheese maker</i></button><button class="on tower-tab"><span>Halloween Tower</span><i>Skill-based</i></button></nav>';
  }
  function render(){
    if(!root)return;
    const power=Math.ceil(300+2.5*state.floor),enemies=state.enemies||[],fixed=Boolean(fixedStages[state.floor]);
    const names=all.filter(c=>!c.unobtainable).map(c=>c.name).sort((a,b)=>a.localeCompare(b));
    const refs=names.map(n=>'<option value="'+esc(n)+'"></option>').join('');
    const errors=problems(),isValid=!errors.length;
    const roster=enemies.map((name,i)=>{
      const c=card(name),hp=power*(c?.hpMultiplier||1);
      return '<label class="hwt-field"><span>Enemy '+(i+1)+'</span><div class="hwt-card">'+art(c)+'<div class="hwt-field-copy"><input data-hwt-enemy="'+i+'" list="hwt-enemy-list" value="'+esc(name)+'" '+(fixed?'readonly':'')+'><small>'+esc(c?.ability||'Unknown ability')+'</small><small>'+pretty(hp)+' HP · '+pretty(Math.ceil(power/2))+' ATK</small></div></div></label>';
    }).join('');
    const hasJulius=state.slots.some(s=>s.cardName==='Julius Leader');
    const members=state.slots.map((slot,i)=>{
      const c=card(slot.cardName),bad=banReason(slot.cardName),atk=Math.ceil(playerPower(slot)/2),influence=hasJulius?1.2:1;
      return '<div class="hwt-team-card '+(bad?'hwt-banned':'')+'">'+art(c)+'<div class="hwt-member-data"><span class="hwt-slot">Slot '+(i+1)+'</span><input list="hwt-card-list" data-hwt-slot="'+i+'" value="'+esc(slot.cardName)+'"><small>'+esc(c?.ability||'Choose a card')+'</small><div class="hwt-stat">'+pretty(playerPower(slot)*(c?.hpMultiplier||1))+' modeled HP · '+pretty(atk*influence)+' ATK'+(hasJulius?' (Influence)':'')+'</div>'+(bad?'<small class="hwt-error">'+esc(bad)+'</small>':'')+'<div class="hwt-borders">'+BORDERS.map(b=>'<button data-hwt-border="'+esc(b)+'" data-hwt-index="'+i+'" class="'+(slot.borders.includes(b)?'on':'')+'">'+esc(b)+'</button>').join('')+'</div></div></div>';
    }).join('');
    const globalPool=all.filter(c=>!banReason(c.name)),pool=state.poolMode==='all'?globalPool.map(c=>c.name):state.pool.filter(n=>valid(n)&&!banReason(n));
    const bannedSet=[...new Set([...all.filter(c=>c.weather==='Rapture').map(c=>c.name),...REPORTED,...state.extraBans])];
    const unavailable=all.filter(legacyCard).map(c=>c.name);
    const unavailableCount=unavailable.length;
    const bans=bannedSet.map(n=>'<span class="hwt-ban-tag">'+esc(n)+(state.extraBans.includes(n)?'<button data-hwt-unban="'+esc(n)+'" title="Remove custom ban">×</button>':'')+'</span>').join('');
    const results=state.result?state.result.error?'<div class="hwt-error">'+esc(state.result.error)+'</div>':('<div class="hwt-summary"><div><strong>'+pretty(state.result.wins)+' / '+pretty(state.result.runs)+'</strong><small>Wins</small></div><div><strong>'+(state.result.winRate*100).toFixed(1)+'%</strong><small>Win rate</small></div><div><strong>'+(state.result.progress*100).toFixed(1)+'%</strong><small>Average enemy progress</small></div><div><strong>'+state.result.averageTurns.toFixed(1)+'</strong><small>Turns</small></div></div>'+(state.result.trusted?'':'<p class="hwt-error">Approximate mechanics / unsupported: '+esc((state.result.unsupportedAbilities||[]).join(', '))+'</p>')):'<p class="hwt-muted">Run a sample after building your four-card deck.</p>';
    const probeHtml=Array.isArray(state.probe)?'<div class="hwt-probe-grid">'+state.probe.map(r=>'<div class="hwt-probe-item"><b>Floor '+r.floor+'</b><span>'+r.wins+'/'+r.runs+' wins · '+(r.winRate*100).toFixed(0)+'%</span><small>'+Math.round(r.progress*100)+'% encounter progress'+(r.trusted?'':' · model warning')+'</small></div>').join('')+'</div>':'<p class="hwt-muted">Test sampled floors from 1 to 105 with your current deck. Zero wins does not prove any floor impossible.</p>';
    const search=state.search?.error?'<p class="hwt-error">'+esc(state.search.error)+'</p>':state.search?.recommendations?.length?'<div class="hwt-results">'+state.search.recommendations.map((r,i)=>
      '<div class="hwt-rec"><div><b>#'+(i+1)+' · '+r.loadout.cards.map(c=>esc(c.cardName)).join(' / ')+'</b><small>'+r.wins+'/'+r.runs+' wins · '+(r.winRate*100).toFixed(1)+'%'+(state.search.labels?.[i]?.winInterval?' · 95% CI '+(100*state.search.labels[i].winInterval[0]).toFixed(1)+'–'+(100*state.search.labels[i].winInterval[1]).toFixed(1)+'%':'')+' · '+(r.progress*100).toFixed(1)+'% enemy progress'+(r.trusted?'':' · unverified ability interactions')+'</small></div><button data-hwt-load="'+i+'">Use team</button></div>').join('')+'</div><small class="hwt-muted">'+state.search.tested+' ordered teams evaluated · '+pretty(state.search.battles)+' battles · '+state.search.coveredCards+' eligible cards covered. '+esc(state.search.searchMethod||'Evolutionary combat search')+'. Not guaranteed optimal.</small>':state.search?'<p class="hwt-muted">No recommendations found. Add more eligible cards to the search pool.</p>':'<p class="hwt-muted">The optimizer tests every eligible card, evolves team order and abilities, then independently verifies recommendations.</p>';
    root.innerHTML='<main class="shell hwt-shell"><header class="topbar"><div><p class="kicker">CARD RNG EXPANSION</p><h1>Halloween Tower</h1><p class="hwt-muted">A separate skill-based simulator. Player stats are normalized; enemies scale by stage.</p></div></header>'+navigation()+
    '<div class="hwt-banner"><b>Calibration mode</b> · Default assumption: every player card has at least 1qd effective rarity (~175 base ATK). This is hypothetical, not a verified inventory upgrade. Player ATK formula matches Triceratops, Pterodactylus, Mothman and Julius Leader tests. Player HP, server ban enforcement and some interactions are still provisional. The original Roblox server battle scripts were unavailable.</div>'+
    '<section class="hwt-layout"><article class="panel hwt-panel"><div class="panel-head"><div><span class="kicker">ENCOUNTER</span><h3>Halloween · Stage '+state.floor+'</h3></div></div><div class="hwt-input-row"><label>Stage <input type="number" id="hwt-floor" min="1" max="105" value="'+state.floor+'"></label><label>Sample seed <input type="number" id="hwt-seed" value="'+state.seed+'"></label><button id="hwt-reload">Load '+(fixed?'fixed':'sample')+' enemies</button></div><div class="hwt-encounter-meta"><span>'+pretty(power)+' HP · '+pretty(Math.ceil(power/2))+' ATK (base enemy)</span><span>'+ (fixed?'Source-defined fixed stage':'Generated enemy sample · edit to match Roblox')+'</span><span>Enemy aura: '+esc(fixedStages[state.floor]?.[4]||'None')+' · Soul Guide: active</span></div><div class="hwt-roster">'+roster+'</div><small class="hwt-muted">All Halloween fights include Soul Guide (Resting Place), modeled as suppressing the player’s aura cards. On non-fixed floors, Roblox’s random lineup will differ; enter the four enemies you actually see.</small></article>'+
    '<article class="panel hwt-panel"><div class="panel-head"><div><span class="kicker">PLAYER TEAM</span><h3>Four-card deck</h3></div></div><div class="hwt-members">'+members+'</div><label class="hwt-minimum">Stat assumption <select id="hwt-min-rarity"><option value="1000000000000000" '+(state.minimumRarity===1e15?'selected':'')+'>Every player card ≥ 1qd effective rarity (175 base ATK)</option><option value="1" '+(state.minimumRarity===1?'selected':'')+'>Actual effective rarity only</option></select></label><small class="hwt-muted">Borders can raise rarity above this floor. Skill outcomes matter more than raw stats. <b>No duplicate cards of any kind</b> are permitted in Halloween Tower.</small>'+(errors.length?'<div class="hwt-error">'+errors.map(esc).join(' · ')+'</div>':'')+'<div class="hwt-actions"><label>Runs <select id="hwt-runs">'+[25,100,250,1000,2000].map(n=>'<option value="'+n+'" '+(state.runs===n?'selected':'')+'>'+n+'</option>').join('')+'</select></label><button id="hwt-test" '+(busy||!isValid?'disabled':'')+'>Test this deck</button><button id="hwt-probe" '+(busy||!isValid?'disabled':'')+'>Check floors 1–105</button><button id="hwt-copy">Copy deck</button></div><div class="hwt-results">'+results+'</div><div class="hwt-probe-panel"><b>Floor feasibility · sampled encounters</b>'+probeHtml+'</div></article>'+
    '<article class="panel hwt-panel"><div class="panel-head"><div><span class="kicker">RECOMMENDATIONS</span><h3>Skill-based deck finder</h3></div></div><p class="hwt-muted">Adaptive simulator-based deck search: compares real ability interactions, tests each allowed card, refines promising teams, then rechecks finalists with more random battles. No trained AI model is involved yet.</p><label class="hwt-legacy"><input id="hwt-legacy" type="checkbox" '+(state.includeLegacy?'checked':'')+'> Include historical event cards that may have owners</label><small class="hwt-muted">'+unavailableCount+' event-only cards flagged in the catalog. Santa Claus, Anubis & Hades and Supreme Frank stay excluded because no current owners were reported.</small><div class="hwt-search-modes"><button data-hwt-pool-mode="all" class="'+(state.poolMode==='all'?'on':'')+'">All available cards · '+globalPool.length+'</button><button data-hwt-pool-mode="custom" class="'+(state.poolMode==='custom'?'on':'')+'">Custom shortlist</button></div><div class="hwt-borders"><span class="hwt-muted">Extra border assumption above the 1qd floor:</span>'+BORDERS.map(b=>'<button data-hwt-default-border="'+b+'" class="'+(state.defaultBorders.includes(b)?'on':'')+'">'+b+'</button>').join('')+'</div><div class="hwt-pool" style="display:'+(state.poolMode==='custom'?'flex':'none')+'">'+(state.poolMode==='custom'?pool:[]).map(name=>'<button data-hwt-remove-pool="'+esc(name)+'" title="Remove from search pool">'+esc(name)+' ×</button>').join('')+'</div><div class="hwt-input-row" style="display:'+(state.poolMode==='custom'?'flex':'none')+'"><input id="hwt-pool-add" list="hwt-card-list" placeholder="Add a card you own…" value="'+esc(state.editingPool||'')+'"><button id="hwt-add-pool">Add</button></div><div class="hwt-actions"><button id="hwt-find" '+(busy||!pool.length?'disabled':'')+'>Search '+pool.length+' cards</button>'+(state.search?.labels?.length?'<button id="hwt-labels">Copy estimated training labels</button>':'')'+(busy?'<button id="hwt-cancel">Cancel</button><b class="hwt-muted">'+esc(busy)+'</b>':'')+'</div>'+search+'</article>'+
    '<article class="panel hwt-panel"><div class="panel-head"><div><span class="kicker">RESTRICTIONS</span><h3>Community bans</h3></div></div><p class="hwt-muted">Rapture cards and the listed cards are blocked based on player reports. Fuxi is tentative. These are NOT the recovered server ban rules. Add newly discovered bans here; they are saved in this browser.</p><div class="hwt-bans">'+bans+'</div><div class="hwt-input-row"><input id="hwt-ban-add" list="hwt-card-list" placeholder="Card found banned in-game…" value="'+esc(state.editingBan||'')+'"><button id="hwt-add-ban">Ban card</button></div><small class="hwt-muted">One-copy rule applies to <b>every player card</b>. Other old event exclusives are unavailable by default, but can be included for players who own them. Unconfirmed extra-turn or on-kill cards are not automatically banned.</small></article></section><datalist id="hwt-card-list">'+refs+'</datalist><datalist id="hwt-enemy-list">'+names.map(n=>'<option value="'+esc(n)+'"></option>').join('')+'</datalist><footer><span>Halloween Tower calculator · calibrated model · original Tower unaffected</span></footer></main>';
    bind();
  }
  function bind(){
    root.querySelectorAll('[data-hwt-nav]').forEach(b=>b.addEventListener('click',()=>navigate?.(b.dataset.hwtNav)));
    root.querySelector('#hwt-floor')?.addEventListener('change',e=>{state.floor=Math.max(1,Math.min(105,Math.floor(Number(e.target.value)||1)));state.result=null;state.search=null;state.probe=null;save();previewStage();render()});
    root.querySelector('#hwt-seed')?.addEventListener('change',e=>{state.seed=Math.floor(Number(e.target.value)||1);state.probe=null;save();previewStage();render()});
    root.querySelector('#hwt-reload')?.addEventListener('click',()=>{previewStage();render()});
    root.querySelectorAll('[data-hwt-enemy]').forEach(el=>el.addEventListener('change',()=>{
      const i=Number(el.dataset.hwtEnemy);state.enemies[i]=el.value.trim();state.manual=true;state.result=null;state.search=null;save();render()
    }));
    root.querySelectorAll('[data-hwt-slot]').forEach(el=>el.addEventListener('change',()=>{
      const i=Number(el.dataset.hwtSlot);state.slots[i].cardName=el.value.trim();state.result=null;state.probe=null;save();render()
    }));
    root.querySelectorAll('[data-hwt-border]').forEach(b=>b.addEventListener('click',()=>{
      const slot=state.slots[Number(b.dataset.hwtIndex)],name=b.dataset.hwtBorder;
      slot.borders=slot.borders.includes(name)?slot.borders.filter(x=>x!==name):[...slot.borders,name];state.result=null;state.probe=null;save();render()
    }));
    root.querySelectorAll('[data-hwt-default-border]').forEach(b=>b.addEventListener('click',()=>{
      const name=b.dataset.hwtDefaultBorder;state.defaultBorders=state.defaultBorders.includes(name)?state.defaultBorders.filter(x=>x!==name):[...state.defaultBorders,name];save();render()
    }));
    root.querySelector('#hwt-min-rarity')?.addEventListener('change',e=>{state.minimumRarity=Number(e.target.value)===1?1:1e15;state.result=null;state.search=null;state.probe=null;save();render()});
    root.querySelector('#hwt-legacy')?.addEventListener('change',e=>{state.includeLegacy=e.target.checked;state.search=null;state.result=null;state.probe=null;save();render()});
    root.querySelectorAll('[data-hwt-pool-mode]').forEach(b=>b.addEventListener('click',()=>{state.poolMode=b.dataset.hwtPoolMode==='custom'?'custom':'all';state.search=null;save();render()}));
    root.querySelector('#hwt-runs')?.addEventListener('change',e=>{state.runs=Number(e.target.value)||100;save()});
    root.querySelector('#hwt-test')?.addEventListener('click',()=>send('halloween-sim'));
    root.querySelector('#hwt-find')?.addEventListener('click',()=>send('halloween-search'));
    root.querySelector('#hwt-labels')?.addEventListener('click',()=>{
      const labels=state.search?.labels||[];
      const jsonl=labels.map(row=>JSON.stringify(row)).join('\n');
      if(!jsonl)return;
      if(navigator.clipboard?.writeText)navigator.clipboard.writeText(jsonl).catch(()=>prompt('Copy training labels',jsonl));
      else prompt('Copy training labels',jsonl);
    });
    root.querySelector('#hwt-probe')?.addEventListener('click',()=>send('halloween-probe'));
    root.querySelector('#hwt-copy')?.addEventListener('click',()=>{
      const data=JSON.stringify({floor:state.floor,enemies:state.enemies,cards:state.slots,extraBans:state.extraBans,minimumRarity:state.minimumRarity,includeLegacy:state.includeLegacy});
      if(navigator.clipboard?.writeText)navigator.clipboard.writeText(data).catch(()=>prompt('Copy deck JSON',data));
      else prompt('Copy deck JSON',data)
    });
    root.querySelector('#hwt-cancel')?.addEventListener('click',()=>{
      requestId++;worker?.terminate();worker=null;busy='';render()
    });
    root.querySelector('#hwt-pool-add')?.addEventListener('change',e=>{state.editingPool=e.target.value});
    root.querySelector('#hwt-add-pool')?.addEventListener('click',()=>{
      const name=root.querySelector('#hwt-pool-add')?.value.trim();
      if(valid(name)&&!banReason(name)&&!state.pool.includes(name))state.pool.push(name);
      state.editingPool='';state.search=null;save();render()
    });
    root.querySelectorAll('[data-hwt-remove-pool]').forEach(b=>b.addEventListener('click',()=>{
      state.pool=state.pool.filter(x=>x!==b.dataset.hwtRemovePool);state.search=null;save();render()
    }));
    root.querySelector('#hwt-add-ban')?.addEventListener('click',()=>{
      const name=root.querySelector('#hwt-ban-add')?.value.trim();
      if(valid(name)&&!state.extraBans.includes(name))state.extraBans.push(name);
      state.editingBan='';state.search=null;state.result=null;state.probe=null;save();render()
    });
    root.querySelectorAll('[data-hwt-unban]').forEach(b=>b.addEventListener('click',()=>{
      state.extraBans=state.extraBans.filter(x=>x!==b.dataset.hwtUnban);save();render()
    }));
    root.querySelectorAll('[data-hwt-load]').forEach(b=>b.addEventListener('click',()=>{
      const pick=state.search?.recommendations?.[Number(b.dataset.hwtLoad)];
      if(!pick)return;state.slots=pick.loadout.cards.map(x=>({cardName:x.cardName,borders:[...x.borders]}));state.result=null;state.probe=null;save();render()
    }));
  }
  window.CRXHalloween={render:(el,cards,thumbs,nav)=>{
    root=el;all=cards||[];thumbnails=thumbs||{};navigate=nav;
    if(state.enemies.length!==4)state.enemies=['Zombie','Zombie','Zombie','Zombie'];
    if(!loadingFloor&&(!state.enemies.every(valid)))previewStage();
    render();
  }};
})();

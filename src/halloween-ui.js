(()=>{
  'use strict';
  const STORE='crx-halloween-tower-v1';
  const DEFAULT_POOL=['Triceratops','Pterodactylus','Mothman','Julius Leader','Anubis','Serket','Neighbor','Tarantula','Ghost','Crow','Grey Pumpkin','The Faceless','Living Armor','Eerie Tree','Pumpkin King','Scarecrow','Banshee','Witch','Poison Witch','Night Witch','Robin Hood','Kuchisake-onna'];
  const REPORTED=['Vampire Lord','Fuxi','Priest','Pandora','Black Plague','Wendigo','Glamour','Fate Seamstress','Behemoth','Parallax','Sable The Envious','Supreme Ozzy','Ice King','Chaos','Mrs. Claus'];
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
    slots:['Triceratops','Pterodactylus','Mothman','Julius Leader'].map(cardName=>({cardName,borders:[]})),
    searchRevision:4,runs:256,result:null,search:null});
  let state=fresh(),root=null,all=[],thumbnails={},navigate=null,worker=null,requestId=0,busy='',loadingFloor=null;
  try{const saved=JSON.parse(localStorage.getItem(STORE)||'null');if(saved&&typeof saved==='object'){
    state={...fresh(),...saved,result:null,search:null,probe:null};
    state.searchRevision=4;
    if(!Array.isArray(state.slots)||state.slots.length!==4)state.slots=fresh().slots;
    state.slots=state.slots.map(c=>({cardName:String(c.cardName||''),borders:[]}));
    state.runs=[64,256,1000,2000].includes(Number(state.runs))?Number(state.runs):256;
    state.floor=Math.max(1,Math.min(105,Math.floor(Number(state.floor)||15)));
  }}catch(_){}
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const card=name=>all.find(x=>x.name===name);
  const valid=name=>Boolean(card(name));
  const pretty=n=>Math.round(n).toLocaleString('en-US');
  const banReason=name=>{
    const c=card(name);if(!c)return 'Unknown card';
    if(c.unobtainable)return 'Unavailable card';
    if(c.weather==='Rapture'||REPORTED.includes(name))return 'Banned in Halloween Tower';
    if(c.pack==='Christmas'||UNAVAILABLE_EVENTS.includes(name)||
       (c.expires&&c.pack!=='Halloween3'&&!REISSUED_EVENTS.includes(name)))return 'Unavailable event card';
    return '';
  };
  const problems=()=>{
    const names=state.slots.map(c=>c.cardName),issues=[];
    for(const name of names){const why=banReason(name);if(why)issues.push(name+': '+why)}
    if(new Set(names).size!==4)issues.push('Use four different cards');
    return [...new Set(issues)];
  };
  function save(){
    try{const {result,search,...stored}=state;localStorage.setItem(STORE,JSON.stringify(stored))}catch(_){}
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
          busy=(busy.startsWith('Searching')?'Searching decks':'Testing deck')+' · '+msg.done+'/'+msg.total;
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
    if(kind==='halloween-sim'&&problems().length){
      state.result={error:problems().join(' · ')};render();return;
    }
    if(state.enemies.length!==4||state.enemies.some(name=>!valid(name))){
      state.result={error:'Choose four valid enemy cards first.'};render();return;
    }
    const w=getWorker();if(!w)return;
    const id=++requestId;busy=kind==='halloween-search'?'Searching decks · starting':'Testing deck · starting';
    const loadout={cards:state.slots.map(c=>({cardName:c.cardName,borders:[]}))};
    const args={id,kind,floor:state.floor,enemyNames:[...state.enemies],
      seed:kind==='halloween-search'?state.seed:((Date.now()>>>0)||1),
      loadout,current:loadout,runs:state.runs,extraBans:[],
      borders:[],fixedAttack:160,includeLegacy:false};
    if(kind==='halloween-search')state.search=null;else state.result=null;
    w.postMessage(args);render();
  }
  function navigation(){
    return '<nav class="team-tabs hwt-tabs"><button data-hwt-nav="depths"><span>Depths</span><i>5 teams</i></button><button data-hwt-nav="tower"><span>Tower</span><i>Cheese maker</i></button><button class="on tower-tab"><span>Halloween Tower</span><i>Skill-based</i></button></nav>';
  }
  function render(){
    if(!root)return;
    const floor=state.floor, fixed=!!fixedStages[floor], power=Math.ceil(300+2.5*floor);
    const names=all.map(c=>c.name).sort((a,b)=>a.localeCompare(b));
    const available=all.filter(c=>!banReason(c.name)).sort((a,b)=>a.name.localeCompare(b.name));
    const errors=problems();
    const enemies=state.enemies.map((name,i)=>{
      const c=card(name);
      return '<div class="hwt-card"><span class="hwt-card-number">ENEMY '+(i+1)+'</span>'+art(c)
        +'<div class="hwt-card-body"><input list="hwt-enemy-list" aria-label="Enemy '+(i+1)+'" data-hwt-enemy="'+i+'" value="'+esc(name)+'"'+(fixed?' readonly':'')+'>'
        +'<span class="hwt-ability">'+esc(c?.ability||'Unknown ability')+'</span>'
        +'<span class="hwt-stats">'+pretty(power*(c?.hpMultiplier||1))+' HP <em>·</em> '+pretty(Math.ceil(power/2))+' ATK</span></div></div>';
    }).join('');
    const team=state.slots.map((slot,i)=>{
      const c=card(slot.cardName),bad=banReason(slot.cardName);
      return '<div class="hwt-card'+(bad?' hwt-illegal':'')+'"><span class="hwt-card-number">CARD '+(i+1)+'</span>'+art(c)
        +'<div class="hwt-card-body"><input list="hwt-player-list" aria-label="Player card '+(i+1)+'" data-hwt-slot="'+i+'" value="'+esc(slot.cardName)+'">'
        +'<span class="hwt-ability">'+esc(c?.ability||'Choose a card')+'</span>'
        +'<span class="hwt-stats">'+(bad?esc(bad):'160 base ATK')+'</span></div></div>';
    }).join('');
    const result=state.result?state.result.error?'<div class="hwt-alert">'+esc(state.result.error)+'</div>'
      :'<div class="hwt-metrics"><div><strong>'+(state.result.winRate*100).toFixed(1)+'%</strong><small>Win rate</small></div>'
       +'<div><strong>'+state.result.wins+' / '+state.result.runs+'</strong><small>Wins</small></div>'
       +'<div><strong>'+(state.result.progress*100).toFixed(0)+'%</strong><small>Enemy progress</small></div></div>'
      :'<p class="hwt-hint">Test your team against this stage.</p>';
    const results=state.search?.error?'<div class="hwt-alert">'+esc(state.search.error)+'</div>'
      :state.search?.recommendations?.length?'<div class="hwt-recs">'+state.search.recommendations.map((rec,i)=>{
        const label=state.search.labels?.[i]?.winInterval;
        return '<div class="hwt-rec"><span class="hwt-rank">'+(i+1)+'</span><div class="hwt-rec-body"><strong>'
          +rec.loadout.cards.map(c=>esc(c.cardName)).join(' <span class="hwt-slash">/</span> ')
          +'</strong><small>'+(rec.winRate*100).toFixed(1)+'% win rate <span class="hwt-slash">·</span> '+rec.wins+'/'+rec.runs+' wins'
          +(label?' <span class="hwt-slash">·</span> estimated':'')
          +(rec.trusted?'':' <span class="hwt-warning">· Some abilities unverified</span>')+'</small></div>'
          +'<button data-hwt-load="'+i+'" class="hwt-secondary">Use deck</button></div>';
      }).join('')+'</div>'
      :'<p class="hwt-hint">Find the strongest card combinations for this encounter.</p>';
    root.innerHTML='<main class="hwt-app">'
      +'<header class="hwt-header"><div><span class="hwt-eyebrow">CARD RNG EXPANSION</span><h1>Halloween Tower</h1><p>Find a team that can beat the stage.</p></div><span class="hwt-atk">160 BASE ATK / CARD</span></header>'
      +navigation()
      +'<div class="hwt-grid">'
      +'<section class="hwt-section"><div class="hwt-heading"><div><span>01 · ENCOUNTER</span><h2>Stage '+floor+'</h2></div><div class="hwt-stage-controls"><label for="hwt-floor">Floor<input id="hwt-floor" type="number" min="1" max="105" value="'+floor+'"></label><button id="hwt-reload" class="hwt-secondary">'+(fixed?'Reset':'Reroll enemies')+'</button></div></div>'
      +'<div class="hwt-stage-meta"><span>Enemy '+power+' HP / '+Math.ceil(power/2)+' ATK</span>'+(fixedStages[floor]?.[4]?'<span>'+esc(fixedStages[floor][4])+' aura</span>':'')+'</div>'
      +'<div class="hwt-card-grid">'+enemies+'</div>'
      +'<p class="hwt-hint">'+(fixed?'Fixed boss encounter.':'Random encounter. Edit enemy cards to match your game.')+'</p></section>'
      +'<section class="hwt-section"><div class="hwt-heading"><div><span>02 · TEAM</span><h2>Your four cards</h2></div></div>'
      +'<div class="hwt-card-grid">'+team+'</div>'
      +(errors.length?'<div class="hwt-alert">'+errors.map(esc).join(' · ')+'</div>':'')
      +'<div class="hwt-actions"><label for="hwt-runs">Battles<select id="hwt-runs">'+[64,256,1000,2000].map(n=>'<option value="'+n+'"'+(state.runs===n?' selected':'')+'>'+n+'</option>').join('')+'</select></label><button id="hwt-test" class="hwt-secondary"'+(busy||errors.length?' disabled':'')+'>Test deck</button></div>'
      +result+'</section></div>'
      +'<section class="hwt-section hwt-search"><div class="hwt-search-top"><div><span class="hwt-eyebrow">03 · RECOMMENDATIONS</span><h2>Search Decks</h2><p>Compare every eligible card by its abilities and team order.</p></div><div class="hwt-search-actions"><button id="hwt-find" class="hwt-primary"'+(busy?' disabled':'')+'>Search Decks</button>'+(busy?'<button id="hwt-cancel" class="hwt-secondary">Cancel</button>':'')+'</div></div>'
      +(busy?'<div class="hwt-progress">'+esc(busy)+'</div>':'')
      +results+'</section>'
      +'<p class="hwt-fineprint">Simulation results are estimates. Some Halloween ability and HP mechanics still need in-game verification.</p>'
      +'<datalist id="hwt-player-list">'+available.map(c=>'<option value="'+esc(c.name)+'"></option>').join('')+'</datalist>'
      +'<datalist id="hwt-enemy-list">'+names.map(n=>'<option value="'+esc(n)+'"></option>').join('')+'</datalist></main>';
    bind();
  }
  function bind(){
    root.querySelectorAll('[data-hwt-nav]').forEach(el=>el.addEventListener('click',()=>navigate?.(el.dataset.hwtNav)));
    root.querySelector('#hwt-floor')?.addEventListener('change',e=>{
      state.floor=Math.max(1,Math.min(105,Math.floor(Number(e.target.value)||1)));
      state.result=null;state.search=null;save();previewStage();render();
    });
    root.querySelector('#hwt-reload')?.addEventListener('click',()=>{
      state.seed=(state.seed+1)>>>0;state.result=null;state.search=null;save();previewStage();render();
    });
    root.querySelectorAll('[data-hwt-enemy]').forEach(el=>el.addEventListener('change',()=>{
      state.enemies[Number(el.dataset.hwtEnemy)]=el.value.trim();
      state.manual=true;state.result=null;state.search=null;save();render();
    }));
    root.querySelectorAll('[data-hwt-slot]').forEach(el=>el.addEventListener('change',()=>{
      state.slots[Number(el.dataset.hwtSlot)].cardName=el.value.trim();
      state.result=null;save();render();
    }));
    root.querySelector('#hwt-runs')?.addEventListener('change',e=>{state.runs=Number(e.target.value)||256;save()});
    root.querySelector('#hwt-test')?.addEventListener('click',()=>send('halloween-sim'));
    root.querySelector('#hwt-find')?.addEventListener('click',()=>send('halloween-search'));
    root.querySelector('#hwt-cancel')?.addEventListener('click',()=>{
      requestId++;worker?.terminate();worker=null;busy='';render();
    });
    root.querySelectorAll('[data-hwt-load]').forEach(el=>el.addEventListener('click',()=>{
      const pick=state.search?.recommendations?.[Number(el.dataset.hwtLoad)];
      if(!pick)return;
      state.slots=pick.loadout.cards.map(c=>({cardName:c.cardName,borders:[]}));
      state.result=null;save();render();
      root.querySelector('#hwt-test')?.scrollIntoView({behavior:'smooth',block:'nearest'});
    }));
  }
  window.CRXHalloween={render:(el,cards,thumbs,nav)=>{
    root=el;all=cards||[];thumbnails=thumbs||{};navigate=nav;
    if(state.enemies.length!==4)state.enemies=['Zombie','Zombie','Zombie','Zombie'];
    if(!loadingFloor&&(!state.enemies.every(valid)))previewStage();
    render();
  }};
})();

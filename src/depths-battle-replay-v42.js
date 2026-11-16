/* Depths Battle Replay: deterministic event playback, not a second battle
   simulator. Loaded only after someone selects Watch Replay in Depths. */
const replayScriptUrl = document.currentScript?.src || new URL('./src/depths-battle-replay-v42.js', document.baseURI).href;
let stylesheetLoaded = false;
function ensureStyles() {
  if (stylesheetLoaded || document.querySelector('[data-depth-replay-css]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('./depths-battle-replay.css?v=20261116-r42', replayScriptUrl).href;
  link.dataset.depthReplayCss = '1';
  document.head.appendChild(link);
  stylesheetLoaded = true;
}
const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[c]));
const num = value => {
  if (!Number.isFinite(Number(value))) return '—';
  return Intl.NumberFormat('en-US', {notation:'compact', maximumFractionDigits:2})
    .format(Number(value)).replace(/\s/g,'');
};
const pct = (hp,max) => max > 0 ? Math.max(0, Math.min(100, 100 * hp / max)) : 0;
const clone = obj => JSON.parse(JSON.stringify(obj));
function firstState(debug) {
  const copy = (items,side) => (items || []).map((item,index) => ({
    id: item.id || side + ':' + index + ':' + item.name, team:side,
    name:item.name, ability:item.ability || '', hp:item.hp, maxHp:item.maxHp,
    damage:item.damage, dead:item.hp <= 0
  }));
  return {Allies:copy(debug.initialAllies,'Allies'), Enemies:copy(debug.initialEnemies,'Enemies')};
}
function targetOf(state,event) {
  if(!event || typeof event!=='object')return null;
  const side=event.targetTeam || (event.team === 'Allies'?'Enemies':'Allies');
  const list=state[side] || [];
  return list.find(c=>c.id === event.targetId) ||
    list.find(c=>c.name === event.target && c.hp > 0) ||
    list.find(c=>c.name === event.target) || null;
}
function actorOf(state,event) {
  if(!event || typeof event!=='object')return null;
  const list=state[event.team] || [];
  return list.find(c=>c.id === event.actorId) ||
    list.find(c=>c.name === event.card && c.hp > 0) ||
    list.find(c=>c.name === event.card) || null;
}
function apply(state,event) {
  if (!event) return;
  let actor=actorOf(state,event);
  if (!actor && event.card && (event.type==='spawn'||event.type==='entry')) {
    const list=state[event.team] || [];
    actor={ id:event.actorId || event.team+':spawn:'+list.length+':'+event.card,
      team:event.team,name:event.card,ability:'',hp:Number(event.hp)||0,
      maxHp:Number(event.maxHp)||1,damage:Number(event.damage)||0,dead:false };
    list.push(actor);
  }
  if (event.type === 'attack') {
    const target=targetOf(state,event);
    if(target) {
      if(Number.isFinite(Number(event.targetHpAfter))) target.hp=Number(event.targetHpAfter);
      if(Number.isFinite(Number(event.targetMaxHp))) target.maxHp=Number(event.targetMaxHp);
      target.dead=target.hp<=0;
    }
  }
  if (actor) {
    if (Number.isFinite(Number(event.hp))) actor.hp=Number(event.hp);
    if (Number.isFinite(Number(event.maxHp))) actor.maxHp=Number(event.maxHp);
    if (Number.isFinite(Number(event.damage))) actor.damage=Number(event.damage);
    if(event.type==='death'){actor.hp=0;actor.dead=true}
    if(event.type==='revive'||event.type==='spawn'||event.type==='entry')actor.dead=false;
  }
}
function buildCheckpoints(initial,events) {
  const state=clone(initial),checkpoints=new Map([[0,clone(state)]]);
  for(let i=0;i<events.length;i++) {
    apply(state,events[i]);
    if((i+1)%64===0)checkpoints.set(i+1,clone(state));
  }
  return checkpoints;
}
function frameState(initial,events,checkpoints,index) {
  const point=Math.floor((index+1)/64)*64;
  const state=clone(checkpoints.get(point)||initial);
  for(let i=point;i<=index;i++)apply(state,events[i]);
  return state;
}

/* Detailed replay rows are derived from the recorded combat trace; only the
   ability's rule text comes from the imported game descriptions. */
function abilityForEvent(event, initial, descriptions) {
  if(!event || event.type!=='ability')return null;
  const raw=String(event.detail||'').trim();
  const prefix=raw.match(/^([^:]{1,100}):\s*(.+)$/s);
  const named=prefix&&Object.prototype.hasOwnProperty.call(descriptions,prefix[1].trim())?prefix[1].trim():'';
  const owner=(initial[event.team]||[]).find(c=>c.name===event.card);
  const ability=named||String(event.ability||owner?.ability||'').trim()||'Unknown ability';
  return {
    card:String(event.card||owner?.name||'Unknown card'),
    ability,
    description:String(descriptions[ability]||'').trim(),
    effect:(named?prefix[2].trim():raw)||'The engine recorded an activation but no individual stat change.'
  };
}

function summarizeEvent(event) {
  if(!event)return 'Before battle';
  if(event.type==='turn') return (event.team==='Allies'?'Your':'Enemy') + ' turn: ' + event.card;
  if(event.type==='attack')return event.card+' attacked '+(event.target||'the target')+
    (Number(event.damageDealt)>0?' for '+num(event.damageDealt)+' net HP':' (no HP lost)');
  if(event.type==='entry') return event.card+' entered the battle';
  if(event.type==='death') return event.card+' was defeated';
  if(event.type==='revive')return event.card+' revived';
  if(event.type==='spawn')return event.card+' was summoned';
  return event.card+': '+(event.detail||event.type);
}
function eventKind(event) {
  return event?.type==='attack'?'HIT':event?.type==='ability'?'ABILITY':
    event?.type==='entry'?'ENTRY':event?.type==='death'?'KO':
    event?.type==='revive'?'REVIVE':event?.type==='turn'?'TURN':String(event?.type||'EVENT').toUpperCase();
}
function closestActive(state,side) {
  return (state[side]||[]).find(c=>!c.dead&&c.hp>0)||(state[side]||[])[0]||null;
}
function openBattleReplay({debug,cardImages={},abilityDescriptions={},teamIndex=0,runIndex=0,floor=1,
  onTextLog=null,onClose=()=>{},battleSeed}={}) {
  if(!debug)throw Error('This fight has no trace to replay.');
  ensureStyles();
  const events=Array.isArray(debug.events)?debug.events:[];
  const initial=firstState(debug),checkpoints=buildCheckpoints(initial,events);
  const abilityInfo=event=>abilityForEvent(event,initial,abilityDescriptions);
  const dialog=document.createElement('dialog');dialog.className='rpl-dialog';
  let pos=-1,playing=false,speed=1,timer=null,closed=false,filter='all';
  let lastCardPointer=null,pinnedCard=null;
  function stopTimer(){if(timer!==null)clearTimeout(timer);timer=null}
  function pause(){playing=false;stopTimer();const btn=dialog.querySelector('[data-rpl-play]');if(btn)btn.textContent='▶ Play'}
  const getState=()=>frameState(initial,events,checkpoints,pos);
  function img(card,cls=''){
    const source=cardImages[card?.name]||'';
    return source?'<img class="'+cls+'" loading="lazy" alt="" src="'+esc(source)+'">':
      '<span class="rpl-placeholder">'+esc((card?.name||'?').slice(0,1))+'</span>';
  }
  function cardAttributes(card,side) {
    if(!card)return ' disabled aria-disabled="true"';
    return ' data-rpl-card-side="'+esc(side)+'" data-rpl-card-id="'+esc(card.id)+'"'+
      ' aria-label="'+esc(card.name+' · '+(card.ability||'No recorded ability'))+'"';
  }
  function roster(list,side,current) {
    return '<div class="rpl-roster">'+list.slice(0,5).map((card,i)=>{
      const selected=card.id===current?.id?' chosen':'';
      return '<button type="button" class="rpl-mini'+selected+(card.dead?' dead':'')+'"'+cardAttributes(card,side)+'>'+
        img(card)+'<span>'+esc(card.name)+'</span></button>';
    }).join('')+'</div>';
  }
  function stageCard(card,side,event) {
    const actor=Boolean(card&&(event?.actorId ? card.id===event.actorId :
      event?.card===card.name&&event.team===side));
    const target=Boolean(card&&(event?.targetId?card.id===event.targetId:
      event?.target===card.name&&event?.targetTeam===side));
    const isAttack=event?.type==='attack';
    return '<div class="rpl-champion '+(side==='Allies'?'ally':'enemy')+
      (isAttack&&actor?' attacking':'')+(isAttack&&target?' damaged':'')+
      (event?.type==='entry'&&actor?' entering':'')+'">'+
      '<button type="button" class="rpl-champion-portrait"'+cardAttributes(card,side)+'>'+img(card)+'</button>'+
      '<div class="rpl-champion-name">'+esc(card?.name||'—')+'</div>'+
      '<div class="rpl-champion-ability">'+esc(card?.ability||'')+'</div>'+
      '<div class="rpl-HP-text">'+num(card?.hp)+' / '+num(card?.maxHp)+' HP</div>'+
      '<div class="rpl-HP"><div style="width:'+pct(card?.hp,card?.maxHp)+'%"></div></div>'+
      '<div class="rpl-ATK">'+num(card?.damage)+' ATK</div></div>';
  }
  function eventLog(){
    const visible=[];
    for(let i=0;i<events.length;i++){
      if(filter==='all'||filter==='attacks'&&events[i].type==='attack'||
        filter==='abilities'&&['ability','entry','spawn','revive'].includes(events[i].type))visible.push(i);
    }
    if(!visible.length)return '<div class="rpl-empty">No matching events.</div>';
    let best=visible.findIndex(i=>i>=pos);if(best<0)best=visible.length-1;
    const lo=Math.max(0,best-8),hi=Math.min(visible.length,lo+17);
    return visible.slice(lo,hi).map(i=>{
      const e=events[i],info=abilityInfo(e);
      const heading=info?info.card+' · '+info.ability:'';
      return '<button type="button" data-rpl-event="'+i+'" class="rpl-event '+(info?'rpl-event-ability ':'')+(i===pos?'active':'')+'">'+
       '<span class="rpl-event-tag">'+eventKind(e)+'</span>'+
       '<span class="rpl-event-detail">'+(info?
          '<strong class="rpl-ability-name">'+esc(heading)+'</strong><span class="rpl-recorded-effect">'+esc(info.effect)+'</span>'
          :esc(summarizeEvent(e)))+'</span>'+
       '<small>Turn '+(e.turn||0)+'</small></button>';
    }).join('');
  }
  function inspectorHtml(event){
    const info=abilityInfo(event);if(!info)return '';
    return '<div class="rpl-inspector-heading">'+esc(info.card)+' · '+esc(info.ability)+'</div>'+
      '<div class="rpl-inspector-label">RECORDED EFFECT</div>'+
      '<div class="rpl-inspector-effect">'+esc(info.effect)+'</div>'+
      '<div class="rpl-inspector-label">ABILITY RULE</div>'+
      '<div class="rpl-inspector-rule">'+esc(info.description||'Not specified in imported game data.')+'</div>';
  }
  function hideTooltip(){
    const tip=dialog.querySelector('[data-rpl-tooltip]');if(tip)tip.hidden=true;
  }
  function showCardTooltip(button){
    if(!button?.matches?.('button[data-rpl-card-side][data-rpl-card-id]'))return;
    const side=button.dataset.rplCardSide,id=button.dataset.rplCardId;
    const card=(getState()[side]||[]).find(item=>item.id===id);
    const tip=dialog.querySelector('[data-rpl-tooltip]');
    if(!card||!tip)return;
    const ability=String(card.ability||'').trim();
    const description=ability?String(abilityDescriptions[ability]||'').trim():'';
    tip.innerHTML='<b>'+esc(card.name)+'</b>'+
      '<span class="rpl-tooltip-ability">'+esc(ability||'No recorded ability')+'</span>'+
      '<span>'+esc(description||(ability?'No description in imported game data.':'No ability recorded for this card.'))+'</span>';
    tip.hidden=false;
    const rect=button.getBoundingClientRect();
    const vw=Number(window.innerWidth)||1280,vh=Number(window.innerHeight)||800;
    const bounds=dialog.getBoundingClientRect?.()||{left:0,right:vw,top:0,bottom:vh};
    const width=Math.min(310,vw-24),height=tip.offsetHeight||170;
    const minX=Math.max(8,bounds.left+8),maxX=Math.max(minX,Math.min(vw-width-8,bounds.right-width-8));
    const minY=Math.max(8,bounds.top+8),maxY=Math.max(minY,Math.min(vh-height-8,bounds.bottom-height-8));
    let x=rect.right+12;
    if(x>maxX)x=rect.left-width-12;
    if(x<minX)x=rect.left+((rect.width||0)-width)/2;
    let y=button.classList?.contains?.('rpl-mini')?rect.bottom+10:rect.top;
    if(y>maxY)y=rect.top-height-10;
    tip.style.left=Math.min(maxX,Math.max(minX,x))+'px';
    tip.style.top=Math.min(maxY,Math.max(minY,y))+'px';
  }
  function paint(animate=false) {
    if(closed)return;
    const state=getState(),event=pos>=0&&pos<events.length?(events[pos]||null):null;
    const ally=!event?null:event.team==='Allies'?actorOf(state,event):targetOf(state,event);
    const enemy=!event?null:event.team==='Enemies'?actorOf(state,event):targetOf(state,event);
    const a=ally?.team==='Allies'?ally:closestActive(state,'Allies');
    const b=enemy?.team==='Enemies'?enemy:closestActive(state,'Enemies');
    const stage=dialog.querySelector('[data-rpl-stage]');
    stage.innerHTML='<div class="rpl-battleground">'+
      '<div class="rpl-battleground-column"><h5>YOUR DECK</h5>'+roster(state.Allies,'Allies',a)+stageCard(a,'Allies',event)+'</div>'+
      '<div class="rpl-middle"><span class="rpl-vs">VS</span>'+
      (event?.type==='attack'?'<strong class="rpl-damage">'+(Number(event.damageDealt)>0?'-'+num(event.damageDealt):'NO HP LOSS')+'</strong>':
      event?.type==='ability'?'<strong class="rpl-skill">ABILITY</strong>':'')+'</div>'+
      '<div class="rpl-battleground-column"><h5>ENEMY DECK</h5>'+roster(state.Enemies,'Enemies',b)+stageCard(b,'Enemies',event)+'</div></div>';
    if(animate){
      stage.classList.remove('rpl-motion');void stage.offsetWidth;stage.classList.add('rpl-motion');
    }else stage.classList.remove('rpl-motion');
    dialog.querySelector('[data-rpl-summary]').textContent=summarizeEvent(event);
    dialog.querySelector('[data-rpl-turn]').textContent='Turn '+(event?.turn||0);
    dialog.querySelector('[data-rpl-position]').textContent=(pos+1)+' / '+events.length+' events';
    dialog.querySelector('[data-rpl-range]').value=String(pos+1);
    hideTooltip();
    dialog.querySelector('[data-rpl-events]').innerHTML=eventLog();
    const inspector=dialog.querySelector('[data-rpl-ability-inspector]');
    if(inspector){inspector.hidden=event?.type!=='ability';inspector.innerHTML=inspectorHtml(event)}
    const candidates=Array.from(stage.querySelectorAll?.('button[data-rpl-card-side][data-rpl-card-id]')||[]);
    let hovered=pinnedCard?candidates.find(btn=>btn.dataset.rplCardSide===pinnedCard.side&&btn.dataset.rplCardId===pinnedCard.id):null;
    if(!hovered&&lastCardPointer&&typeof document.elementFromPoint==='function'){
      const found=document.elementFromPoint(lastCardPointer.x,lastCardPointer.y)?.closest?.('button[data-rpl-card-side][data-rpl-card-id]');
      if(found&&(!stage.contains||stage.contains(found)))hovered=found;
    }
    if(hovered)showCardTooltip(hovered);
    dialog.querySelector('[data-rpl-play]').textContent=playing?'Ⅱ Pause':'▶ Play';
    dialog.querySelector('[data-rpl-caption]').textContent=debug.truncated
     ?'Trace was capped at 20,000 events. Replayed data comes from the recorded fight.'
     :'Recorded outcome · no additional combat simulation during playback';
  }
  function seek(next,animate=false){
    pos=Math.max(-1,Math.min(events.length-1,Number(next)||0));
    paint(animate);
  }
  function schedule(){
    if(!playing)return;
    if(pos>=events.length-1){pause();return}
    const current=events[pos+1];
    const length=current?.type==='attack'?650:current?.type==='entry'?520:
      current?.type==='ability'?580:current?.type==='death'?600:280;
    stopTimer();
    timer=setTimeout(()=>{seek(pos+1,true);schedule()},length/speed);
  }
  function play(){
    if(playing){pause();return}
    if(pos>=events.length-1)pos=-1;
    playing=true;paint(false);schedule();
  }
  function cleanup(){
    if(closed)return;closed=true;pause();dialog.remove();onClose();
  }
  dialog.innerHTML='<div class="rpl-frame">'+
    '<header class="rpl-head"><div><small class="rpl-kicker">DEPTHS · BATTLE REPLAY</small>'+
      '<h2>Team '+(teamIndex+1)+' · Run '+(runIndex+1)+'</h2>'+
      '<span>Floor '+esc(floor)+' · '+esc(battleSeed||'seeded battle')+'</span></div>'+
      '<div class="rpl-header-actions">'+(onTextLog?'<button type="button" data-rpl-log>Full event log</button>':'')+
      '<button type="button" data-rpl-close>Close ✕</button></div></header>'+
    '<div class="rpl-content"><div class="rpl-video"><div data-rpl-stage class="rpl-stage"></div>'+
      '<div class="rpl-status"><span data-rpl-turn>Turn 0</span>'+
        '<span data-rpl-summary>Ready to play</span></div></div>'+
      '<aside class="rpl-aside"><header><b>Event timeline</b><small data-rpl-position>0 / 0</small></header>'+
        '<div class="rpl-filters"><button data-rpl-filter="all" class="active">All</button>'+
        '<button data-rpl-filter="attacks">Attacks</button>'+
        '<button data-rpl-filter="abilities">Abilities</button></div>'+
        '<div data-rpl-ability-inspector class="rpl-ability-inspector" hidden></div>'+
        '<div data-rpl-events class="rpl-event-list"></div></aside></div>'+
      '<div data-rpl-tooltip class="rpl-ability-tooltip" role="tooltip" hidden></div>'+
    '<footer class="rpl-controls"><div class="rpl-button-row">'+
      '<button data-rpl-first title="Beginning">|◀</button>'+
      '<button data-rpl-prev title="Previous event">◀</button>'+
      '<button class="rpl-play" data-rpl-play>▶ Play</button>'+
      '<button data-rpl-next title="Next event">▶</button>'+
      '<button data-rpl-last title="End">▶|</button>'+
      '<label>Speed <select data-rpl-speed><option value=".5">0.5×</option>'+
        '<option value="1" selected>1×</option><option value="2">2×</option>'+
        '<option value="4">4×</option></select></label></div>'+
      '<input type="range" data-rpl-range min="0" max="'+events.length+'" value="0" step="1">'+
      '<small data-rpl-caption></small></footer></div>';
  document.body.appendChild(dialog);
  dialog.addEventListener('click',event=>{
    const cardButton=event.target.closest('button[data-rpl-card-side][data-rpl-card-id]');
    if(cardButton){
      pinnedCard={side:cardButton.dataset.rplCardSide,id:cardButton.dataset.rplCardId};
      showCardTooltip(cardButton);return;
    }
    pinnedCard=null;lastCardPointer=null;hideTooltip();
    const button=event.target.closest('button[data-rpl-play],button[data-rpl-first],button[data-rpl-prev],button[data-rpl-next],button[data-rpl-last],button[data-rpl-log],button[data-rpl-close],button[data-rpl-event],button[data-rpl-filter]');
    if(!button)return;
    if(button.hasAttribute('data-rpl-play'))play();
    else if(button.hasAttribute('data-rpl-first')){pause();seek(-1)}
    else if(button.hasAttribute('data-rpl-prev')){pause();seek(pos-1)}
    else if(button.hasAttribute('data-rpl-next')){pause();seek(pos+1,true)}
    else if(button.hasAttribute('data-rpl-last')){pause();seek(events.length-1)}
    else if(button.hasAttribute('data-rpl-log')&&onTextLog){pause();dialog.close();cleanup();onTextLog()}
    else if(button.hasAttribute('data-rpl-close')){dialog.close();cleanup()}
    else if(button.hasAttribute('data-rpl-event')){pause();seek(Number(button.dataset.rplEvent))}
    else if(button.hasAttribute('data-rpl-filter')){
      filter=button.dataset.rplFilter;
      dialog.querySelectorAll('[data-rpl-filter]').forEach(el=>el.classList.toggle('active',el===button));
      paint(false);
    }
  });
  dialog.addEventListener('pointerover',e=>{
    if(e.pointerType==='mouse'||e.pointerType==='pen'){
      const btn=e.target?.closest?.('button[data-rpl-card-side][data-rpl-card-id]');
      if(btn){
        if(Number.isFinite(e.clientX)&&Number.isFinite(e.clientY))
          lastCardPointer={x:e.clientX,y:e.clientY};
        showCardTooltip(btn);
      }
    }
  });
  dialog.addEventListener('pointermove',e=>{
    if(e.pointerType!=='mouse'&&e.pointerType!=='pen')return;
    const btn=e.target?.closest?.('button[data-rpl-card-side][data-rpl-card-id]');
    if(btn&&Number.isFinite(e.clientX)&&Number.isFinite(e.clientY)){
      lastCardPointer={x:e.clientX,y:e.clientY};
    }else if(!btn){lastCardPointer=null;if(!pinnedCard)hideTooltip()}
  });
  dialog.addEventListener('pointerout',e=>{
    if(e.target?.isConnected===false)return; // A replay frame replaced the hovered card.
    if(!e.relatedTarget?.closest?.('button[data-rpl-card-side][data-rpl-card-id]')){
      lastCardPointer=null;if(!pinnedCard)hideTooltip();
    }
  });
  dialog.addEventListener('focusin',e=>showCardTooltip(e.target?.closest?.('button[data-rpl-card-side][data-rpl-card-id]')));
  dialog.addEventListener('focusout',hideTooltip);
  dialog.querySelector('[data-rpl-events]').addEventListener('scroll',hideTooltip);
  dialog.querySelector('[data-rpl-range]').addEventListener('input',e=>{
    pause();seek(Number(e.target.value)-1);
  });
  dialog.querySelector('[data-rpl-speed]').addEventListener('change',e=>{
    speed=Number(e.target.value)||1;if(playing)schedule();
  });
  dialog.addEventListener('cancel',event=>{event.preventDefault();dialog.close();cleanup()});
  paint(false);dialog.showModal();return {close:cleanup,pause,seek};
}

// Load as a classic script: This player uses a classic script for broad hosting compatibility.
window.CRXDepthsReplay = {version:'v42',openBattleReplay};

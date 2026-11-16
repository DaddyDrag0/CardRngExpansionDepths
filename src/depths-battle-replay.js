/* Depths Battle Replay: deterministic event playback, not a second battle
   simulator. Loaded only after someone selects Watch Replay in Depths. */
const replayScriptUrl = document.currentScript?.src || new URL('./src/depths-battle-replay.js', document.baseURI).href;
let stylesheetLoaded = false;
function ensureStyles() {
  if (stylesheetLoaded || document.querySelector('[data-depth-replay-css]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('./depths-battle-replay.css?v=20261116-r2', replayScriptUrl).href;
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
function openBattleReplay({debug,cardImages={},teamIndex=0,runIndex=0,floor=1,
  onTextLog=null,onClose=()=>{},battleSeed}={}) {
  if(!debug)throw Error('This fight has no trace to replay.');
  ensureStyles();
  const events=Array.isArray(debug.events)?debug.events:[];
  const initial=firstState(debug),checkpoints=buildCheckpoints(initial,events);
  const dialog=document.createElement('dialog');dialog.className='rpl-dialog';
  let pos=-1,playing=false,speed=1,timer=null,closed=false,filter='all';
  function stopTimer(){if(timer!==null)clearTimeout(timer);timer=null}
  function pause(){playing=false;stopTimer();const btn=dialog.querySelector('[data-rpl-play]');if(btn)btn.textContent='▶ Play'}
  const getState=()=>frameState(initial,events,checkpoints,pos);
  function img(card,cls=''){
    const source=cardImages[card?.name]||'';
    return source?'<img class="'+cls+'" loading="lazy" alt="" src="'+esc(source)+'">':
      '<span class="rpl-placeholder">'+esc((card?.name||'?').slice(0,1))+'</span>';
  }
  function roster(list,side,current) {
    return '<div class="rpl-roster">'+list.slice(0,5).map((card,i)=>{
      const selected=card.id===current?.id?' chosen':'';
      return '<div class="rpl-mini'+selected+(card.dead?' dead':'')+'" title="'+esc(card.name)+'">'+
        img(card)+'<span>'+esc(card.name)+'</span></div>';
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
      '<div class="rpl-champion-portrait">'+img(card)+'</div>'+
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
        filter==='abilities'&&['ability','entry','spawn','revive'].includes(events[i].type))
        visible.push(i);
    }
    if(!visible.length)return '<div class="rpl-empty">No matching events.</div>';
    let best=visible.findIndex(i=>i>=pos);
    if(best<0)best=visible.length-1;
    const lo=Math.max(0,best-8),hi=Math.min(visible.length,lo+17);
    return visible.slice(lo,hi).map(i=>{
      const e=events[i];
      return '<button type="button" data-rpl-event="'+i+'" class="rpl-event '+(i===pos?'active':'')+'">'+
       '<span class="rpl-event-tag">'+eventKind(e)+'</span>'+
       '<span class="rpl-event-detail">'+esc(summarizeEvent(e))+'</span>'+
       '<small>Turn '+(e.turn||0)+'</small></button>';
    }).join('');
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
    dialog.querySelector('[data-rpl-events]').innerHTML=eventLog();
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
        '<div data-rpl-events class="rpl-event-list"></div></aside></div>'+
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
window.CRXDepthsReplay = {version:'v30',openBattleReplay};

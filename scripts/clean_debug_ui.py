from pathlib import Path
import re

path = Path('index.html')
h = path.read_text(encoding='utf-8')

pattern = re.compile(r"  function showRunDebug\(teamIndex,runIndex\)\{.*?\n  \}\n  function persist\(\)", re.S)
if not pattern.search(h):
    raise SystemExit('showRunDebug function not found')

new_debug = r'''  function showRunDebug(teamIndex,runIndex){
    const run=state.teams[teamIndex]?.result?.runs?.[runIndex],d=run?.debug;if(!run)return;
    const fmt=n=>Number.isFinite(Number(n))?Math.round(Number(n)).toLocaleString('en-US'):'?';
    const compactDbg=n=>Number.isFinite(Number(n))?Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:2}).format(Number(n)).replace(/\s/g,'').toLowerCase():'?';
    const compactText=value=>String(value??'').replace(/-?\b\d{4,}(?:\.\d+)?\b/g,raw=>compactDbg(Number(raw)));
    const side=t=>t==='Allies'?'PLAYER':'ENEMY';
    let showAbilities=true;
    const visibleEvents=()=>d?.events?.filter(e=>showAbilities||e.type!=='ability')||[];
    const parseTurn=e=>{
      const m=String(e.detail||'').match(/^vs (.*?) \| attacker ([\d.-]+)\/([\d.-]+) HP ([\d.-]+) ATK \| defender ([\d.-]+)\/([\d.-]+) HP ([\d.-]+) ATK$/);
      if(!m)return null;
      return {target:m[1],aHp:Number(m[2]),aMax:Number(m[3]),aAtk:Number(m[4]),dHp:Number(m[5]),dMax:Number(m[6]),dAtk:Number(m[7])};
    };
    const hpPct=(hp,max)=>Math.max(0,Math.min(100,max>0?hp/max*100:0));
    const fightCard=(name,hp,max,atk,align='left')=>`<div class="dbg-fighter ${align}"><div class="dbg-fighter-top"><b>${esc(name)}</b><span>${compactDbg(hp)} / ${compactDbg(max)} HP</span></div><div class="dbg-hp"><i style="width:${hpPct(hp,max)}%"></i></div><div class="dbg-fighter-atk">${compactDbg(atk)} ATK</div></div>`;
    const eventLine=e=>{
      if(e.type==='ability')return `<div class="dbg-interaction ability"><span>ABILITY</span><b>${esc(e.card)}</b><p>${esc(compactText(e.detail||''))}</p></div>`;
      if(e.type==='death')return `<div class="dbg-interaction death"><span>DEATH</span><b>${esc(e.card)}</b><p>${esc(compactText(e.detail||'Card defeated'))}</p></div>`;
      if(e.type==='revive')return `<div class="dbg-interaction revive"><span>REVIVE</span><b>${esc(e.card)}</b><p>${esc(compactText(e.detail||''))}</p></div>`;
      if(e.type==='spawn')return `<div class="dbg-interaction spawn"><span>SPAWN</span><b>${esc(e.card)}</b><p>${esc(compactText(e.detail||''))}</p></div>`;
      if(e.type==='stall')return `<div class="dbg-interaction stall"><span>STALL</span><b>${esc(e.card)}</b><p>${esc(compactText(e.detail||''))}</p></div>`;
      return '';
    };
    const buildTimeline=()=>{
      const groups=[];
      for(const e of visibleEvents()){
        let group=groups[groups.length-1];
        if(!group||group.turn!==e.turn){group={turn:e.turn,events:[]};groups.push(group)}
        group.events.push(e);
      }
      return groups.map(group=>{
        const turnEvent=group.events.find(e=>e.type==='turn');
        const parsed=turnEvent?parseTurn(turnEvent):null;
        const extras=group.events.filter(e=>e.type!=='turn').map(eventLine).join('');
        let fight='';
        if(turnEvent&&parsed){
          fight=`<div class="dbg-fight"><div class="dbg-side-label ${turnEvent.team==='Allies'?'player':''}">${side(turnEvent.team)}</div>${fightCard(turnEvent.card,parsed.aHp,parsed.aMax,parsed.aAtk,'left')}<div class="dbg-vs"><span>VS</span><i>→</i></div>${fightCard(parsed.target,parsed.dHp,parsed.dMax,parsed.dAtk,'right')}</div>`;
        }else if(turnEvent){
          fight=`<div class="dbg-fight-simple"><b>${esc(turnEvent.card)}</b><span>${esc(compactText(turnEvent.detail||''))}</span></div>`;
        }
        return `<section class="dbg-turn"><div class="dbg-turn-head"><b>TURN ${group.turn}</b>${turnEvent?`<span>${side(turnEvent.team)} TURN</span>`:''}</div>${fight}${extras?`<div class="dbg-interactions">${extras}</div>`:''}</section>`;
      }).join('')||'<div class="dbg-empty">No battle events captured.</div>';
    };
    const plainText=()=>{
      const lines=[];
      lines.push(`TEAM ${teamIndex+1} · RUN ${runIndex+1} · DEATH FLOOR ${fmt(run.deathFloor)}`);
      let last=null;
      for(const e of visibleEvents()){
        if(e.turn!==last){last=e.turn;lines.push('',`TURN ${e.turn}`)}
        const parsed=e.type==='turn'?parseTurn(e):null;
        if(parsed){
          lines.push(`  ${side(e.team)} · ${e.card} → ${parsed.target}`);
          lines.push(`    ${e.card}: ${compactDbg(parsed.aHp)}/${compactDbg(parsed.aMax)} HP · ${compactDbg(parsed.aAtk)} ATK`);
          lines.push(`    ${parsed.target}: ${compactDbg(parsed.dHp)}/${compactDbg(parsed.dMax)} HP · ${compactDbg(parsed.dAtk)} ATK`);
        }else if(e.type!=='turn'){
          lines.push(`  [${e.type.toUpperCase()}] ${e.card}: ${compactText(e.detail||'')}`);
        }
      }
      return lines.join('\n');
    };
    const dialog=document.createElement('dialog');dialog.className='dbg-dialog';
    dialog.innerHTML=`<style>
      .dbg-dialog{width:min(1050px,96vw);height:min(880px,94vh);padding:0;background:#070c12;color:#d1dae4;border:1px solid #2a394a;border-radius:16px;box-shadow:0 28px 90px rgba(0,0,0,.68)}.dbg-dialog::backdrop{background:rgba(0,0,0,.76)}
      .dbg-shell{height:100%;display:flex;flex-direction:column}.dbg-head{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:13px 16px;border-bottom:1px solid #1e2a38;background:#0a1018}.dbg-head h3{margin:3px 0 0;font-size:17px;color:#edf2f7}.dbg-kicker{font-size:7px;letter-spacing:.12em;color:#70cfc0;font-weight:850}.dbg-sub{margin-top:4px;color:#6e7d8f;font-size:8px}.dbg-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.dbg-actions button{background:#101823;color:#bec9d5;border:1px solid #293849;border-radius:8px;padding:7px 10px;font-size:9px;cursor:pointer}.dbg-actions button.on{border-color:#6a5b9d;color:#ded4ff;background:#171225}.dbg-scroll{overflow:auto;padding:12px 14px 22px}.dbg-empty{border:1px dashed #263444;border-radius:10px;padding:12px;color:#617084;font-size:9px}
      .dbg-turn{border:1px solid #243243;background:#0a1119;border-radius:13px;margin:0 0 10px;overflow:hidden}.dbg-turn-head{display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:#0d1721;border-bottom:1px solid #233243}.dbg-turn-head b{font-size:8px;letter-spacing:.08em;color:#87b9df}.dbg-turn-head span{font-size:7px;color:#5f7185}
      .dbg-fight{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 58px minmax(0,1fr);gap:10px;align-items:center;padding:12px}.dbg-side-label{position:absolute;right:10px;top:7px;font-size:6px;letter-spacing:.1em;color:#756274}.dbg-side-label.player{color:#557687}.dbg-fighter{border:1px solid #243445;background:#0d151e;border-radius:10px;padding:10px}.dbg-fighter-top{display:flex;align-items:baseline;justify-content:space-between;gap:8px}.dbg-fighter-top b{font-size:10px;color:#e0e7ef}.dbg-fighter-top span{font-size:7px;color:#7d8b9a}.dbg-hp{height:5px;background:#151f2a;border-radius:999px;overflow:hidden;margin:8px 0 6px}.dbg-hp i{display:block;height:100%;background:linear-gradient(90deg,#397b69,#65b89e);border-radius:999px}.dbg-fighter.right .dbg-hp i{background:linear-gradient(90deg,#8b4d5a,#c16b77)}.dbg-fighter-atk{font-size:8px;color:#9ba9b8}.dbg-vs{text-align:center;color:#6f8193}.dbg-vs span{display:block;font-size:7px;font-weight:850;letter-spacing:.08em}.dbg-vs i{display:block;font-style:normal;font-size:20px;line-height:1;margin-top:4px}.dbg-fight-simple{padding:10px 12px}.dbg-fight-simple b{display:block;font-size:10px}.dbg-fight-simple span{display:block;margin-top:4px;color:#8291a1;font-size:8px}
      .dbg-interactions{padding:0 12px 12px;display:grid;gap:6px}.dbg-interaction{display:grid;grid-template-columns:58px 150px minmax(0,1fr);align-items:center;gap:8px;border:1px solid #2d2840;border-left:3px solid #775da8;background:#100d17;border-radius:9px;padding:7px 9px}.dbg-interaction>span{font-size:6px;font-weight:900;letter-spacing:.1em;color:#9d87ca}.dbg-interaction>b{font-size:9px;color:#ddd5ef}.dbg-interaction>p{margin:0;color:#a99fba;font-size:8px;line-height:1.35}.dbg-interaction.death{border-color:#44262d;border-left-color:#965968;background:#130d10}.dbg-interaction.death>span{color:#c67988}.dbg-interaction.revive{border-color:#254136;border-left-color:#5a9a80;background:#0c1512}.dbg-interaction.revive>span{color:#79b79c}.dbg-interaction.spawn{border-color:#274047;border-left-color:#518a97;background:#0c1417}.dbg-interaction.stall{border-color:#4a3c25;border-left-color:#a48143;background:#151108}
      @media(max-width:720px){.dbg-head{align-items:flex-start;flex-direction:column}.dbg-actions{justify-content:flex-start}.dbg-fight{grid-template-columns:1fr}.dbg-vs{display:none}.dbg-interaction{grid-template-columns:55px 1fr}.dbg-interaction>p{grid-column:1/-1}.dbg-fighter-top{align-items:flex-start;flex-direction:column}}
    </style><div class="dbg-shell"><div class="dbg-head"><div><span class="dbg-kicker">BATTLE DEBUG</span><h3>Team ${teamIndex+1} · Run ${runIndex+1}</h3><div class="dbg-sub">Death floor ${fmt(run.deathFloor)}</div></div><div class="dbg-actions"><button data-dbg-abilities class="on">Ability interactions: ON</button><button data-dbg-copy>Copy debug</button><button data-dbg-close>Close</button></div></div><div class="dbg-scroll"><div data-dbg-timeline></div></div></div>`;
    document.body.appendChild(dialog);
    const timeline=dialog.querySelector('[data-dbg-timeline]'),toggle=dialog.querySelector('[data-dbg-abilities]'),copy=dialog.querySelector('[data-dbg-copy]'),close=dialog.querySelector('[data-dbg-close]');
    const repaint=()=>{toggle.textContent=`Ability interactions: ${showAbilities?'ON':'OFF'}`;toggle.classList.toggle('on',showAbilities);timeline.innerHTML=buildTimeline()};
    repaint();dialog.showModal();
    toggle.addEventListener('click',()=>{showAbilities=!showAbilities;repaint()});
    copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(plainText());copy.textContent='Copied!';setTimeout(()=>{if(copy.isConnected)copy.textContent='Copy debug'},900)}catch(_){}});
    close.addEventListener('click',()=>{dialog.close();dialog.remove()});
    dialog.addEventListener('cancel',()=>dialog.remove());
  }
  function persist()'''

h = pattern.sub(lambda m: new_debug, h, count=1)
path.write_text(h, encoding='utf-8')
print('Debug UI cleaned up.')

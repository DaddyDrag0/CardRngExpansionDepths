from pathlib import Path
import re

battle = Path('src/engine/battle-v2.ts')
s = battle.read_text(encoding='utf-8')

# Shared ability debug helper.
anchor = """function pushDebugEvent(runtime: Runtime, event: BattleDebug['events'][number]) {
  if (!runtime.captureDebug) return
  if (runtime.debug.events.length >= 300) runtime.debug.events.shift()
  runtime.debug.events.push(event)
}
"""
insert = anchor + """
function pushAbilityDebug(runtime: Runtime, card: CombatCard, detail: string) {
  pushDebugEvent(runtime, {
    turn: runtime.state.turn,
    type: 'ability',
    team: card.team,
    card: effectiveCardName(card) || card.definition.name,
    detail,
    hp: card.hp,
    maxHp: card.maxHp,
    damage: card.damage,
  })
}
"""
if 'function pushAbilityDebug' not in s:
    if anchor not in s:
        raise SystemExit('pushDebugEvent anchor missing')
    s = s.replace(anchor, insert, 1)

# End Times explicit debug when it actually causes a failure.
old = """  const enemy = runtime.state.boosts[OTHER_TEAM[card.team]]
  if (enemy.endTimes && runtime.rng.next() < enemy.endTimes / 100) return false
  return true
"""
new = """  const enemy = runtime.state.boosts[OTHER_TEAM[card.team]]
  if (enemy.endTimes && runtime.rng.next() < enemy.endTimes / 100) {
    pushAbilityDebug(runtime, card, `End Times made ${name} fail.`)
    return false
  }
  return true
"""
if old in s:
    s = s.replace(old, new, 1)
elif 'End Times made ${name} fail.' not in s:
    raise SystemExit('End Times anchor missing')

# Order of the Cosmos and Hell's Curse interaction messages.
old = """    case 'Order of the Cosmos':
      // OG server source stores this as a team-wide NoAbilities counter.
      // It lasts for three turns TAKEN by the affected team, not three turns per card.
      runtime.state.boosts[enemyTeam].noAbilities = 3
      break
"""
new = """    case 'Order of the Cosmos':
      // OG server source stores this as a team-wide NoAbilities counter.
      // It lasts for three turns TAKEN by the affected team, not three turns per card.
      runtime.state.boosts[enemyTeam].noAbilities = 3
      pushAbilityDebug(runtime, card, `Order of the Cosmos disabled ${enemyTeam === 'Enemies' ? 'enemy' : 'player'} abilities for their next 3 turns.`)
      break
"""
if old in s:
    s = s.replace(old, new, 1)
elif 'Order of the Cosmos disabled' not in s:
    raise SystemExit('Order of the Cosmos anchor missing')

old = """    case \"Hell's Curse\":
      enemy.flags.sealed = true
      enemy.hp /= 2
      break
"""
new = """    case \"Hell's Curse\":
      enemy.flags.sealed = true
      enemy.hp /= 2
      pushAbilityDebug(runtime, card, `Hell's Curse sealed ${effectiveCardName(enemy) || enemy.definition.name} and cut its current HP in half.`)
      break
"""
if old in s:
    s = s.replace(old, new, 1)
elif "Hell's Curse sealed" not in s:
    raise SystemExit("Hell's Curse anchor missing")

# Armageddon success/fail detail.
old = """    case 'Armageddon': if (rand(runtime, attacker.team) > 0.5) damage = Number.POSITIVE_INFINITY; break
"""
new = """    case 'Armageddon': {
      const success = rand(runtime, attacker.team) > 0.5
      if (success) damage = Number.POSITIVE_INFINITY
      pushAbilityDebug(runtime, attacker, `Armageddon ${success ? 'succeeded — this hit became lethal' : 'failed — normal attack damage only'}.`)
      break
    }
"""
if old in s:
    s = s.replace(old, new, 1)
elif 'Armageddon ${success' not in s:
    raise SystemExit('Armageddon anchor missing')

# Limitless first evade detail.
old = """    case 'Limitless':
      if (!target.flags.limitless) { damage = 0; target.flags.limitless = true }
      break
"""
new = """    case 'Limitless':
      if (!target.flags.limitless) {
        damage = 0
        target.flags.limitless = true
        pushAbilityDebug(runtime, target, `Limitless evaded the first attack from ${effectiveCardName(attacker) || attacker.definition.name}.`)
      }
      break
"""
if old in s:
    s = s.replace(old, new, 1)
elif 'Limitless evaded the first attack' not in s:
    raise SystemExit('Limitless anchor missing')

# Revive path: explain successful revives and blocked revive abilities.
pattern = re.compile(r"function tryRevive\(runtime: Runtime, attacker: CombatCard, target: CombatCard\): boolean \{.*?\n\}\n\nfunction targetRetro", re.S)
match = pattern.search(s)
if not match:
    raise SystemExit('tryRevive function missing')
if 'Unpaid Interns activated' not in match.group(0):
    replacement = """function tryRevive(runtime: Runtime, attacker: CombatCard, target: CombatCard): boolean {
  if (target.hp > 0) return false
  if (activeBonusAbilities(target).length) {
    for (const gained of activeBonusAbilities(target)) {
      const revived = withAbility(target, gained, () => tryRevive(runtime, attacker, target))
      if (revived) return true
    }
    return false
  }
  const name = resolvedAbility(runtime, target)
  // Revive-style abilities are still abilities. Respect Fuxi's Order of the Cosmos,
  // Hell's Curse/Eclipse seals, Honor, End Times, and any other ability-disable path.
  if (!name) return false
  if (!hasAbility(runtime, target, name)) {
    if (['Revive', 'Eternity', 'Frozen Ashes', \"Unpaid 'Interns'\", 'Flames of Rebirth'].includes(name)) {
      pushAbilityDebug(runtime, target, `${name} could not activate because the ability was blocked or disabled.`)
    }
    return false
  }
  if (name === 'Revive' && !target.flags.revived && rand(runtime, target.team) > 0.5) {
    target.flags.revived = true
    target.hp = target.maxHp * 0.5
    pushAbilityDebug(runtime, target, 'Revive succeeded — returned at 50% HP.')
    return true
  }
  if (name === 'Eternity' && !target.flags.revived && rand(runtime, target.team) > 0.5) {
    target.flags.revived = true
    target.hp = target.maxHp
    pushAbilityDebug(runtime, target, 'Eternity succeeded — returned at full HP.')
    return true
  }
  if (name === 'Frozen Ashes' && !target.flags.revived && rand(runtime, target.team) > 0.5) {
    target.flags.revived = true
    target.hp = target.maxHp
    attacker.status.stunned = Math.max(1, attacker.status.stunned)
    pushAbilityDebug(runtime, target, `Frozen Ashes revived at full HP and froze ${effectiveCardName(attacker) || attacker.definition.name}.`)
    return true
  }
  if (name === \"Unpaid 'Interns'\" && (target.counters.interns || 0) < 2) {
    target.counters.interns = (target.counters.interns || 0) + 1
    target.hp = target.maxHp
    pushAbilityDebug(runtime, target, `Unpaid Interns activated — extra life ${target.counters.interns}/2 used; returned at full HP.`)
    return true
  }
  if (name === 'Flames of Rebirth' && !target.flags.revived) {
    target.flags.revived = true
    target.hp = target.maxHp * 0.5
    target.damage *= 2
    attacker.status.burn = 2
    pushAbilityDebug(runtime, target, `Flames of Rebirth activated — returned at 50% HP with doubled ATK and burned ${effectiveCardName(attacker) || attacker.definition.name}.`)
    return true
  }
  return false
}

function targetRetro"""
    s = pattern.sub(replacement, s, count=1)

# Eclipse detail.
old = """    case 'Eclipse': if (damage > 0) target.flags.sealed = true; break
"""
new = """    case 'Eclipse':
      if (damage > 0) {
        const wasSealed = target.flags.sealed
        target.flags.sealed = true
        if (!wasSealed) pushAbilityDebug(runtime, attacker, `Eclipse disabled ${effectiveCardName(target) || target.definition.name}'s ability after dealing damage.`)
      }
      break
"""
if old in s:
    s = s.replace(old, new, 1)
elif 'Eclipse disabled ${effectiveCardName(target)' not in s:
    raise SystemExit('Eclipse anchor missing')

# Eternal Devotion / Destiny Sight consume messages.
old = """  if (!bypass && target.flags.eternalDevotion) { target.flags.eternalDevotion = false; damage = 0 }
  else if (!bypass && target.flags.dodgeLethal) { target.flags.dodgeLethal = false; damage = 0 }
"""
new = """  if (!bypass && target.flags.eternalDevotion) {
    target.flags.eternalDevotion = false
    damage = 0
    pushAbilityDebug(runtime, target, `Eternal Devotion blocked the incoming attack from ${effectiveCardName(attacker) || attacker.definition.name}.`)
  }
  else if (!bypass && target.flags.dodgeLethal) {
    target.flags.dodgeLethal = false
    damage = 0
    pushAbilityDebug(runtime, target, `Destiny Sight dodged the incoming lethal attack from ${effectiveCardName(attacker) || attacker.definition.name}.`)
  }
"""
if old in s:
    s = s.replace(old, new, 1)
elif 'Eternal Devotion blocked the incoming attack' not in s:
    raise SystemExit('devotion/destiny consume anchor missing')

# Paradox and survival detail.
old = """      if (hasAbility(runtime, card, 'Paradox') && !card.flags.paradox) {
        card.flags.paradox = true
        card.hp = 1
        const opp = active(runtime, OTHER_TEAM[team])
        if (opp) opp.hp = 0
        changed = true
        continue
      }
"""
new = """      if (hasAbility(runtime, card, 'Paradox') && !card.flags.paradox) {
        card.flags.paradox = true
        card.hp = 1
        const opp = active(runtime, OTHER_TEAM[team])
        if (opp) opp.hp = 0
        pushAbilityDebug(runtime, card, `Paradox activated — survived at 1 HP and defeated ${opp ? effectiveCardName(opp) || opp.definition.name : 'the opposing card'}. This Paradox is now consumed.`)
        changed = true
        continue
      }
"""
if old in s:
    s = s.replace(old, new, 1)
elif 'This Paradox is now consumed' not in s:
    raise SystemExit('Paradox anchor missing')

# On-death pass-offs.
old = """  if (name === 'Destiny Sight') next.flags.dodgeLethal = true
  if (name === \"Housewife's Blessing\") { boostStats(next, 2); next.status.stunned = 2 }
  if (name === 'Eternal Devotion') next.flags.eternalDevotion = true
"""
new = """  if (name === 'Destiny Sight') {
    next.flags.dodgeLethal = true
    pushAbilityDebug(runtime, dead, `Destiny Sight passed a lethal dodge to ${effectiveCardName(next) || next.definition.name}.`)
  }
  if (name === \"Housewife's Blessing\") { boostStats(next, 2); next.status.stunned = 2 }
  if (name === 'Eternal Devotion') {
    next.flags.eternalDevotion = true
    pushAbilityDebug(runtime, dead, `Eternal Devotion gave ${effectiveCardName(next) || next.definition.name} a one-attack shield after death.`)
  }
"""
if old in s:
    s = s.replace(old, new, 1)
elif 'Destiny Sight passed a lethal dodge' not in s:
    raise SystemExit('on-death pass-off anchor missing')

# Lotus Sutra: explicit revive/heal/no-target messages.
lotus_pattern = re.compile(r"function doLotusSutra\(runtime: Runtime, attacker: CombatCard\) \{.*?\n\}\n\nfunction doOrigin", re.S)
lotus_match = lotus_pattern.search(s)
if not lotus_match:
    raise SystemExit('Lotus Sutra function missing')
if 'Lotus Sutra revived' not in lotus_match.group(0):
    lotus = """function doLotusSutra(runtime: Runtime, attacker: CombatCard) {
  const fallen = runtime.state.fallen[attacker.team]
  // A Lotus Sutra user can perform its revive once per battle. This prevents
  // Buddha and Hades (after copying Lotus Sutra) from reviving each other forever.
  const deadAlly = attacker.flags.lotusReviveUsed
    ? undefined
    : [...fallen].reverse().find((card) => card !== attacker)
  if (deadAlly) {
    attacker.flags.lotusReviveUsed = true
    const index = fallen.indexOf(deadAlly)
    if (index >= 0) fallen.splice(index, 1)
    deadAlly.dead = false
    deadAlly.hp = deadAlly.maxHp * 0.5
    deadAlly.entered = false
    runtime.state.teams[attacker.team].push(deadAlly)
    pushAbilityDebug(runtime, attacker, `Lotus Sutra revived ${effectiveCardName(deadAlly) || deadAlly.definition.name} at 50% HP and placed it at the back of the team.`)
    return
  }

  const allies = runtime.state.teams[attacker.team].filter((card) => card !== attacker && alive(card))
  const target = allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]
  if (!target) {
    pushAbilityDebug(runtime, attacker, 'Lotus Sutra had no fallen or living ally to target, so nothing happened this turn.')
    return
  }
  const before = target.hp
  target.hp = Math.min(target.maxHp, target.hp + target.maxHp * 0.5)
  const healed = target.hp - before
  let moved = false
  if (target.hp >= target.maxHp) {
    const deck = runtime.state.teams[attacker.team]
    const index = deck.indexOf(attacker)
    if (index >= 0 && deck.length > 1) {
      deck.splice(index, 1)
      deck.push(attacker)
      moved = true
    }
  }
  pushAbilityDebug(runtime, attacker, `Lotus Sutra healed ${effectiveCardName(target) || target.definition.name} for ${Math.ceil(healed)} HP${moved ? ' and moved the Lotus Sutra user to the back of the team' : ''}.`)
}

function doOrigin"""
    s = lotus_pattern.sub(lotus, s, count=1)

battle.write_text(s, encoding='utf-8')

# Add a permanent Buddha regression proving Lotus Sutra revives when Buddha actually gets a turn.
smoke = Path('scripts/engine-smoke.ts')
t = smoke.read_text(encoding='utf-8')
if 'Buddha Lotus Sutra turn regression passed' not in t:
    marker = """console.log(\"Ability-disable revive regression passed: Fuxi and Hell's Curse suppress Unpaid Interns.\")

console.log(`Engine smoke tests passed: ${cards.length} cards, ${auras.length} auras.`)
"""
    test = """console.log(\"Ability-disable revive regression passed: Fuxi and Hell's Curse suppress Unpaid Interns.\")

// Buddha regression: Lotus Sutra is a turn action, not an entry effect. Meteosaurus
// dies on its own first turn; the zero-ATK enemy then acts; Buddha receives the next
// allied turn and must revive Meteosaurus at 50% HP.
const buddhaEnemy: DepthsEnemy[] = [{
  card: { ...dummy, name: '__Buddha Turn Enemy__' }, power: 1e20, attack: 0, health: 1e20,
}]
const buddhaBattle = simulateBattleV2(
  { cards: [{ cardName: 'Meteosaurus', borders: [] }, { cardName: 'Buddha', borders: [] }] },
  buddhaEnemy,
  9966, 3, false, true,
)
const revivedMeteosaurus = buddhaBattle.state.teams.Allies.find((card) => card.definition.name === 'Meteosaurus')
assert(revivedMeteosaurus, 'Buddha failed to revive Meteosaurus when Lotus Sutra received a turn')
close(revivedMeteosaurus.hp, revivedMeteosaurus.maxHp * 0.5, 1e-6)
assert(buddhaBattle.debug?.events.some((event) => event.type === 'ability' && event.detail.includes('Lotus Sutra revived Meteosaurus')), 'Lotus Sutra revive interaction missing from debug events')
console.log('Buddha Lotus Sutra turn regression passed.')

console.log(`Engine smoke tests passed: ${cards.length} cards, ${auras.length} auras.`)
"""
    if marker not in t:
        raise SystemExit('engine smoke insertion marker missing')
    t = t.replace(marker, test, 1)
    smoke.write_text(t, encoding='utf-8')

# Replace the raw <pre> debug dialog with a readable battle report and ability toggle.
index = Path('index.html')
h = index.read_text(encoding='utf-8')
debug_pattern = re.compile(r"  function showRunDebug\(teamIndex,runIndex\)\{.*?\n  \}\n  function persist\(\)", re.S)
if not debug_pattern.search(h):
    raise SystemExit('showRunDebug function missing')

new_debug = r'''  function showRunDebug(teamIndex,runIndex){
    const run=state.teams[teamIndex]?.result?.runs?.[runIndex],d=run?.debug;if(!run)return;
    const fmt=n=>Number.isFinite(Number(n))?Math.round(Number(n)).toLocaleString('en-US'):'?';
    const compactDbg=n=>Number.isFinite(Number(n))?Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:2}).format(Number(n)):'?';
    const side=t=>t==='Allies'?'PLAYER':'ENEMY';
    let showAbilities=localStorage.getItem('cre-debug-ability-details')!=='0';
    const cardsHtml=(cards,empty)=>cards?.length?cards.map(c=>`<div class="dbg-card"><div><b>${esc(c.name)}</b><small>${esc(c.ability||'No ability')}</small></div><div class="dbg-card-stats"><span><i>HP</i>${compactDbg(c.hp)} / ${compactDbg(c.maxHp)}</span><span><i>ATK</i>${compactDbg(c.damage)}</span><span><i>POWER</i>${compactDbg(c.power)}</span></div></div>`).join(''):`<div class="dbg-empty">${empty}</div>`;
    const turnParts=e=>{const m=String(e.detail||'').match(/^vs (.*?) \| attacker (.*?) \| defender (.*)$/);return m?{target:m[1],attacker:m[2],defender:m[3]}:null};
    const visibleEvents=()=>d?.events?.filter(e=>showAbilities||e.type!=='ability')||[];
    const eventHtml=e=>{
      const parts=e.type==='turn'?turnParts(e):null;
      if(parts)return `<div class="dbg-event turn"><div class="dbg-event-top"><span class="dbg-type">TURN</span><span>${side(e.team)}</span></div><div class="dbg-event-title"><b>${esc(e.card)}</b><span>→</span><b>${esc(parts.target)}</b></div><div class="dbg-turn-stats"><span><i>${esc(e.card)}</i>${esc(parts.attacker)}</span><span><i>${esc(parts.target)}</i>${esc(parts.defender)}</span></div></div>`;
      return `<div class="dbg-event ${esc(e.type)}"><div class="dbg-event-top"><span class="dbg-type">${esc(e.type.toUpperCase())}</span><span>${side(e.team)}</span></div><div class="dbg-event-title"><b>${esc(e.card)}</b></div><div class="dbg-event-detail">${esc(e.detail||'')}</div></div>`;
    };
    const traceHtml=()=>{let last=null,out='';for(const e of visibleEvents()){if(e.turn!==last){last=e.turn;out+=`<div class="dbg-turn-label">Turn ${e.turn}</div>`}out+=eventHtml(e)}return out||'<div class="dbg-empty">No trace events captured.</div>'};
    const plainText=()=>{
      const lines=[];
      lines.push(`TEAM ${teamIndex+1} · RUN ${runIndex+1} · DEATH FLOOR ${fmt(run.deathFloor)}`);
      lines.push(`Run seed: ${run.runSeed}`);
      lines.push(`Floor seed: ${run.floorSeed??'?'}`);
      lines.push(`Battle seed: ${run.battleSeed??'?'}`);
      lines.push(`Stat Aura: ${d?.statAura?`${d.statAura.name} · ${d.statAura.border||'Base'} · value ${d.statAura.value??'?'}`:'None'}`);
      lines.push(`Ability Aura: ${d?.abilityAura?`${d.abilityAura.name} · ${d.abilityAura.border||'Base'} · value ${d.abilityAura.value??'?'}`:'None'}`);
      lines.push(`150-turn resolutions: ${d?.forcedStallResolutions??0}`);
      const addCards=(title,cards)=>{lines.push('',title);if(!cards?.length)lines.push('  None');else for(const c of cards)lines.push(`  ${c.name} [${c.ability||'No ability'}]`, `    HP ${fmt(c.hp)} / ${fmt(c.maxHp)} · ATK ${fmt(c.damage)} · Power ${fmt(c.power)}`)};
      addCards('PLAYER START',d?.initialAllies);addCards('ENEMY START',d?.initialEnemies);addCards('FINAL PLAYER SURVIVORS',d?.finalAllies);addCards('FINAL ENEMY SURVIVORS',d?.finalEnemies);
      lines.push('',`BATTLE TRACE${showAbilities?' · ABILITY INTERACTIONS ON':' · ABILITY INTERACTIONS OFF'}`);
      let last=null;
      for(const e of visibleEvents()){
        if(e.turn!==last){last=e.turn;lines.push('',`TURN ${e.turn}`)}
        const parts=e.type==='turn'?turnParts(e):null;
        if(parts){lines.push(`  [TURN] ${side(e.team)} · ${e.card} → ${parts.target}`);lines.push(`    ${e.card}: ${parts.attacker}`);lines.push(`    ${parts.target}: ${parts.defender}`)}
        else lines.push(`  [${e.type.toUpperCase()}] ${side(e.team)} · ${e.card}`,`    ${e.detail}`);
      }
      return lines.join('\n');
    };
    const dialog=document.createElement('dialog');dialog.className='dbg-dialog';
    dialog.innerHTML=`<style>
      .dbg-dialog{width:min(1050px,95vw);height:min(850px,92vh);padding:0;background:#080d14;color:#c7d1dc;border:1px solid #334255;border-radius:16px;box-shadow:0 28px 90px rgba(0,0,0,.65)}.dbg-dialog::backdrop{background:rgba(0,0,0,.72)}
      .dbg-shell{height:100%;display:flex;flex-direction:column}.dbg-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:16px 18px;border-bottom:1px solid #202b3a;background:#0b1119}.dbg-head h3{margin:4px 0 0;font-size:18px;color:#e5ebf2}.dbg-kicker{font-size:8px;letter-spacing:.11em;color:#70cfc0;font-weight:800}.dbg-sub{margin-top:5px;color:#708095;font-size:9px}.dbg-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.dbg-actions button{background:#111925;color:#b9c5d2;border:1px solid #2a394a;border-radius:8px;padding:7px 10px;font-size:9px;cursor:pointer}.dbg-actions button.on{border-color:#477b76;color:#d7f2ed;background:#122521}.dbg-scroll{overflow:auto;padding:14px 16px 22px}.dbg-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-bottom:13px}.dbg-summary>div{border:1px solid #202b3a;background:#0b1119;border-radius:10px;padding:9px}.dbg-summary span{display:block;color:#647286;font-size:7px;text-transform:uppercase;letter-spacing:.08em}.dbg-summary b{display:block;margin-top:4px;font-size:10px;color:#cbd5df;overflow-wrap:anywhere}.dbg-section{margin-top:14px}.dbg-section>h4{margin:0 0 7px;color:#7c8999;font-size:8px;letter-spacing:.1em;text-transform:uppercase}.dbg-card-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.dbg-card{display:flex;justify-content:space-between;gap:12px;border:1px solid #202b3a;background:#0a0f16;border-radius:10px;padding:9px}.dbg-card b{display:block;font-size:10px;color:#dce4ed}.dbg-card small{display:block;margin-top:3px;color:#718094;font-size:8px}.dbg-card-stats{display:flex;gap:9px;flex-wrap:wrap;justify-content:flex-end}.dbg-card-stats span{font-size:8px;color:#aab6c4;white-space:nowrap}.dbg-card-stats i{display:block;font-style:normal;color:#526174;font-size:6px}.dbg-empty{border:1px dashed #243141;border-radius:9px;padding:10px;color:#58677a;font-size:9px}.dbg-trace{margin-top:6px}.dbg-turn-label{position:sticky;top:-14px;z-index:2;margin:13px 0 6px;padding:5px 8px;background:#0d151f;border:1px solid #223040;border-radius:8px;color:#7890a8;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}.dbg-event{border:1px solid #202b3a;background:#0a0f16;border-radius:10px;padding:9px 10px;margin:5px 0;border-left-width:3px}.dbg-event.turn{border-left-color:#3f6575}.dbg-event.death{border-left-color:#86505a;background:#110c10}.dbg-event.revive{border-left-color:#4c7e6d;background:#0c1412}.dbg-event.ability{border-left-color:#765ca6;background:#100d17}.dbg-event.stall{border-left-color:#846b3e}.dbg-event.spawn{border-left-color:#466f73}.dbg-event-top{display:flex;justify-content:space-between;gap:8px;color:#526174;font-size:7px}.dbg-type{font-weight:850;letter-spacing:.08em}.dbg-event-title{display:flex;align-items:center;gap:7px;margin-top:4px;color:#d7e0e9;font-size:10px}.dbg-event-detail{margin-top:4px;color:#94a2b2;font-size:9px;line-height:1.45}.dbg-turn-stats{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px}.dbg-turn-stats span{background:#0d141d;border:1px solid #1b2735;border-radius:7px;padding:6px;color:#8795a5;font-size:8px;line-height:1.4}.dbg-turn-stats i{display:block;color:#c5d0db;font-style:normal;font-weight:750;margin-bottom:2px}.dbg-note{margin-top:7px;color:#66778b;font-size:8px;line-height:1.5}
      @media(max-width:760px){.dbg-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.dbg-card-grid,.dbg-turn-stats{grid-template-columns:1fr}.dbg-head{flex-direction:column}.dbg-actions{justify-content:flex-start}}
    </style><div class="dbg-shell"><div class="dbg-head"><div><span class="dbg-kicker">BATTLE DEBUG</span><h3>Team ${teamIndex+1} · Run ${runIndex+1}</h3><div class="dbg-sub">Death floor ${fmt(run.deathFloor)} · click ability interactions on/off to simplify the trace</div></div><div class="dbg-actions"><button data-dbg-abilities></button><button data-dbg-copy>Copy debug</button><button data-dbg-close>Close</button></div></div><div class="dbg-scroll"><div class="dbg-summary"><div><span>Run seed</span><b>${esc(run.runSeed)}</b></div><div><span>Floor seed</span><b>${esc(run.floorSeed??'?')}</b></div><div><span>Battle seed</span><b>${esc(run.battleSeed??'?')}</b></div><div><span>150-turn resolutions</span><b>${d?.forcedStallResolutions??0}</b></div><div><span>Stat Aura</span><b>${d?.statAura?`${esc(d.statAura.name)} · ${esc(d.statAura.border||'Base')} · ${esc(d.statAura.value??'?')}`:'None'}</b></div><div><span>Ability Aura</span><b>${d?.abilityAura?`${esc(d.abilityAura.name)} · ${esc(d.abilityAura.border||'Base')} · ${esc(d.abilityAura.value??'?')}`:'None'}</b></div></div><div class="dbg-section"><h4>Player battle-start stats</h4><div class="dbg-card-grid">${cardsHtml(d?.initialAllies,'No player cards captured.')}</div></div><div class="dbg-section"><h4>Enemy battle-start stats</h4><div class="dbg-card-grid">${cardsHtml(d?.initialEnemies,'No enemy cards captured.')}</div></div><div class="dbg-section"><h4>Final survivors</h4><div class="dbg-card-grid">${cardsHtml(d?.finalAllies,'No player survivors.')}${cardsHtml(d?.finalEnemies,'No enemy survivors.')}</div></div><div class="dbg-section"><h4>Battle trace · last 300 important events</h4><div class="dbg-note">Ability interactions show why things happened: revives, ability locks, Paradox, End Times failures, shields, Armageddon rolls, and similar effects.</div><div class="dbg-trace" data-dbg-trace></div></div></div></div>`;
    document.body.appendChild(dialog);
    const trace=dialog.querySelector('[data-dbg-trace]'),toggle=dialog.querySelector('[data-dbg-abilities]'),copy=dialog.querySelector('[data-dbg-copy]'),close=dialog.querySelector('[data-dbg-close]');
    const repaint=()=>{toggle.textContent=`Ability interactions: ${showAbilities?'ON':'OFF'}`;toggle.classList.toggle('on',showAbilities);trace.innerHTML=traceHtml()};
    repaint();dialog.showModal();
    toggle.addEventListener('click',()=>{showAbilities=!showAbilities;localStorage.setItem('cre-debug-ability-details',showAbilities?'1':'0');repaint()});
    close.addEventListener('click',()=>{dialog.close();dialog.remove()});
    copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(plainText());copy.textContent='Copied!';setTimeout(()=>{if(copy.isConnected)copy.textContent='Copy debug'},900)}catch(_){}});
  }
  function persist()'''

h = debug_pattern.sub(new_debug, h, count=1)
index.write_text(h, encoding='utf-8')
print('Improved battle ability debug events, Buddha regression, and readable debug UI.')

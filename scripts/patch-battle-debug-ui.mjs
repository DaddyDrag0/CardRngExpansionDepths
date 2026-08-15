import fs from 'node:fs'

function replaceOrThrow(source, oldText, newText, label) {
  if (!source.includes(oldText)) throw new Error(`Could not find ${label}`)
  return source.replace(oldText, newText)
}

function section(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker)
  if (start < 0) throw new Error(`Missing section start: ${startMarker}`)
  const end = source.indexOf(endMarker, start)
  if (end < 0) throw new Error(`Missing section end: ${endMarker}`)
  return { start, end, text: source.slice(start, end) }
}

// ---- Battle engine debug coverage -------------------------------------------------
let battle = fs.readFileSync('src/engine/battle-v2.ts', 'utf8')

battle = replaceOrThrow(
  battle,
  '  if (runtime.debug.events.length >= 300) runtime.debug.events.shift()',
  '  if (runtime.debug.events.length >= 1200) runtime.debug.events.shift()',
  'debug event cap',
)

{
  const s = section(battle, 'function onEntry(runtime: Runtime, card: CombatCard) {', '\nfunction offensive(')
  let chunk = s.text
  chunk = replaceOrThrow(
    chunk,
    '  switch (name) {',
    [
      '  const entryDebugBefore = runtime.captureDebug ? {',
      '    cardHp: card.hp, cardMaxHp: card.maxHp, cardDamage: card.damage,',
      '    enemyHp: enemy.hp, enemyMaxHp: enemy.maxHp, enemyDamage: enemy.damage,',
      '    enemyStunned: enemy.status.stunned, enemyConfused: enemy.status.confused, enemyBurn: enemy.status.burn,',
      '    enemyBlind: enemy.status.blind, enemyWeakness: enemy.status.weakness, enemySealed: Boolean(enemy.flags.sealed),',
      '  } : null',
      '',
      '  switch (name) {',
    ].join('\n'),
    'onEntry debug snapshot',
  )

  const close = chunk.lastIndexOf('\n  }\n}')
  if (close < 0) throw new Error('Could not find onEntry closing switch')
  const entryFooter = [
    '',
    '  if (entryDebugBefore) {',
    '    const changes: string[] = []',
    "    const n = (value: number) => Number.isFinite(value) ? String(Math.round(value)) : 'lethal'",
    "    const changed = (before: number, after: number) => Math.abs(before - after) > Math.max(0.001, Math.abs(before) * 1e-9)",
    "    if (changed(entryDebugBefore.cardDamage, card.damage)) changes.push('own ATK ' + n(entryDebugBefore.cardDamage) + ' → ' + n(card.damage))",
    "    if (changed(entryDebugBefore.cardMaxHp, card.maxHp)) changes.push('own max HP ' + n(entryDebugBefore.cardMaxHp) + ' → ' + n(card.maxHp))",
    "    if (changed(entryDebugBefore.cardHp, card.hp)) changes.push('own HP ' + n(entryDebugBefore.cardHp) + ' → ' + n(card.hp))",
    "    if (changed(entryDebugBefore.enemyDamage, enemy.damage)) changes.push('enemy ATK ' + n(entryDebugBefore.enemyDamage) + ' → ' + n(enemy.damage))",
    "    if (changed(entryDebugBefore.enemyMaxHp, enemy.maxHp)) changes.push('enemy max HP ' + n(entryDebugBefore.enemyMaxHp) + ' → ' + n(enemy.maxHp))",
    "    if (changed(entryDebugBefore.enemyHp, enemy.hp)) changes.push('enemy HP ' + n(entryDebugBefore.enemyHp) + ' → ' + n(enemy.hp))",
    "    if (entryDebugBefore.enemyStunned !== enemy.status.stunned) changes.push('enemy stun ' + entryDebugBefore.enemyStunned + ' → ' + enemy.status.stunned + ' turns')",
    "    if (entryDebugBefore.enemyConfused !== enemy.status.confused) changes.push('enemy confusion ' + entryDebugBefore.enemyConfused + ' → ' + enemy.status.confused + ' turns')",
    "    if (entryDebugBefore.enemyBurn !== enemy.status.burn) changes.push('enemy burn ' + entryDebugBefore.enemyBurn + ' → ' + enemy.status.burn + ' turns')",
    "    if (entryDebugBefore.enemyBlind !== enemy.status.blind) changes.push(enemy.status.blind ? 'enemy blinded' : 'enemy blind removed')",
    "    if (entryDebugBefore.enemyWeakness !== enemy.status.weakness) changes.push(enemy.status.weakness ? 'enemy weakened' : 'enemy weakness removed')",
    "    if (entryDebugBefore.enemySealed !== Boolean(enemy.flags.sealed)) changes.push(enemy.flags.sealed ? 'enemy ability sealed' : 'enemy ability unsealed')",
    "    if (changes.length && name !== \"Hell's Curse\" && name !== 'Order of the Cosmos') pushAbilityDebug(runtime, card, name + ': ' + changes.join('; ') + '.')",
    '  }',
  ].join('\n')
  chunk = chunk.slice(0, close + '\n  }'.length) + entryFooter + chunk.slice(close + '\n  }'.length)
  battle = battle.slice(0, s.start) + chunk + battle.slice(s.end)
}

{
  const s = section(battle, 'function offensive(runtime: Runtime, attacker: CombatCard, target: CombatCard, initial: number)', '\nfunction defensive(')
  let chunk = s.text
  chunk = replaceOrThrow(
    chunk,
    '  let special = false\n',
    [
      '  let special = false',
      '  const offensiveDebugBefore = runtime.captureDebug ? {',
      '    attackerHp: attacker.hp, attackerMaxHp: attacker.maxHp, attackerDamage: attacker.damage,',
      '    targetBleed: target.counters.bleed || 0, targetPoisonPercent: target.counters.poisonPercent || 0,',
      '    targetFrostbite: target.counters.frostbite || 0, targetWeakness: target.status.weakness,',
      '  } : null',
      '',
    ].join('\n'),
    'offensive debug snapshot',
  )
  chunk = replaceOrThrow(
    chunk,
    '  return { damage, bypass, special }\n}',
    [
      '  if (offensiveDebugBefore && name !== \'Armageddon\') {',
      '    const changes: string[] = []',
      "    const n = (value: number) => Number.isFinite(value) ? String(Math.round(value)) : 'lethal'",
      "    const changed = (before: number, after: number) => Math.abs(before - after) > Math.max(0.001, Math.abs(before) * 1e-9)",
      "    if (changed(initial, damage)) changes.push('attack damage ' + n(initial) + ' → ' + n(damage))",
      "    if (bypass) changes.push('bypasses defense')",
      "    if (changed(offensiveDebugBefore.attackerDamage, attacker.damage)) changes.push('own ATK ' + n(offensiveDebugBefore.attackerDamage) + ' → ' + n(attacker.damage))",
      "    if (changed(offensiveDebugBefore.attackerMaxHp, attacker.maxHp)) changes.push('own max HP ' + n(offensiveDebugBefore.attackerMaxHp) + ' → ' + n(attacker.maxHp))",
      "    if (changed(offensiveDebugBefore.attackerHp, attacker.hp)) changes.push('own HP ' + n(offensiveDebugBefore.attackerHp) + ' → ' + n(attacker.hp))",
      "    if (offensiveDebugBefore.targetBleed !== (target.counters.bleed || 0)) changes.push('applied/changed bleed')",
      "    if (offensiveDebugBefore.targetPoisonPercent !== (target.counters.poisonPercent || 0)) changes.push('applied/changed poison')",
      "    if (offensiveDebugBefore.targetFrostbite !== (target.counters.frostbite || 0)) changes.push('applied/changed frostbite')",
      "    if (offensiveDebugBefore.targetWeakness !== target.status.weakness) changes.push(target.status.weakness ? 'applied weakness' : 'removed weakness')",
      "    if (changes.length) pushAbilityDebug(runtime, attacker, name + ': ' + changes.join('; ') + '.')",
      '  }',
      '  return { damage, bypass, special }',
      '}',
    ].join('\n'),
    'offensive debug footer',
  )
  battle = battle.slice(0, s.start) + chunk + battle.slice(s.end)
}

{
  const s = section(battle, 'function defensive(runtime: Runtime, attacker: CombatCard, target: CombatCard, initial: number)', '\nfunction tryRevive(')
  let chunk = s.text
  chunk = replaceOrThrow(
    chunk,
    '  let damage = initial\n  if (!name || !hasAbility(runtime, target, name)) return damage\n',
    [
      '  let damage = initial',
      '  if (!name || !hasAbility(runtime, target, name)) return damage',
      '  const defensiveDebugBefore = runtime.captureDebug ? { attackerHp: attacker.hp, attackerDamage: attacker.damage, targetHp: target.hp, targetDamage: target.damage } : null',
      '',
    ].join('\n'),
    'defensive debug snapshot',
  )
  chunk = replaceOrThrow(
    chunk,
    '  if (initial > 0 && damage === 0 && DODGE_ABILITIES.has(name)) target.flags.evadedThisHit = true\n  return damage\n}',
    [
      '  if (initial > 0 && damage === 0 && DODGE_ABILITIES.has(name)) target.flags.evadedThisHit = true',
      '  if (defensiveDebugBefore && name !== \'Limitless\') {',
      '    const changes: string[] = []',
      "    const n = (value: number) => Number.isFinite(value) ? String(Math.round(value)) : 'lethal'",
      "    const changed = (before: number, after: number) => Math.abs(before - after) > Math.max(0.001, Math.abs(before) * 1e-9)",
      "    if (changed(initial, damage)) changes.push(damage === 0 ? 'blocked ' + n(initial) + ' incoming damage' : 'incoming damage ' + n(initial) + ' → ' + n(damage))",
      "    if (changed(defensiveDebugBefore.attackerHp, attacker.hp)) changes.push('attacker HP ' + n(defensiveDebugBefore.attackerHp) + ' → ' + n(attacker.hp))",
      "    if (changed(defensiveDebugBefore.attackerDamage, attacker.damage)) changes.push('attacker ATK ' + n(defensiveDebugBefore.attackerDamage) + ' → ' + n(attacker.damage))",
      "    if (changed(defensiveDebugBefore.targetHp, target.hp)) changes.push('own HP ' + n(defensiveDebugBefore.targetHp) + ' → ' + n(target.hp))",
      "    if (changed(defensiveDebugBefore.targetDamage, target.damage)) changes.push('own ATK ' + n(defensiveDebugBefore.targetDamage) + ' → ' + n(target.damage))",
      "    if (changes.length) pushAbilityDebug(runtime, target, name + ': ' + changes.join('; ') + '.')",
      '  }',
      '  return damage',
      '}',
    ].join('\n'),
    'defensive debug footer',
  )
  battle = battle.slice(0, s.start) + chunk + battle.slice(s.end)
}

fs.writeFileSync('src/engine/battle-v2.ts', battle)

// ---- Battle debug modal -----------------------------------------------------------
let html = fs.readFileSync('index.html', 'utf8')

html = replaceOrThrow(
  html,
  "    let showAbilities=true;\n    const visibleEvents=()=>d?.events?.filter(e=>showAbilities||e.type!=='ability')||[];",
  [
    "    const visibleEvents=()=>d?.events||[];",
    "    const matchCard=c=>`<div class=\"dbg-match-card\"><div><b>${esc(c.name)}</b><small>${esc(c.ability||'No ability')}</small></div><span>${compactDbg(c.hp)} HP · ${compactDbg(c.damage)} ATK</span></div>`;",
    "    const matchTeam=(list,label,kind)=>`<section class=\"dbg-match-team ${kind}\"><div class=\"dbg-match-team-title\">${label}</div><div class=\"dbg-match-cards\">${list?.length?list.map(matchCard).join(''):'<div class=\"dbg-match-empty\">No cards</div>'}</div></section>`;",
    "    const auraLine=()=>{const parts=[];if(d?.statAura)parts.push(`Stat Aura: ${esc(d.statAura.name)} · ${esc(d.statAura.border||'Base')}`);if(d?.abilityAura)parts.push(`Ability Aura: ${esc(d.abilityAura.name)} · ${esc(d.abilityAura.border||'Base')}`);return parts.length?`<div class=\"dbg-aura-line\">${parts.join('<span>•</span>')}</div>`:''};",
  ].join('\n'),
  'always-visible ability events and matchup helpers',
)

const oldFight = "          fight=`<div class=\"dbg-fight\"><div class=\"dbg-side-label ${turnEvent.team==='Allies'?'player':''}\">${side(turnEvent.team)}</div>${fightCard(turnEvent.card,parsed.aHp,parsed.aMax,parsed.aAtk,'left')}<div class=\"dbg-vs\"><span>VS</span><i>→</i></div>${fightCard(parsed.target,parsed.dHp,parsed.dMax,parsed.dAtk,'right')}</div>`;"
const newFight = [
  "          const playerAttacking=turnEvent.team==='Allies';",
  "          fight=playerAttacking",
  "            ?`<div class=\"dbg-fight player-attack\">${fightCard(parsed.target,parsed.dHp,parsed.dMax,parsed.dAtk,'enemy')}<div class=\"dbg-vs\"><i>←</i></div>${fightCard(turnEvent.card,parsed.aHp,parsed.aMax,parsed.aAtk,'player')}</div>`",
  "            :`<div class=\"dbg-fight enemy-attack\">${fightCard(turnEvent.card,parsed.aHp,parsed.aMax,parsed.aAtk,'enemy')}<div class=\"dbg-vs\"><i>→</i></div>${fightCard(parsed.target,parsed.dHp,parsed.dMax,parsed.dAtk,'player')}</div>`;",
].join('\n')
html = replaceOrThrow(html, oldFight, newFight, 'fixed player side and directional arrow')

html = replaceOrThrow(
  html,
  "        return `<section class=\"dbg-turn\"><div class=\"dbg-turn-head\"><b>TURN ${group.turn}</b>${turnEvent?`<span>${side(turnEvent.team)} TURN</span>`:''}</div>${fight}${extras?`<div class=\"dbg-interactions\">${extras}</div>`:''}</section>`;",
  "        return `<section class=\"dbg-turn\"><div class=\"dbg-turn-head\"><b>TURN ${group.turn}</b>${turnEvent?`<span class=\"${turnEvent.team==='Allies'?'player':'enemy'}\">${side(turnEvent.team)} TURN</span>`:'<span></span>'}<i></i></div>${fight}${extras?`<div class=\"dbg-interactions\">${extras}</div>`:''}</section>`;",
  'centered turn owner',
)

html = replaceOrThrow(
  html,
  "      .dbg-turn{border:1px solid #243243;background:#0a1119;border-radius:13px;margin:0 0 10px;overflow:hidden}.dbg-turn-head{display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:#0d1721;border-bottom:1px solid #233243}.dbg-turn-head b{font-size:8px;letter-spacing:.08em;color:#87b9df}.dbg-turn-head span{font-size:7px;color:#5f7185}",
  "      .dbg-turn{border:1px solid #243243;background:#0a1119;border-radius:11px;margin:0 0 10px;overflow:hidden}.dbg-turn-head{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:7px 11px;background:#0d1721;border-bottom:1px solid #233243}.dbg-turn-head b{font-size:8px;letter-spacing:.08em;color:#87b9df}.dbg-turn-head span{font-size:9px;font-weight:850;letter-spacing:.08em;text-align:center;color:#aeb9c7}.dbg-turn-head span.player{color:#85d1c2}.dbg-turn-head span.enemy{color:#df91a0}.dbg-turn-head i{display:block}",
  'turn header styling',
)

html = replaceOrThrow(
  html,
  "      .dbg-fight{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 58px minmax(0,1fr);gap:10px;align-items:center;padding:12px}.dbg-side-label{position:absolute;right:10px;top:7px;font-size:6px;letter-spacing:.1em;color:#756274}.dbg-side-label.player{color:#557687}.dbg-fighter{border:1px solid #243445;background:#0d151e;border-radius:10px;padding:10px}.dbg-fighter-top{display:flex;align-items:baseline;justify-content:space-between;gap:8px}.dbg-fighter-top b{font-size:10px;color:#e0e7ef}.dbg-fighter-top span{font-size:7px;color:#7d8b9a}.dbg-hp{height:5px;background:#151f2a;border-radius:999px;overflow:hidden;margin:8px 0 6px}.dbg-hp i{display:block;height:100%;background:linear-gradient(90deg,#397b69,#65b89e);border-radius:999px}.dbg-fighter.right .dbg-hp i{background:linear-gradient(90deg,#8b4d5a,#c16b77)}.dbg-fighter-atk{font-size:8px;color:#9ba9b8}.dbg-vs{text-align:center;color:#6f8193}.dbg-vs span{display:block;font-size:7px;font-weight:850;letter-spacing:.08em}.dbg-vs i{display:block;font-style:normal;font-size:20px;line-height:1;margin-top:4px}.dbg-fight-simple{padding:10px 12px}.dbg-fight-simple b{display:block;font-size:10px}.dbg-fight-simple span{display:block;margin-top:4px;color:#8291a1;font-size:8px}",
  "      .dbg-fight{display:grid;grid-template-columns:minmax(0,1fr) 54px minmax(0,1fr);gap:10px;align-items:center;padding:12px}.dbg-fighter{border:1px solid #243445;background:#0d151e;border-radius:9px;padding:10px}.dbg-fighter-top{display:flex;align-items:baseline;justify-content:space-between;gap:8px}.dbg-fighter-top b{font-size:10px;color:#e0e7ef}.dbg-fighter-top span{font-size:7px;color:#7d8b9a}.dbg-hp{height:5px;background:#151f2a;border-radius:999px;overflow:hidden;margin:8px 0 6px}.dbg-hp i{display:block;height:100%;border-radius:999px}.dbg-fighter.enemy .dbg-hp i{background:linear-gradient(90deg,#8b4d5a,#c16b77)}.dbg-fighter.player .dbg-hp i{background:linear-gradient(90deg,#397b69,#65b89e)}.dbg-fighter-atk{font-size:8px;color:#9ba9b8}.dbg-vs{text-align:center;color:#8191a3}.dbg-vs i{display:block;font-style:normal;font-size:23px;line-height:1}.dbg-fight-simple{padding:10px 12px}.dbg-fight-simple b{display:block;font-size:10px}.dbg-fight-simple span{display:block;margin-top:4px;color:#8291a1;font-size:8px}",
  'fight styling',
)

html = replaceOrThrow(
  html,
  "      .dbg-interactions{padding:0 12px 12px;display:grid;gap:6px}.dbg-interaction{display:grid;grid-template-columns:58px 150px minmax(0,1fr);align-items:center;gap:8px;border:1px solid #2d2840;border-left:3px solid #775da8;background:#100d17;border-radius:9px;padding:7px 9px}.dbg-interaction>span{font-size:6px;font-weight:900;letter-spacing:.1em;color:#9d87ca}.dbg-interaction>b{font-size:9px;color:#ddd5ef}.dbg-interaction>p{margin:0;color:#a99fba;font-size:8px;line-height:1.35}.dbg-interaction.death{border-color:#44262d;border-left-color:#965968;background:#130d10}.dbg-interaction.death>span{color:#c67988}.dbg-interaction.revive{border-color:#254136;border-left-color:#5a9a80;background:#0c1512}.dbg-interaction.revive>span{color:#79b79c}.dbg-interaction.spawn{border-color:#274047;border-left-color:#518a97;background:#0c1417}.dbg-interaction.stall{border-color:#4a3c25;border-left-color:#a48143;background:#151108}",
  "      .dbg-matchup{display:grid;grid-template-columns:minmax(0,1fr) 42px minmax(0,1fr);gap:10px;align-items:stretch;margin:0 0 10px}.dbg-match-vs{display:grid;place-items:center;color:#647589;font-size:9px;font-weight:900;letter-spacing:.08em}.dbg-match-team{border:1px solid #253344;background:#0a1119;border-radius:10px;padding:10px}.dbg-match-team-title{font-size:8px;font-weight:900;letter-spacing:.1em;margin-bottom:7px}.dbg-match-team.enemy .dbg-match-team-title{color:#d88191}.dbg-match-team.player .dbg-match-team-title{color:#78c7b7}.dbg-match-cards{display:grid;gap:5px}.dbg-match-card{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:6px 7px;border-top:1px solid #182331}.dbg-match-card:first-child{border-top:0}.dbg-match-card b{display:block;font-size:9px;color:#dce4ed}.dbg-match-card small{display:block;margin-top:2px;color:#738397;font-size:7px}.dbg-match-card>span{white-space:nowrap;color:#8997a8;font-size:7px}.dbg-match-empty{color:#657489;font-size:8px}.dbg-aura-line{display:flex;gap:9px;justify-content:center;align-items:center;flex-wrap:wrap;margin:0 0 11px;padding:7px 9px;border:1px solid #202d3c;border-radius:8px;background:#090f16;color:#8493a4;font-size:8px}.dbg-aura-line span{color:#3e4d5f}.dbg-interactions{padding:0 12px 12px;display:grid;gap:5px}.dbg-interaction{display:grid;grid-template-columns:55px 145px minmax(0,1fr);align-items:center;gap:8px;border-top:1px solid #28213a;background:#0e0b14;padding:8px 9px}.dbg-interaction:first-child{border-radius:7px 7px 0 0}.dbg-interaction:last-child{border-radius:0 0 7px 7px}.dbg-interaction:only-child{border-radius:7px}.dbg-interaction>span{font-size:7px;font-weight:900;letter-spacing:.1em;color:#a28ace}.dbg-interaction>b{font-size:9px;color:#ddd5ef}.dbg-interaction>p{margin:0;color:#b1a7c0;font-size:8px;line-height:1.45}.dbg-interaction.death{border-top-color:#4a2a31;background:#120d10}.dbg-interaction.death>span{color:#c67988}.dbg-interaction.revive{border-top-color:#28443a;background:#0c1512}.dbg-interaction.revive>span{color:#79b79c}.dbg-interaction.spawn{border-top-color:#28434a;background:#0c1417}.dbg-interaction.stall{border-top-color:#4a3c25;background:#151108}",
  'matchup and interaction styling',
)

html = replaceOrThrow(
  html,
  "      @media(max-width:720px){.dbg-head{align-items:flex-start;flex-direction:column}.dbg-actions{justify-content:flex-start}.dbg-fight{grid-template-columns:1fr}.dbg-vs{display:none}.dbg-interaction{grid-template-columns:55px 1fr}.dbg-interaction>p{grid-column:1/-1}.dbg-fighter-top{align-items:flex-start;flex-direction:column}}",
  "      @media(max-width:720px){.dbg-head{align-items:flex-start;flex-direction:column}.dbg-actions{justify-content:flex-start}.dbg-matchup{grid-template-columns:1fr}.dbg-match-vs{padding:2px}.dbg-fight{grid-template-columns:1fr}.dbg-vs{display:none}.dbg-interaction{grid-template-columns:55px 1fr}.dbg-interaction>p{grid-column:1/-1}.dbg-fighter-top{align-items:flex-start;flex-direction:column}}",
  'mobile debug styling',
)

const oldDialog = "    </style><div class=\"dbg-shell\"><div class=\"dbg-head\"><div><span class=\"dbg-kicker\">BATTLE DEBUG</span><h3>Team ${teamIndex+1} · Run ${runIndex+1}</h3><div class=\"dbg-sub\">Death floor ${fmt(run.deathFloor)}</div></div><div class=\"dbg-actions\"><button data-dbg-abilities class=\"on\">Ability interactions: ON</button><button data-dbg-copy>Copy debug</button><button data-dbg-close>Close</button></div></div><div class=\"dbg-scroll\"><div data-dbg-timeline></div></div></div>`;"
const newDialog = "    </style><div class=\"dbg-shell\"><div class=\"dbg-head\"><div><span class=\"dbg-kicker\">BATTLE DEBUG</span><h3>Team ${teamIndex+1} · Run ${runIndex+1}</h3><div class=\"dbg-sub\">Death floor ${fmt(run.deathFloor)}</div></div><div class=\"dbg-actions\"><button data-dbg-copy>Copy debug</button><button data-dbg-close>Close</button></div></div><div class=\"dbg-scroll\"><div class=\"dbg-matchup\">${matchTeam(d?.initialEnemies,'ENEMY TEAM','enemy')}<div class=\"dbg-match-vs\">VS</div>${matchTeam(d?.initialAllies,'YOUR TEAM','player')}</div>${auraLine()}<div data-dbg-timeline></div></div></div>`;"
html = replaceOrThrow(html, oldDialog, newDialog, 'debug dialog header and matchup')

html = replaceOrThrow(
  html,
  "    const timeline=dialog.querySelector('[data-dbg-timeline]'),toggle=dialog.querySelector('[data-dbg-abilities]'),copy=dialog.querySelector('[data-dbg-copy]'),close=dialog.querySelector('[data-dbg-close]');\n    const repaint=()=>{toggle.textContent=`Ability interactions: ${showAbilities?'ON':'OFF'}`;toggle.classList.toggle('on',showAbilities);timeline.innerHTML=buildTimeline()};\n    repaint();dialog.showModal();\n    toggle.addEventListener('click',()=>{showAbilities=!showAbilities;repaint()});",
  "    const timeline=dialog.querySelector('[data-dbg-timeline]'),copy=dialog.querySelector('[data-dbg-copy]'),close=dialog.querySelector('[data-dbg-close]');\n    timeline.innerHTML=buildTimeline();\n    dialog.showModal();",
  'remove ability toggle behavior',
)

fs.writeFileSync('index.html', html)
console.log('Patched battle debug UI and expanded ability interaction logging.')

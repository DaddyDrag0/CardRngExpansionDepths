from pathlib import Path

p = Path('src/engine/battle-v2.ts')
s = p.read_text()

def rep(old: str, new: str):
    global s
    if old not in s:
        raise SystemExit('battle patch anchor not found:\n' + old[:550])
    s = s.replace(old, new, 1)

rep(
    "  'Deadly Ambush',\n])",
    "  'Deadly Ambush', 'Erosion', 'Divination', 'Insatiable', 'Poke the Beast',\n  'Full Moon', 'Unholy Creature', 'The Underworld', 'Devilish', 'Chaos Destruction',\n])",
)

rep(
    "function ability(card: CombatCard | undefined): string | null {\n  return card?.definition.ability || null\n}",
    "function ability(card: CombatCard | undefined): string | null {\n  return card?.abilityOverride ?? card?.definition.ability ?? null\n}",
)

rep(
    "function clearStatuses(card: CombatCard) {\n  card.status.stunned = 0",
    "function clearSkillAura(runtime: Runtime, team: BattleTeam) {\n  const boosts = runtime.state.boosts[team]\n  runtime.state.boosts[team] = {\n    statAuraName: boosts.statAuraName,\n    statAuraValue: boosts.statAuraValue,\n    fossils: boosts.fossils || 0,\n  }\n}\n\nfunction clearStatuses(card: CombatCard) {\n  card.status.stunned = 0",
)

rep(
    "  const name = ability(card)\n  if (!name) return\n\n  switch (name) {",
    "  let name = ability(card)\n  if (!name) return\n\n  if (name === 'The Underworld') {\n    const copied = [...runtime.state.fallen[card.team]].reverse()\n      .map((fallen) => ability(fallen))\n      .find((candidate) => candidate && candidate !== 'The Underworld')\n    if (copied) {\n      card.abilityOverride = copied\n      card.entered = false\n      onEntry(runtime, card)\n      return\n    }\n  }\n\n  switch (name) {",
)

rep(
    "    case 'Divine Mist':\n      if (rand(runtime, card.team) < 0.7) {",
    "    case 'Erosion':\n      if (rand(runtime, card.team) < 0.5) clearSkillAura(runtime, enemyTeam)\n      break\n    case 'Divination':\n      card.counters.divinationMoves = 5\n      break\n    case 'Divine Mist':\n      if (rand(runtime, card.team) < 0.7) {",
)

rep(
    "    'Holy Wrath','Unlucky','Dragon Slayer','Frozen Wrath','Absolute Apex',\n    'Dark Qi Manipulation',\n  ].includes(name)) special = true",
    "    'Holy Wrath','Unlucky','Dragon Slayer','Frozen Wrath','Absolute Apex',\n    'Dark Qi Manipulation','Chaos Destruction',\n  ].includes(name)) special = true",
)

rep(
    "    case 'Absolute Apex': damage *= 1.5; break\n    case 'Dark Qi Manipulation': if (attacker.flags.awakened) damage *= 2; break",
    "    case 'Absolute Apex': damage *= 1.5; break\n    case 'Chaos Destruction': if (attacker.flags.chaosTriple) { damage *= 3; attacker.flags.chaosTriple = false }; break\n    case 'Dark Qi Manipulation': if (attacker.flags.awakened) damage *= 2; break",
)

rep(
    "    case 'Last Meal':\n      if (damage > 0) {",
    "    case 'Poke the Beast':\n      if (damage > 0 && !statusProtected(runtime, attacker.team)) attacker.status.burn = Math.max(attacker.status.burn, 2)\n      break\n    case 'Last Meal':\n      if (damage > 0) {",
)

rep(
    "    case 'Unholy Creature': if (!statusProtected(runtime, target.team)) target.counters.poisonPercent = -0.15; break\n    case 'Eclipse':",
    "    case 'Unholy Creature': if (!statusProtected(runtime, target.team)) target.counters.poisonPercent = -0.15; break\n    case 'Insatiable':\n      if (target.hp <= 0 && target !== attacker) {\n        attacker.damage += target.damage * 0.3\n        attacker.maxHp += target.maxHp * 0.3\n        attacker.hp += target.maxHp * 0.3\n        attacker.flags.insatiableAttack = true\n      }\n      break\n    case 'Devilish':\n      if (target.hp <= 0 && target !== attacker) {\n        const converted: CombatCard = {\n          ...target,\n          id: `${attacker.team}:devilish:${runtime.state.turn}:${target.definition.name}`,\n          team: attacker.team,\n          index: runtime.state.teams[attacker.team].length + 1,\n          hp: target.maxHp,\n          entered: false,\n          dead: false,\n          status: { stunned: 0, confused: 0, burn: 0, weakness: false, blind: false, shield: 0 },\n          flags: {},\n          counters: { normalDamage: target.damage },\n        }\n        runtime.state.teams[attacker.team].push(converted)\n      }\n      break\n    case 'Eclipse':",
)

rep(
    "    case 'Doom': if (target.hp > 0 && rand(runtime, attacker.team) > 1 - damage / target.hp) { target.hp = 0; target.flags.sealed = true }; break",
    "    case 'Doom': if (ability(target) !== 'Erosion' && target.hp > 0 && rand(runtime, attacker.team) > 1 - damage / target.hp) { target.hp = 0; target.flags.sealed = true }; break",
)

rep(
    "    case 'Eat The Moon': if (target.hp / target.maxHp < 0.33) target.hp = 0; break\n    case 'Death Embrace': if (target.hp > 0 && rand(runtime, attacker.team) > 1 - damage / target.hp) target.hp = 0; break",
    "    case 'Eat The Moon': if (ability(target) !== 'Erosion' && target.hp / target.maxHp < 0.33) target.hp = 0; break\n    case 'Death Embrace': if (ability(target) !== 'Erosion' && target.hp > 0 && rand(runtime, attacker.team) > 1 - damage / target.hp) target.hp = 0; break",
)

rep(
    "  if (statusProtected(runtime, target.team)) clearStatuses(target)\n  if (target.status.weakness) damage *= 1.3",
    "  if (statusProtected(runtime, target.team)) clearStatuses(target)\n  if (hasAbility(runtime, target, 'Erosion') && off.special && damage >= target.hp) damage = Math.max(0, target.hp - 1)\n  if (target.status.weakness) damage *= 1.3",
)

rep(
    "      if (hasAbility(runtime, card, 'Paradox') && !card.flags.paradox) {",
    "      if (hasAbility(runtime, card, 'Unholy Creature')) {\n        if (!card.flags.unholyActive) {\n          card.flags.unholyActive = true\n          card.counters.unholyTurns = 2\n          card.hp = 1\n          changed = true\n          continue\n        }\n        if ((card.counters.unholyTurns || 0) > 0) {\n          card.hp = 1\n          changed = true\n          continue\n        }\n      }\n\n      if (hasAbility(runtime, card, 'Paradox') && !card.flags.paradox) {",
)

rep(
    "  if (ability(attacker) === 'Final Tail') {\n    attacker.counters.finalTail = (attacker.counters.finalTail || 0) + 1\n    if (attacker.counters.finalTail >= 3) attacker.hp = 0\n  }",
    "  if (ability(attacker) === 'Final Tail') {\n    attacker.counters.finalTail = (attacker.counters.finalTail || 0) + 1\n    if (attacker.counters.finalTail >= 3) attacker.hp = 0\n  }\n  if (attacker.flags.unholyActive) {\n    attacker.counters.unholyTurns = Math.max(0, (attacker.counters.unholyTurns || 0) - 1)\n    if ((attacker.counters.unholyTurns || 0) <= 0) attacker.hp = 0\n  }",
)

rep(
    "function prepareTurn(runtime: Runtime, attacker: CombatCard) {\n  if (hasAbility(runtime, attacker, 'Dark Qi Manipulation')",
    "function prepareTurn(runtime: Runtime, attacker: CombatCard) {\n  if (hasAbility(runtime, attacker, 'Full Moon')) {\n    attacker.counters.fullMoon = (attacker.counters.fullMoon || 0) + 1\n    if (attacker.counters.fullMoon % 2 === 0) {\n      const target = active(runtime, OTHER_TEAM[attacker.team])\n      if (target && alive(target)) dealDamage(runtime, target, target)\n    }\n  }\n  if (hasAbility(runtime, attacker, 'Dark Qi Manipulation')",
)

rep(
    "  beforeAttack(runtime, attacker)\n\n  if (canNormalAttack(attacker)) {",
    "  beforeAttack(runtime, attacker)\n\n  if (hasAbility(runtime, attacker, 'Chaos Destruction') && rand(runtime, attacker.team) > 0.5) {\n    const deck = runtime.state.teams[enemyTeam]\n    if (deck.length > 1) {\n      const swapIndex = 1 + Math.floor(runtime.rng.next() * (deck.length - 1))\n      ;[deck[0], deck[swapIndex]] = [deck[swapIndex], deck[0]]\n      target = deck[0]\n      onEntry(runtime, target)\n      resolveDeaths(runtime)\n    }\n    attacker.flags.chaosTriple = true\n  }\n\n  if (canNormalAttack(attacker)) {",
)

rep(
    "      dealDamage(runtime, attacker, target)\n      if (hasAbility(runtime, attacker, 'Black Flash')",
    "      dealDamage(runtime, attacker, target)\n      resolveDeaths(runtime)\n      while (attacker.flags.insatiableAttack && alive(attacker) && active(runtime, enemyTeam)) {\n        attacker.flags.insatiableAttack = false\n        dealDamage(runtime, attacker, active(runtime, enemyTeam)!)\n        resolveDeaths(runtime)\n      }\n      if (hasAbility(runtime, attacker, 'Black Flash')",
)

rep(
    "      || hasAbility(runtime, currentTarget, 'Stolen Spotlight')\n      || (hasAbility(runtime, currentTarget, 'Absolute Apex')",
    "      || hasAbility(runtime, currentTarget, 'Stolen Spotlight')\n      || hasAbility(runtime, currentTarget, 'Poke the Beast')\n      || (hasAbility(runtime, currentTarget, 'Absolute Apex')",
)

rep(
    "function growHiddenInDepths(runtime: Runtime, moving: BattleTeam) {",
    "function processDivination(runtime: Runtime) {\n  const allCards = [\n    ...runtime.state.teams.Allies, ...runtime.state.fallen.Allies,\n    ...runtime.state.teams.Enemies, ...runtime.state.fallen.Enemies,\n  ]\n  for (const card of allCards) {\n    if (ability(card) !== 'Divination' || card.flags.divinationFired) continue\n    const moves = card.counters.divinationMoves || 0\n    if (moves <= 0) continue\n    card.counters.divinationMoves = moves - 1\n    if (card.counters.divinationMoves <= 0) {\n      card.flags.divinationFired = true\n      const target = active(runtime, OTHER_TEAM[card.team])\n      if (target) {\n        dealDamage(runtime, card, target, 3, true)\n        resolveDeaths(runtime)\n      }\n    }\n  }\n}\n\nfunction growHiddenInDepths(runtime: Runtime, moving: BattleTeam) {",
)

rep(
    "    doTurn(runtime, attacker)\n    growHiddenInDepths(runtime, state.moving)",
    "    doTurn(runtime, attacker)\n    processDivination(runtime)\n    growHiddenInDepths(runtime, state.moving)",
)

# Full Moon can kill the opponent before statusStart; refresh the target after prepareTurn.
rep(
    "  prepareTurn(runtime, attacker)\n  statusStart(runtime, attacker, target)\n  resolveDeaths(runtime)\n  if (!alive(attacker)) return\n  target = active(runtime, enemyTeam)\n  if (!target) return",
    "  prepareTurn(runtime, attacker)\n  resolveDeaths(runtime)\n  if (!alive(attacker)) return\n  target = active(runtime, enemyTeam)\n  if (!target) return\n  statusStart(runtime, attacker, target)\n  resolveDeaths(runtime)\n  if (!alive(attacker)) return\n  target = active(runtime, enemyTeam)\n  if (!target) return",
)

p.write_text(s)

p = Path('src/engine/support.ts')
s = p.read_text()
old = "  'Deadly Ambush',\n])"
new = "  'Deadly Ambush', 'Erosion', 'Divination', 'Insatiable', 'Poke the Beast',\n  'Full Moon', 'Unholy Creature', 'The Underworld', 'Devilish', 'Chaos Destruction',\n])"
if old not in s:
    raise SystemExit('support patch anchor not found')
p.write_text(s.replace(old, new, 1))

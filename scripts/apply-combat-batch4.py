from pathlib import Path

p = Path('src/engine/battle-v2.ts')
s = p.read_text()

def rep(old: str, new: str):
    global s
    if old not in s:
        raise SystemExit('battle patch anchor not found:\n' + old[:500])
    s = s.replace(old, new, 1)

rep(
    "  'Limitless', \"Monkey King's Rage\",\n])",
    "  'Limitless', \"Monkey King's Rage\",\n  'A Pair of Two', 'Final Stand', 'Heard but not Seen', 'Lights Way', 'Eclipse',\n  'Friendship', 'Fusion... HA!', 'Divine Mist', 'Dark Qi Manipulation',\n  'Immortal Ascension', 'Hard Boiled', 'Tyrannospirit', 'Absolute Apex', 'Last Meal',\n  'Stolen Spotlight', 'Horned Attack', 'Creep', 'Protection of Gods', 'Upheaval',\n  'Deadly Ambush',\n])",
)

rep(
    "const BENCH_AFFECTING_UNSUPPORTED = new Set([\n  'Nightmare Melody', 'Protection of Gods', 'Creep', 'Water Shield of Xuanwu',\n  'Draconian', 'Mirror Image', 'Beyond The Grave', 'Better Days', 'Playing God',\n])",
    "const BENCH_AFFECTING_UNSUPPORTED = new Set([\n  'Nightmare Melody', 'Water Shield of Xuanwu', 'Draconian', 'Mirror Image',\n  'Beyond The Grave', 'Better Days', 'Playing God',\n])",
)

rep(
    "function boostStats(card: CombatCard, mult: number) {\n  card.damage *= mult\n  card.maxHp *= mult\n  card.hp *= mult\n}\n",
    "function boostStats(card: CombatCard, mult: number) {\n  card.damage *= mult\n  card.maxHp *= mult\n  card.hp *= mult\n}\n\nfunction statusProtected(runtime: Runtime, team: BattleTeam): boolean {\n  return runtime.state.teams[team].some((card) =>\n    !card.dead && !card.flags.sealed && ability(card) === 'Protection of Gods'\n  )\n}\n\nfunction clearStatuses(card: CombatCard) {\n  card.status.stunned = 0\n  card.status.confused = 0\n  card.status.burn = 0\n  card.status.weakness = false\n  card.status.blind = false\n  card.counters.bleed = 0\n  card.counters.frostbite = 0\n  card.counters.poisonFlat = 0\n  card.counters.poisonPercent = 0\n  card.counters.weaknessTurns = 0\n}\n",
)

rep(
    "  const boosts: Record<BattleTeam, BattleBoosts> = { Allies: {}, Enemies: {} }\n  const skill = buildSkillAuraBoosts(loadout.abilityAura)\n  boosts.Allies = { ...skill.boosts }",
    "  const boosts: Record<BattleTeam, BattleBoosts> = { Allies: { fossils: 0 }, Enemies: { fossils: 0 } }\n  const skill = buildSkillAuraBoosts(loadout.abilityAura)\n  boosts.Allies = { fossils: 0, ...skill.boosts }",
)

rep(
    "    case 'Remembrance': {\n      const count = runtime.state.fallen[card.team].length\n      if (count) boostStats(card, Math.pow(1.5, count))\n      break\n    }",
    "    case 'Remembrance': {\n      const count = runtime.state.fallen[card.team].length\n      if (count) boostStats(card, Math.pow(1.5, count))\n      break\n    }\n    case 'Friendship': {\n      const unique = new Set(\n        [...runtime.state.teams[card.team], ...runtime.state.fallen[card.team]]\n          .filter((ally) => ability(ally) === 'Friendship')\n          .map((ally) => ally.definition.name),\n      ).size\n      if (unique > 0) boostStats(card, 1 + unique * 0.4)\n      break\n    }",
)

rep(
    "    case 'Book of Death':\n      enemy.counters.death = 2\n      break",
    "    case 'Book of Death':\n      enemy.counters.death = 2\n      break\n    case 'Divine Mist':\n      if (rand(runtime, card.team) < 0.7) {\n        const hp = getHealth(enemy.definition, [])\n        enemy.power = getPower(enemy.definition, [])\n        enemy.damage = getAttack(enemy.definition, [])\n        enemy.maxHp = hp\n        enemy.hp = hp\n      }\n      break",
)

rep(
    "    case 'Fury of the White Tiger':\n      card.damage *= 3\n      break",
    "    case 'Fury of the White Tiger':\n      card.damage *= 3\n      break\n    case 'Tyrannospirit': {\n      const fossils = runtime.state.boosts[card.team].fossils || 0\n      if (fossils > 0) card.damage *= Math.pow(1.5, fossils)\n      break\n    }",
)

rep(
    "    case 'Red-Nosed Reindeer':\n      enemy.status.blind = true\n      break",
    "    case 'Red-Nosed Reindeer':\n      if (!statusProtected(runtime, enemy.team)) enemy.status.blind = true\n      break",
)

rep(
    "    case 'A Pair of Two':\n      if (!card.flags.paired) {",
    "    case 'Stolen Spotlight': {\n      const deck = runtime.state.teams[card.team]\n      const behind = deck[1]\n      if (behind && behind !== card) {\n        card.damage += behind.damage\n        card.maxHp += behind.maxHp\n        card.hp += Math.max(0, behind.hp)\n        deck.splice(1, 1)\n        behind.dead = true\n      }\n      break\n    }\n    case 'A Pair of Two':\n      if (!card.flags.paired) {",
)

rep(
    "    case 'First Blood':\n      performEntryAttack(runtime, card, 0.5)\n      break\n    case 'Fight Dirty':\n    case 'Quick Strike':\n    case 'Horned Attack':\n    case 'Heart Hunter':\n      performEntryAttack(runtime, card, 1)\n      if (name === 'Heart Hunter' && active(runtime, enemyTeam)) active(runtime, enemyTeam)!.counters.bleed = 100\n      break",
    "    case 'First Blood':\n      performEntryAttack(runtime, card, 0.5)\n      break\n    case 'Deadly Ambush': {\n      const first = active(runtime, enemyTeam)\n      if (first) {\n        dealDamage(runtime, card, first)\n        const current = active(runtime, enemyTeam)\n        if (current && !statusProtected(runtime, current.team)) current.counters.poisonPercent = -0.15\n        resolveDeaths(runtime)\n      }\n      break\n    }\n    case 'Horned Attack': {\n      const first = active(runtime, enemyTeam)\n      if (first) {\n        const hpBefore = first.hp\n        const dealt = dealDamage(runtime, card, first)\n        resolveDeaths(runtime)\n        if (dealt > hpBefore && first.hp <= 0) {\n          const next = active(runtime, enemyTeam)\n          if (next) next.hp -= Math.min(next.hp, dealt - hpBefore)\n          resolveDeaths(runtime)\n        }\n      }\n      break\n    }\n    case 'Fight Dirty':\n    case 'Quick Strike':\n    case 'Heart Hunter':\n      performEntryAttack(runtime, card, 1)\n      if (name === 'Heart Hunter' && active(runtime, enemyTeam)) active(runtime, enemyTeam)!.counters.bleed = 100\n      break",
)

rep(
    "    'Holy Wrath','Unlucky','Dragon Slayer','Frozen Wrath',\n  ].includes(name)) special = true",
    "    'Holy Wrath','Unlucky','Dragon Slayer','Frozen Wrath','Absolute Apex',\n    'Dark Qi Manipulation',\n  ].includes(name)) special = true",
)

rep(
    "    case 'True Strike': if (rand(runtime, attacker.team) > 0.5) damage *= 2; break",
    "    case 'True Strike': if (rand(runtime, attacker.team) > 0.5) damage *= 2; break\n    case 'Absolute Apex': damage *= 1.5; break\n    case 'Dark Qi Manipulation': if (attacker.flags.awakened) damage *= 2; break",
)

rep(
    "  switch (name) {\n    case 'Danger Sense':\n      if (!target.flags.dangerSense && damage > target.hp) {\n        target.flags.dangerSense = true",
    "  switch (name) {\n    case 'Danger Sense':\n    case 'Deadly Ambush':\n      if (!target.flags.dangerSense && damage > target.hp) {\n        target.flags.dangerSense = true",
)

rep(
    "    case 'Apex Predator': damage *= 0.5; break\n    case 'Final Tail': damage = 0; break",
    "    case 'Apex Predator': damage *= 0.5; break\n    case 'Absolute Apex': damage *= 0.5; break\n    case 'Immortal Ascension': if (target.flags.awakened) damage *= 0.5; break\n    case 'Final Tail': damage = 0; break",
)

rep(
    "    case 'Boiling Blood': attacker.status.burn = 3; break\n    case 'Melt': attacker.status.burn += 5; break",
    "    case 'Last Meal':\n      if (damage > 0) {\n        const fossils = runtime.state.boosts[target.team].fossils || 0\n        attacker.counters.death = Math.max(2, 5 - fossils)\n      }\n      break\n    case 'Boiling Blood': if (!statusProtected(runtime, attacker.team)) attacker.status.burn = 3; break\n    case 'Melt': if (!statusProtected(runtime, attacker.team)) attacker.status.burn += 5; break",
)

rep(
    "    case 'Unholy Creature': target.counters.poisonPercent = -0.15; break",
    "    case 'Unholy Creature': if (!statusProtected(runtime, target.team)) target.counters.poisonPercent = -0.15; break\n    case 'Eclipse': if (damage > 0) target.flags.sealed = true; break\n    case 'Dark Qi Manipulation':\n      if (attacker.flags.awakened) {\n        attacker.hp = Math.min(attacker.maxHp, attacker.hp + damage * 0.3)\n        didRegen = true\n        if (target.hp <= 0) boostStats(attacker, 1.5)\n      }\n      break\n    case 'Immortal Ascension':\n      if (attacker.flags.awakened && target.hp <= 0) boostStats(attacker, 1.5)\n      break",
)

rep(
    "  if (target.status.weakness) damage *= 1.3",
    "  if (statusProtected(runtime, target.team)) clearStatuses(target)\n  if (target.status.weakness) damage *= 1.3",
)

rep(
    "  const flame = runtime.state.boosts[attacker.team].flameWizard\n  if (flame && damage > 0 && runtime.rng.next() * 100 < flame) target.status.burn = 2\n  const phantom = runtime.state.boosts[attacker.team].phantom\n  if (phantom && damage > 0 && runtime.rng.next() * 100 < phantom) target.status.stunned = Math.max(1, target.status.stunned)",
    "  const flame = runtime.state.boosts[attacker.team].flameWizard\n  if (!statusProtected(runtime, target.team) && flame && damage > 0 && runtime.rng.next() * 100 < flame) target.status.burn = 2\n  const phantom = runtime.state.boosts[attacker.team].phantom\n  if (!statusProtected(runtime, target.team) && phantom && damage > 0 && runtime.rng.next() * 100 < phantom) target.status.stunned = Math.max(1, target.status.stunned)",
)

rep(
    "  const name = ability(dead)\n\n  if (opponent && alive(opponent) && hasAbility(runtime, opponent, 'Prehistoric Wrath')) opponent.damage *= 2",
    "  const name = ability(dead)\n\n  if (name === 'Hard Boiled') runtime.state.boosts[team].fossils = (runtime.state.boosts[team].fossils || 0) + 3\n  if (name === 'Extinction') runtime.state.boosts[team].fossils = (runtime.state.boosts[team].fossils || 0) + 2\n\n  if (opponent && alive(opponent) && hasAbility(runtime, opponent, 'Prehistoric Wrath')) opponent.damage *= 2",
)

rep(
    "  if (name === 'Tonic') boostStats(next, 1.2)\n  if (name === 'Destiny Sight') next.flags.dodgeLethal = true",
    "  if (name === 'Tonic') boostStats(next, 1.2)\n  if (name === 'Fusion... HA!' && rand(runtime, team) > 0.5) {\n    next.damage += dead.damage * 0.5\n    next.maxHp += dead.maxHp * 0.5\n    next.hp += dead.maxHp * 0.5\n  }\n  if (name === 'Destiny Sight') next.flags.dodgeLethal = true",
)

rep(
    "function statusStart(runtime: Runtime, attacker: CombatCard, target: CombatCard) {\n  if (hasAbility(runtime, target, 'Lightning Strike')",
    "function statusStart(runtime: Runtime, attacker: CombatCard, target: CombatCard) {\n  if (statusProtected(runtime, attacker.team)) clearStatuses(attacker)\n  if (hasAbility(runtime, target, 'Lightning Strike')",
)

rep(
    "function statusEnd(runtime: Runtime, attacker: CombatCard) {\n  if (attacker.status.burn > 0) {",
    "function statusEnd(runtime: Runtime, attacker: CombatCard) {\n  if (statusProtected(runtime, attacker.team)) {\n    clearStatuses(attacker)\n    return\n  }\n  if (attacker.status.burn > 0) {",
)

rep(
    "function prepareTurn(runtime: Runtime, attacker: CombatCard) {\n  if (hasAbility(runtime, attacker, 'First Tail')",
    "function prepareTurn(runtime: Runtime, attacker: CombatCard) {\n  if (hasAbility(runtime, attacker, 'Dark Qi Manipulation') && !attacker.flags.awakened) {\n    attacker.counters.ascension = (attacker.counters.ascension || 0) + 1\n    if (attacker.counters.ascension <= 2) boostStats(attacker, 1.3)\n    else attacker.flags.awakened = true\n  }\n  if (hasAbility(runtime, attacker, 'Immortal Ascension') && !attacker.flags.awakened) {\n    attacker.counters.ascension = (attacker.counters.ascension || 0) + 1\n    if (attacker.counters.ascension <= 2) boostStats(attacker, 1.3)\n    else attacker.flags.awakened = true\n  }\n  if (hasAbility(runtime, attacker, 'Upheaval')) {\n    attacker.counters.upheaval = (attacker.counters.upheaval || 0) + 1\n    if (attacker.counters.upheaval % 3 == 0) {\n      attacker.damage *= 2\n      const target = active(runtime, OTHER_TEAM[attacker.team])\n      if (target && !statusProtected(runtime, target.team)) target.status.stunned = Math.max(1, target.status.stunned)\n    }\n  }\n  if (hasAbility(runtime, attacker, 'First Tail')",
)

rep(
    "  const currentTarget = active(runtime, enemyTeam)\n  if (currentTarget && alive(currentTarget) && alive(attacker)) {",
    "  const creepTarget = active(runtime, enemyTeam)\n  if (creepTarget && alive(attacker)) {\n    for (const creep of runtime.state.teams[attacker.team].slice(1)) {\n      if (hasAbility(runtime, creep, 'Creep') && alive(creep) && active(runtime, enemyTeam)) {\n        dealDamage(runtime, creep, active(runtime, enemyTeam)!, 0.25)\n        resolveDeaths(runtime)\n      }\n    }\n  }\n\n  const currentTarget = active(runtime, enemyTeam)\n  if (currentTarget && alive(currentTarget) && alive(attacker)) {",
)

rep(
    "      || hasAbility(runtime, currentTarget, 'Blood Drinker')\n    if (shouldCounter)",
    "      || hasAbility(runtime, currentTarget, 'Blood Drinker')\n      || hasAbility(runtime, currentTarget, 'Stolen Spotlight')\n      || (hasAbility(runtime, currentTarget, 'Absolute Apex') && (runtime.state.boosts[currentTarget.team].fossils || 0) > 2)\n    if (shouldCounter)",
)

rep(
    "      const next = active(runtime, nextTeam)\n      if (next && next.status.stunned > 0) {",
    "      const next = active(runtime, nextTeam)\n      if (next && statusProtected(runtime, nextTeam)) clearStatuses(next)\n      if (next && next.status.stunned > 0) {",
)

p.write_text(s)

p = Path('src/engine/support.ts')
s = p.read_text()
old = "  'Limitless', \"Monkey King's Rage\",\n])"
new = "  'Limitless', \"Monkey King's Rage\",\n  'A Pair of Two', 'Final Stand', 'Heard but not Seen', 'Lights Way', 'Eclipse',\n  'Friendship', 'Fusion... HA!', 'Divine Mist', 'Dark Qi Manipulation',\n  'Immortal Ascension', 'Hard Boiled', 'Tyrannospirit', 'Absolute Apex', 'Last Meal',\n  'Stolen Spotlight', 'Horned Attack', 'Creep', 'Protection of Gods', 'Upheaval',\n  'Deadly Ambush',\n])"
if old not in s:
    raise SystemExit('support patch anchor not found')
p.write_text(s.replace(old, new, 1))

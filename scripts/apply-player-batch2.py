from pathlib import Path

p = Path('src/engine/battle-v2.ts')
s = p.read_text()

def rep(old: str, new: str):
    global s
    if old not in s:
        raise SystemExit('patch anchor not found:\n' + old[:800])
    s = s.replace(old, new, 1)

# Bring in the Avian King classification for Scarecrow's bird check.
rep(
    "import { DEMON_CARDS, DRAGON_CARDS, IMP_BOOSTED_CARDS, RNG_ABILITIES, UNDEAD_CARDS } from './combat-data'",
    "import { AVIAN_CARDS, DEMON_CARDS, DRAGON_CARDS, IMP_BOOSTED_CARDS, RNG_ABILITIES, UNDEAD_CARDS } from './combat-data'",
)

# Current descriptions are explicit enough for these player-only mechanics.
rep(
    "  'Cosmic Maw', 'Hex', 'Order of the Cosmos', 'Honor',\n])",
    "  'Cosmic Maw', 'Hex', 'Order of the Cosmos', 'Honor',\n  'Gehenna', 'Beyond Comprehension', 'Imminent Doom', 'Dance of Discord',\n  'Snowscape', 'Plague', 'Spook', 'Perish', 'Blood Bath', 'Undying',\n])",
)

# Eternal confusion from Cthulu should not tick down like normal timed confusion.
rep(
    "  let target = originalTarget\n  if (attacker.status.confused > 0 && runtime.rng.next() < 0.5) target = attacker\n  if (attacker.status.confused > 0) attacker.status.confused -= 1\n\n  const frostbiteActiveOnAttack",
    "  let target = originalTarget\n  const confused = attacker.status.confused > 0 || attacker.flags.eternalConfusion\n  const confusionSelfHit = confused && runtime.rng.next() < 0.5\n  if (confusionSelfHit) target = attacker\n  if (attacker.status.confused > 0 && !attacker.flags.eternalConfusion) attacker.status.confused -= 1\n  if (confusionSelfHit) {\n    const observer = active(runtime, OTHER_TEAM[attacker.team])\n    if (observer && hasAbility(runtime, observer, 'Beyond Comprehension')) boostStats(observer, 1.5)\n  }\n\n  const frostbiteActiveOnAttack",
)

# Entry effects.
rep(
    "    case 'Desire':\n      // Desire itself triggers when the opposing card enters; no extra self-entry effect.\n      break",
    "    case 'Beyond Comprehension':\n      if (!statusProtected(runtime, enemy.team)) {\n        enemy.flags.eternalConfusion = true\n        enemy.status.confused = Math.max(enemy.status.confused, 1)\n      }\n      break\n    case 'Dance of Discord': {\n      const deck = runtime.state.teams[enemyTeam]\n      if (deck.length >= 2) {\n        const firstIndex = Math.floor(runtime.rng.next() * deck.length)\n        let secondIndex = Math.floor(runtime.rng.next() * (deck.length - 1))\n        if (secondIndex >= firstIndex) secondIndex += 1\n        const first = deck[firstIndex]\n        const second = deck[secondIndex]\n        ;[first.damage, second.damage] = [second.damage, first.damage]\n        ;[first.maxHp, second.maxHp] = [second.maxHp, first.maxHp]\n        ;[first.hp, second.hp] = [Math.min(second.hp, second.maxHp), Math.min(first.hp, first.maxHp)]\n        boostStats(first, 0.85)\n        boostStats(second, 0.85)\n        ;[deck[firstIndex], deck[secondIndex]] = [deck[secondIndex], deck[firstIndex]]\n      }\n      break\n    }\n    case 'Snowscape': {\n      if (statusProtected(runtime, enemy.team)) break\n      const roll = Math.floor(rand(runtime, card.team) * 3)\n      if (roll <= 0) enemy.counters.frostbite = Math.max(enemy.counters.frostbite || 0, 3)\n      else if (roll === 1) {\n        enemy.flags.slowed = true\n        enemy.counters.slowTurns = Math.max(enemy.counters.slowTurns || 0, 3)\n        enemy.counters.slowed = 0\n      } else enemy.status.stunned = Math.max(enemy.status.stunned, 3)\n      break\n    }\n    case 'Spook':\n      if (AVIAN_CARDS.has(enemy.definition.name) && !statusProtected(runtime, enemy.team)) {\n        enemy.status.confused = Math.max(enemy.status.confused, 3)\n      }\n      break\n    case 'Perish':\n      if (!statusProtected(runtime, enemy.team)) enemy.status.stunned = Math.max(enemy.status.stunned, 1)\n      card.counters.perishTurns = 3\n      break\n    case 'Desire':\n      // Desire itself triggers when the opposing card enters; no extra self-entry effect.\n      break",
)

# Pestilence poisons the attacker when it receives damage.
rep(
    "    case 'Steal Christmas':\n      if (damage > 0 && attacker !== target) stealStats(attacker, target, 0.2)\n      break",
    "    case 'Plague':\n      if (damage > 0 && attacker !== target && !statusProtected(runtime, attacker.team)) {\n        attacker.counters.poisonFlat = Math.max(attacker.counters.poisonFlat || 0, target.damage)\n        attacker.counters.poisonTurns = Math.max(attacker.counters.poisonTurns || 0, 2)\n      }\n      break\n    case 'Steal Christmas':\n      if (damage > 0 && attacker !== target) stealStats(attacker, target, 0.2)\n      break",
)

# Pestilence poisons its target when it deals damage; Undying kills extend its lifespan.
rep(
    "    case 'ConstellarScorpio':\n      if (damage > 0 && !statusProtected(runtime, target.team)) target.counters.poisonFlat = Math.max(target.counters.poisonFlat || 0, attacker.damage)\n      break",
    "    case 'ConstellarScorpio':\n      if (damage > 0 && !statusProtected(runtime, target.team)) target.counters.poisonFlat = Math.max(target.counters.poisonFlat || 0, attacker.damage)\n      break\n    case 'Plague':\n      if (damage > 0 && !statusProtected(runtime, target.team)) {\n        target.counters.poisonFlat = Math.max(target.counters.poisonFlat || 0, attacker.damage)\n        target.counters.poisonTurns = Math.max(target.counters.poisonTurns || 0, 2)\n      }\n      break\n    case 'Undying':\n      if (target.hp <= 0 && attacker.flags.undyingActive) {\n        attacker.counters.undyingTurns = (attacker.counters.undyingTurns || 0) + 1\n      }\n      break",
)

# On-death effects that do not require another living ally to already be at the front.
rep(
    "  if (name === 'Hard Boiled') runtime.state.boosts[team].fossils = (runtime.state.boosts[team].fossils || 0) + 3\n  if (name === 'Extinction') runtime.state.boosts[team].fossils = (runtime.state.boosts[team].fossils || 0) + 2\n\n  if (!next || !name) return",
    "  if (name === 'Hard Boiled') runtime.state.boosts[team].fossils = (runtime.state.boosts[team].fossils || 0) + 3\n  if (name === 'Extinction') runtime.state.boosts[team].fossils = (runtime.state.boosts[team].fossils || 0) + 2\n  if (name === 'Imminent Doom' && opponent && alive(opponent) && !statusProtected(runtime, opponent.team)) {\n    opponent.counters.frostbite = Math.max(opponent.counters.frostbite || 0, 2)\n  }\n  if (name === 'Gehenna') {\n    const reviveCount = runtime.state.fallen[OTHER_TEAM[team]].length\n    const candidates = runtime.state.fallen[team].filter((fallen) => fallen !== dead).slice().reverse().slice(0, reviveCount)\n    const sourceDamage = (dead.counters.normalDamage || dead.damage) * 0.75\n    const sourceHp = (dead.counters.normalMaxHp || dead.maxHp) * 0.75\n    for (const ally of candidates) {\n      const fallenIndex = runtime.state.fallen[team].indexOf(ally)\n      if (fallenIndex >= 0) runtime.state.fallen[team].splice(fallenIndex, 1)\n      ally.dead = false\n      ally.damage = sourceDamage\n      ally.maxHp = sourceHp\n      ally.hp = sourceHp\n      ally.entered = false\n      ally.counters.normalDamage = sourceDamage\n      ally.counters.normalMaxHp = sourceHp\n      runtime.state.teams[team].push(ally)\n    }\n  }\n\n  if (!next || !name) return",
)

# Undying stays in front for one lifespan turn when first killed.
rep(
    "      if (hasAbility(runtime, card, 'Unholy Creature')) {",
    "      if (hasAbility(runtime, card, 'Undying')) {\n        if (!card.flags.undyingActive) {\n          card.flags.undyingActive = true\n          card.counters.undyingTurns = 1\n          card.hp = 1\n          changed = true\n          continue\n        }\n        if ((card.counters.undyingTurns || 0) > 0) {\n          card.hp = 1\n          changed = true\n          continue\n        }\n      }\n\n      if (hasAbility(runtime, card, 'Unholy Creature')) {",
)

# Poison duration cleans up both percent and flat poison; Undying lifespan expires after its own completed turn.
rep(
    "  if ((attacker.counters.poisonTurns || 0) > 0) {\n    attacker.counters.poisonTurns -= 1\n    if (attacker.counters.poisonTurns <= 0) attacker.counters.poisonPercent = 0\n  }",
    "  if ((attacker.counters.poisonTurns || 0) > 0) {\n    attacker.counters.poisonTurns -= 1\n    if (attacker.counters.poisonTurns <= 0) {\n      attacker.counters.poisonPercent = 0\n      attacker.counters.poisonFlat = 0\n    }\n  }",
)
rep(
    "  if (attacker.flags.unholyActive) {\n    attacker.counters.unholyTurns = Math.max(0, (attacker.counters.unholyTurns || 0) - 1)\n    if ((attacker.counters.unholyTurns || 0) <= 0) attacker.hp = 0\n  }",
    "  if (attacker.flags.unholyActive) {\n    attacker.counters.unholyTurns = Math.max(0, (attacker.counters.unholyTurns || 0) - 1)\n    if ((attacker.counters.unholyTurns || 0) <= 0) attacker.hp = 0\n  }\n  if (attacker.flags.undyingActive) {\n    attacker.counters.undyingTurns = Math.max(0, (attacker.counters.undyingTurns || 0) - 1)\n    if ((attacker.counters.undyingTurns || 0) <= 0) attacker.hp = 0\n  }",
)

# Perish countdown and Blood Bath happen before the normal attack.
rep(
    "function prepareTurn(runtime: Runtime, attacker: CombatCard) {\n  if (attacker.flags.naughtyListDrain) boostStats(attacker, 0.9)",
    "function prepareTurn(runtime: Runtime, attacker: CombatCard) {\n  if (hasAbility(runtime, attacker, 'Perish') && (attacker.counters.perishTurns || 0) > 0) {\n    attacker.counters.perishTurns -= 1\n    if (attacker.counters.perishTurns <= 0) {\n      const target = active(runtime, OTHER_TEAM[attacker.team])\n      attacker.hp = 0\n      if (target) target.hp = 0\n      return\n    }\n  }\n  if (attacker.flags.naughtyListDrain) boostStats(attacker, 0.9)",
)
rep(
    "function beforeAttack(runtime: Runtime, attacker: CombatCard) {\n  const target = active(runtime, OTHER_TEAM[attacker.team])\n  if (hasAbility(runtime, attacker, 'Lazy')) {",
    "function beforeAttack(runtime: Runtime, attacker: CombatCard) {\n  const target = active(runtime, OTHER_TEAM[attacker.team])\n  if (target && hasAbility(runtime, attacker, 'Blood Bath')) {\n    const stolen = Math.max(0, target.hp * 0.25)\n    target.hp -= stolen\n    attacker.hp = Math.min(attacker.maxHp, attacker.hp + stolen)\n  }\n  if (hasAbility(runtime, attacker, 'Lazy')) {",
)

# Temporary Snowscape slow expires after three turn opportunities instead of becoming permanent.
rep(
    "      } else if (next && next.flags.slowed) {\n        next.counters.slowed = (next.counters.slowed || 0) + 1\n        if (next.counters.slowed % 2 === 0) state.moving = nextTeam\n      } else {",
    "      } else if (next && next.flags.slowed) {\n        next.counters.slowed = (next.counters.slowed || 0) + 1\n        if ((next.counters.slowTurns || 0) > 0) {\n          next.counters.slowTurns -= 1\n          if (next.counters.slowTurns <= 0) next.flags.slowed = false\n        }\n        if (next.counters.slowed % 2 === 0) state.moving = nextTeam\n      } else {",
)

p.write_text(s)

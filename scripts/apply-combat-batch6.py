from pathlib import Path

p = Path('src/engine/battle-v2.ts')
s = p.read_text()

def rep(old: str, new: str):
    global s
    if old not in s:
        raise SystemExit('battle patch anchor not found:\n' + old[:650])
    s = s.replace(old, new, 1)

rep(
    "  'Full Moon', 'Unholy Creature', 'The Underworld', 'Devilish', 'Chaos Destruction',\n])",
    "  'Full Moon', 'Unholy Creature', 'The Underworld', 'Devilish', 'Chaos Destruction',\n  'Beyond The Grave', 'Creation and Restoration', 'Dispel', 'Healing Miracle',\n  'Laser Gun', 'Lotus Sutra', 'Origin', 'Outshine', 'Pandemic', 'Railgun',\n  'Shiny Steal', 'Water Shield of Xuanwu',\n])",
)

rep(
    "const BENCH_AFFECTING_UNSUPPORTED = new Set([\n  'Nightmare Melody', 'Water Shield of Xuanwu', 'Draconian', 'Mirror Image',\n  'Beyond The Grave', 'Better Days', 'Playing God',\n])",
    "const BENCH_AFFECTING_UNSUPPORTED = new Set([\n  'Nightmare Melody', 'Draconian', 'Mirror Image', 'Better Days', 'Playing God',\n])",
)

rep(
    "function clearStatuses(card: CombatCard) {\n  card.status.stunned = 0",
    "function randomCreatableCard(runtime: Runtime) {\n  const pool = cards.filter((card) => !card.unobtainable && !card.boss && card.rarity > 0)\n  return pool[Math.floor(runtime.rng.next() * pool.length)] || cards[0]\n}\n\nfunction waterShield(runtime: Runtime, team: BattleTeam, target: CombatCard): CombatCard | undefined {\n  return runtime.state.teams[team].find((card) =>\n    card !== target && alive(card) && !card.flags.sealed && ability(card) === 'Water Shield of Xuanwu'\n  )\n}\n\nfunction resetCombatStats(card: CombatCard) {\n  const normalDamage = card.counters.normalDamage\n  const normalMaxHp = card.counters.normalMaxHp\n  if (normalDamage > 0) card.damage = normalDamage\n  if (normalMaxHp > 0) {\n    card.maxHp = normalMaxHp\n    card.hp = Math.min(card.hp, card.maxHp)\n  }\n}\n\nfunction clearStatuses(card: CombatCard) {\n  card.status.stunned = 0",
)

rep(
    "    card.counters.normalDamage = card.damage\n    if (BENCH_AFFECTING_UNSUPPORTED.has(ability(card) || '')) noteUnsupported(state, card)",
    "    card.counters.normalDamage = card.damage\n    card.counters.normalMaxHp = card.maxHp\n    if (BENCH_AFFECTING_UNSUPPORTED.has(ability(card) || '')) noteUnsupported(state, card)",
)

rep(
    "    case 'Divination':\n      card.counters.divinationMoves = 5\n      break",
    "    case 'Divination':\n      card.counters.divinationMoves = 5\n      break\n    case 'Creation and Restoration': {\n      const createdDefinition = randomCreatableCard(runtime)\n      const created: CombatCard = {\n        ...card,\n        id: `${card.team}:created:${runtime.state.turn}:${createdDefinition.name}`,\n        definition: createdDefinition,\n        index: runtime.state.teams[card.team].length + 1,\n        hp: card.hp,\n        maxHp: card.maxHp,\n        damage: card.damage,\n        power: card.power,\n        entered: false,\n        dead: false,\n        abilityOverride: undefined,\n        status: { stunned: 0, confused: 0, burn: 0, weakness: false, blind: false, shield: 0 },\n        flags: {},\n        counters: { normalDamage: card.damage, normalMaxHp: card.maxHp },\n      }\n      runtime.state.teams[card.team].push(created)\n      break\n    }\n    case 'Dispel':\n      resetCombatStats(enemy)\n      break\n    case 'Pandemic':\n      for (const target of runtime.state.teams[enemyTeam]) {\n        if (statusProtected(runtime, target.team)) continue\n        target.counters.poisonPercent = Math.min(target.counters.poisonPercent || 0, -0.075)\n        target.counters.poisonTurns = Math.max(target.counters.poisonTurns || 0, 2)\n      }\n      break",
)

rep(
    "  damage = Number.isFinite(damage) ? Math.ceil(damage) : target.hp\n\n  const farm = resolveAuraFarm(runtime, target, damage)",
    "  damage = Number.isFinite(damage) ? Math.ceil(damage) : target.hp\n\n  const xuanwu = damage > 0 ? waterShield(runtime, target.team, target) : undefined\n  if (xuanwu) {\n    const redirected = Math.ceil(damage * 0.5)\n    damage -= redirected\n    xuanwu.hp -= Math.min(xuanwu.hp, redirected)\n  }\n\n  const farm = resolveAuraFarm(runtime, target, damage)",
)

rep(
    "  if (hasAbility(runtime, attacker, 'Disarm') && damage > 0) target.damage = Math.max(0, target.damage - damage * 0.4)",
    "  if (hasAbility(runtime, attacker, 'Disarm') && damage > 0) target.damage = Math.max(0, target.damage - damage * 0.4)\n  if (hasAbility(runtime, attacker, 'Shiny Steal') && damage > 0 && target !== attacker) {\n    const stolenDamage = target.damage * 0.1\n    const stolenHp = target.maxHp * 0.1\n    target.damage = Math.max(0, target.damage - stolenDamage)\n    target.maxHp = Math.max(1, target.maxHp - stolenHp)\n    target.hp = Math.min(target.hp, target.maxHp)\n    attacker.damage += stolenDamage\n    attacker.maxHp += stolenHp\n    attacker.hp += stolenHp\n  }",
)

rep(
    "      runtime.state.fallen[team].push(card)\n      const opponent = active(runtime, OTHER_TEAM[team])\n      applyOnDeath(runtime, card, opponent)\n      changed = true",
    "      runtime.state.fallen[team].push(card)\n      const opponent = active(runtime, OTHER_TEAM[team])\n      applyOnDeath(runtime, card, opponent)\n\n      // Beyond The Grave is a bench/death trigger: a dead holder returns at half HP when a different ally dies.\n      const revenants = runtime.state.fallen[team].filter((fallen) =>\n        fallen !== card && ability(fallen) === 'Beyond The Grave' && fallen.hp <= 0\n      )\n      for (const revenant of revenants) {\n        const fallenIndex = runtime.state.fallen[team].indexOf(revenant)\n        if (fallenIndex >= 0) runtime.state.fallen[team].splice(fallenIndex, 1)\n        revenant.dead = false\n        revenant.hp = revenant.maxHp * 0.5\n        revenant.entered = false\n        runtime.state.teams[team].unshift(revenant)\n      }\n      changed = true",
)

rep(
    "  const poisonPercent = attacker.counters.poisonPercent || 0\n  const poisonFlat = attacker.counters.poisonFlat || 0\n  if (poisonPercent) attacker.hp = Math.max(0, attacker.hp + poisonPercent * attacker.maxHp)\n  else if (poisonFlat) attacker.hp = Math.max(0, attacker.hp - poisonFlat)",
    "  const poisonPercent = attacker.counters.poisonPercent || 0\n  const poisonFlat = attacker.counters.poisonFlat || 0\n  if (poisonPercent) attacker.hp = Math.max(0, attacker.hp + poisonPercent * attacker.maxHp)\n  else if (poisonFlat) attacker.hp = Math.max(0, attacker.hp - poisonFlat)",
)

rep(
    "  if ((attacker.counters.bleed || 0) > 0) {\n    attacker.hp -= attacker.maxHp * 0.15\n    attacker.counters.bleed -= 1\n  }",
    "  if ((attacker.counters.bleed || 0) > 0) {\n    attacker.hp -= attacker.maxHp * 0.15\n    attacker.counters.bleed -= 1\n  }\n  if ((attacker.counters.poisonTurns || 0) > 0) {\n    attacker.counters.poisonTurns -= 1\n    if (attacker.counters.poisonTurns <= 0) attacker.counters.poisonPercent = 0\n  }",
)

rep(
    "function canNormalAttack(attacker: CombatCard): boolean {\n  const name = ability(attacker)\n  if (name === 'Meow' || name === 'Never Forgotten') return false",
    "function canNormalAttack(attacker: CombatCard): boolean {\n  const name = ability(attacker)\n  if (name === 'Meow' || name === 'Never Forgotten' || name === 'Origin' || name === 'Laser Gun' || name === 'Lotus Sutra') return false",
)

marker = "function doTurn(runtime: Runtime, attacker: CombatCard) {"
helper = r'''function doLotusSutra(runtime: Runtime, attacker: CombatCard) {
  const fallen = runtime.state.fallen[attacker.team]
  const deadAlly = [...fallen].reverse().find((card) => card !== attacker)
  if (deadAlly) {
    const index = fallen.indexOf(deadAlly)
    if (index >= 0) fallen.splice(index, 1)
    deadAlly.dead = false
    deadAlly.hp = deadAlly.maxHp * 0.5
    deadAlly.entered = false
    runtime.state.teams[attacker.team].push(deadAlly)
    return
  }

  const allies = runtime.state.teams[attacker.team].filter((card) => card !== attacker && alive(card))
  const target = allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]
  if (!target) return
  target.hp = Math.min(target.maxHp, target.hp + target.maxHp * 0.5)
  if (target.hp >= target.maxHp) {
    const deck = runtime.state.teams[attacker.team]
    const index = deck.indexOf(attacker)
    if (index >= 0 && deck.length > 1) {
      deck.splice(index, 1)
      deck.push(attacker)
    }
  }
}

function doOrigin(runtime: Runtime, attacker: CombatCard) {
  const enemyTeam = OTHER_TEAM[attacker.team]
  for (let hit = 0; hit < 4; hit++) {
    const deck = runtime.state.teams[enemyTeam].filter(alive)
    if (!deck.length || !alive(attacker)) break
    const target = deck[Math.floor(runtime.rng.next() * deck.length)]
    dealDamage(runtime, attacker, target, 0.5)
    resolveDeaths(runtime)
  }
}

function doLaserGun(runtime: Runtime, attacker: CombatCard) {
  if (!attacker.flags.laserCharged) {
    attacker.flags.laserCharged = true
    return
  }
  attacker.flags.laserCharged = false
  const enemyTeam = OTHER_TEAM[attacker.team]
  const targets = Math.min(3, (runtime.state.boosts[attacker.team].fossils || 0) + 1)
  for (const target of runtime.state.teams[enemyTeam].slice(0, targets)) {
    if (!alive(attacker) || !alive(target)) continue
    dealDamage(runtime, attacker, target, 0.75)
  }
  resolveDeaths(runtime)
}

function applyCollateralAfterHit(runtime: Runtime, attacker: CombatCard, target: CombatCard, dealt: number) {
  if (dealt <= 0) return
  const enemyTeam = OTHER_TEAM[attacker.team]

  if (hasAbility(runtime, attacker, 'Railgun')) {
    const splash = Math.ceil(dealt * 0.3)
    for (const enemy of runtime.state.teams[enemyTeam]) {
      if (enemy.hp > 0) enemy.hp -= Math.min(enemy.hp, splash)
    }
  }

  if (hasAbility(runtime, attacker, 'Outshine')) {
    const deck = runtime.state.teams[enemyTeam]
    const index = deck.indexOf(target)
    const next = index >= 0 ? deck[index + 1] : deck[1]
    if (next && next.hp > 0) {
      const before = next.hp
      next.hp -= Math.min(next.hp, dealt)
      if (before > 0 && next.hp <= 0) next.flags.suppressOnDeath = true
    }
  }
}

function processTeamTurnAbilities(runtime: Runtime, movedTeam: BattleTeam, movedCard: CombatCard) {
  const defendingTeam = OTHER_TEAM[movedTeam]
  const dispel = active(runtime, defendingTeam)
  if (dispel && alive(dispel) && hasAbility(runtime, dispel, 'Dispel') && alive(movedCard)) {
    const drained = movedCard.damage * 0.2
    movedCard.damage = Math.max(0, movedCard.damage - drained)
    dispel.hp = Math.min(dispel.maxHp, dispel.hp + drained)
  }

  for (const healer of runtime.state.teams[movedTeam]) {
    if (!alive(healer) || !hasAbility(runtime, healer, 'Healing Miracle') || healer === movedCard) continue
    healer.counters.healingMiracle = (healer.counters.healingMiracle || 0) + 1
    if (healer.counters.healingMiracle >= 3) {
      healer.counters.healingMiracle = 0
      healer.hp = Math.min(healer.maxHp, healer.hp + healer.maxHp)
    }
  }
}

'''
if marker not in s:
    raise SystemExit('doTurn insertion marker not found')
s = s.replace(marker, helper + marker, 1)

rep(
    "  beforeAttack(runtime, attacker)\n\n  if (hasAbility(runtime, attacker, 'Chaos Destruction')",
    "  beforeAttack(runtime, attacker)\n\n  if (hasAbility(runtime, attacker, 'Lotus Sutra')) doLotusSutra(runtime, attacker)\n  else if (hasAbility(runtime, attacker, 'Origin')) doOrigin(runtime, attacker)\n  else if (hasAbility(runtime, attacker, 'Laser Gun')) doLaserGun(runtime, attacker)\n\n  if (hasAbility(runtime, attacker, 'Chaos Destruction')",
)

rep(
    "      dealDamage(runtime, attacker, target)\n      resolveDeaths(runtime)",
    "      const dealt = dealDamage(runtime, attacker, target)\n      applyCollateralAfterHit(runtime, attacker, target, dealt)\n      resolveDeaths(runtime)",
)

# Prevent the generic normal attack block from firing after a replacement-action ability.
rep(
    "  if (canNormalAttack(attacker)) {\n    const { count } = attackCount(attacker)",
    "  if (canNormalAttack(attacker)) {\n    const { count } = attackCount(attacker)",
)

rep(
    "  statusEnd(runtime, attacker)\n  resolveDeaths(runtime)\n}",
    "  statusEnd(runtime, attacker)\n  processTeamTurnAbilities(runtime, attacker.team, attacker)\n  resolveDeaths(runtime)\n}",
)

rep(
    "  if (!next || !name) return\n  if (name === 'Blessing')",
    "  if (!next || !name) return\n  if (dead.flags.suppressOnDeath) return\n  if (name === 'Blessing')",
)

p.write_text(s)

p = Path('src/engine/support.ts')
s = p.read_text()
old = "  'Full Moon', 'Unholy Creature', 'The Underworld', 'Devilish', 'Chaos Destruction',\n])"
new = "  'Full Moon', 'Unholy Creature', 'The Underworld', 'Devilish', 'Chaos Destruction',\n  'Beyond The Grave', 'Creation and Restoration', 'Dispel', 'Healing Miracle',\n  'Laser Gun', 'Lotus Sutra', 'Origin', 'Outshine', 'Pandemic', 'Railgun',\n  'Shiny Steal', 'Water Shield of Xuanwu',\n])"
if old not in s:
    raise SystemExit('support patch anchor not found')
p.write_text(s.replace(old, new, 1))

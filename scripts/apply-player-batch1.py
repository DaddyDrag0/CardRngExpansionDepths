from pathlib import Path

p = Path('src/engine/battle-v2.ts')
s = p.read_text()

def rep(old: str, new: str):
    global s
    if old not in s:
        raise SystemExit('patch anchor not found:\n' + old[:700])
    s = s.replace(old, new, 1)

# Trusted player abilities in this batch. Several already had engine hooks and only needed coverage marking.
rep(
    "  'ConstellarAquarius', 'ConstellarGemini', 'ConstellarTaurus', 'ConstellarCancer',\n])",
    "  'ConstellarAquarius', 'ConstellarGemini', 'ConstellarTaurus', 'ConstellarCancer',\n  'Perseverance', 'Oppressed', 'Dagger Storm', 'Desire', 'Starvation', 'Meow',\n  'Playing God', 'Eternal Voyage', 'Haunt', \"Witch's Curse\", 'Blessing',\n  'Happy Family', 'Lazy', \"Housewife's Blessing\", 'Flames of Rebirth', 'Paradox',\n  'Hatred', 'Naughty or Nice?', 'Naughty List', 'Sacred Judgment', 'Toil',\n  'Never Forgotten', 'Steal Christmas', 'Better Days', 'Pop-Up Impression',\n  'Gobble', 'We Want YOU', 'Bloodlust', 'Flesh Eater', 'Forbidden Banquet',\n  'Cosmic Maw', 'Hex', 'Order of the Cosmos', 'Honor',\n])",
)

# These bench-affecting abilities are now explicitly modeled.
rep(
    "const BENCH_AFFECTING_UNSUPPORTED = new Set([\n  'Nightmare Melody', 'Draconian', 'Mirror Image', 'Better Days', 'Playing God',\n])",
    "const BENCH_AFFECTING_UNSUPPORTED = new Set([\n  'Nightmare Melody', 'Draconian', 'Mirror Image',\n])",
)

# Stat-steal helper used by several player-only abilities.
rep(
    "function boostStats(card: CombatCard, mult: number) {\n  card.damage *= mult\n  card.maxHp *= mult\n  card.hp *= mult\n}\n",
    "function boostStats(card: CombatCard, mult: number) {\n  card.damage *= mult\n  card.maxHp *= mult\n  card.hp *= mult\n}\n\nfunction stealStats(from: CombatCard, to: CombatCard, fraction: number) {\n  const stolenDamage = Math.max(0, from.damage * fraction)\n  const stolenMaxHp = Math.max(0, from.maxHp * fraction)\n  const stolenHp = Math.max(0, from.hp * fraction)\n  from.damage = Math.max(0, from.damage - stolenDamage)\n  from.maxHp = Math.max(1, from.maxHp - stolenMaxHp)\n  from.hp = Math.max(0, Math.min(from.maxHp, from.hp - stolenHp))\n  to.damage += stolenDamage\n  to.maxHp += stolenMaxHp\n  to.hp += stolenHp\n}\n",
)

# Honor cancels every other ability while an Honor card is active. Cosmos is a temporary seal.
rep(
    "function hasAbility(runtime: Runtime, card: CombatCard | undefined, name: string): boolean {\n  if (!card || card.dead || card.flags.sealed || !abilityNames(card).includes(name)) return false\n",
    "function hasAbility(runtime: Runtime, card: CombatCard | undefined, name: string): boolean {\n  if (!card || card.dead || card.flags.sealed || (card.counters.cosmosSeal || 0) > 0 || !abilityNames(card).includes(name)) return false\n  const honorActive = [active(runtime, 'Allies'), active(runtime, 'Enemies')].some((activeCard) =>\n    activeCard && !activeCard.dead && !activeCard.flags.sealed && abilityNames(activeCard).includes('Honor')\n  )\n  if (honorActive && name !== 'Honor') return false\n",
)

# Opposing entry passives: Desire and Cosmic Maw trigger when a new enemy becomes visible.
rep(
    "  card.entered = true\n  noteUnsupported(runtime.state, card)\n  const enemyTeam = OTHER_TEAM[card.team]\n  const enemy = active(runtime, enemyTeam)\n  if (!enemy) return\n",
    "  card.entered = true\n  noteUnsupported(runtime.state, card)\n  const enemyTeam = OTHER_TEAM[card.team]\n  const enemy = active(runtime, enemyTeam)\n  if (!enemy) return\n\n  if (enemy !== card && hasAbility(runtime, enemy, 'Desire')) stealStats(card, enemy, 0.1)\n  if (enemy !== card && hasAbility(runtime, enemy, 'Cosmic Maw')) stealStats(card, enemy, 0.2)\n",
)

# Entry mechanics.
rep(
    "    case 'ConstellarVirgo':\n      card.counters.hpShield = (card.counters.hpShield || 0) + card.maxHp * 2\n      break",
    "    case 'Perseverance':\n      if (!card.flags.perseveranceBoosted) {\n        card.flags.perseveranceBoosted = true\n        card.maxHp *= 100\n        card.hp *= 100\n      }\n      break\n    case 'ConstellarVirgo':\n      card.counters.hpShield = (card.counters.hpShield || 0) + card.maxHp * 2\n      break",
)

rep(
    "    case 'Mind Rift':\n      if (card.damage > enemy.damage / 4) enemy.status.confused = 3\n      break",
    "    case 'Desire':\n      // Desire itself triggers when the opposing card enters; no extra self-entry effect.\n      break\n    case 'Cosmic Maw':\n      stealStats(enemy, card, 0.2)\n      break\n    case 'Haunt': {\n      const damageLoss = card.damage * 0.35\n      const hpLoss = card.maxHp * 0.35\n      enemy.damage = Math.max(0, enemy.damage - damageLoss)\n      enemy.maxHp = Math.max(1, enemy.maxHp - hpLoss)\n      enemy.hp = Math.max(0, Math.min(enemy.maxHp, enemy.hp - hpLoss))\n      break\n    }\n    case 'Hex':\n      enemy.flags.noRng = true\n      break\n    case 'Order of the Cosmos':\n      for (const target of runtime.state.teams[enemyTeam]) target.counters.cosmosSeal = Math.max(target.counters.cosmosSeal || 0, 3)\n      break\n    case 'Mind Rift':\n      if (card.damage > enemy.damage / 4) enemy.status.confused = 3\n      break",
)

rep(
    "    case 'Fluffy Aggression':\n      card.damage *= 2\n      break",
    "    case 'Happy Family': {\n      const dads = runtime.state.teams[card.team].filter((ally) => ally !== card && ally.definition.name === 'Dad' && alive(ally))\n      for (const dad of dads) {\n        dad.damage += card.damage\n        dad.maxHp += card.maxHp\n        dad.hp += Math.max(0, card.hp)\n      }\n      card.hp = 0\n      resolveDeaths(runtime)\n      break\n    }\n    case 'Pop-Up Impression':\n      if (!statusProtected(runtime, enemy.team)) enemy.status.confused = Math.max(enemy.status.confused, 2)\n      break\n    case 'Naughty List':\n      for (const ally of runtime.state.teams[card.team]) {\n        if (!alive(ally)) continue\n        boostStats(ally, 1.5)\n        ally.flags.naughtyListDrain = true\n      }\n      break\n    case 'Toil':\n      boostStats(card, 2)\n      break\n    case 'Bloodlust':\n      card.counters.bloodlustBase = card.damage\n      card.damage += card.damage\n      card.flags.bloodlustFirstTurn = true\n      break\n    case 'Fluffy Aggression':\n      card.damage *= 2\n      break",
)

rep(
    "    case 'Stardust Driver':\n      performEntryAttack(runtime, card, 2.5)\n      break",
    "    case 'Sacred Judgment': {\n      const targets = [...runtime.state.teams[enemyTeam]]\n      for (const target of targets) {\n        if (!alive(card) || !alive(target)) continue\n        dealDamage(runtime, card, target)\n        resolveDeaths(runtime)\n      }\n      break\n    }\n    case 'Stardust Driver':\n      performEntryAttack(runtime, card, 2.5)\n      break",
)

# Dagger Storm and Naughty/Nice are replacement attack patterns.
rep(
    "function canNormalAttack(runtime: Runtime, attacker: CombatCard): boolean {\n  if (hasAbility(runtime, attacker, 'Meow') || hasAbility(runtime, attacker, 'Never Forgotten')",
    "function canNormalAttack(runtime: Runtime, attacker: CombatCard): boolean {\n  if (hasAbility(runtime, attacker, 'Dagger Storm') || hasAbility(runtime, attacker, 'Naughty or Nice?')\n    || hasAbility(runtime, attacker, 'Meow') || hasAbility(runtime, attacker, 'Never Forgotten')",
)

marker = "function doTurn(runtime: Runtime, attacker: CombatCard) {"
helpers = '''function doDaggerStorm(runtime: Runtime, attacker: CombatCard) {
  const enemyTeam = OTHER_TEAM[attacker.team]
  for (const mult of [0.5, 1, 2]) {
    const target = active(runtime, enemyTeam)
    if (!target || !alive(attacker)) break
    dealDamage(runtime, attacker, target, mult)
    resolveDeaths(runtime)
  }
}

function doNaughtyOrNice(runtime: Runtime, attacker: CombatCard) {
  const target = active(runtime, OTHER_TEAM[attacker.team])
  if (!target || !alive(attacker)) return
  if (rand(runtime, attacker.team) < 0.8) {
    dealDamage(runtime, attacker, target, 4)
    resolveDeaths(runtime)
  } else {
    target.hp = Math.min(target.maxHp, target.hp + target.maxHp * 0.5)
  }
}

'''
if marker not in s:
    raise SystemExit('doTurn marker missing')
s = s.replace(marker, helpers + marker, 1)

rep(
    "  if (hasAbility(runtime, attacker, 'Lotus Sutra')) doLotusSutra(runtime, attacker)\n  else if (hasAbility(runtime, attacker, 'Origin')) doOrigin(runtime, attacker)\n  else if (hasAbility(runtime, attacker, 'Laser Gun')) doLaserGun(runtime, attacker)\n",
    "  if (hasAbility(runtime, attacker, 'Lotus Sutra')) doLotusSutra(runtime, attacker)\n  else if (hasAbility(runtime, attacker, 'Origin')) doOrigin(runtime, attacker)\n  else if (hasAbility(runtime, attacker, 'Laser Gun')) doLaserGun(runtime, attacker)\n  else if (hasAbility(runtime, attacker, 'Dagger Storm')) doDaggerStorm(runtime, attacker)\n  else if (hasAbility(runtime, attacker, 'Naughty or Nice?')) doNaughtyOrNice(runtime, attacker)\n",
)

# Each-turn player-only mechanics.
rep(
    "function prepareTurn(runtime: Runtime, attacker: CombatCard) {\n  if (hasAbility(runtime, attacker, 'ConstellarAquarius')) {",
    "function prepareTurn(runtime: Runtime, attacker: CombatCard) {\n  if (attacker.flags.naughtyListDrain) boostStats(attacker, 0.9)\n  if (hasAbility(runtime, attacker, 'Toil')) boostStats(attacker, 0.85)\n  if (hasAbility(runtime, attacker, 'Bloodlust')) {\n    if (attacker.flags.bloodlustFirstTurn) attacker.flags.bloodlustFirstTurn = false\n    else attacker.damage += attacker.counters.bloodlustBase || 0\n  }\n  if (hasAbility(runtime, attacker, 'ConstellarAquarius')) {",
)

rep(
    "function beforeAttack(runtime: Runtime, attacker: CombatCard) {\n  const target = active(runtime, OTHER_TEAM[attacker.team])\n",
    "function beforeAttack(runtime: Runtime, attacker: CombatCard) {\n  const target = active(runtime, OTHER_TEAM[attacker.team])\n  if (hasAbility(runtime, attacker, 'Lazy')) {\n    attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.damage * 2)\n    attacker.damage *= 0.9\n  }\n  if (target && hasAbility(runtime, attacker, 'Forbidden Banquet')) stealStats(target, attacker, 0.15)\n",
)

# Offensive after-hit/kill player mechanics.
rep(
    "    case 'ConstellarScorpio':\n      if (damage > 0 && !statusProtected(runtime, target.team)) target.counters.poisonFlat = Math.max(target.counters.poisonFlat || 0, attacker.damage)\n      break",
    "    case 'ConstellarScorpio':\n      if (damage > 0 && !statusProtected(runtime, target.team)) target.counters.poisonFlat = Math.max(target.counters.poisonFlat || 0, attacker.damage)\n      break\n    case \"Witch's Curse\":\n      if (damage > 0 && !attacker.flags.witchCurseStolen) {\n        const stolen = ability(target)\n        if (stolen && stolen !== \"Witch's Curse\") {\n          attacker.flags.witchCurseStolen = true\n          attacker.abilityOverride = stolen\n        }\n      }\n      break\n    case 'Flesh Eater':\n      if (damage > 0) {\n        const gain = damage * 0.25\n        attacker.hp = Math.min(attacker.maxHp, attacker.hp + gain)\n        attacker.damage += gain\n      }\n      break\n    case 'Gobble':\n      if (target.hp <= 0 && target !== attacker) {\n        attacker.damage += target.damage * 0.5\n        attacker.maxHp += target.maxHp * 0.5\n        attacker.hp = Math.min(attacker.maxHp, attacker.hp + target.maxHp * 0.5 + attacker.maxHp * 0.3)\n      }\n      break\n    case 'Playing God':\n      if (target.hp <= 0 && target !== attacker) {\n        const frankenstein = definition('Frankenstein')\n        if (frankenstein) {\n          const created: CombatCard = {\n            ...attacker,\n            id: `${attacker.team}:frankenstein:${runtime.state.turn}:${runtime.state.teams[attacker.team].length}`,\n            definition: frankenstein,\n            index: runtime.state.teams[attacker.team].length + 1,\n            hp: attacker.maxHp,\n            maxHp: attacker.maxHp,\n            damage: attacker.damage,\n            entered: false,\n            dead: false,\n            abilityOverride: undefined,\n            bonusAbilities: undefined,\n            status: { stunned: 0, confused: 0, burn: 0, weakness: false, blind: false, shield: 0 },\n            flags: {},\n            counters: { normalDamage: attacker.damage, normalMaxHp: attacker.maxHp },\n          }\n          runtime.state.teams[attacker.team].push(created)\n        }\n      }\n      break\n    case 'Forbidden Banquet':\n      if (target.hp <= 0 && !attacker.flags.banquetStolen) {\n        const stolen = ability(target)\n        if (stolen && stolen !== 'Forbidden Banquet') {\n          attacker.flags.banquetStolen = true\n          attacker.abilityOverride = stolen\n        }\n      }\n      break",
)

# Defensive after-hit Steal Christmas.
rep(
    "    case 'Poke the Beast':\n      if (damage > 0 && !statusProtected(runtime, attacker.team)) attacker.status.burn = Math.max(attacker.status.burn, 2)\n      break",
    "    case 'Steal Christmas':\n      if (damage > 0 && attacker !== target) stealStats(attacker, target, 0.2)\n      break\n    case 'Poke the Beast':\n      if (damage > 0 && !statusProtected(runtime, attacker.team)) attacker.status.burn = Math.max(attacker.status.burn, 2)\n      break",
)

# On-death transfers/revives.
rep(
    "  if (name === 'Blessing') { next.damage += dead.damage / 2; next.maxHp += dead.maxHp / 2; next.hp += dead.maxHp / 2 }\n",
    "  if (name === 'Blessing') { next.damage += dead.damage / 2; next.maxHp += dead.maxHp / 2; next.hp += dead.maxHp / 2 }\n  if (name === 'Meow') next.damage += (dead.counters.damageTaken || 0) * 1.5\n  if (name === 'Never Forgotten') {\n    const gain = (dead.counters.damageTaken || 0) * 1.25\n    for (const ally of runtime.state.teams[team]) if (alive(ally)) ally.damage += gain\n  }\n  if (name === 'We Want YOU') {\n    next.damage *= 5\n    next.flags.diesAfterAttack = true\n  }\n  if (name === 'Better Days') {\n    const revive = runtime.state.fallen[team].filter((fallen) => fallen !== dead)\n    for (const ally of revive) {\n      const index = runtime.state.fallen[team].indexOf(ally)\n      if (index >= 0) runtime.state.fallen[team].splice(index, 1)\n      ally.dead = false\n      ally.hp = ally.maxHp\n      ally.entered = false\n      runtime.state.teams[team].push(ally)\n    }\n  }\n",
)

# Eternal Voyage swaps after the attack/counter sequence; We Want YOU's beneficiary dies after attacking.
rep(
    "  if (hasAbility(runtime, attacker, 'Martial Will') && alive(attacker)) attacker.damage *= 1.3\n\n  statusEnd(runtime, attacker)",
    "  if (hasAbility(runtime, attacker, 'Martial Will') && alive(attacker)) attacker.damage *= 1.3\n\n  if (hasAbility(runtime, attacker, 'Eternal Voyage') && alive(attacker)) {\n    const deck = runtime.state.teams[attacker.team]\n    const selfIndex = deck.indexOf(attacker)\n    const choices = deck.map((_, index) => index).filter((index) => index !== selfIndex)\n    if (selfIndex >= 0 && choices.length) {\n      const swapIndex = choices[Math.floor(runtime.rng.next() * choices.length)]\n      ;[deck[selfIndex], deck[swapIndex]] = [deck[swapIndex], deck[selfIndex]]\n    }\n  }\n\n  if (attacker.flags.diesAfterAttack && alive(attacker)) attacker.hp = 0\n\n  statusEnd(runtime, attacker)",
)

# Temporary Cosmos seals tick down on the sealed card's own completed turn.
rep(
    "  if (attacker.status.weakness && (attacker.counters.weaknessTurns || 0) > 0) {\n    attacker.counters.weaknessTurns -= 1\n    if (attacker.counters.weaknessTurns <= 0) attacker.status.weakness = false\n  }\n}",
    "  if (attacker.status.weakness && (attacker.counters.weaknessTurns || 0) > 0) {\n    attacker.counters.weaknessTurns -= 1\n    if (attacker.counters.weaknessTurns <= 0) attacker.status.weakness = false\n  }\n  if ((attacker.counters.cosmosSeal || 0) > 0) attacker.counters.cosmosSeal -= 1\n}",
)

p.write_text(s)

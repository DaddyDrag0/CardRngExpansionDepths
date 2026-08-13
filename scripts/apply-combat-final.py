from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f'{label} anchor not found:\n{old[:700]}')
    return text.replace(old, new, 1)


p = Path('src/engine/battle-v2.ts')
s = p.read_text()

# Mark the final two top-level abilities plus the internal Astraeus art abilities as implemented.
s = replace_once(
    s,
    "  'Shiny Steal', 'Water Shield of Xuanwu',\n])",
    "  'Shiny Steal', 'Water Shield of Xuanwu', 'Constellar', \"Pandora's Box\",\n  'ConstellarVirgo', 'ConstellarScorpio', 'ConstellarSagittarius',\n  'ConstellarAquarius', 'ConstellarGemini', 'ConstellarTaurus', 'ConstellarCancer',\n])",
    'supported abilities',
)

# Constants for the art variants, dodge detection, and Pandora's actual random ability pool.
needle = "const BENCH_AFFECTING_UNSUPPORTED = new Set([\n  'Nightmare Melody', 'Draconian', 'Mirror Image', 'Better Days', 'Playing God',\n])\n"
insert = needle + "\nconst CONSTELLAR_ABILITIES = [\n  'ConstellarVirgo', 'ConstellarScorpio', 'ConstellarSagittarius',\n  'ConstellarAquarius', 'ConstellarGemini', 'ConstellarTaurus', 'ConstellarCancer',\n] as const\n\nconst DODGE_ABILITIES = new Set([\n  'Danger Sense', 'Deadly Ambush', 'Evasion', 'Untouchable', 'Guerilla Warfare',\n  'The Loser', 'Invisibility', 'Limitless', 'Transcend Time', 'Snowbound',\n  'Sky Drop', 'Shadow Predator', 'Run As Fast As You Can', 'Heard but not Seen',\n  'Lights Way',\n])\n\nconst GENERAL_MOON_ZOO_ABILITY = cards.find((card) => card.name === 'General Moon Zoo')?.ability\nconst PANDORA_ABILITY_POOL = [...new Set(\n  cards.map((card) => card.ability).filter((name): name is string => Boolean(name)),\n)].filter((name) =>\n  name !== \"Pandora's Box\"\n  && name !== GENERAL_MOON_ZOO_ABILITY\n  && FULLY_SUPPORTED.has(name)\n)\n"
s = replace_once(s, needle, insert, 'ability constants')

# Composite-ability helpers. Pandora keeps its base ability and carries two bonuses.
old = "function ability(card: CombatCard | undefined): string | null {\n  return card?.abilityOverride ?? card?.definition.ability ?? null\n}\n"
new = "function ability(card: CombatCard | undefined): string | null {\n  return card?.abilityOverride ?? card?.definition.ability ?? null\n}\n\nfunction abilityNames(card: CombatCard | undefined): string[] {\n  if (!card) return []\n  return [...new Set([ability(card), ...(card.bonusAbilities || [])].filter((name): name is string => Boolean(name)))]\n}\n\nfunction withAbility<T>(card: CombatCard, name: string, fn: () => T): T {\n  const previous = card.abilityOverride\n  card.abilityOverride = name\n  try {\n    return fn()\n  } finally {\n    card.abilityOverride = previous\n  }\n}\n\nfunction randomConstellarAbility(runtime: Runtime): string {\n  return CONSTELLAR_ABILITIES[Math.floor(runtime.rng.next() * CONSTELLAR_ABILITIES.length)]\n}\n\nfunction resolvePandoraGainedAbility(runtime: Runtime, card: CombatCard, name: string): string {\n  if (name === 'Constellar') return randomConstellarAbility(runtime)\n  if (name === 'The Underworld') {\n    const copied = [...runtime.state.fallen[card.team]].reverse()\n      .flatMap((fallen) => abilityNames(fallen))\n      .find((candidate) => candidate !== 'The Underworld' && candidate !== \"Pandora's Box\")\n    if (copied) return copied\n  }\n  return name\n}\n\nfunction constellarTaurusFactor(card: CombatCard): number {\n  if (card.maxHp <= 0) return 2.5\n  return Math.min(2.5, 1 + (1 - Math.max(0, card.hp) / card.maxHp) * 1.5)\n}\n"
s = replace_once(s, old, new, 'composite ability helpers')

# Bench/passive helpers must see Pandora bonuses too.
s = replace_once(
    s,
    "    !card.dead && !card.flags.sealed && ability(card) === 'Protection of Gods'\n",
    "    !card.dead && !card.flags.sealed && abilityNames(card).includes('Protection of Gods')\n",
    'status protection composite',
)
s = replace_once(
    s,
    "    card !== target && alive(card) && !card.flags.sealed && ability(card) === 'Water Shield of Xuanwu'\n",
    "    card !== target && alive(card) && !card.flags.sealed && abilityNames(card).includes('Water Shield of Xuanwu')\n",
    'water shield composite',
)

old = "function noteUnsupported(state: BattleState, card: CombatCard | undefined) {\n  const name = ability(card)\n  if (name && !FULLY_SUPPORTED.has(name)) state.unsupportedAbilities.add(name)\n}\n\nfunction hasAbility(runtime: Runtime, card: CombatCard | undefined, name: string): boolean {\n  if (!card || card.dead || card.flags.sealed || ability(card) !== name) return false\n  const enemy = runtime.state.boosts[OTHER_TEAM[card.team]]\n  if (enemy.endTimes && runtime.rng.next() < enemy.endTimes / 100) return false\n  return true\n}\n\nfunction rand(runtime: Runtime, team: BattleTeam): number {\n  const activeA = runtime.state.teams.Allies[0]\n  const activeE = runtime.state.teams.Enemies[0]\n  if (ability(activeA) === 'Unlucky' || ability(activeE) === 'Unlucky') return 0\n"
new = "function noteUnsupported(state: BattleState, card: CombatCard | undefined) {\n  for (const name of abilityNames(card)) {\n    if (!FULLY_SUPPORTED.has(name)) state.unsupportedAbilities.add(name)\n  }\n}\n\nfunction hasAbility(runtime: Runtime, card: CombatCard | undefined, name: string): boolean {\n  if (!card || card.dead || card.flags.sealed || !abilityNames(card).includes(name)) return false\n  const enemy = runtime.state.boosts[OTHER_TEAM[card.team]]\n  if (enemy.endTimes && runtime.rng.next() < enemy.endTimes / 100) return false\n  return true\n}\n\nfunction rand(runtime: Runtime, team: BattleTeam): number {\n  const activeA = runtime.state.teams.Allies[0]\n  const activeE = runtime.state.teams.Enemies[0]\n  if (abilityNames(activeA).includes('Unlucky') || abilityNames(activeE).includes('Unlucky')) return 0\n"
s = replace_once(s, old, new, 'unsupported/hasAbility/rand')

# Creation must not accidentally inherit Pandora's bonus list from its creator.
s = replace_once(
    s,
    "        abilityOverride: undefined,\n        status: { stunned: 0, confused: 0, burn: 0, weakness: false, blind: false, shield: 0 },",
    "        abilityOverride: undefined,\n        bonusAbilities: undefined,\n        status: { stunned: 0, confused: 0, burn: 0, weakness: false, blind: false, shield: 0 },",
    'created card bonus reset',
)

# Resolve the inherent Astraeus art before combat so Gemini behaves as a prior-to-battle passive.
marker = "function active(runtime: Runtime, team: BattleTeam) {\n  return runtime.state.teams[team][0]\n}\n"
addition = marker + "\nfunction resolveConstellarArts(runtime: Runtime) {\n  for (const team of ['Allies', 'Enemies'] as BattleTeam[]) {\n    for (const card of runtime.state.teams[team]) {\n      if (card.definition.ability === 'Constellar' && !card.abilityOverride) {\n        card.abilityOverride = randomConstellarAbility(runtime)\n      }\n    }\n    const astraeusCount = runtime.state.teams[team].filter((card) => card.definition.name === 'Astraeus').length\n    for (const card of runtime.state.teams[team]) {\n      if (ability(card) === 'ConstellarGemini' && !card.flags.constellarGeminiApplied) {\n        card.flags.constellarGeminiApplied = true\n        boostStats(card, 1 + astraeusCount * 0.5)\n      }\n    }\n  }\n}\n"
s = replace_once(s, marker, addition, 'constellar prebattle')

# Pandora rolls two distinct abilities on entry. Constellar fallback covers created/copied Astraeus too.
old = "  let name = ability(card)\n  if (!name) return\n\n  if (name === 'The Underworld') {"
new = "  let name = ability(card)\n  if (!name) return\n\n  if (name === \"Pandora's Box\" && !card.flags.pandoraRolled) {\n    card.flags.pandoraRolled = true\n    const chosen: string[] = []\n    let attempts = 0\n    while (chosen.length < 2 && attempts++ < 100 && PANDORA_ABILITY_POOL.length) {\n      const raw = PANDORA_ABILITY_POOL[Math.floor(runtime.rng.next() * PANDORA_ABILITY_POOL.length)]\n      const gained = resolvePandoraGainedAbility(runtime, card, raw)\n      if (gained !== \"Pandora's Box\" && !chosen.includes(gained)) chosen.push(gained)\n    }\n    card.bonusAbilities = chosen\n    for (const gained of chosen) {\n      withAbility(card, gained, () => {\n        card.entered = false\n        onEntry(runtime, card)\n      })\n    }\n    card.entered = true\n    return\n  }\n\n  if (name === 'Constellar') {\n    card.abilityOverride = randomConstellarAbility(runtime)\n    name = ability(card)\n    if (name === 'ConstellarGemini' && !card.flags.constellarGeminiApplied) {\n      card.flags.constellarGeminiApplied = true\n      const count = runtime.state.teams[card.team].filter((ally) => ally.definition.name === 'Astraeus').length\n      boostStats(card, 1 + count * 0.5)\n    }\n    card.entered = false\n    onEntry(runtime, card)\n    return\n  }\n\n  if (name === 'The Underworld') {"
s = replace_once(s, old, new, 'Pandora/Constellar entry')

# Virgo and Gemini entry behavior. Gemini is normally already applied pre-battle; the fallback matters for gained abilities.
s = replace_once(
    s,
    "  switch (name) {\n    case 'Gathering': {",
    "  switch (name) {\n    case 'ConstellarVirgo':\n      card.counters.hpShield = (card.counters.hpShield || 0) + card.maxHp * 2\n      break\n    case 'ConstellarGemini':\n      if (!card.flags.constellarGeminiApplied) {\n        card.flags.constellarGeminiApplied = true\n        const count = runtime.state.teams[card.team].filter((ally) => ally.definition.name === 'Astraeus').length\n        boostStats(card, 1 + count * 0.5)\n      }\n      break\n    case 'Gathering': {",
    'Constellar entry cases',
)

# Pandora's two offensive abilities are evaluated sequentially on the same attack.
old = "function offensive(runtime: Runtime, attacker: CombatCard, target: CombatCard, initial: number): { damage: number; bypass: boolean; special: boolean } {\n  const name = ability(attacker)\n  let damage = initial\n"
new = "function offensive(runtime: Runtime, attacker: CombatCard, target: CombatCard, initial: number): { damage: number; bypass: boolean; special: boolean } {\n  if (ability(attacker) === \"Pandora's Box\" && attacker.bonusAbilities?.length) {\n    let result = { damage: initial, bypass: false, special: false }\n    for (const gained of attacker.bonusAbilities) {\n      const next = withAbility(attacker, gained, () => offensive(runtime, attacker, target, result.damage))\n      result = { damage: next.damage, bypass: result.bypass || next.bypass, special: result.special || next.special }\n    }\n    return result\n  }\n\n  const name = ability(attacker)\n  let damage = initial\n"
s = replace_once(s, old, new, 'Pandora offensive')

s = replace_once(
    s,
    "    'Dark Qi Manipulation','Chaos Destruction',\n  ].includes(name)) special = true",
    "    'Dark Qi Manipulation','Chaos Destruction','ConstellarTaurus','ConstellarSagittarius',\n  ].includes(name)) special = true",
    'Constellar special attack classification',
)
s = replace_once(
    s,
    "    case 'Absolute Apex': damage *= 1.5; break\n",
    "    case 'Absolute Apex': damage *= 1.5; break\n    case 'ConstellarTaurus': damage *= constellarTaurusFactor(attacker); break\n",
    'Taurus offense',
)

# Pandora's defensive bonuses stack; Cancer and Taurus are native Constellar defenses.
old = "function defensive(runtime: Runtime, attacker: CombatCard, target: CombatCard, initial: number): number {\n  const name = ability(target)\n  let damage = initial\n"
new = "function defensive(runtime: Runtime, attacker: CombatCard, target: CombatCard, initial: number): number {\n  if (ability(target) === \"Pandora's Box\" && target.bonusAbilities?.length) {\n    let damage = initial\n    for (const gained of target.bonusAbilities) {\n      damage = withAbility(target, gained, () => defensive(runtime, attacker, target, damage))\n    }\n    return damage\n  }\n\n  const name = ability(target)\n  let damage = initial\n"
s = replace_once(s, old, new, 'Pandora defensive')
s = replace_once(
    s,
    "  switch (name) {\n    case 'Danger Sense':",
    "  switch (name) {\n    case 'ConstellarTaurus': damage /= constellarTaurusFactor(target); break\n    case 'ConstellarCancer': {\n      const threshold = target.counters.cancerThreshold || 1\n      if (threshold > 0 && damage < target.maxHp * threshold) {\n        damage = 0\n        target.counters.cancerThreshold = Math.max(0, threshold - 0.15)\n      }\n      break\n    }\n    case 'Danger Sense':",
    'Constellar defensive cases',
)
# Record whether zero damage came from a real dodge/evasion ability for Sagittarius.
s = replace_once(
    s,
    "  if (name === 'Dominate' && borderTier(target) > borderTier(attacker)) damage /= 2\n  return damage\n}",
    "  if (name === 'Dominate' && borderTier(target) > borderTier(attacker)) damage /= 2\n  if (initial > 0 && damage === 0 && DODGE_ABILITIES.has(name)) target.flags.evadedThisHit = true\n  return damage\n}",
    'evasion marker',
)

# Pandora may roll multiple revive abilities.
old = "function tryRevive(runtime: Runtime, attacker: CombatCard, target: CombatCard): boolean {\n  if (target.hp > 0) return false\n  const name = ability(target)\n"
new = "function tryRevive(runtime: Runtime, attacker: CombatCard, target: CombatCard): boolean {\n  if (target.hp > 0) return false\n  if (ability(target) === \"Pandora's Box\" && target.bonusAbilities?.length) {\n    for (const gained of target.bonusAbilities) {\n      const revived = withAbility(target, gained, () => tryRevive(runtime, attacker, target))\n      if (revived) return true\n    }\n    return false\n  }\n  const name = ability(target)\n"
s = replace_once(s, old, new, 'Pandora revive')

# Pandora defensive after-hit effects.
old = "function targetRetro(runtime: Runtime, attacker: CombatCard, target: CombatCard, damage: number) {\n  const name = ability(target)\n"
new = "function targetRetro(runtime: Runtime, attacker: CombatCard, target: CombatCard, damage: number) {\n  if (ability(target) === \"Pandora's Box\" && target.bonusAbilities?.length) {\n    for (const gained of target.bonusAbilities) {\n      withAbility(target, gained, () => targetRetro(runtime, attacker, target, damage))\n    }\n    return\n  }\n  const name = ability(target)\n"
s = replace_once(s, old, new, 'Pandora target retro')

# Pandora offensive after-hit effects, plus Scorpio's ATK-based poison.
old = "function attackerRetro(runtime: Runtime, attacker: CombatCard, target: CombatCard, damage: number): boolean {\n  const name = ability(attacker)\n  let didRegen = false\n"
new = "function attackerRetro(runtime: Runtime, attacker: CombatCard, target: CombatCard, damage: number): boolean {\n  if (ability(attacker) === \"Pandora's Box\" && attacker.bonusAbilities?.length) {\n    let didRegen = false\n    for (const gained of attacker.bonusAbilities) {\n      didRegen = withAbility(attacker, gained, () => attackerRetro(runtime, attacker, target, damage)) || didRegen\n    }\n    return didRegen\n  }\n  const name = ability(attacker)\n  let didRegen = false\n"
s = replace_once(s, old, new, 'Pandora attacker retro')
s = replace_once(
    s,
    "  switch (name) {\n    case 'Regenerate':",
    "  switch (name) {\n    case 'ConstellarScorpio':\n      if (damage > 0 && !statusProtected(runtime, target.team)) target.counters.poisonFlat = Math.max(target.counters.poisonFlat || 0, attacker.damage)\n      break\n    case 'Regenerate':",
    'Scorpio poison',
)
# Erosion immunity checks must see Pandora bonuses too.
s = s.replace("ability(target) !== 'Erosion'", "!abilityNames(target).includes('Erosion')")

# Sagittarius converts an actual dodge into a 2x hit; Virgo uses a real HP shield before Xuanwu redirection.
old = "  if (!bypass && target.flags.eternalDevotion) { target.flags.eternalDevotion = false; damage = 0 }\n  else if (!bypass && target.flags.dodgeLethal) { target.flags.dodgeLethal = false; damage = 0 }\n  else if (!bypass) damage = defensive(runtime, attacker, target, damage)\n\n  const shielder"
new = "  target.flags.evadedThisHit = false\n  const beforeDefense = damage\n  if (!bypass && target.flags.eternalDevotion) { target.flags.eternalDevotion = false; damage = 0 }\n  else if (!bypass && target.flags.dodgeLethal) { target.flags.dodgeLethal = false; damage = 0 }\n  else if (!bypass) damage = defensive(runtime, attacker, target, damage)\n  if (!bypass && target.flags.evadedThisHit && hasAbility(runtime, attacker, 'ConstellarSagittarius')) damage = beforeDefense * 2\n\n  const shielder"
s = replace_once(s, old, new, 'Sagittarius dodge override')
s = replace_once(
    s,
    "  damage = Number.isFinite(damage) ? Math.ceil(damage) : target.hp\n\n  const xuanwu",
    "  damage = Number.isFinite(damage) ? Math.ceil(damage) : target.hp\n\n  if ((target.counters.hpShield || 0) > 0 && damage > 0) {\n    const absorbed = Math.min(target.counters.hpShield, damage)\n    target.counters.hpShield -= absorbed\n    damage -= absorbed\n  }\n\n  const xuanwu",
    'Virgo HP shield',
)

# Replace applyOnDeath as one block so Pandora's two on-death abilities fire, opponent passives fire once,
# and Outshine truly suppresses the defeated card's on-death mechanics (including fossils).
start = s.index('function applyOnDeath(')
end = s.index('\nfunction resolveDeaths(', start)
new_apply = '''function applyOnDeath(runtime: Runtime, dead: CombatCard, opponent: CombatCard | undefined, skipOpponentPassives = false) {
  const team = dead.team
  const deck = runtime.state.teams[team]
  const next = deck[0]
  const name = ability(dead)

  if (!skipOpponentPassives) {
    if (opponent && alive(opponent) && hasAbility(runtime, opponent, 'Prehistoric Wrath')) opponent.damage *= 2
    if (opponent && alive(opponent) && hasAbility(runtime, opponent, 'All Father')) for (const card of runtime.state.teams[opponent.team]) boostStats(card, 1.25)
  }

  if (dead.flags.suppressOnDeath) return

  if (name === "Pandora's Box" && dead.bonusAbilities?.length) {
    for (const gained of dead.bonusAbilities) {
      withAbility(dead, gained, () => applyOnDeath(runtime, dead, opponent, true))
    }
    return
  }

  if (name === 'Hard Boiled') runtime.state.boosts[team].fossils = (runtime.state.boosts[team].fossils || 0) + 3
  if (name === 'Extinction') runtime.state.boosts[team].fossils = (runtime.state.boosts[team].fossils || 0) + 2

  if (!next || !name) return
  if (name === 'Blessing') { next.damage += dead.damage / 2; next.maxHp += dead.maxHp / 2; next.hp += dead.maxHp / 2 }
  if (name === 'Heart Legacy') { next.maxHp += dead.maxHp; next.hp += dead.maxHp }
  if (name === 'Tonic') boostStats(next, 1.2)
  if (name === 'Fusion... HA!' && rand(runtime, team) > 0.5) {
    next.damage += dead.damage * 0.5
    next.maxHp += dead.maxHp * 0.5
    next.hp += dead.maxHp * 0.5
  }
  if (name === 'Destiny Sight') next.flags.dodgeLethal = true
  if (name === "Housewife's Blessing") { boostStats(next, 2); next.status.stunned = 2 }
  if (name === 'Eternal Devotion') next.flags.eternalDevotion = true
  if (name === 'Final Stand') {
    next.damage += dead.damage * 0.25
    next.maxHp += dead.maxHp * 0.25
    next.hp += dead.maxHp * 0.25
    next.status.shield += 1
  }
}
'''
s = s[:start] + new_apply + s[end:]

# Fallen Pandora can carry Beyond The Grave as one of its gained abilities.
s = replace_once(
    s,
    "        fallen !== card && ability(fallen) === 'Beyond The Grave' && fallen.hp <= 0\n",
    "        fallen !== card && abilityNames(fallen).includes('Beyond The Grave') && fallen.hp <= 0\n",
    'Beyond the Grave composite',
)

# Direct ability checks in turn/status logic must see Pandora bonuses.
s = s.replace("(attacker.counters.death || 0) > 0 && ability(attacker) !== 'Erosion'", "(attacker.counters.death || 0) > 0 && !abilityNames(attacker).includes('Erosion')")
s = s.replace("if (ability(attacker) === 'Final Tail')", "if (hasAbility(runtime, attacker, 'Final Tail'))")

# Aquarius happens at turn start.
s = replace_once(
    s,
    "function prepareTurn(runtime: Runtime, attacker: CombatCard) {\n  if (hasAbility(runtime, attacker, 'Full Moon')) {",
    "function prepareTurn(runtime: Runtime, attacker: CombatCard) {\n  if (hasAbility(runtime, attacker, 'ConstellarAquarius')) {\n    if (attacker.hp < attacker.maxHp / 2) attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.3)\n    else attacker.maxHp *= 1.25\n  }\n  if (hasAbility(runtime, attacker, 'Full Moon')) {",
    'Aquarius turn start',
)

# Attack replacement/multi-hit helpers use hasAbility so Pandora bonuses work naturally.
old = "function attackCount(attacker: CombatCard): { count: number; mult: number } {\n  const name = ability(attacker)\n  const bonus = attacker.counters.attacks || 0\n  if (name === 'Rapid Blows') return { count: 3 + bonus, mult: 1 }\n  if (name === 'Chainsaw') return { count: 8 + bonus, mult: 1 }\n  if (name === 'Firepower') return { count: 5 + bonus, mult: 1 }\n  if (name === 'Behavioral Therapy') return { count: 2 + bonus, mult: 1 }\n  return { count: 1 + bonus, mult: 1 }\n}\n\nfunction canNormalAttack(attacker: CombatCard): boolean {\n  const name = ability(attacker)\n  if (name === 'Meow' || name === 'Never Forgotten' || name === 'Origin' || name === 'Laser Gun' || name === 'Lotus Sutra') return false\n  if (name === 'Sky Drop') return Boolean(attacker.counters.drop && attacker.counters.drop % 2 === 0)\n  return true\n}\n"
new = "function attackCount(runtime: Runtime, attacker: CombatCard): { count: number; mult: number } {\n  const bonus = attacker.counters.attacks || 0\n  let base = 1\n  if (hasAbility(runtime, attacker, 'Rapid Blows')) base = Math.max(base, 3)\n  if (hasAbility(runtime, attacker, 'Chainsaw')) base = Math.max(base, 8)\n  if (hasAbility(runtime, attacker, 'Firepower')) base = Math.max(base, 5)\n  if (hasAbility(runtime, attacker, 'Behavioral Therapy')) base = Math.max(base, 2)\n  return { count: base + bonus, mult: 1 }\n}\n\nfunction canNormalAttack(runtime: Runtime, attacker: CombatCard): boolean {\n  if (hasAbility(runtime, attacker, 'Meow') || hasAbility(runtime, attacker, 'Never Forgotten')\n    || hasAbility(runtime, attacker, 'Origin') || hasAbility(runtime, attacker, 'Laser Gun')\n    || hasAbility(runtime, attacker, 'Lotus Sutra')) return false\n  if (hasAbility(runtime, attacker, 'Sky Drop')) return Boolean(attacker.counters.drop && attacker.counters.drop % 2 === 0)\n  return true\n}\n"
s = replace_once(s, old, new, 'attack helpers composite')
s = s.replace('if (canNormalAttack(attacker)) {', 'if (canNormalAttack(runtime, attacker)) {')
s = s.replace('const { count } = attackCount(attacker)', 'const { count } = attackCount(runtime, attacker)')

# Divination may be one of Pandora's gained abilities.
s = s.replace("if (ability(card) !== 'Divination' || card.flags.divinationFired) continue", "if (!hasAbility(runtime, card, 'Divination') || card.flags.divinationFired) continue")

# Assign Astraeus art variants before the first move.
s = replace_once(
    s,
    "  const runtime: Runtime = { state, rng: new SeededRng(seed) }\n  let lastPair = ''",
    "  const runtime: Runtime = { state, rng: new SeededRng(seed) }\n  resolveConstellarArts(runtime)\n  let lastPair = ''",
    'resolve Constellar before battle',
)

p.write_text(s)

# Coverage tracker: all 176 Depths-source abilities should now be represented.
p = Path('src/engine/support.ts')
s = p.read_text()
s = replace_once(
    s,
    "  'Shiny Steal', 'Water Shield of Xuanwu',\n])",
    "  'Shiny Steal', 'Water Shield of Xuanwu', 'Constellar', \"Pandora's Box\",\n])",
    'support coverage final abilities',
)
p.write_text(s)

# Pandora is explicitly an RNG ability; Black Cat / Unlucky needs to recognize it.
p = Path('src/engine/combat-data.ts')
s = p.read_text()
s = replace_once(
    s,
    "  'Origin', \"Pandora's Box\", 'Naughty or Nice?', 'Snowscape',\n])" if "'Origin', \"Pandora's Box\"" in s else "  'Origin', \"Pandora's Box\", 'Naughty or Nice?', 'Snowscape',\n])",
    "  'Origin', \"Pandora's Box\", 'Naughty or Nice?', 'Snowscape',\n])",
    'Pandora RNG marker',
) if False else s
# Older file did not include Pandora; insert it beside the other random abilities if necessary.
if \"Pandora's Box\" not in s:
    anchor = "  'Origin', \"Pandora's Box\", 'Naughty or Nice?', 'Snowscape',\n])"
    # Fall back to the known current tail.
    old_tail = "  'Origin', \"Pandora's Box\", 'Naughty or Nice?', 'Snowscape',\n])"
    if old_tail in s:
        pass
    else:
        old_tail = "  'Origin', \"Pandora's Box\", 'Naughty or Nice?', 'Snowscape',\n])"
# Use a simple set insertion independent of formatting.
if \"'Pandora\\'s Box'\" not in s and '"Pandora\\'s Box"' not in s and 'Pandora\'s Box' not in s:
    idx = s.index('export const RNG_ABILITIES = new Set([')
    close = s.index('])', idx)
    s = s[:close] + "  \"Pandora's Box\",\n" + s[close:]
p.write_text(s)

# Make zero remaining abilities a CI invariant.
p = Path('scripts/engine-smoke.ts')
s = p.read_text()
anchor = "assert(coverage.total > 150, 'Depths ability coverage scan did not see the full pool')\n"
if anchor not in s:
    raise SystemExit('smoke coverage anchor not found')
s = s.replace(anchor, anchor + "assert(coverage.unsupported === 0, `Unimplemented Depths abilities remain: ${coverage.unsupportedAbilities.join(', ')}`)\n", 1)
p.write_text(s)

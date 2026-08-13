from pathlib import Path

p = Path('src/engine/battle-v2.ts')
s = p.read_text()

def rep(old: str, new: str):
    global s
    if old not in s:
        raise SystemExit('battle patch anchor not found:\n' + old[:450])
    s = s.replace(old, new, 1)

rep(
    "  'Revenge', 'Northern Winds', 'Azure Dragon Wrath', 'Stampede', 'Ice Age',\n])",
    "  'Revenge', 'Northern Winds', 'Azure Dragon Wrath', 'Stampede', 'Ice Age',\n  'Jaws', 'Lightning Strike', 'Danger Sense', 'Defensive Maneuver', 'First Tail',\n  'Grind', 'World Creation', 'Melancholy', 'The World', 'Accelerate', 'Black Flash',\n  'Limitless', \"Monkey King's Rage\",\n])",
)

rep(
    "  let damage = attacker.damage * mult\n  if (attacker.status.burn > 0) damage *= 0.85",
    "  let damage = attacker.damage * mult\n  if (hasAbility(runtime, attacker, 'Jaws')) damage += target.damage\n  if (attacker.status.burn > 0) damage *= 0.85",
)

rep(
    "    case 'True Strike': if (rand(runtime, attacker.team) > 0.5) damage *= 2; break\n    case \"Reaper's Luck\":",
    "    case 'True Strike': if (rand(runtime, attacker.team) > 0.5) damage *= 2; break\n    case \"Monkey King's Rage\":\n      if (attacker.hp / attacker.maxHp <= 0.5 && !attacker.flags.transformed) {\n        attacker.flags.transformed = true\n        attacker.maxHp *= 2\n        attacker.hp *= 2\n        damage *= 2\n      }\n      break\n    case \"Reaper's Luck\":",
)

rep(
    "  switch (name) {\n    case 'Evasion': if (rand(runtime, target.team) > 0.9) damage = 0; break",
    "  switch (name) {\n    case 'Danger Sense':\n      if (!target.flags.dangerSense && damage > target.hp) {\n        target.flags.dangerSense = true\n        damage = 0\n        const deck = runtime.state.teams[target.team]\n        const index = deck.indexOf(target)\n        if (index >= 0 && deck[index + 1]) {\n          deck[index] = deck[index + 1]\n          deck[index + 1] = target\n        }\n      }\n      break\n    case 'Evasion': if (rand(runtime, target.team) > 0.9) damage = 0; break",
)

rep(
    "function statusStart(runtime: Runtime, attacker: CombatCard, target: CombatCard) {\n  const poisonPercent",
    "function statusStart(runtime: Runtime, attacker: CombatCard, target: CombatCard) {\n  if (hasAbility(runtime, target, 'Lightning Strike') && alive(target) && alive(attacker)) {\n    dealDamage(runtime, target, attacker, 0.75)\n  }\n  const poisonPercent",
)

old_before = "\n".join([
    "function beforeAttack(runtime: Runtime, attacker: CombatCard) {",
    "  const target = active(runtime, OTHER_TEAM[attacker.team])",
    "  if (hasAbility(runtime, attacker, 'Rejuvenate')) attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.35)",
    "  if (hasAbility(runtime, attacker, 'First Progenitor')) attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.1)",
    "  if (hasAbility(runtime, attacker, 'Twilight Sparkle') && rand(runtime, attacker.team) > 0.6) attacker.hp = attacker.maxHp",
    "  if (target && hasAbility(runtime, attacker, 'Viral Breath')) target.hp -= target.maxHp * 0.25",
    "  if (hasAbility(runtime, attacker, 'Herbal Alchemy')) {",
    "    attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.2)",
    "    if (rand(runtime, attacker.team) > 0.5) attacker.damage *= 1.3",
    "  }",
    "  if (hasAbility(runtime, attacker, 'Combatant')) attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.1)",
    "  if (hasAbility(runtime, attacker, 'Patience')) boostStats(attacker, 1.3)",
    "  if (hasAbility(runtime, attacker, 'Absolute Sovereignty')) for (const card of runtime.state.teams[attacker.team]) boostStats(card, 1.1)",
    "  if (hasAbility(runtime, attacker, 'Persistent')) {",
    "    const normal = attacker.counters.normalDamage || attacker.damage",
    "    if (attacker.damage < normal) attacker.damage = normal",
    "  }",
    "  if (hasAbility(runtime, attacker, 'Sky Drop')) attacker.counters.drop = (attacker.counters.drop || 0) + 1",
    "  if (hasAbility(runtime, attacker, 'Snowbound')) {",
    "    attacker.counters.snowbound = (attacker.counters.snowbound || 0) + 1",
    "    if (attacker.counters.snowbound % 2 === 0) attacker.status.stunned = Math.max(1, attacker.status.stunned)",
    "  }",
    "}",
]) + "\n"

new_before = "\n".join([
    "function prepareTurn(runtime: Runtime, attacker: CombatCard) {",
    "  if (hasAbility(runtime, attacker, 'First Tail') && (attacker.counters.tail || 0) < 9) {",
    "    attacker.counters.tail = (attacker.counters.tail || 0) + 1",
    "    boostStats(attacker, 1.2)",
    "  }",
    "  if (hasAbility(runtime, attacker, 'Grind')) {",
    "    attacker.counters.grind = (attacker.counters.grind || 0) + 1",
    "    if (attacker.counters.grind <= 5) boostStats(attacker, 1.1)",
    "  }",
    "  if (hasAbility(runtime, attacker, 'Patience')) boostStats(attacker, 1.3)",
    "  if (hasAbility(runtime, attacker, 'Absolute Sovereignty')) for (const card of runtime.state.teams[attacker.team]) boostStats(card, 1.1)",
    "  if (hasAbility(runtime, attacker, 'World Creation')) {",
    "    attacker.counters.worldCreation = (attacker.counters.worldCreation || 0) + 1",
    "    if (attacker.counters.worldCreation % 3 === 0) boostStats(attacker, 2)",
    "  }",
    "  if (hasAbility(runtime, attacker, 'Persistent')) {",
    "    const normal = attacker.counters.normalDamage || attacker.damage",
    "    if (attacker.damage < normal) attacker.damage = normal",
    "  }",
    "  if (hasAbility(runtime, attacker, 'Sky Drop')) attacker.counters.drop = (attacker.counters.drop || 0) + 1",
    "  if (hasAbility(runtime, attacker, 'Snowbound')) {",
    "    attacker.counters.snowbound = (attacker.counters.snowbound || 0) + 1",
    "    if (attacker.counters.snowbound % 2 === 0) attacker.status.stunned = Math.max(1, attacker.status.stunned)",
    "  }",
    "  if (hasAbility(runtime, attacker, 'Defensive Maneuver')) {",
    "    attacker.counters.defensiveManeuver = (attacker.counters.defensiveManeuver || 0) + 1",
    "    if (attacker.counters.defensiveManeuver % 2 === 0) attacker.status.shield += 1",
    "  }",
    "}",
    "",
    "function beforeAttack(runtime: Runtime, attacker: CombatCard) {",
    "  const target = active(runtime, OTHER_TEAM[attacker.team])",
    "  if (hasAbility(runtime, attacker, 'Rejuvenate')) attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.35)",
    "  if (hasAbility(runtime, attacker, 'First Progenitor')) attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.1)",
    "  if (hasAbility(runtime, attacker, 'Twilight Sparkle') && rand(runtime, attacker.team) > 0.6) attacker.hp = attacker.maxHp",
    "  if (target && hasAbility(runtime, attacker, 'Viral Breath')) target.hp -= target.maxHp * 0.25",
    "  if (hasAbility(runtime, attacker, 'Herbal Alchemy')) {",
    "    attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.2)",
    "    if (rand(runtime, attacker.team) > 0.5) attacker.damage *= 1.3",
    "  }",
    "  if (hasAbility(runtime, attacker, 'Combatant')) attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.1)",
    "}",
]) + "\n"
rep(old_before, new_before)

rep(
    "  statusStart(runtime, attacker, target)\n  resolveDeaths(runtime)",
    "  prepareTurn(runtime, attacker)\n  statusStart(runtime, attacker, target)\n  resolveDeaths(runtime)",
)

rep(
    "      dealDamage(runtime, attacker, target)\n      resolveDeaths(runtime)",
    "      dealDamage(runtime, attacker, target)\n      if (hasAbility(runtime, attacker, 'Black Flash') && alive(attacker) && target.hp > 0) {\n        dealDamage(runtime, attacker, target, 0.5, true)\n      }\n      resolveDeaths(runtime)",
)

rep(
    "    if (hasAbility(runtime, attacker, 'Berserk') && attacker.hp / attacker.maxHp < 0.5) count += 1\n    if (hasAbility(runtime, attacker, 'Haste')) count += 1\n    if (hasAbility(runtime, attacker, 'First Progenitor')) count += 1\n    if (count > 0) attacker.counters.extraTurns = count",
    "    if (hasAbility(runtime, attacker, 'Berserk') && attacker.hp / attacker.maxHp < 0.5) count += 1\n    if (hasAbility(runtime, attacker, 'Melancholy') && attacker.hp / attacker.maxHp > 0.5) count += 2\n    if (hasAbility(runtime, attacker, 'Haste')) count += 1\n    if (hasAbility(runtime, attacker, 'First Progenitor')) count += 1\n    if (hasAbility(runtime, attacker, 'The World')) {\n      if (attacker.flags.worldCooldown) attacker.flags.worldCooldown = false\n      else { count += 2; attacker.flags.worldCooldown = true }\n    }\n    if (hasAbility(runtime, attacker, 'Accelerate')) {\n      attacker.counters.turnsPerTurn = (attacker.counters.turnsPerTurn || 0) + 1\n      count += attacker.counters.turnsPerTurn\n    }\n    if (count > 0) attacker.counters.extraTurns = count",
)

p.write_text(s)

p = Path('src/engine/support.ts')
s = p.read_text()
old = "  'Revenge', 'Northern Winds', 'Azure Dragon Wrath', 'Stampede', 'Ice Age',\n])"
new = "  'Revenge', 'Northern Winds', 'Azure Dragon Wrath', 'Stampede', 'Ice Age',\n  'Jaws', 'Lightning Strike', 'Danger Sense', 'Defensive Maneuver', 'First Tail',\n  'Grind', 'World Creation', 'Melancholy', 'The World', 'Accelerate', 'Black Flash',\n  'Limitless', \"Monkey King's Rage\",\n])"
if old not in s:
    raise SystemExit('support patch anchor not found')
p.write_text(s.replace(old, new, 1))

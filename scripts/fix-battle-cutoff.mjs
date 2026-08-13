import fs from 'node:fs'

function replaceOnce(text, oldText, newText, label) {
  if (!text.includes(oldText)) throw new Error(`${label} anchor missing`)
  return text.replace(oldText, newText)
}

{
  const path = 'src/engine/auras.ts'
  let text = fs.readFileSync(path, 'utf8')
  const anchor = "  if (aura.name === 'Jurassic World') {"
  const replacement = "  if (DIRECT_SKILL_BOOST_KEYS[aura.name]) {\n    return { aura, value, implemented: true }\n  }\n\n  if (aura.name === 'Jurassic World') {"
  text = replaceOnce(text, anchor, replacement, 'Aura support')
  fs.writeFileSync(path, text)
}

{
  const path = 'src/engine/battle-v2.ts'
  let text = fs.readFileSync(path, 'utf8')
  const otherTeam = "const OTHER_TEAM: Record<BattleTeam, BattleTeam> = { Allies: 'Enemies', Enemies: 'Allies' }"
  text = replaceOnce(text, otherTeam, `${otherTeam}\nconst MAX_BATTLE_TURNS = 100_000`, 'Battle constant')
  text = replaceOnce(text, "  let lastPair = ''\n  let samePairTurns = 0\n\n", '', 'Same-pair state')
  text = replaceOnce(text, 'state.turn < 2_000', 'state.turn < MAX_BATTLE_TURNS', 'Battle turn limit')
  const cutoff = "    const pair = `${attacker.id}|${defender.id}`\n    if (pair === lastPair) samePairTurns += 1\n    else { lastPair = pair; samePairTurns = 0 }\n    if (samePairTurns >= 150) {\n      attacker.hp = 0\n      defender.hp = 0\n      resolveDeaths(runtime)\n      continue\n    }\n\n"
  text = replaceOnce(text, cutoff, '', 'Artificial pair cutoff')
  const resultAnchor = "  const winner: BattleResult['winner'] = state.teams.Allies.length\n"
  const resultReplacement = "  if (state.turn >= MAX_BATTLE_TURNS && state.teams.Allies.length && state.teams.Enemies.length) {\n    state.unsupportedAbilities.add('Battle turn cap reached')\n  }\n\n  const winner: BattleResult['winner'] = state.teams.Allies.length\n"
  text = replaceOnce(text, resultAnchor, resultReplacement, 'Battle result')
  fs.writeFileSync(path, text)
}

{
  const path = 'scripts/engine-smoke.ts'
  let text = fs.readFileSync(path, 'utf8')
  const anchor = "assert(battle.turns > 0, 'Controlled battle did not advance turns')"
  const replacement = `${anchor}\n\nconst fateBattle = simulateBattleV2({ cards: [{ cardName: 'Mastermind', borders: ['Galaxy'] }], abilityAura: { auraName: 'Fate' } }, enemies, 8)\nassert(!fateBattle.unsupportedAbilities.includes('Aura: Fate'), 'Fate was incorrectly marked unsupported')`
  text = replaceOnce(text, anchor, replacement, 'Fate regression')
  fs.writeFileSync(path, text)
}

import fs from 'node:fs'

function replaceOnce(text, oldText, newText, label) {
  if (!text.includes(oldText)) throw new Error(`${label} anchor missing`)
  return text.replace(oldText, newText)
}

{
  const path = 'src/engine/battle-v2.ts'
  let text = fs.readFileSync(path, 'utf8')
  text = replaceOnce(
    text,
    "    const nextPairKey = `${attacker.id}|${defender.id}`\n",
    "    const allyActive = active(runtime, 'Allies')\n    const enemyActive = active(runtime, 'Enemies')\n    const nextPairKey = allyActive && enemyActive ? `${allyActive.id}|${enemyActive.id}` : ''\n",
    'stable active pair key',
  )
  fs.writeFileSync(path, text)
}

{
  const path = 'scripts/engine-smoke.ts'
  let text = fs.readFileSync(path, 'utf8')
  const anchor = "console.log(`Engine smoke tests passed: ${cards.length} cards, ${auras.length} auras.`)"
  if (!text.includes('Stable active-pair timeout regression passed')) {
    const test = `\nconst timeoutEnemies = [{\n  definition: cards.find((card) => card.name === 'Knight')!,\n  power: 1,\n  health: 1e30,\n  weather: null,\n}]\nconst timeoutBattle = simulateBattleV2(\n  { cards: [{ cardName: 'Knight', borders: ['Galaxy'] }] },\n  timeoutEnemies,\n  12345,\n  10_000,\n  true,\n)\nassert(!timeoutBattle.unsupportedAbilities.includes('Battle turn cap reached'), 'Stable active-pair timeout failed before emergency cap')\nassert(timeoutBattle.turns < 1_000, \`Stable active-pair timeout took too long: \${timeoutBattle.turns}\`)\nconsole.log('Stable active-pair timeout regression passed:', timeoutBattle.turns, 'turns')\n\n`
    text = replaceOnce(text, anchor, test + anchor, 'engine smoke log')
  }
  fs.writeFileSync(path, text)
}

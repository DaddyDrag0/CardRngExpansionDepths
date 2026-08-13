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
    "  let activePairKey = ''\n  let pairTurns: Record<string, number> = {}\n",
    "  let turnsWithoutDeaths = 0\n  let lastMover: CombatCard | undefined\n  let lastTarget: CombatCard | undefined\n",
    'timeout state',
  )

  const oldBlock = `    const allyActive = active(runtime, 'Allies')
    const enemyActive = active(runtime, 'Enemies')
    const nextPairKey = allyActive && enemyActive ? \`${'${allyActive.id}'}|${'${enemyActive.id}'}\` : ''
    if (nextPairKey !== activePairKey) {
      activePairKey = nextPairKey
      pairTurns = {}
    }
    pairTurns[attacker.id] = (pairTurns[attacker.id] || 0) + 1
    if (pairTurns[attacker.id] > 150) {
      attacker.hp = 0
      defender.hp = 0
      resolveDeaths(runtime)
      continue
    }
`

  const newBlock = `    turnsWithoutDeaths += 1
    if (attacker !== lastMover && attacker !== lastTarget) turnsWithoutDeaths = 0
    if (defender !== lastMover && defender !== lastTarget) turnsWithoutDeaths = 0
    if (turnsWithoutDeaths >= 150) {
      attacker.hp = 0
      defender.hp = 0
      resolveDeaths(runtime)
      continue
    }
    lastMover = attacker
    lastTarget = defender
`

  text = replaceOnce(text, oldBlock, newBlock, 'source-aligned timeout loop')
  fs.writeFileSync(path, text)
}

{
  const path = 'scripts/engine-smoke.ts'
  let text = fs.readFileSync(path, 'utf8')
  text = text.replace(
    "assert(timeoutBattle.turns < 1_000, `Stable active-pair timeout took too long: ${timeoutBattle.turns}`)",
    "assert(timeoutBattle.turns >= 145 && timeoutBattle.turns <= 155, `Source-aligned timeout should resolve at about 150 total turns, got ${timeoutBattle.turns}`)",
  )
  text = text.replace(
    "console.log('Stable active-pair timeout regression passed:', timeoutBattle.turns, 'turns')",
    "console.log('Source-aligned 150-turn timeout regression passed:', timeoutBattle.turns, 'turns')",
  )
  fs.writeFileSync(path, text)
}

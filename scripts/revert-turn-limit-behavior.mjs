import fs from 'node:fs'

function replaceOnce(path,before,after,label){
  let text=fs.readFileSync(path,'utf8')
  const count=text.split(before).length-1
  if(count!==1)throw new Error(`${label}: expected 1 match, found ${count}`)
  text=text.replace(before,after)
  fs.writeFileSync(path,text)
}

replaceOnce('src/engine/battle-v2.ts',
`    if (turnsWithoutDeaths >= 150) {
      debug.forcedStallResolutions += 1
      turnLimitReached = true
      const allyCard = attacker.team === 'Allies' ? attacker : defender
      const enemyCard = attacker.team === 'Enemies' ? attacker : defender
      const allyName = effectiveCardName(allyCard) || allyCard.definition.name
      const enemyName = effectiveCardName(enemyCard) || enemyCard.definition.name
      debug.turnLimit = { turn: state.turn, ally: allyName, enemy: enemyName }
      if (runtime.captureDebug) pushDebugEvent(runtime, {
        turn: state.turn,
        type: 'stall',
        team: state.moving,
        card: effectiveCardName(attacker) || attacker.definition.name,
        detail: \`Expansion 150-turn battle limit reached: battle ends with \${allyName} vs \${enemyName}\`,
        hp: attacker.hp, maxHp: attacker.maxHp, damage: attacker.damage,
      })
      break
    }`,
`    if (turnsWithoutDeaths >= 150) {
      debug.forcedStallResolutions += 1
      if (runtime.captureDebug) pushDebugEvent(runtime, {
        turn: state.turn,
        type: 'stall',
        team: state.moving,
        card: effectiveCardName(attacker) || attacker.definition.name,
        detail: \`Expansion 150-turn no-progress resolution vs \${effectiveCardName(defender) || defender.definition.name}: both active cards defeated\`,
        hp: attacker.hp, maxHp: attacker.maxHp, damage: attacker.damage,
      })
      attacker.hp = 0
      defender.hp = 0
      resolveDeaths(runtime)
      continue
    }`,'restore 150-turn matchup resolution')

replaceOnce('src/engine/battle-v2.ts',
`  const winner: BattleResult['winner'] = turnLimitReached
    ? 'Draw'
    : state.teams.Allies.length
      ? state.teams.Enemies.length ? 'Draw' : 'Allies'
      : state.teams.Enemies.length ? 'Enemies' : 'Draw'`,
`  const winner: BattleResult['winner'] = state.teams.Allies.length
    ? state.teams.Enemies.length ? 'Draw' : 'Allies'
    : state.teams.Enemies.length ? 'Enemies' : 'Draw'`,'restore normal winner logic')

replaceOnce('src/browser-worker.ts','const LIVE_BATTLE_TURN_CAP = 5_000','const LIVE_BATTLE_TURN_CAP = 10_000','raise hard battle cap')

replaceOnce('index.html',
`    lines.push(\`150-turn battle endings: \${d?.forcedStallResolutions??0}\`);
    if(run.turnLimitReached||d?.turnLimit)lines.push(\`TURN LIMIT: battle ended at T\${d?.turnLimit?.turn??'?'} · \${d?.turnLimit?.ally||'?'} vs \${d?.turnLimit?.enemy||run.turnLimitEnemy||'?'}\`);`,
`    lines.push(\`150-turn matchup resolutions: \${d?.forcedStallResolutions??0}\`);`,'restore debug wording')

replaceOnce('index.html',
`game-style 150-turn limits end the battle and are reported by enemy; emergency 5,000-turn softlocks are recorded as losses instead of hanging.`,
`150-turn no-progress matchups resolve using the previous behavior; any battle that reaches 10,000 total turns ends as a loss instead of hanging.`,'update simulator footnote')

replaceOnce('scripts/engine-smoke.ts',
`assert(timeoutBattle.turns >= 145 && timeoutBattle.turns <= 155, \`Expansion timeout should end at about 150 no-progress turns, got \${timeoutBattle.turns}\`)
assert(timeoutBattle.turnLimitReached, 'Expansion 150-turn limit did not mark the battle as ended by turn limit')
assert(timeoutBattle.winner === 'Draw', \`Turn-limit battle should end without a normal winner, got \${timeoutBattle.winner}\`)
console.log('Expansion 150-turn battle-ending regression passed:', timeoutBattle.turns, 'turns')`,
`assert(timeoutBattle.turns >= 145 && timeoutBattle.turns <= 155, \`Expansion timeout should resolve at about 150 no-progress turns, got \${timeoutBattle.turns}\`)
console.log('Expansion 150-turn no-progress regression passed:', timeoutBattle.turns, 'turns')`,'restore timeout regression')

console.log('Restored old 150-turn matchup behavior and set a 10,000-turn hard battle cap.')

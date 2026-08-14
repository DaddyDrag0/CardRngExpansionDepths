import fs from 'node:fs'

function replaceOnce(path, before, after, label) {
  let text = fs.readFileSync(path, 'utf8')
  const count = text.split(before).length - 1
  if (count !== 1) throw new Error(`${label}: expected 1 match, found ${count}`)
  text = text.replace(before, after)
  fs.writeFileSync(path, text)
}

replaceOnce(
  'src/types.ts',
  `  forcedStallResolutions: number\n  statAura?: { name: string; border: AuraBorderName | null; value?: number }`,
  `  forcedStallResolutions: number\n  turnLimit?: { turn: number; ally: string; enemy: string }\n  statAura?: { name: string; border: AuraBorderName | null; value?: number }`,
  'battle debug turn-limit metadata',
)
replaceOnce(
  'src/types.ts',
  `  trusted: boolean\n  debug?: BattleDebug`,
  `  trusted: boolean\n  turnLimitReached: boolean\n  debug?: BattleDebug`,
  'battle result turn-limit flag',
)

replaceOnce(
  'src/engine/battle-v2.ts',
  `  let turnsWithoutDeaths = 0\n  let lastDeathEpoch = runtime.deathEpoch`,
  `  let turnsWithoutDeaths = 0\n  let lastDeathEpoch = runtime.deathEpoch\n  let turnLimitReached = false`,
  'turn-limit state',
)
replaceOnce(
  'src/engine/battle-v2.ts',
  `    if (turnsWithoutDeaths >= 150) {\n      debug.forcedStallResolutions += 1\n      if (runtime.captureDebug) pushDebugEvent(runtime, {\n        turn: state.turn,\n        type: 'stall',\n        team: state.moving,\n        card: effectiveCardName(attacker) || attacker.definition.name,\n        detail: \`Expansion 150-turn no-progress resolution vs \${effectiveCardName(defender) || defender.definition.name}: both active cards defeated\`,\n        hp: attacker.hp, maxHp: attacker.maxHp, damage: attacker.damage,\n      })\n      attacker.hp = 0\n      defender.hp = 0\n      resolveDeaths(runtime)\n      continue\n    }`,
  `    if (turnsWithoutDeaths >= 150) {\n      debug.forcedStallResolutions += 1\n      turnLimitReached = true\n      const allyCard = attacker.team === 'Allies' ? attacker : defender\n      const enemyCard = attacker.team === 'Enemies' ? attacker : defender\n      const allyName = effectiveCardName(allyCard) || allyCard.definition.name\n      const enemyName = effectiveCardName(enemyCard) || enemyCard.definition.name\n      debug.turnLimit = { turn: state.turn, ally: allyName, enemy: enemyName }\n      if (runtime.captureDebug) pushDebugEvent(runtime, {\n        turn: state.turn,\n        type: 'stall',\n        team: state.moving,\n        card: effectiveCardName(attacker) || attacker.definition.name,\n        detail: \`Expansion 150-turn battle limit reached: battle ends with \${allyName} vs \${enemyName}\`,\n        hp: attacker.hp, maxHp: attacker.maxHp, damage: attacker.damage,\n      })\n      break\n    }`,
  'end whole battle at 150-turn limit',
)
replaceOnce(
  'src/engine/battle-v2.ts',
  `  const winner: BattleResult['winner'] = state.teams.Allies.length\n    ? state.teams.Enemies.length ? 'Draw' : 'Allies'\n    : state.teams.Enemies.length ? 'Enemies' : 'Draw'`,
  `  const winner: BattleResult['winner'] = turnLimitReached\n    ? 'Draw'\n    : state.teams.Allies.length\n      ? state.teams.Enemies.length ? 'Draw' : 'Allies'\n      : state.teams.Enemies.length ? 'Enemies' : 'Draw'`,
  'turn-limit winner',
)
replaceOnce(
  'src/engine/battle-v2.ts',
  `  return { winner, turns: state.turn, state, unsupportedAbilities, trusted: unsupportedAbilities.length === 0, debug: captureDebug ? debug : undefined }`,
  `  return { winner, turns: state.turn, state, unsupportedAbilities, trusted: unsupportedAbilities.length === 0, turnLimitReached, debug: captureDebug ? debug : undefined }`,
  'return turn-limit flag',
)

replaceOnce(
  'src/engine/simulation.ts',
  `  battleSeed?: number\n  debug?: BattleDebug`,
  `  battleSeed?: number\n  turnLimitReached?: boolean\n  turnLimitEnemy?: string\n  turnLimitAlly?: string\n  debug?: BattleDebug`,
  'Depths result turn-limit fields',
)
replaceOnce(
  'src/engine/simulation.ts',
  `        battleSeed: floorSeed ^ 0x51ed270b,\n        debug: debugBattle.debug,`,
  `        battleSeed: floorSeed ^ 0x51ed270b,\n        turnLimitReached: debugBattle.turnLimitReached,\n        turnLimitEnemy: debugBattle.debug?.turnLimit?.enemy,\n        turnLimitAlly: debugBattle.debug?.turnLimit?.ally,\n        debug: debugBattle.debug,`,
  'return turn-limit culprit',
)

replaceOnce(
  'src/browser-worker.ts',
  `    battleTurnCap: LIVE_BATTLE_TURN_CAP,\n    throwOnBattleTurnCap: true,`,
  `    battleTurnCap: LIVE_BATTLE_TURN_CAP,\n    throwOnBattleTurnCap: false,`,
  'record emergency cap as battle loss',
)

replaceOnce(
  'index.html',
  `  const commonEnemies=Object.entries(enemyCounts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,6);\n  const endingHtml=commonEnemies.length?\`<div class="ending-enemies"><span>Most common losing-floor enemies</span><div class="enemy-chips">\${commonEnemies.map(([name,count])=>\`<i>\${esc(name)} <b>×\${count}</b></i>\`).join('')}</div></div>\`:'';`,
  `  const commonEnemies=Object.entries(enemyCounts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,6);\n  const endingHtml=commonEnemies.length?\`<div class="ending-enemies"><span>Most common losing-floor enemies</span><div class="enemy-chips">\${commonEnemies.map(([name,count])=>\`<i>\${esc(name)} <b>×\${count}</b></i>\`).join('')}</div></div>\`:'';\n  const turnLimitCounts={};\n  for(const run of r.runs)if(run.turnLimitEnemy)turnLimitCounts[run.turnLimitEnemy]=(turnLimitCounts[run.turnLimitEnemy]||0)+1;\n  const commonTurnLimits=Object.entries(turnLimitCounts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,6);\n  const turnLimitHtml=commonTurnLimits.length?\`<div class="ending-enemies"><span>Turn-limit enemies</span><div class="enemy-chips">\${commonTurnLimits.map(([name,count])=>\`<i>\${esc(name)} <b>×\${count}</b></i>\`).join('')}</div></div>\`:'';`,
  'turn-limit summary chips',
)
replaceOnce(
  'index.html',
  `<div class="floor-strip">\${r.runs.map((run,i)=>\`<span role="button" tabindex="0" style="cursor:pointer" data-debug-team="\${index}" data-debug-run="\${i}" title="Run \${i+1}\${run.endingEnemies?.length?' · '+run.endingEnemies.join(' / '):''} · click for debug">\${full(run.deathFloor)}</span>\`).join('')}</div>\${endingHtml}\${r.unsupportedAbilities?.length?`,
  `<div class="floor-strip">\${r.runs.map((run,i)=>\`<span role="button" tabindex="0" style="cursor:pointer" data-debug-team="\${index}" data-debug-run="\${i}" title="Run \${i+1}\${run.turnLimitEnemy?' · TURN LIMIT vs '+run.turnLimitEnemy:''}\${run.endingEnemies?.length?' · '+run.endingEnemies.join(' / '):''} · click for debug">\${full(run.deathFloor)}</span>\`).join('')}</div>\${endingHtml}\${turnLimitHtml}\${r.unsupportedAbilities?.length?`,
  'turn-limit floor tooltip and summary',
)
replaceOnce(
  'index.html',
  `    lines.push(\`Forced 100-turn resolutions: \${d?.forcedStallResolutions??0}\`);`,
  `    lines.push(\`150-turn battle endings: \${d?.forcedStallResolutions??0}\`);\n    if(run.turnLimitReached||d?.turnLimit)lines.push(\`TURN LIMIT: battle ended at T\${d?.turnLimit?.turn??'?'} · \${d?.turnLimit?.ally||'?'} vs \${d?.turnLimit?.enemy||run.turnLimitEnemy||'?'}\`);`,
  'debug turn-limit line',
)
replaceOnce(
  'index.html',
  `pathological fights stop at 5,000 turns with seeds instead of running forever.`,
  `game-style 150-turn limits end the battle and are reported by enemy; emergency 5,000-turn softlocks are recorded as losses instead of hanging.`,
  'simulation footnote',
)

replaceOnce(
  'scripts/engine-smoke.ts',
  `assert(timeoutBattle.turns >= 145 && timeoutBattle.turns <= 155, \`Expansion timeout should resolve at about 150 no-progress turns, got \${timeoutBattle.turns}\`)\nconsole.log('Expansion 150-turn no-progress regression passed:', timeoutBattle.turns, 'turns')`,
  `assert(timeoutBattle.turns >= 145 && timeoutBattle.turns <= 155, \`Expansion timeout should end at about 150 no-progress turns, got \${timeoutBattle.turns}\`)\nassert(timeoutBattle.turnLimitReached, 'Expansion 150-turn limit did not mark the battle as ended by turn limit')\nassert(timeoutBattle.winner === 'Draw', \`Turn-limit battle should end without a normal winner, got \${timeoutBattle.winner}\`)\nconsole.log('Expansion 150-turn battle-ending regression passed:', timeoutBattle.turns, 'turns')`,
  'engine timeout semantics regression',
)

console.log('Applied terminal battle turn-limit semantics and culprit reporting.')

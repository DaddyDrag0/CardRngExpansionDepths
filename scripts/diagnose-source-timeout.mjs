import fs from 'node:fs'
const path='src/engine/battle-v2.ts'
let s=fs.readFileSync(path,'utf8')
s=s.replace('  let lastDeathEpoch = runtime.deathEpoch\n  let turnLimitReached = false','  let lastMover: CombatCard | undefined\n  let lastTarget: CombatCard | undefined\n  let turnLimitReached = false')
s=s.replace(`    if (runtime.deathEpoch !== lastDeathEpoch) {\n      turnsWithoutDeaths = 0\n      lastDeathEpoch = runtime.deathEpoch\n    }\n    turnsWithoutDeaths += 1\n    if (turnsWithoutDeaths >= 150) {`,`    turnsWithoutDeaths += 1\n    if (attacker !== lastMover && attacker !== lastTarget) turnsWithoutDeaths = 0\n    if (defender !== lastMover && defender !== lastTarget) turnsWithoutDeaths = 0\n    if (turnsWithoutDeaths >= 100) {`)
s=s.replace(`      continue\n    }\n    if (runtime.captureDebug) pushDebugEvent(runtime, {`,`      continue\n    }\n    lastMover = attacker\n    lastTarget = defender\n    if (runtime.captureDebug) pushDebugEvent(runtime, {`)
fs.writeFileSync(path,s)
console.log('Patched battle-v2 in runner to old server active-pair reset + 100-turn matchup resolver')
// diagnostic rerun

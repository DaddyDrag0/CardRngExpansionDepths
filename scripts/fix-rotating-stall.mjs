import fs from 'node:fs'

function replaceOnce(path, before, after, label) {
  let text = fs.readFileSync(path, 'utf8')
  const count = text.split(before).length - 1
  if (count !== 1) throw new Error(`${label}: expected 1 match, found ${count}`)
  text = text.replace(before, after)
  fs.writeFileSync(path, text)
}

replaceOnce(
  'src/engine/battle-v2.ts',
  `interface Runtime {\n  state: BattleState\n  rng: SeededRng\n  debug: BattleDebug\n  captureDebug: boolean\n}`,
  `interface Runtime {\n  state: BattleState\n  rng: SeededRng\n  debug: BattleDebug\n  captureDebug: boolean\n  deathEpoch: number\n}`,
  'runtime death epoch',
)

replaceOnce(
  'src/engine/battle-v2.ts',
  `      deck.shift()\n      card.hp = 0`,
  `      deck.shift()\n      runtime.deathEpoch += 1\n      card.hp = 0`,
  'increment death epoch',
)

replaceOnce(
  'src/engine/battle-v2.ts',
  `  const runtime: Runtime = { state, rng: new SeededRng(seed), debug, captureDebug }`,
  `  const runtime: Runtime = { state, rng: new SeededRng(seed), debug, captureDebug, deathEpoch: 0 }`,
  'initialize death epoch',
)

replaceOnce(
  'src/engine/battle-v2.ts',
  `  let turnsWithoutDeaths = 0\n  let lastMover: CombatCard | undefined\n  let lastTarget: CombatCard | undefined`,
  `  let turnsWithoutDeaths = 0\n  let lastDeathEpoch = runtime.deathEpoch`,
  'replace pair tracking with death tracking',
)

replaceOnce(
  'src/engine/battle-v2.ts',
  `    turnsWithoutDeaths += 1\n    if (attacker !== lastMover && attacker !== lastTarget) turnsWithoutDeaths = 0\n    if (defender !== lastMover && defender !== lastTarget) turnsWithoutDeaths = 0\n    if (turnsWithoutDeaths >= 150) {`,
  `    if (runtime.deathEpoch !== lastDeathEpoch) {\n      turnsWithoutDeaths = 0\n      lastDeathEpoch = runtime.deathEpoch\n    }\n    turnsWithoutDeaths += 1\n    if (turnsWithoutDeaths >= 150) {`,
  'actual no-death timeout',
)

replaceOnce(
  'src/engine/battle-v2.ts',
  `    lastMover = attacker\n    lastTarget = defender\n    if (runtime.captureDebug) pushDebugEvent(runtime, {`,
  `    if (runtime.captureDebug) pushDebugEvent(runtime, {`,
  'remove obsolete pair state',
)

const ciPath = '.github/workflows/engine-check.yml'
let ci = fs.readFileSync(ciPath, 'utf8')
ci = ci.replace(`          if (!battle.includes('attacker !== lastMover && attacker !== lastTarget')) throw new Error('Source-aligned attacker timeout reset missing')\n          if (!battle.includes('defender !== lastMover && defender !== lastTarget')) throw new Error('Source-aligned target timeout reset missing')`, `          if (!battle.includes('runtime.deathEpoch !== lastDeathEpoch')) throw new Error('Actual-death timeout reset missing')\n          if (!battle.includes('runtime.deathEpoch += 1')) throw new Error('Death epoch increment missing')`)
fs.writeFileSync(ciPath, ci)

console.log('Rotating-card stalls now reset the 150-turn timer only on actual deaths.')

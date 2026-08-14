import fs from 'node:fs'

function replaceOnce(path, before, after, label) {
  let text = fs.readFileSync(path, 'utf8')
  const count = text.split(before).length - 1
  if (count !== 1) throw new Error(`${label}: expected 1 match, found ${count}`)
  text = text.replace(before, after)
  fs.writeFileSync(path, text)
}

replaceOnce(
  'src/engine/simulation.ts',
  `  battleTurnCap?: number\n}`,
  `  battleTurnCap?: number\n  throwOnBattleTurnCap?: boolean\n}`,
  'diagnostic turn cap option',
)

replaceOnce(
  'src/engine/simulation.ts',
  `export type DepthsProgressCallback = (floor: number, battleTurn?: number) => void`,
  `export type DepthsProgressCallback = (floor: number, battleTurn?: number, enemyNames?: string[]) => void`,
  'progress callback enemy names',
)

replaceOnce(
  'src/engine/simulation.ts',
  `  for (let floor = startFloor; floor <= floorCap; floor++) {\n    onProgress?.(floor)\n    const floorSeed = mixSeed(runSeed, floor)\n    const enemies = generateDepthsTeam(floor, floorSeed)`,
  `  for (let floor = startFloor; floor <= floorCap; floor++) {\n    const floorSeed = mixSeed(runSeed, floor)\n    const enemies = generateDepthsTeam(floor, floorSeed)\n    const enemyNames = enemies.map((enemy) => enemy.card.name)\n    onProgress?.(floor, undefined, enemyNames)`,
  'initial floor enemy progress',
)

replaceOnce(
  'src/engine/simulation.ts',
  `      (battleTurn) => onProgress?.(floor, battleTurn),\n    )\n    battles += 1\n    totalTurns += battle.turns\n    for (const ability of battle.unsupportedAbilities) unsupported.add(ability)`,
  `      (battleTurn) => onProgress?.(floor, battleTurn, enemyNames),\n    )\n    battles += 1\n    totalTurns += battle.turns\n    for (const ability of battle.unsupportedAbilities) unsupported.add(ability)\n\n    if (options.throwOnBattleTurnCap && battle.unsupportedAbilities.includes('Battle turn cap reached')) {\n      const battleSeed = floorSeed ^ 0x51ed270b\n      throw new Error(\n        \`Long battle diagnostic: floor \${floor.toLocaleString('en-US')} reached \${maxTurns.toLocaleString('en-US')} turns vs \${enemyNames.join(' | ')}. \` +\n        \`Run seed \${runSeed}; floor seed \${floorSeed}; battle seed \${battleSeed}.\`,\n      )\n    }`,
  'heartbeat enemies and long battle error',
)

replaceOnce(
  'src/engine/simulation.ts',
  `        (battleTurn) => onProgress?.(floor, battleTurn),\n      )\n      onProgress?.(floor)`,
  `        (battleTurn) => onProgress?.(floor, battleTurn, enemyNames),\n      )\n      onProgress?.(floor, undefined, enemyNames)`,
  'debug rerun enemies',
)

replaceOnce(
  'src/browser-worker.ts',
  `const STALL_WATCHDOG_MS = 20_000`,
  `const STALL_WATCHDOG_MS = 20_000\nconst LIVE_BATTLE_TURN_CAP = 5_000`,
  'live long battle cap',
)

replaceOnce(
  'src/browser-worker.ts',
  `function simulateOne(request: SingleRunRequest, onProgress?: (floor: number, battleTurn?: number) => void): DepthsRunResult {\n  return simulateDepthsRun(request.loadout, {\n    floorCap: request.floorCap,\n    seed: runSeed(request.batchSeed, request.runIndex),\n  }, onProgress)\n}`,
  `function simulateOne(request: SingleRunRequest, onProgress?: (floor: number, battleTurn?: number, enemyNames?: string[]) => void): DepthsRunResult {\n  return simulateDepthsRun(request.loadout, {\n    floorCap: request.floorCap,\n    seed: runSeed(request.batchSeed, request.runIndex),\n    battleTurnCap: LIVE_BATTLE_TURN_CAP,\n    throwOnBattleTurnCap: true,\n  }, onProgress)\n}`,
  'browser diagnostic cap',
)

replaceOnce(
  'src/browser-worker.ts',
  `      let lastFloor = 1\n      let lastBattleTurn = 0\n      let lastForwardedAt = 0`,
  `      let lastFloor = 1\n      let lastBattleTurn = 0\n      let lastEnemies: string[] = []\n      let lastForwardedAt = 0`,
  'track current enemies',
)

replaceOnce(
  'src/browser-worker.ts',
  `          const turnText = lastBattleTurn > 0 ? \` around battle turn \${lastBattleTurn}\` : ''\n          fail(new Error(\`Simulation stalled on run \${runIndex + 1}/\${runs} near floor \${lastFloor}\${turnText}. No simulation progress for \${STALL_WATCHDOG_MS / 1000}s. Batch seed \${request.seed}; run seed \${runSeed(request.seed, runIndex)}.\`))`,
  `          const turnText = lastBattleTurn > 0 ? \` around battle turn \${lastBattleTurn}\` : ''\n          const enemyText = lastEnemies.length ? \` vs \${lastEnemies.join(' | ')}\` : ''\n          fail(new Error(\`Simulation stalled on run \${runIndex + 1}/\${runs} near floor \${lastFloor}\${turnText}\${enemyText}. No simulation progress for \${STALL_WATCHDOG_MS / 1000}s. Batch seed \${request.seed}; run seed \${runSeed(request.seed, runIndex)}.\`))`,
  'watchdog enemy details',
)

replaceOnce(
  'src/browser-worker.ts',
  `          const nextFloorValue = Number(message.floor) || lastFloor\n          const nextBattleTurn = Math.max(0, Number(message.battleTurn) || 0)`,
  `          const nextFloorValue = Number(message.floor) || lastFloor\n          const nextBattleTurn = Math.max(0, Number(message.battleTurn) || 0)\n          if (Array.isArray(message.enemies)) lastEnemies = message.enemies.map(String)`,
  'consume current enemies',
)

replaceOnce(
  'src/browser-worker.ts',
  `              maxActiveFloor,\n            })`,
  `              maxActiveFloor,\n              enemies: lastEnemies,\n            })`,
  'forward enemies to page',
)

replaceOnce(
  'src/browser-worker.ts',
  `      const result = simulateOne(request, (floor, battleTurn) => {\n        self.postMessage({\n          kind: 'progress',\n          id: request.id,\n          runIndex: request.runIndex,\n          floor,\n          battleTurn,\n        })\n      })`,
  `      const result = simulateOne(request, (floor, battleTurn, enemyNames) => {\n        self.postMessage({\n          kind: 'progress',\n          id: request.id,\n          runIndex: request.runIndex,\n          floor,\n          battleTurn,\n          enemies: enemyNames,\n        })\n      })`,
  'single worker forwards enemies',
)

const indexPath = 'index.html'
let html = fs.readFileSync(indexPath, 'utf8')
const oldProgress = `if(e.data.kind==='progress'){const now=performance.now(),done=e.data.completedRuns||0,total=e.data.totalRuns||state.runs,active=Number(e.data.activeRuns)||1,min=Number(e.data.minActiveFloor)||Number(e.data.floor)||1,max=Number(e.data.maxActiveFloor)||min,range=min===max?\`Floor \${full(min)}\`:\`Floors \${full(min)}–\${full(max)}\`,turn=Number(e.data.battleTurn)||0;state.runningLabel=\`Team \${p.teamIndex+1} · \${done}/\${total} runs done · \${active} active · \${range}\${turn?\` · current T\${turn}\`:''}\`;if(now-state.lastProgressRender>250){state.lastProgressRender=now;render()}return}`
const newProgress = `if(e.data.kind==='progress'){const now=performance.now(),done=e.data.completedRuns||0,total=e.data.totalRuns||state.runs,active=Number(e.data.activeRuns)||1,min=Number(e.data.minActiveFloor)||Number(e.data.floor)||1,max=Number(e.data.maxActiveFloor)||min,range=min===max?\`Floor \${full(min)}\`:\`Floors \${full(min)}–\${full(max)}\`,turn=Number(e.data.battleTurn)||0,enemies=Array.isArray(e.data.enemies)?e.data.enemies:[],matchup=turn>=150&&enemies.length?\` · vs \${enemies.join(' / ')}\`:'';state.runningLabel=\`Team \${p.teamIndex+1} · \${done}/\${total} runs done · \${active} active · \${range}\${turn?\` · current T\${turn}\`:''}\${matchup}\`;if(now-state.lastProgressRender>250){state.lastProgressRender=now;render()}return}`
const count = html.split(oldProgress).length - 1
if (count !== 1) throw new Error(`live progress diagnostic label: expected 1 match, found ${count}`)
html = html.replace(oldProgress, newProgress)
html = html.replace(
  'Runs execute in parallel. The displayed floor range shows all active workers; battle-turn heartbeats keep long fights from looking frozen.',
  'Runs execute in parallel. Long battles show the exact enemy lineup; pathological fights stop at 5,000 turns with seeds instead of running forever.',
)
fs.writeFileSync(indexPath, html)

console.log('Added live enemy-lineup diagnostics and a non-silent 5,000-turn investigation cap.')

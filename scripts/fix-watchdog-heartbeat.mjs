import fs from 'node:fs'

function replaceOnce(path, oldText, newText, label) {
  let text = fs.readFileSync(path, 'utf8')
  const count = text.split(oldText).length - 1
  if (count !== 1) throw new Error(`${label}: expected 1 match, found ${count}`)
  text = text.replace(oldText, newText)
  fs.writeFileSync(path, text)
}

replaceOnce(
  'src/engine/battle-v2.ts',
  `  markTurnCap = false,\n  captureDebug = false,\n): BattleResult {`,
  `  markTurnCap = false,\n  captureDebug = false,\n  onProgress?: (turn: number) => void,\n): BattleResult {`,
  'battle progress callback signature',
)

replaceOnce(
  'src/engine/battle-v2.ts',
  `    state.turn += 1\n    let attacker = active(runtime, state.moving)`,
  `    state.turn += 1\n    // Heartbeat for the outer browser watchdog. This is intentionally sparse so\n    // normal fast battles do not spam worker messages, while long battles still\n    // prove that the engine is actively advancing.\n    if (state.turn % 5 === 0) onProgress?.(state.turn)\n    let attacker = active(runtime, state.moving)`,
  'battle heartbeat emission',
)

replaceOnce(
  'src/engine/battle-v2.ts',
  `    if (turnsWithoutDeaths >= 100) {`,
  `    if (turnsWithoutDeaths >= 150) {`,
  'restore Expansion 150-turn timeout',
)

replaceOnce(
  'src/engine/battle-v2.ts',
  `        detail: \`OG-server 100-turn no-progress resolution vs \${effectiveCardName(defender) || defender.definition.name}: both active cards defeated\`,` ,
  `        detail: \`Expansion 150-turn no-progress resolution vs \${effectiveCardName(defender) || defender.definition.name}: both active cards defeated\`,` ,
  'restore Expansion timeout debug label',
)

replaceOnce(
  'src/engine/simulation.ts',
  `export type DepthsProgressCallback = (floor: number) => void`,
  `export type DepthsProgressCallback = (floor: number, battleTurn?: number) => void`,
  'Depths progress callback type',
)

replaceOnce(
  'src/engine/simulation.ts',
  `    const battle = simulateBattleV2(loadout, enemies, floorSeed ^ 0x51ed270b, maxTurns, hasTurnCap)`,
  `    const battle = simulateBattleV2(\n      loadout, enemies, floorSeed ^ 0x51ed270b, maxTurns, hasTurnCap, false,\n      (battleTurn) => onProgress?.(floor, battleTurn),\n    )`,
  'wire winning battle heartbeat',
)

replaceOnce(
  'src/engine/simulation.ts',
  `      const debugBattle = simulateBattleV2(loadout, enemies, floorSeed ^ 0x51ed270b, maxTurns, hasTurnCap, true)`,
  `      const debugBattle = simulateBattleV2(\n        loadout, enemies, floorSeed ^ 0x51ed270b, maxTurns, hasTurnCap, true,\n        (battleTurn) => onProgress?.(floor, battleTurn),\n      )`,
  'wire losing debug battle heartbeat',
)

replaceOnce(
  'src/browser-worker.ts',
  `function simulateOne(request: SingleRunRequest, onProgress?: (floor: number) => void): DepthsRunResult {`,
  `function simulateOne(request: SingleRunRequest, onProgress?: (floor: number, battleTurn?: number) => void): DepthsRunResult {`,
  'worker progress callback type',
)

replaceOnce(
  'src/browser-worker.ts',
  `      let lastFloor = 1\n      let lastForwardedAt = 0`,
  `      let lastFloor = 1\n      let lastBattleTurn = 0\n      let lastForwardedAt = 0`,
  'worker heartbeat state',
)

replaceOnce(
  'src/browser-worker.ts',
  `          fail(new Error(\`Simulation stalled on run \${runIndex + 1}/\${runs} near floor \${lastFloor}. No floor progress for \${STALL_WATCHDOG_MS / 1000}s. Batch seed \${request.seed}; run seed \${runSeed(request.seed, runIndex)}.\`))`,
  `          const turnText = lastBattleTurn > 0 ? \` around battle turn \${lastBattleTurn}\` : ''\n          fail(new Error(\`Simulation stalled on run \${runIndex + 1}/\${runs} near floor \${lastFloor}\${turnText}. No simulation progress for \${STALL_WATCHDOG_MS / 1000}s. Batch seed \${request.seed}; run seed \${runSeed(request.seed, runIndex)}.\`))`,
  'watchdog error detail',
)

replaceOnce(
  'src/browser-worker.ts',
  `        if (message?.kind === 'progress') {\n          const nextFloorValue = Number(message.floor) || lastFloor\n          if (nextFloorValue !== lastFloor) {\n            lastFloor = nextFloorValue\n            armWatchdog()\n          }\n          const now = performance.now()\n          if (now - lastForwardedAt >= 100) {\n            lastForwardedAt = now\n            self.postMessage({\n              kind: 'progress',\n              id: request.id,\n              completedRuns: completed,\n              totalRuns: runs,\n              runIndex,\n              floor: lastFloor,\n            })\n          }\n          return\n        }`,
  `        if (message?.kind === 'progress') {\n          const nextFloorValue = Number(message.floor) || lastFloor\n          const nextBattleTurn = Math.max(0, Number(message.battleTurn) || 0)\n          const floorAdvanced = nextFloorValue !== lastFloor\n          const turnAdvanced = !floorAdvanced && nextBattleTurn > lastBattleTurn\n          if (floorAdvanced) {\n            lastFloor = nextFloorValue\n            lastBattleTurn = nextBattleTurn\n            armWatchdog()\n          } else if (turnAdvanced) {\n            lastBattleTurn = nextBattleTurn\n            armWatchdog()\n          }\n          const now = performance.now()\n          if (now - lastForwardedAt >= 100) {\n            lastForwardedAt = now\n            self.postMessage({\n              kind: 'progress',\n              id: request.id,\n              completedRuns: completed,\n              totalRuns: runs,\n              runIndex,\n              floor: lastFloor,\n              battleTurn: lastBattleTurn || undefined,\n            })\n          }\n          return\n        }`,
  'watchdog advances on battle heartbeat',
)

replaceOnce(
  'src/browser-worker.ts',
  `      const result = simulateOne(request, (floor) => {\n        self.postMessage({\n          kind: 'progress',\n          id: request.id,\n          runIndex: request.runIndex,\n          floor,\n        })\n      })`,
  `      const result = simulateOne(request, (floor, battleTurn) => {\n        self.postMessage({\n          kind: 'progress',\n          id: request.id,\n          runIndex: request.runIndex,\n          floor,\n          battleTurn,\n        })\n      })`,
  'single-run forwards battle heartbeat',
)

replaceOnce(
  'scripts/engine-smoke.ts',
  `assert(timeoutBattle.turns >= 100 && timeoutBattle.turns <= 105, \`Source-aligned timeout should resolve at about 100 no-progress turns, got \${timeoutBattle.turns}\`)\nconsole.log('Source-aligned 100-turn no-progress regression passed:', timeoutBattle.turns, 'turns')`,
  `assert(timeoutBattle.turns >= 145 && timeoutBattle.turns <= 155, \`Expansion timeout should resolve at about 150 no-progress turns, got \${timeoutBattle.turns}\`)\nconsole.log('Expansion 150-turn no-progress regression passed:', timeoutBattle.turns, 'turns')`,
  'restore Expansion timeout regression',
)

const heartbeatRegression = `import { simulateBattleV2 } from '../src/engine/battle-v2'\nimport cards from '../src/data/cards'\nimport type { DepthsEnemy, TeamLoadout } from '../src/types'\n\nfunction assert(condition: unknown, message: string): asserts condition {\n  if (!condition) throw new Error(message)\n}\n\nconst mastermind = cards.find((card) => card.name === 'Mastermind')\nif (!mastermind) throw new Error('Mastermind test card missing')\n\nconst enemyCard = { ...mastermind, name: '__Watchdog Heartbeat Enemy__', ability: null }\nconst enemies: DepthsEnemy[] = [{ card: enemyCard, power: 1, attack: 0, health: 1e30 }]\nconst loadout: TeamLoadout = { cards: [{ cardName: 'Mastermind', borders: [] }] }\nconst beats: number[] = []\nconst battle = simulateBattleV2(loadout, enemies, 424242, 10_000, true, false, (turn) => beats.push(turn))\n\nassert(!battle.unsupportedAbilities.includes('Battle turn cap reached'), 'Heartbeat test hit emergency battle cap')\nassert(battle.turns >= 145 && battle.turns <= 155, 'Expected Expansion 150-turn no-progress resolution, got ' + battle.turns)\nassert(beats.length >= 20, 'Too few watchdog heartbeats: ' + beats.length)\nassert(beats[0] === 5, 'First heartbeat should be turn 5, got ' + beats[0])\nassert(beats.some((turn) => turn >= 145), 'Heartbeat did not continue through the long battle')\nfor (let index = 1; index < beats.length; index++) {\n  assert(beats[index] > beats[index - 1], 'Heartbeat turns did not increase monotonically')\n}\n\nconsole.log('Watchdog heartbeat regression passed:', battle.turns, 'turns with', beats.length, 'heartbeats.')\n`
fs.writeFileSync('scripts/watchdog-heartbeat-regression.ts', heartbeatRegression)

console.log('Applied battle-turn watchdog heartbeats and restored Expansion 150-turn timeout.')

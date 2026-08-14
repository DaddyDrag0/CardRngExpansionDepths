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
  `const OTHER_TEAM: Record<BattleTeam, BattleTeam> = { Allies: 'Enemies', Enemies: 'Allies' }\n`,
  `const OTHER_TEAM: Record<BattleTeam, BattleTeam> = { Allies: 'Enemies', Enemies: 'Allies' }\n// Ability resolution is an extremely hot path during high-floor batches. Avoid\n// scanning the full card database every time an identity/ability is resolved.\nconst CARD_BY_NAME = new Map(cards.map((card) => [card.name, card] as const))\n`,
  'card lookup index',
)

replaceOnce(
  'src/engine/battle-v2.ts',
  `function definition(name: string) {\n  return cards.find((card) => card.name === name)\n}`,
  `function definition(name: string) {\n  return CARD_BY_NAME.get(name)\n}`,
  'indexed definition lookup',
)

replaceOnce(
  'src/engine/battle-v2.ts',
  `const RANDOM_CARD_POOL = cards.filter((card) =>\n  !card.unobtainable && card.ability !== "Pandora's Box" && card.ability !== 'Constellar'\n)\n`,
  `const RANDOM_CARD_POOL = cards.filter((card) =>\n  !card.unobtainable && card.ability !== "Pandora's Box" && card.ability !== 'Constellar'\n)\nconst NUWA_CREATABLE_POOL = cards.filter((card) => !card.expires && !card.unobtainable && card.name !== 'Nüwa')\n`,
  'precompute Nüwa pool',
)

replaceOnce(
  'src/engine/battle-v2.ts',
  `function randomCreatableCard(runtime: Runtime) {\n  // OG server source: Nüwa can create any non-expired, obtainable card except Nüwa itself.\n  // Pack and Boss are not separate exclusions here; Unobtainable/Expires are the source gates.\n  const pool = cards.filter((card) => !card.expires && !card.unobtainable && card.name !== 'Nüwa')\n  return pool[Math.floor(runtime.rng.next() * pool.length)] || cards[0]\n}`,
  `function randomCreatableCard(runtime: Runtime) {\n  // OG server source: Nüwa can create any non-expired, obtainable card except Nüwa itself.\n  // Pack and Boss are not separate exclusions here; Unobtainable/Expires are the source gates.\n  return NUWA_CREATABLE_POOL[Math.floor(runtime.rng.next() * NUWA_CREATABLE_POOL.length)] || cards[0]\n}`,
  'reuse Nüwa pool',
)

replaceOnce(
  'src/browser-worker.ts',
  `  const workerCount = Math.min(runs, Math.max(1, Math.min(8, hardware - 1 || 1)))\n  const results = new Array<DepthsRunResult>(runs)\n  const workers: Worker[] = []\n  let nextRun = 0`,
  `  const workerCount = Math.min(runs, Math.max(1, Math.min(12, hardware - 1 || 1)))\n  const results = new Array<DepthsRunResult>(runs)\n  const workers: Worker[] = []\n  const runFloors = new Array<number>(runs).fill(1)\n  const runBattleTurns = new Array<number>(runs).fill(0)\n  const activeRuns = new Set<number>()\n  let nextRun = 0`,
  'parallel worker and progress state',
)

replaceOnce(
  'src/browser-worker.ts',
  `      const runIndex = nextRun++\n      let lastFloor = 1`,
  `      const runIndex = nextRun++\n      activeRuns.add(runIndex)\n      let lastFloor = 1`,
  'mark active run',
)

replaceOnce(
  'src/browser-worker.ts',
  `          if (floorAdvanced) {\n            lastFloor = nextFloorValue\n            lastBattleTurn = nextBattleTurn\n            armWatchdog()\n          } else if (turnAdvanced) {\n            lastBattleTurn = nextBattleTurn\n            armWatchdog()\n          }\n          const now = performance.now()`,
  `          if (floorAdvanced) {\n            lastFloor = nextFloorValue\n            lastBattleTurn = nextBattleTurn\n            armWatchdog()\n          } else if (turnAdvanced) {\n            lastBattleTurn = nextBattleTurn\n            armWatchdog()\n          }\n          runFloors[runIndex] = lastFloor\n          runBattleTurns[runIndex] = lastBattleTurn\n          const activeFloorValues = [...activeRuns].map((index) => runFloors[index])\n          const minActiveFloor = activeFloorValues.length ? Math.min(...activeFloorValues) : lastFloor\n          const maxActiveFloor = activeFloorValues.length ? Math.max(...activeFloorValues) : lastFloor\n          const now = performance.now()`,
  'calculate aggregate progress',
)

replaceOnce(
  'src/browser-worker.ts',
  `              runIndex,\n              floor: lastFloor,\n              battleTurn: lastBattleTurn || undefined,\n            })`,
  `              runIndex,\n              floor: lastFloor,\n              battleTurn: lastBattleTurn || undefined,\n              activeRuns: activeRuns.size,\n              minActiveFloor,\n              maxActiveFloor,\n            })`,
  'forward aggregate progress',
)

replaceOnce(
  'src/browser-worker.ts',
  `        results[runIndex] = message.result\n        completed += 1\n        self.postMessage({`,
  `        results[runIndex] = message.result\n        runFloors[runIndex] = message.result?.deathFloor || lastFloor\n        runBattleTurns[runIndex] = 0\n        activeRuns.delete(runIndex)\n        completed += 1\n        const remainingFloors = [...activeRuns].map((index) => runFloors[index])\n        self.postMessage({`,
  'complete active run tracking',
)

replaceOnce(
  'src/browser-worker.ts',
  `          runIndex,\n          floor: message.result?.deathFloor || lastFloor,\n        })`,
  `          runIndex,\n          floor: message.result?.deathFloor || lastFloor,\n          activeRuns: activeRuns.size,\n          minActiveFloor: remainingFloors.length ? Math.min(...remainingFloors) : undefined,\n          maxActiveFloor: remainingFloors.length ? Math.max(...remainingFloors) : undefined,\n        })`,
  'completion aggregate progress',
)

const indexPath = 'index.html'
let html = fs.readFileSync(indexPath, 'utf8')
const oldProgress = `if(e.data.kind==='progress'){const now=performance.now();state.runningLabel=\`Team \${p.teamIndex+1} · \${e.data.completedRuns||0}/\${e.data.totalRuns||state.runs} runs done · Run \${Number(e.data.runIndex)+1} · Floor \${full(e.data.floor||1)}\`;if(now-state.lastProgressRender>250){state.lastProgressRender=now;render()}return}`
const newProgress = `if(e.data.kind==='progress'){const now=performance.now(),done=e.data.completedRuns||0,total=e.data.totalRuns||state.runs,active=Number(e.data.activeRuns)||1,min=Number(e.data.minActiveFloor)||Number(e.data.floor)||1,max=Number(e.data.maxActiveFloor)||min,range=min===max?\`Floor \${full(min)}\`:\`Floors \${full(min)}–\${full(max)}\`,turn=Number(e.data.battleTurn)||0;state.runningLabel=\`Team \${p.teamIndex+1} · \${done}/\${total} runs done · \${active} active · \${range}\${turn?\` · current T\${turn}\`:''}\`;if(now-state.lastProgressRender>250){state.lastProgressRender=now;render()}return}`
const count = html.split(oldProgress).length - 1
if (count !== 1) throw new Error(`live progress label: expected 1 match, found ${count}`)
html = html.replace(oldProgress, newProgress)
html = html.replace('Live progress updates every few floors. If one floor stops advancing for 20 seconds, the simulator will stop and report the run/floor instead of hanging.', 'Runs execute in parallel. The displayed floor range shows all active workers; battle-turn heartbeats keep long fights from looking frozen.')
fs.writeFileSync(indexPath, html)

console.log('Applied indexed combat lookups, up to 12 workers, and aggregate active-run progress.')

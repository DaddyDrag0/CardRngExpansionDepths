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
  `import { simulateBattleV2 } from './battle-v2'`,
  `import { simulateBattleV2 } from './battle-v2'\nimport { auraPackRangeForMedian } from './depths-rewards'`,
  'simulation reward import',
)

replaceOnce(
  'src/engine/simulation.ts',
  `  maxFloor: number\n  trusted: boolean`,
  `  maxFloor: number\n  estimatedFloorLow: number\n  estimatedFloorHigh: number\n  auraPackLow: number\n  auraPackHigh: number\n  trusted: boolean`,
  'batch result reward fields',
)

replaceOnce(
  'src/engine/simulation.ts',
  `  const medianFloor = floors.length % 2\n    ? floors[middle]\n    : (floors[middle - 1] + floors[middle]) / 2\n\n  return {`,
  `  const medianFloor = floors.length % 2\n    ? floors[middle]\n    : (floors[middle - 1] + floors[middle]) / 2\n  const estimate = auraPackRangeForMedian(medianFloor)\n\n  return {`,
  'simulation estimate calculation',
)

replaceOnce(
  'src/engine/simulation.ts',
  `    maxFloor: floors[floors.length - 1],\n    trusted: unsupported.size === 0,`,
  `    maxFloor: floors[floors.length - 1],\n    estimatedFloorLow: estimate.low,\n    estimatedFloorHigh: estimate.high,\n    auraPackLow: estimate.auraPackLow,\n    auraPackHigh: estimate.auraPackHigh,\n    trusted: unsupported.size === 0,`,
  'simulation estimate result fields',
)

replaceOnce(
  'src/browser-worker.ts',
  `import { SeededRng } from './engine/rng'`,
  `import { SeededRng } from './engine/rng'\nimport { auraPackRangeForMedian } from './engine/depths-rewards'`,
  'worker reward import',
)

replaceOnce(
  'src/browser-worker.ts',
  `  const medianFloor = floors.length % 2 ? floors[middle] : (floors[middle - 1] + floors[middle]) / 2\n  return {`,
  `  const medianFloor = floors.length % 2 ? floors[middle] : (floors[middle - 1] + floors[middle]) / 2\n  const estimate = auraPackRangeForMedian(medianFloor)\n  return {`,
  'worker estimate calculation',
)

replaceOnce(
  'src/browser-worker.ts',
  `    maxFloor: floors[floors.length - 1],\n    trusted: unsupported.size === 0,`,
  `    maxFloor: floors[floors.length - 1],\n    estimatedFloorLow: estimate.low,\n    estimatedFloorHigh: estimate.high,\n    auraPackLow: estimate.auraPackLow,\n    auraPackHigh: estimate.auraPackHigh,\n    trusted: unsupported.size === 0,`,
  'worker estimate result fields',
)

replaceOnce(
  'index.html',
  `.result-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:12px}.result-metrics div{background:#0d141d;border:1px solid #1e2937;border-radius:9px;padding:8px}.result-metrics span{display:block;color:#687789;font-size:8px;text-transform:uppercase}.result-metrics b{display:block;margin-top:3px;font-size:15px}`,
  `.result-metrics{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,.8fr);gap:6px;margin-top:12px}.result-metrics div{background:#0d141d;border:1px solid #1e2937;border-radius:9px;padding:10px}.result-metrics span{display:block;color:#687789;font-size:8px;text-transform:uppercase}.result-metrics b{display:block;margin-top:4px;font-size:17px}.result-metrics small{display:block;margin-top:4px;color:#758397;font-size:8px;line-height:1.35}`,
  'result metric CSS',
)

replaceOnce(
  'index.html',
  `@media(max-width:760px){.aura-grid{grid-template-columns:1fr}.team-tabs .tab-action{margin-left:0}.sim-actions{grid-template-columns:1fr}.result-metrics{grid-template-columns:1fr 1fr}}`,
  `@media(max-width:760px){.aura-grid{grid-template-columns:1fr}.team-tabs .tab-action{margin-left:0}.sim-actions{grid-template-columns:1fr}.result-metrics{grid-template-columns:1fr}}`,
  'mobile result metric CSS',
)

replaceOnce(
  'index.html',
  `${'${'}t.result?\`Avg ${'${'}one(t.result.averageFloor)}\`:complete(t)?'Ready':'Empty'}`, 
  `${'${'}t.result?\`Range ${'${'}compact(t.result.estimatedFloorLow)}–${'${'}compact(t.result.estimatedFloorHigh)}\`:complete(t)?'Ready':'Empty'}`,
  'team tab range label',
)

replaceOnce(
  'index.html',
  `<div class="result-metrics"><div><span>Average</span><b>${'${'}one(r.averageFloor)}</b></div><div><span>Median</span><b>${'${'}one(r.medianFloor)}</b></div><div><span>Peak</span><b>${'${'}full(r.maxFloor)}</b></div><div><span>Low</span><b>${'${'}full(r.minFloor)}</b></div></div>`,
  `<div class="result-metrics"><div><span>Estimated Depth range</span><b>${'${'}full(r.estimatedFloorLow)} – ${'${'}full(r.estimatedFloorHigh)}</b><small>±15% from the simulation median</small></div><div title="${'${'}full(r.auraPackLow)} – ${'${'}full(r.auraPackHigh)} Aura Packs"><span>Aura Pack reward</span><b>${'${'}compact(r.auraPackLow)} – ${'${'}compact(r.auraPackHigh)}</b><small>Cumulative reward across that Depth range</small></div></div>`,
  'replace Average Median Peak Low cards',
)

const regression = `import { auraPackRangeForMedian, auraPacksForDepth, depthsRewardStageAttack, estimatedDepthRange } from '../src/engine/depths-rewards'\n\nfunction assert(condition: unknown, message: string): asserts condition {\n  if (!condition) throw new Error(message)\n}\n\nassert(depthsRewardStageAttack(1) === 39, 'StageATK floor 1 mismatch')\nassert(depthsRewardStageAttack(100) === 2242, 'StageATK floor 100 mismatch')\nassert(auraPacksForDepth(1) === 1, 'Aura Packs floor 1 mismatch')\nassert(auraPacksForDepth(100) === 249, 'Aura Packs floor 100 mismatch')\nconst range = estimatedDepthRange(13334)\nassert(range.low === 11334 && range.high === 15334, '15% estimated range mismatch: ' + JSON.stringify(range))\nconst reward = auraPackRangeForMedian(13334)\nassert(reward.auraPackLow === 12838510, 'Low Aura Pack reward mismatch: ' + reward.auraPackLow)\nassert(reward.auraPackHigh === 26117287, 'High Aura Pack reward mismatch: ' + reward.auraPackHigh)\nconsole.log('Depths reward regression passed:', reward)\n`
fs.writeFileSync('scripts/depths-rewards-regression.ts', regression)

console.log('Replaced floor summary with ±15% median range and added Aura Pack reward range.')

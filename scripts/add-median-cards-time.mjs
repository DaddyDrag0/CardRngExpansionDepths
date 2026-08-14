import fs from 'node:fs'

function replaceOnce(path, before, after, label) {
  let text = fs.readFileSync(path, 'utf8')
  const count = text.split(before).length - 1
  if (count !== 1) throw new Error(`${label}: expected 1 match, found ${count}`)
  text = text.replace(before, after)
  fs.writeFileSync(path, text)
}

replaceOnce(
  'src/engine/depths-rewards.ts',
  `  return {\n    ...range,\n    auraPackLow: auraPacksForDepth(range.low),\n    auraPackHigh: auraPacksForDepth(range.high),\n  }`,
  `  const medianDepth = Math.max(1, Math.round(Number(medianFloor) || 1))\n  return {\n    ...range,\n    medianDepth,\n    auraPackLow: auraPacksForDepth(range.low),\n    auraPackMedian: auraPacksForDepth(medianDepth),\n    auraPackHigh: auraPacksForDepth(range.high),\n  }`,
  'add median Aura Pack reward',
)

replaceOnce(
  'src/engine/simulation.ts',
  `import { auraPackRangeForMedian } from './depths-rewards'`,
  `import { auraPackRangeForMedian } from './depths-rewards'\nimport { estimateDepthClearSeconds } from './depths-time'`,
  'simulation time import',
)

replaceOnce(
  'src/engine/simulation.ts',
  `  auraPackLow: number\n  auraPackHigh: number\n  trusted: boolean`,
  `  auraPackLow: number\n  auraPackMedian: number\n  auraPackHigh: number\n  averageTurnsPerBattle: number\n  estimatedSecondsLow: number\n  estimatedSecondsMedian: number\n  estimatedSecondsHigh: number\n  auraCardsPerHour: number\n  trusted: boolean`,
  'batch time fields',
)

replaceOnce(
  'src/engine/simulation.ts',
  `  const estimate = auraPackRangeForMedian(medianFloor)\n\n  return {`,
  `  const estimate = auraPackRangeForMedian(medianFloor)\n  const totalBattles = results.reduce((sum, result) => sum + result.battles, 0)\n  const allTurns = results.reduce((sum, result) => sum + result.totalTurns, 0)\n  const averageTurnsPerBattle = totalBattles > 0 ? allTurns / totalBattles : 0\n  const estimatedSecondsLow = estimateDepthClearSeconds(estimate.low, averageTurnsPerBattle, true)\n  const estimatedSecondsMedian = estimateDepthClearSeconds(estimate.medianDepth, averageTurnsPerBattle, true)\n  const estimatedSecondsHigh = estimateDepthClearSeconds(estimate.high, averageTurnsPerBattle, true)\n  const auraCardsPerHour = estimatedSecondsMedian > 0 ? estimate.auraPackMedian / (estimatedSecondsMedian / 3600) : 0\n\n  return {`,
  'simulation time calculation',
)

replaceOnce(
  'src/engine/simulation.ts',
  `    auraPackLow: estimate.auraPackLow,\n    auraPackHigh: estimate.auraPackHigh,\n    trusted: unsupported.size === 0,`,
  `    auraPackLow: estimate.auraPackLow,\n    auraPackMedian: estimate.auraPackMedian,\n    auraPackHigh: estimate.auraPackHigh,\n    averageTurnsPerBattle,\n    estimatedSecondsLow,\n    estimatedSecondsMedian,\n    estimatedSecondsHigh,\n    auraCardsPerHour,\n    trusted: unsupported.size === 0,`,
  'simulation time result fields',
)

replaceOnce(
  'src/browser-worker.ts',
  `import { auraPackRangeForMedian } from './engine/depths-rewards'`,
  `import { auraPackRangeForMedian } from './engine/depths-rewards'\nimport { estimateDepthClearSeconds } from './engine/depths-time'`,
  'worker time import',
)

replaceOnce(
  'src/browser-worker.ts',
  `  const estimate = auraPackRangeForMedian(medianFloor)\n  return {`,
  `  const estimate = auraPackRangeForMedian(medianFloor)\n  const totalBattles = results.reduce((sum, result) => sum + result.battles, 0)\n  const totalTurns = results.reduce((sum, result) => sum + result.totalTurns, 0)\n  const averageTurnsPerBattle = totalBattles > 0 ? totalTurns / totalBattles : 0\n  const estimatedSecondsLow = estimateDepthClearSeconds(estimate.low, averageTurnsPerBattle, true)\n  const estimatedSecondsMedian = estimateDepthClearSeconds(estimate.medianDepth, averageTurnsPerBattle, true)\n  const estimatedSecondsHigh = estimateDepthClearSeconds(estimate.high, averageTurnsPerBattle, true)\n  const auraCardsPerHour = estimatedSecondsMedian > 0 ? estimate.auraPackMedian / (estimatedSecondsMedian / 3600) : 0\n  return {`,
  'worker time calculation',
)

replaceOnce(
  'src/browser-worker.ts',
  `    auraPackLow: estimate.auraPackLow,\n    auraPackHigh: estimate.auraPackHigh,\n    trusted: unsupported.size === 0,`,
  `    auraPackLow: estimate.auraPackLow,\n    auraPackMedian: estimate.auraPackMedian,\n    auraPackHigh: estimate.auraPackHigh,\n    averageTurnsPerBattle,\n    estimatedSecondsLow,\n    estimatedSecondsMedian,\n    estimatedSecondsHigh,\n    auraCardsPerHour,\n    trusted: unsupported.size === 0,`,
  'worker time result fields',
)

replaceOnce(
  'index.html',
  `.result-metrics{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,.8fr);gap:6px;margin-top:12px}`,
  `.result-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin-top:12px}`,
  'five result metric columns',
)

replaceOnce(
  'index.html',
  `@media(max-width:760px){.aura-grid{grid-template-columns:1fr}.team-tabs .tab-action{margin-left:0}.sim-actions{grid-template-columns:1fr}.result-metrics{grid-template-columns:1fr}}`,
  `@media(max-width:1050px){.result-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:760px){.aura-grid{grid-template-columns:1fr}.team-tabs .tab-action{margin-left:0}.sim-actions{grid-template-columns:1fr}.result-metrics{grid-template-columns:1fr}}`,
  'responsive result metrics',
)

replaceOnce(
  'index.html',
  `  const compact=n=>Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:2}).format(n),full=n=>Math.round(n).toLocaleString('en-US'),one=n=>Number(n).toLocaleString('en-US',{maximumFractionDigits:1}),pct=n=>Number.isInteger(n)?String(n):Number(n.toFixed(2)).toString();`,
  `  const compact=n=>Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:2}).format(n),full=n=>Math.round(n).toLocaleString('en-US'),one=n=>Number(n).toLocaleString('en-US',{maximumFractionDigits:1}),pct=n=>Number.isInteger(n)?String(n):Number(n.toFixed(2)).toString();\n  const duration=s=>{const n=Math.max(0,Math.round(Number(s)||0)),h=Math.floor(n/3600),m=Math.floor(n%3600/60),sec=n%60;if(h)return \`${'${'}h}h ${'${'}m}m\`;if(m)return \`${'${'}m}m ${'${'}sec}s\`;return \`${'${'}sec}s\`};`,
  'duration formatter',
)

replaceOnce(
  'index.html',
  `<div class="result-metrics"><div><span>Estimated Depth range</span><b>${'${'}full(r.estimatedFloorLow)} – ${'${'}full(r.estimatedFloorHigh)}</b><small>±15% from the simulation median</small></div><div title="${'${'}full(r.auraPackLow)} – ${'${'}full(r.auraPackHigh)} Aura Packs"><span>Aura Pack reward</span><b>${'${'}compact(r.auraPackLow)} – ${'${'}compact(r.auraPackHigh)}</b><small>Cumulative reward across that Depth range</small></div></div>`,
  `<div class="result-metrics"><div><span>Estimated Depth range</span><b>${'${'}full(r.estimatedFloorLow)} – ${'${'}full(r.estimatedFloorHigh)}</b><small>Median: ${'${'}one(r.medianFloor)} · ±15%</small></div><div title="${'${'}full(r.auraPackLow)} – ${'${'}full(r.auraPackHigh)} Aura Packs"><span>Aura Pack reward</span><b>${'${'}compact(r.auraPackLow)} – ${'${'}compact(r.auraPackHigh)}</b><small>Median: ${'${'}compact(r.auraPackMedian)} packs</small></div><div title="One Aura Pack opens one Aura Card roll"><span>Aura cards</span><b>≈${'${'}compact(r.auraPackMedian)}</b><small>${'${'}compact(r.auraPackLow)}–${'${'}compact(r.auraPackHigh)} across the range · 1 card / pack</small></div><div><span>Estimated clear time</span><b>${'${'}duration(r.estimatedSecondsMedian)}</b><small>${'${'}duration(r.estimatedSecondsLow)}–${'${'}duration(r.estimatedSecondsHigh)} · Battle Speed 3 + Chrono Shard + floor scaling</small></div><div><span>Aura cards / hour</span><b>≈${'${'}compact(r.auraCardsPerHour)}</b><small>Using the median reward and estimated median clear time</small></div></div>`,
  'expanded result metrics',
)

const regression = `import { auraPackRangeForMedian } from '../src/engine/depths-rewards'\nimport { depthsFloorSpeedBonus, effectiveDepthsBattleSpeed, estimateBattleSeconds, inBattleAcceleration } from '../src/engine/depths-time'\n\nfunction assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message) }\nfunction close(a: number, b: number, eps = 1e-9) { return Math.abs(a - b) <= eps }\n\nassert(effectiveDepthsBattleSpeed(1, true) === 4, 'Floor 1 Battle Speed should be 3 + Chrono 1')\nassert(effectiveDepthsBattleSpeed(100, true) === 4.25, 'Floor 100 Battle Speed should include +0.25')\nassert(depthsFloorSpeedBonus(1800) === 4.5, 'Depths floor Battle Speed bonus should cap at +4.5')\nassert(effectiveDepthsBattleSpeed(5000, true) === 8.5, 'High-floor Battle Speed should cap at 8.5 with Chrono')\nassert(inBattleAcceleration(9) === 1 && inBattleAcceleration(10) === 2, '10-attack acceleration mismatch')\nassert(inBattleAcceleration(20) === 3 && inBattleAcceleration(40) === 5 && inBattleAcceleration(60) === 10, 'Long-battle acceleration mismatch')\nassert(close(estimateBattleSeconds(1, 1, true), 0.4), 'One-turn floor 1 battle timing mismatch')\nconst reward = auraPackRangeForMedian(13334)\nassert(reward.medianDepth === 13334, 'Median depth mismatch')\nassert(reward.auraPackLow === 12838510, 'Low Aura Pack mismatch')\nassert(reward.auraPackMedian === 18807292, 'Median Aura Pack mismatch')\nassert(reward.auraPackHigh === 26117287, 'High Aura Pack mismatch')\nconsole.log('Depths speed/reward regression passed:', reward)\n`
fs.writeFileSync('scripts/depths-time-regression.ts', regression)

console.log('Added median reward, Aura Cards, source-based clear time, and hourly yield.')

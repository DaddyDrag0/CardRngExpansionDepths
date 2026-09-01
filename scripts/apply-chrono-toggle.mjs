import fs from 'node:fs'

function replaceOnce(path, oldText, newText) {
  let text = fs.readFileSync(path, 'utf8')
  if (!text.includes(oldText)) throw new Error(`${path}: target not found: ${oldText.slice(0, 120)}`)
  text = text.replace(oldText, newText)
  fs.writeFileSync(path, text)
}

// Timing calibration: 0.85s -> 0.90s.
replaceOnce('src/engine/depths-time.ts', 'currently set to 0.85 seconds per', 'currently set to 0.90 seconds per')
replaceOnce('src/engine/depths-time.ts', 'export const INTER_FLOOR_OVERHEAD_SECONDS = 0.85', 'export const INTER_FLOOR_OVERHEAD_SECONDS = 0.9')
replaceOnce('scripts/depths-time-regression.ts', "assert(close(estimateBattleSeconds(1, 1, true), 1.25), 'One-turn floor 1 battle timing mismatch')", "assert(close(estimateBattleSeconds(1, 1, true), 1.3), 'One-turn floor 1 battle timing mismatch')\nassert(effectiveDepthsBattleSpeed(1, false) === 3, 'Floor 1 Battle Speed without Chrono should be 3')\nassert(estimateBattleSeconds(1, 1, false) > estimateBattleSeconds(1, 1, true), 'Chrono Shard should reduce estimated battle time')")

// Engine batch API: make Chrono optional, defaulting to enabled for backwards compatibility.
replaceOnce('src/engine/simulation.ts', '  battleSpeedStructureLevel?: number\n}', '  battleSpeedStructureLevel?: number\n  chronoShard?: boolean\n}')
replaceOnce('src/engine/simulation.ts', 'estimateDepthClearSeconds(estimate.low, averageTurnsPerBattle, true, options.battleSpeedStructureLevel)', 'estimateDepthClearSeconds(estimate.low, averageTurnsPerBattle, options.chronoShard ?? true, options.battleSpeedStructureLevel)')
replaceOnce('src/engine/simulation.ts', 'estimateDepthClearSeconds(estimate.medianDepth, averageTurnsPerBattle, true, options.battleSpeedStructureLevel)', 'estimateDepthClearSeconds(estimate.medianDepth, averageTurnsPerBattle, options.chronoShard ?? true, options.battleSpeedStructureLevel)')
replaceOnce('src/engine/simulation.ts', 'estimateDepthClearSeconds(estimate.high, averageTurnsPerBattle, true, options.battleSpeedStructureLevel)', 'estimateDepthClearSeconds(estimate.high, averageTurnsPerBattle, options.chronoShard ?? true, options.battleSpeedStructureLevel)')

// Browser worker: carry the toggle into the timing summary.
replaceOnce('src/browser-worker.ts', '  battleSpeedStructureLevel?: number\n}', '  battleSpeedStructureLevel?: number\n  chronoShard?: boolean\n}')
replaceOnce('src/browser-worker.ts', 'function summarize(results: DepthsRunResult[], bountifulDepths = false, battleSpeedStructureLevel = 0) {', 'function summarize(results: DepthsRunResult[], bountifulDepths = false, battleSpeedStructureLevel = 0, chronoShard = true) {')
replaceOnce('src/browser-worker.ts', 'estimateDepthClearSeconds(estimate.low, averageTurnsPerBattle, true, battleSpeedStructureLevel)', 'estimateDepthClearSeconds(estimate.low, averageTurnsPerBattle, chronoShard, battleSpeedStructureLevel)')
replaceOnce('src/browser-worker.ts', 'estimateDepthClearSeconds(estimate.medianDepth, averageTurnsPerBattle, true, battleSpeedStructureLevel)', 'estimateDepthClearSeconds(estimate.medianDepth, averageTurnsPerBattle, chronoShard, battleSpeedStructureLevel)')
replaceOnce('src/browser-worker.ts', 'estimateDepthClearSeconds(estimate.high, averageTurnsPerBattle, true, battleSpeedStructureLevel)', 'estimateDepthClearSeconds(estimate.high, averageTurnsPerBattle, chronoShard, battleSpeedStructureLevel)')
replaceOnce('src/browser-worker.ts', 'result: summarize(results, request.bountifulDepths, request.battleSpeedStructureLevel)', 'result: summarize(results, request.bountifulDepths, request.battleSpeedStructureLevel, request.chronoShard !== false)')

// UI state, persistence, toggle, worker request, and result label.
replaceOnce('index-base.html', "bountifulDepths:false,rebanLegacyDepths:false,battleSpeedStructureLevel:0", "bountifulDepths:false,chronoShard:true,rebanLegacyDepths:false,battleSpeedStructureLevel:0")
replaceOnce('index-base.html', 'bountifulDepths:state.bountifulDepths,battleSpeedStructureLevel:state.battleSpeedStructureLevel', 'bountifulDepths:state.bountifulDepths,chronoShard:state.chronoShard,battleSpeedStructureLevel:state.battleSpeedStructureLevel')
replaceOnce('index-base.html', 'state.bountifulDepths=Boolean(s.bountifulDepths);state.battleSpeedStructureLevel=', 'state.bountifulDepths=Boolean(s.bountifulDepths);state.chronoShard=s.chronoShard!==false;state.battleSpeedStructureLevel=')
replaceOnce('index-base.html', '· Battle Speed 3 + Chrono Shard + Structure L${state.battleSpeedStructureLevel} + floor scaling', "· Battle Speed 3${state.chronoShard?' + Chrono Shard':''} + Structure L${state.battleSpeedStructureLevel} + floor scaling")
replaceOnce('index-base.html', '<div class="relic-toggle ${state.bountifulDepths?\'on\':\'\'}"><div><span>Bountiful Depths</span>', '<div class="relic-toggle ${state.chronoShard?\'on\':\'\'}"><div><span>Chrono Shard</span><small>Relic · +1 Battle Speed. Turn this off if you do not own/use the relic.</small></div><button type="button" data-chrono-shard>${state.chronoShard?\'ON\':\'OFF\'}</button></div><div class="relic-toggle ${state.bountifulDepths?\'on\':\'\'}"><div><span>Bountiful Depths</span>')
replaceOnce('index-base.html', "root.querySelector('[data-bountiful-depths]')?.addEventListener('click',()=>{state.bountifulDepths=!state.bountifulDepths;", "root.querySelector('[data-chrono-shard]')?.addEventListener('click',()=>{state.chronoShard=!state.chronoShard;state.teams.forEach(t=>{t.result=null;t.elapsedMs=0;t.lastError=''});persist();render()});root.querySelector('[data-bountiful-depths]')?.addEventListener('click',()=>{state.bountifulDepths=!state.bountifulDepths;")
replaceOnce('index-base.html', 'bountifulDepths:state.bountifulDepths,battleSpeedStructureLevel:state.battleSpeedStructureLevel})', 'bountifulDepths:state.bountifulDepths,chronoShard:state.chronoShard,battleSpeedStructureLevel:state.battleSpeedStructureLevel})')

// Permanent UI/worker guards.
replaceOnce('scripts/validate-ui.mjs', "if (!liveHtml.includes('runs:15,cap:100000,seed:1000')) throw new Error('Depths fixed floor cap is not initialized to 100,000')", "if (!liveHtml.includes('runs:15,cap:100000,seed:1000')) throw new Error('Depths fixed floor cap is not initialized to 100,000')\nif (!liveHtml.includes('chronoShard:true')) throw new Error('Chrono Shard timing toggle must default on')\nif (!liveHtml.includes('data-chrono-shard')) throw new Error('Chrono Shard timing toggle is missing from the UI')\nif (!liveHtml.includes('chronoShard:state.chronoShard')) throw new Error('Chrono Shard timing setting is not sent to the worker')")
replaceOnce('scripts/validate-ui.mjs', "for (const removedField of ['excludedCardNames', 'selectedCardNames']) {", "if (!workerSource.includes('chronoShard?: boolean')) throw new Error('Browser worker Chrono Shard request field is missing')\nif (!workerSource.includes('request.chronoShard !== false')) throw new Error('Browser worker does not apply the Chrono Shard timing toggle')\nfor (const removedField of ['excludedCardNames', 'selectedCardNames']) {")

console.log('Applied 0.90s Depths timing calibration and Chrono Shard toggle.')

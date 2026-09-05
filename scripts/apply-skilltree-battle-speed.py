#!/usr/bin/env python3
from pathlib import Path
import json


def replace_exact(path: str, old: str, new: str, count: int = 1):
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    found = text.count(old)
    if found != count:
        raise SystemExit(f'{path}: expected {count} occurrence(s), found {found}: {old[:140]!r}')
    p.write_text(text.replace(old, new, count), encoding='utf-8')

# --- timing engine ---
replace_exact(
    'src/engine/depths-time.ts',
    'export const BATTLE_SPEED_STRUCTURE_MAX_LEVEL = 7\nexport const BATTLE_SPEED_STRUCTURE_STEP = 0.25\n',
    'export const BATTLE_SPEED_STRUCTURE_MAX_LEVEL = 7\nexport const BATTLE_SPEED_STRUCTURE_STEP = 0.25\nexport const BATTLE_SPEED_SKILL_TREE_MAX_LEVEL = 4\nexport const BATTLE_SPEED_SKILL_TREE_BONUSES = [0, 0.5, 1, 1.5, 2.5] as const\n',
)
replace_exact(
    'src/engine/depths-time.ts',
    'export function effectiveDepthsBattleSpeed(floor: number, chronoShard = true, structureLevel = 0): number {\n  return DEPTHS_BASE_BATTLE_SPEED\n    + (chronoShard ? CHRONO_SHARD_BONUS : 0)\n    + battleSpeedStructureBonus(structureLevel)\n    + depthsFloorSpeedBonus(floor)\n}\n',
    'export function battleSpeedSkillTreeBonus(level = 0): number {\n  const safeLevel = Math.max(0, Math.min(BATTLE_SPEED_SKILL_TREE_MAX_LEVEL, Math.floor(Number(level) || 0)))\n  return BATTLE_SPEED_SKILL_TREE_BONUSES[safeLevel]\n}\n\nexport function effectiveDepthsBattleSpeed(\n  floor: number,\n  chronoShard = true,\n  structureLevel = 0,\n  skillTreeLevel = 0,\n): number {\n  return DEPTHS_BASE_BATTLE_SPEED\n    + (chronoShard ? CHRONO_SHARD_BONUS : 0)\n    + battleSpeedStructureBonus(structureLevel)\n    + battleSpeedSkillTreeBonus(skillTreeLevel)\n    + depthsFloorSpeedBonus(floor)\n}\n',
)
replace_exact(
    'src/engine/depths-time.ts',
    'export function estimateBattleSeconds(floor: number, turns: number, chronoShard = true, structureLevel = 0): number {\n  const speed = effectiveDepthsBattleSpeed(floor, chronoShard, structureLevel)\n',
    'export function estimateBattleSeconds(\n  floor: number,\n  turns: number,\n  chronoShard = true,\n  structureLevel = 0,\n  skillTreeLevel = 0,\n): number {\n  const speed = effectiveDepthsBattleSpeed(floor, chronoShard, structureLevel, skillTreeLevel)\n',
)
replace_exact(
    'src/engine/depths-time.ts',
    'export function estimateDepthClearSeconds(depth: number, averageTurnsPerBattle: number, chronoShard = true, structureLevel = 0): number {\n',
    'export function estimateDepthClearSeconds(\n  depth: number,\n  averageTurnsPerBattle: number,\n  chronoShard = true,\n  structureLevel = 0,\n  skillTreeLevel = 0,\n): number {\n',
)
replace_exact(
    'src/engine/depths-time.ts',
    '    seconds += estimateBattleSeconds(floor, avgTurns, chronoShard, structureLevel)\n',
    '    seconds += estimateBattleSeconds(floor, avgTurns, chronoShard, structureLevel, skillTreeLevel)\n',
)

# --- worker request and timing summary ---
replace_exact(
    'src/browser-worker.ts',
    '  battleSpeedStructureLevel?: number\n  chronoShard?: boolean\n',
    '  battleSpeedStructureLevel?: number\n  skillTreeBattleSpeedLevel?: number\n  chronoShard?: boolean\n',
)
replace_exact(
    'src/browser-worker.ts',
    'function summarize(results: DepthsRunResult[], bountifulDepths = false, battleSpeedStructureLevel = 0, chronoShard = true) {\n',
    'function summarize(\n  results: DepthsRunResult[],\n  bountifulDepths = false,\n  battleSpeedStructureLevel = 0,\n  skillTreeBattleSpeedLevel = 0,\n  chronoShard = true,\n) {\n',
)
replace_exact(
    'src/browser-worker.ts',
    '  const estimatedSecondsLow = estimateDepthClearSeconds(estimate.low, averageTurnsPerBattle, chronoShard, battleSpeedStructureLevel)\n  const estimatedSecondsMedian = estimateDepthClearSeconds(estimate.medianDepth, averageTurnsPerBattle, chronoShard, battleSpeedStructureLevel)\n  const estimatedSecondsHigh = estimateDepthClearSeconds(estimate.high, averageTurnsPerBattle, chronoShard, battleSpeedStructureLevel)\n',
    '  const estimatedSecondsLow = estimateDepthClearSeconds(estimate.low, averageTurnsPerBattle, chronoShard, battleSpeedStructureLevel, skillTreeBattleSpeedLevel)\n  const estimatedSecondsMedian = estimateDepthClearSeconds(estimate.medianDepth, averageTurnsPerBattle, chronoShard, battleSpeedStructureLevel, skillTreeBattleSpeedLevel)\n  const estimatedSecondsHigh = estimateDepthClearSeconds(estimate.high, averageTurnsPerBattle, chronoShard, battleSpeedStructureLevel, skillTreeBattleSpeedLevel)\n',
)
replace_exact(
    'src/browser-worker.ts',
    '    self.postMessage({ id: request.id, ok: true, elapsedMs: performance.now() - started, result: summarize(results, request.bountifulDepths, request.battleSpeedStructureLevel, request.chronoShard !== false) })\n',
    '    self.postMessage({ id: request.id, ok: true, elapsedMs: performance.now() - started, result: summarize(results, request.bountifulDepths, request.battleSpeedStructureLevel, request.skillTreeBattleSpeedLevel, request.chronoShard !== false) })\n',
)

# --- regression coverage ---
replace_exact(
    'scripts/depths-time-regression.ts',
    "import { battleSpeedStructureBonus, depthsFloorSpeedBonus, effectiveDepthsBattleSpeed, estimateBattleSeconds, inBattleAcceleration } from '../src/engine/depths-time'\n",
    "import { battleSpeedSkillTreeBonus, battleSpeedStructureBonus, depthsFloorSpeedBonus, effectiveDepthsBattleSpeed, estimateBattleSeconds, inBattleAcceleration } from '../src/engine/depths-time'\n",
)
replace_exact(
    'scripts/depths-time-regression.ts',
    "assert(effectiveDepthsBattleSpeed(1, true, 7) === 5.75, 'Max structure Battle Speed mismatch')\n",
    "assert(effectiveDepthsBattleSpeed(1, true, 7) === 5.75, 'Max structure Battle Speed mismatch')\nassert(battleSpeedSkillTreeBonus(0) === 0, 'Skill Tree Battle Speed level 0 mismatch')\nassert(battleSpeedSkillTreeBonus(1) === 0.5, 'Skill Tree Battle Speed level 1 mismatch')\nassert(battleSpeedSkillTreeBonus(2) === 1, 'Skill Tree Battle Speed level 2 mismatch')\nassert(battleSpeedSkillTreeBonus(3) === 1.5, 'Skill Tree Battle Speed level 3 mismatch')\nassert(battleSpeedSkillTreeBonus(4) === 2.5, 'Skill Tree Battle Speed level 4 mismatch')\nassert(effectiveDepthsBattleSpeed(1, true, 7, 4) === 8.25, 'Structure + Skill Tree + Chrono Battle Speed stack mismatch')\n",
)

# --- UI state, persistence, selector, result text, and worker payload ---
replace_exact(
    'index-base.html',
    "bountifulDepths:false,chronoShard:true,rebanLegacyDepths:false,battleSpeedStructureLevel:0,runs:15",
    "bountifulDepths:false,chronoShard:true,rebanLegacyDepths:false,battleSpeedStructureLevel:0,skillTreeBattleSpeedLevel:0,runs:15",
)
replace_exact(
    'index-base.html',
    "battleSpeedStructureLevel:state.battleSpeedStructureLevel,runs:state.runs",
    "battleSpeedStructureLevel:state.battleSpeedStructureLevel,skillTreeBattleSpeedLevel:state.skillTreeBattleSpeedLevel,runs:state.runs",
)
replace_exact(
    'index-base.html',
    "state.battleSpeedStructureLevel=Math.max(0,Math.min(7,Number(s.battleSpeedStructureLevel)||0));state.rebanLegacyDepths=false;",
    "state.battleSpeedStructureLevel=Math.max(0,Math.min(7,Number(s.battleSpeedStructureLevel)||0));state.skillTreeBattleSpeedLevel=Math.max(0,Math.min(4,Number(s.skillTreeBattleSpeedLevel)||0));state.rebanLegacyDepths=false;",
)
replace_exact(
    'index-base.html',
    " · Battle Speed 3${state.chronoShard?' + Chrono Shard':''} + Structure L${state.battleSpeedStructureLevel} + floor scaling",
    " · Battle Speed 3${state.chronoShard?' + Chrono Shard':''} + Structure L${state.battleSpeedStructureLevel} + Skill Tree L${state.skillTreeBattleSpeedLevel} + floor scaling",
)
old_selector = '<label class="sim-field"><span>Battle Speed Structure</span><select id="battleSpeedStructureLevel" style="width:100%;color:var(--text);background:var(--surface-1);border:1px solid var(--line-strong);border-radius:10px;padding:11px 12px;outline:none">${Array.from({length:8},(_,level)=>`<option value="${level}" ${state.battleSpeedStructureLevel===level?\'selected\':\'\'}>Level ${level} · +${(level*.25).toFixed(2)} Battle Speed</option>`).join(\'\')}</select></label>'
new_selector = old_selector + '<label class="sim-field"><span>Skill Tree Battle Speed</span><select id="skillTreeBattleSpeedLevel" style="width:100%;color:var(--text);background:var(--surface-1);border:1px solid var(--line-strong);border-radius:10px;padding:11px 12px;outline:none">${[0,.5,1,1.5,2.5].map((bonus,level)=>`<option value="${level}" ${state.skillTreeBattleSpeedLevel===level?\'selected\':\'\'}>Level ${level} · +${bonus.toFixed(2)} Battle Speed</option>`).join(\'\')}</select><small style="display:block;color:#657487;font-size:8px;line-height:1.45;margin-top:5px">Skill Tree values: +0.50, +0.50, +0.50, then +1.00 at level 4.</small></label>'
replace_exact('index-base.html', old_selector, new_selector)
replace_exact(
    'index-base.html',
    "root.querySelector('#battleSpeedStructureLevel')?.addEventListener('change',e=>{state.battleSpeedStructureLevel=Math.max(0,Math.min(7,Number(e.target.value)||0));state.teams.forEach(t=>{t.result=null;t.elapsedMs=0;t.lastError=''});persist();render()});root.querySelector('[data-run-active]')",
    "root.querySelector('#battleSpeedStructureLevel')?.addEventListener('change',e=>{state.battleSpeedStructureLevel=Math.max(0,Math.min(7,Number(e.target.value)||0));state.teams.forEach(t=>{t.result=null;t.elapsedMs=0;t.lastError=''});persist();render()});root.querySelector('#skillTreeBattleSpeedLevel')?.addEventListener('change',e=>{state.skillTreeBattleSpeedLevel=Math.max(0,Math.min(4,Number(e.target.value)||0));state.teams.forEach(t=>{t.result=null;t.elapsedMs=0;t.lastError=''});persist();render()});root.querySelector('[data-run-active]')",
)
replace_exact(
    'index-base.html',
    "chronoShard:state.chronoShard,battleSpeedStructureLevel:state.battleSpeedStructureLevel})",
    "chronoShard:state.chronoShard,battleSpeedStructureLevel:state.battleSpeedStructureLevel,skillTreeBattleSpeedLevel:state.skillTreeBattleSpeedLevel})",
)

# Cache-bust the live site after the update lands.
Path('site-version.json').write_text(json.dumps({'version':'20260905-skilltree-battle-speed-1'}, separators=(',',':')) + '\n', encoding='utf-8')

print('Applied Skill Tree Battle Speed update from MANGA WEATHER source values.')

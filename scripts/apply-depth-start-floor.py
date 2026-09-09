from pathlib import Path
import json


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly 1 match, found {count}")
    return text.replace(old, new, 1)


# Wire the browser worker to the engine's existing startFloor support.
worker_path = Path('src/browser-worker.ts')
worker = worker_path.read_text(encoding='utf-8')

worker = replace_once(
    worker,
    "  runs: number\n  floorCap: number",
    "  runs: number\n  startFloor?: number\n  floorCap: number",
    'BatchRequest startFloor',
)
worker = replace_once(
    worker,
    "  loadout: TeamLoadout\n  floorCap: number\n  batchSeed: number",
    "  loadout: TeamLoadout\n  startFloor?: number\n  floorCap: number\n  batchSeed: number",
    'SingleRunRequest startFloor',
)
worker = replace_once(
    worker,
    "const LIVE_BATTLE_TURN_CAP = 10_000\n\nfunction runSeed",
    "const LIVE_BATTLE_TURN_CAP = 10_000\n\nfunction normalizeStartFloor(value: number | undefined): number {\n  return Math.min(40_000, Math.max(1, Math.floor(Number(value) || 1)))\n}\n\nfunction runSeed",
    'normalizeStartFloor helper',
)
worker = replace_once(
    worker,
    "  return simulateDepthsRun(request.loadout, {\n    floorCap: request.floorCap,",
    "  return simulateDepthsRun(request.loadout, {\n    startFloor: normalizeStartFloor(request.startFloor),\n    floorCap: request.floorCap,",
    'single run startFloor forwarding',
)
worker = replace_once(
    worker,
    "  const results = new Array<DepthsRunResult>(runs)\n  const workers: Worker[] = []\n  const runFloors = new Array<number>(runs).fill(1)",
    "  const results = new Array<DepthsRunResult>(runs)\n  const workers: Worker[] = []\n  const startFloor = normalizeStartFloor(request.startFloor)\n  const runFloors = new Array<number>(runs).fill(startFloor)",
    'parallel startFloor state',
)
worker = replace_once(
    worker,
    "      let lastFloor = 1\n      let lastBattleTurn = 0",
    "      let lastFloor = startFloor\n      let lastBattleTurn = 0",
    'parallel progress initial floor',
)
worker = replace_once(
    worker,
    "        loadout: request.loadout,\n        floorCap: request.floorCap,",
    "        loadout: request.loadout,\n        startFloor,\n        floorCap: request.floorCap,",
    'subworker startFloor forwarding',
)
worker_path.write_text(worker, encoding='utf-8')


# Expose a persisted 1-40,000 Start Floor control in the Depths UI.
index_path = Path('index-base.html')
index = index_path.read_text(encoding='utf-8')

index = replace_once(
    index,
    "battleSpeedStructureLevel:0,skillTreeBattleSpeedLevel:0,runs:15,cap:100000,seed:1000",
    "battleSpeedStructureLevel:0,skillTreeBattleSpeedLevel:0,runs:15,startFloor:1,cap:100000,seed:1000",
    'UI state startFloor',
)
index = replace_once(
    index,
    "skillTreeBattleSpeedLevel:state.skillTreeBattleSpeedLevel,runs:state.runs,seed:state.seed",
    "skillTreeBattleSpeedLevel:state.skillTreeBattleSpeedLevel,runs:state.runs,startFloor:state.startFloor,seed:state.seed",
    'persist startFloor',
)
index = replace_once(
    index,
    "state.runs=[1,3,8,15,30,50].includes(Number(s.runs))?Number(s.runs):15;state.cap=100000;state.seed=Number(s.seed)||1000;",
    "state.runs=[1,3,8,15,30,50].includes(Number(s.runs))?Number(s.runs):15;state.startFloor=Math.min(40000,Math.max(1,Math.floor(Number(s.startFloor)||1)));state.cap=100000;state.seed=Number(s.seed)||1000;",
    'restore startFloor',
)
old_floor_cap = '<label class="sim-field"><span>Floor cap</span><input id="capInput" type="number" min="100000" max="100000" value="100000" readonly aria-readonly="true" tabindex="-1" title="Depths is fixed at a 100,000 floor cap"></label>'
new_floor_controls = '<label class="sim-field"><span>Start floor</span><input id="startFloorInput" type="number" min="1" max="40000" step="1" value="${state.startFloor}"><small style="display:block;color:#657487;font-size:8px;line-height:1.45;margin-top:5px">Skips floors below this during simulation. Use a floor you know the team safely clears. Max 40,000.</small></label>' + old_floor_cap
index = replace_once(index, old_floor_cap, new_floor_controls, 'Start Floor UI')
index = replace_once(
    index,
    "root.querySelectorAll('[data-runs]').forEach(el=>el.addEventListener('click',()=>{state.runs=Number(el.dataset.runs);persist();render()}));root.querySelector('#battleSpeedStructureLevel')",
    "root.querySelectorAll('[data-runs]').forEach(el=>el.addEventListener('click',()=>{state.runs=Number(el.dataset.runs);persist();render()}));const startFloorInput=root.querySelector('#startFloorInput');startFloorInput?.addEventListener('change',()=>{state.startFloor=Math.min(40000,Math.max(1,Math.floor(Number(startFloorInput.value)||1)));clearDepthResults();persist();render()});root.querySelector('#battleSpeedStructureLevel')",
    'Start Floor event handler',
)
index = replace_once(
    index,
    "active=Number(e.data.activeRuns)||1,min=Number(e.data.minActiveFloor)||Number(e.data.floor)||1,max=Number(e.data.maxActiveFloor)||min",
    "active=Number(e.data.activeRuns)||1,min=Number(e.data.minActiveFloor)||Number(e.data.floor)||state.startFloor,max=Number(e.data.maxActiveFloor)||min",
    'progress start floor fallback',
)
index = replace_once(
    index,
    "runs:state.runs,floorCap:state.cap,seed:batchSeed>>>0",
    "runs:state.runs,startFloor:state.startFloor,floorCap:state.cap,seed:batchSeed>>>0",
    'worker request startFloor',
)
index_path.write_text(index, encoding='utf-8')

Path('site-version.json').write_text(
    json.dumps({'version': '20260909-depth-start-floor-1'}, separators=(',', ':')) + '\n',
    encoding='utf-8',
)

print('Applied selectable Depths Start Floor (1-40,000).')

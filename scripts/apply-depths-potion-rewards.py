from pathlib import Path


def replace(path: str, old: str, new: str, expected: int = 1) -> None:
    p = Path(path)
    text = p.read_text()
    hits = text.count(old)
    if hits != expected:
        raise SystemExit(f"Expected {expected} matches in {path}, found {hits}: {old!r}")
    p.write_text(text.replace(old, new, expected))


# ---------------- src/engine/depths-rewards.ts ----------------
path = Path('src/engine/depths-rewards.ts')
text = path.read_text()
anchor = "export function estimatedDepthRange(medianFloor: number, margin = 0.15): { low: number; high: number } {"
if anchor not in text:
    raise SystemExit('Depths rewards insertion anchor missing')
insert = r'''export const POTION_DROP_CAP_FLOOR = 5000
export const BOUNTIFUL_DEPTHS_DROP_MULTIPLIER = 1.25
export const JACKPOT_POTION_BASE_ODDS = 400
export const JACKPOT_POTION_CAP_ODDS = 170
export const RARE_WEATHER_POTION_BASE_ODDS = 8000
export const RARE_WEATHER_POTION_CAP_ODDS = 3403

export interface PotionDropStat {
  expected: number
  atLeastOne: number
  oneInRuns: number
  endFloorOneIn: number
}

export interface PotionDropSummary {
  depth: number
  bountiful: boolean
  jackpot: PotionDropStat
  rareWeather: PotionDropStat
}

function withBountiful(chance: number, bountiful: boolean): number {
  return Math.min(1, Math.max(0, chance * (bountiful ? BOUNTIFUL_DEPTHS_DROP_MULTIPLIER : 1)))
}

/**
 * Jackpot Potion starts at 1/400 and reaches 1/170 at floor 5,000.
 * The reward table only gives the endpoints, so the calculator applies the
 * stated flat per-floor improvement linearly between those two chances.
 */
export function jackpotPotionChanceForFloor(floor: number, bountiful = false): number {
  const safeFloor = Math.max(1, Math.floor(Number(floor) || 1))
  const progress = Math.min(1, Math.max(0, (safeFloor - 1) / (POTION_DROP_CAP_FLOOR - 1)))
  const baseChance = 1 / JACKPOT_POTION_BASE_ODDS
  const capChance = 1 / JACKPOT_POTION_CAP_ODDS
  return withBountiful(baseChance + (capChance - baseChance) * progress, bountiful)
}

/**
 * Current reward-table figures use a 1/8,000 Rare Weather roll during the
 * 1-5,000 full run, then the capped 1/3,403 per-floor roll at floor 5,000+.
 * This reproduces the published ~1 in 2.15 full-run figure, or ~1 in 1.84
 * with Bountiful Depths (+25% drop chance).
 */
export function rareWeatherPotionChanceForFloor(floor: number, bountiful = false): number {
  const safeFloor = Math.max(1, Math.floor(Number(floor) || 1))
  const baseChance = safeFloor >= POTION_DROP_CAP_FLOOR
    ? 1 / RARE_WEATHER_POTION_CAP_ODDS
    : 1 / RARE_WEATHER_POTION_BASE_ODDS
  return withBountiful(baseChance, bountiful)
}

function summarizePotionDrops(
  depth: number,
  chanceForFloor: (floor: number, bountiful: boolean) => number,
  bountiful: boolean,
): PotionDropStat {
  const endFloor = Math.max(0, Math.floor(Number(depth) || 0))
  if (endFloor <= 0) return { expected: 0, atLeastOne: 0, oneInRuns: Infinity, endFloorOneIn: Infinity }

  const scalingEnd = Math.min(endFloor, POTION_DROP_CAP_FLOOR)
  let expected = 0
  let logNoDrop = 0
  for (let floor = 1; floor <= scalingEnd; floor++) {
    const chance = chanceForFloor(floor, bountiful)
    expected += chance
    logNoDrop += Math.log1p(-chance)
  }

  if (endFloor > POTION_DROP_CAP_FLOOR) {
    const extraFloors = endFloor - POTION_DROP_CAP_FLOOR
    const cappedChance = chanceForFloor(POTION_DROP_CAP_FLOOR + 1, bountiful)
    expected += extraFloors * cappedChance
    logNoDrop += extraFloors * Math.log1p(-cappedChance)
  }

  const atLeastOne = Math.min(1, Math.max(0, 1 - Math.exp(logNoDrop)))
  const endFloorChance = chanceForFloor(endFloor, bountiful)
  return {
    expected,
    atLeastOne,
    oneInRuns: atLeastOne > 0 ? 1 / atLeastOne : Infinity,
    endFloorOneIn: endFloorChance > 0 ? 1 / endFloorChance : Infinity,
  }
}

export function potionDropsForDepth(depth: number, bountiful = false): PotionDropSummary {
  const safeDepth = Math.max(0, Math.floor(Number(depth) || 0))
  return {
    depth: safeDepth,
    bountiful,
    jackpot: summarizePotionDrops(safeDepth, jackpotPotionChanceForFloor, bountiful),
    rareWeather: summarizePotionDrops(safeDepth, rareWeatherPotionChanceForFloor, bountiful),
  }
}

export function potionDropRangeForMedian(medianFloor: number, margin = 0.15, bountiful = false) {
  const range = estimatedDepthRange(medianFloor, margin)
  const medianDepth = Math.max(1, Math.round(Number(medianFloor) || 1))
  return {
    ...range,
    medianDepth,
    bountiful,
    low: potionDropsForDepth(range.low, bountiful),
    median: potionDropsForDepth(medianDepth, bountiful),
    high: potionDropsForDepth(range.high, bountiful),
  }
}

'''
text = text.replace(anchor, insert + anchor, 1)
path.write_text(text)


# ---------------- scripts/depths-rewards-regression.ts ----------------
path = Path('scripts/depths-rewards-regression.ts')
text = path.read_text()
text = text.replace(
    "import { auraPackRangeForMedian, auraPacksForDepth, depthsRewardStageAttack, estimatedDepthRange } from '../src/engine/depths-rewards'",
    "import { auraPackRangeForMedian, auraPacksForDepth, depthsRewardStageAttack, estimatedDepthRange, potionDropsForDepth } from '../src/engine/depths-rewards'",
    1,
)
anchor = "console.log('Depths reward regression passed:', reward)"
if anchor not in text:
    raise SystemExit('Depths reward regression anchor missing')
checks = r'''const fullRunDrops = potionDropsForDepth(5000, false)
assert(Math.abs(fullRunDrops.rareWeather.oneInRuns - 2.15) < 0.02, 'Rare Weather full-run odds mismatch')
assert(Math.abs(fullRunDrops.rareWeather.endFloorOneIn - 3403) < 0.01, 'Rare Weather floor-5000 odds mismatch')
assert(Math.abs(fullRunDrops.jackpot.endFloorOneIn - 170) < 0.01, 'Jackpot floor-5000 odds mismatch')
const bountifulDrops = potionDropsForDepth(5000, true)
assert(Math.abs(bountifulDrops.rareWeather.oneInRuns - 1.84) < 0.02, 'Bountiful Rare Weather full-run odds mismatch')
assert(Math.abs(bountifulDrops.rareWeather.endFloorOneIn - 2722.4) < 0.1, 'Bountiful Rare Weather floor-5000 odds mismatch')
assert(Math.abs(bountifulDrops.jackpot.endFloorOneIn - 136) < 0.01, 'Bountiful Jackpot floor-5000 odds mismatch')

'''
text = text.replace(anchor, checks + anchor, 1)
path.write_text(text)


# ---------------- src/browser-worker.ts ----------------
replace(
    'src/browser-worker.ts',
    "import { auraPackRangeForMedian } from './engine/depths-rewards'",
    "import { auraPackRangeForMedian, potionDropRangeForMedian } from './engine/depths-rewards'",
)
replace(
    'src/browser-worker.ts',
    "  bannedCardNames?: string[]\n}",
    "  bannedCardNames?: string[]\n  bountifulDepths?: boolean\n}",
    1,
)
replace(
    'src/browser-worker.ts',
    "function summarize(results: DepthsRunResult[]) {",
    "function summarize(results: DepthsRunResult[], bountifulDepths = false) {",
)
replace(
    'src/browser-worker.ts',
    "  const estimate = auraPackRangeForMedian(medianFloor)\n",
    "  const estimate = auraPackRangeForMedian(medianFloor)\n  const potionRewards = potionDropRangeForMedian(medianFloor, 0.15, bountifulDepths)\n",
)
replace(
    'src/browser-worker.ts',
    "    auraCardsPerHour,\n    trusted:",
    "    auraCardsPerHour,\n    potionRewards,\n    trusted:",
)
replace(
    'src/browser-worker.ts',
    "result: summarize(results) })",
    "result: summarize(results, request.bountifulDepths) })",
)


# ---------------- index.html ----------------
path = Path('index.html')
text = path.read_text()

old_css = ".simulation-body{padding:14px}.depth-ban-box"
new_css = ".simulation-body{padding:14px}.relic-toggle{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:13px;border:1px solid #263142;background:#0a0f16;border-radius:11px;padding:10px}.relic-toggle>div span{display:block;color:#b8c4d2;font-size:10px;font-weight:750}.relic-toggle>div small{display:block;color:#657487;font-size:8px;line-height:1.45;margin-top:3px}.relic-toggle button{border:1px solid #344354;background:#101722;color:#7f8d9e;border-radius:999px;padding:5px 10px;font-size:8px;font-weight:800;cursor:pointer}.relic-toggle.on{border-color:#355e5a;background:rgba(135,216,202,.05)}.relic-toggle.on button{border-color:#477b76;background:#17302d;color:#d6f1ec}.reward-rate-note{margin-top:7px;border:1px solid #202b3a;background:#0b1119;border-radius:9px;padding:8px 9px;color:#748295;font-size:8px;line-height:1.55}.reward-rate-note b{color:#aebdcb}.reward-drop-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:10px}.reward-drop-card{border:1px solid #243141;background:#0d141d;border-radius:9px;padding:9px 10px}.reward-drop-card span{display:block;color:#6f7e90;font-size:8px;text-transform:uppercase;letter-spacing:.07em}.reward-drop-card b{display:block;color:#d6e0ea;font-size:15px;line-height:1.15;margin-top:4px}.reward-drop-card small{display:block;color:#758397;font-size:8px;line-height:1.45;margin-top:4px}.reward-drop-card em{font-style:normal;color:#87d8ca}.depth-ban-box"
if old_css not in text:
    raise SystemExit('Index reward CSS anchor missing')
text = text.replace(old_css, new_css, 1)

text = text.replace(
    "query:'',depthBans:[],depthBanQuery:'',runs:15",
    "query:'',depthBans:[],depthBanQuery:'',bountifulDepths:false,runs:15",
    1,
)

text = text.replace(
    "activeTeam:state.activeTeam,depthBans:state.depthBans,runs:state.runs",
    "activeTeam:state.activeTeam,depthBans:state.depthBans,bountifulDepths:state.bountifulDepths,runs:state.runs",
    1,
)
text = text.replace(
    "state.seed=Number(s.seed)||1000;state.depthBans=",
    "state.seed=Number(s.seed)||1000;state.bountifulDepths=Boolean(s.bountifulDepths);state.depthBans=",
    1,
)

relic_html = r'''</label><div class="relic-toggle ${state.bountifulDepths?'on':''}"><div><span>Bountiful Depths</span><small>Relic · +25% potion drop chance. This changes reward estimates only, not combat.</small></div><button type="button" data-bountiful-depths>${state.bountifulDepths?'ON':'OFF'}</button></div><div class="reward-rate-note"><b>Depths potion rates:</b> Jackpot starts at 1 in 400 and reaches 1 in 170 per floor at 5,000+. Rare Weather is about 1 in 2.15 full 1–5,000 runs, then 1 in 3,403 per floor. With Bountiful Depths it is about 1 in 1.84 full runs and 1 in 2,722 per floor after 5,000.</div><div class="depth-ban-box">'''
if '</label><div class="depth-ban-box">' not in text:
    raise SystemExit('Index relic UI anchor missing')
text = text.replace('</label><div class="depth-ban-box">', relic_html, 1)

avg_anchor = "  const avgTurns=r.runs.length?r.runs.reduce((s,x)=>s+x.totalTurns,0)/r.runs.length:0;\n"
if avg_anchor not in text:
    raise SystemExit('Index result card anchor missing')
reward_js = r'''  const drops=r.potionRewards;
  const dropPct=v=>{const p=Math.max(0,Math.min(1,Number(v)||0))*100;return `${p>=99.95?'99.9+':p>=10?p.toFixed(1):p.toFixed(2)}%`};
  const dropOdds=v=>Number.isFinite(Number(v))?full(Math.round(Number(v))):'∞';
  const dropHtml=drops?`<div class="reward-drop-grid"><div class="reward-drop-card"><span>Jackpot Potion ${drops.bountiful?'<em>· Bountiful</em>':''}</span><b>≈${one(drops.median.jackpot.expected)} / run</b><small>${one(drops.low.jackpot.expected)}–${one(drops.high.jackpot.expected)} expected across the Depth range · median end-floor odds 1 in ${dropOdds(drops.median.jackpot.endFloorOneIn)}</small></div><div class="reward-drop-card"><span>Rare Weather Potion ${drops.bountiful?'<em>· Bountiful</em>':''}</span><b>≈${one(drops.median.rareWeather.expected)} / run</b><small>${dropPct(drops.median.rareWeather.atLeastOne)} chance to get at least one · ≈1 in ${one(drops.median.rareWeather.oneInRuns)} runs · median end-floor odds 1 in ${dropOdds(drops.median.rareWeather.endFloorOneIn)}</small></div></div>`:'';
'''
text = text.replace(avg_anchor, avg_anchor + reward_js, 1)

marker = '</div><div class="result-meta">'
if text.count(marker) != 1:
    raise SystemExit(f'Expected one result-meta marker, found {text.count(marker)}')
text = text.replace(marker, '</div>${dropHtml}<div class="result-meta">', 1)

bountiful_event_anchor = "root.querySelectorAll('[data-depth-ban-add]')"
if bountiful_event_anchor not in text:
    raise SystemExit('Index bountiful event anchor missing')
bountiful_event = "root.querySelector('[data-bountiful-depths]')?.addEventListener('click',()=>{state.bountifulDepths=!state.bountifulDepths;state.teams.forEach(t=>{t.result=null;t.elapsedMs=0;t.lastError=''});persist();render()});"
text = text.replace(bountiful_event_anchor, bountiful_event + bountiful_event_anchor, 1)

text = text.replace(
    "bannedCardNames:[...state.depthBans]})",
    "bannedCardNames:[...state.depthBans],bountifulDepths:state.bountifulDepths})",
    1,
)

path.write_text(text)

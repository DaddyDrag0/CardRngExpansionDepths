from pathlib import Path
import re


def read(path):
    return Path(path).read_text()


def write(path, text):
    Path(path).write_text(text)


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 match, found {count}')
    return text.replace(old, new, 1)


def regex_once(text, pattern, repl, label, flags=0):
    out, count = re.subn(pattern, repl, text, count=1, flags=flags)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 match, found {count}')
    return out

# --- Depths permanent bans + 14 player bans ---
p = 'src/engine/depths.ts'
t = read(p)
t = replace_once(t, "const HARD_EXCLUSIONS = new Set(['Vampire Lord'])", "const HARD_EXCLUSIONS = new Set(['Vampire Lord', 'Parallax', 'Samurai'])", 'depth hard exclusions')
t = replace_once(t, 'export const MAX_DEPTH_BANS = 12', 'export const MAX_DEPTH_BANS = 14', 'depth ban max')
write(p, t)

# --- Battle Speed structure (7 levels, +0.25 each, +1.75 max) ---
p = 'src/engine/depths-time.ts'
t = read(p)
t = replace_once(
    t,
    'export const CHRONO_SHARD_BONUS = 1\nexport const DEPTHS_FLOOR_SPEED_STEP = 0.25',
    'export const CHRONO_SHARD_BONUS = 1\nexport const BATTLE_SPEED_STRUCTURE_MAX_LEVEL = 7\nexport const BATTLE_SPEED_STRUCTURE_STEP = 0.25\nexport const DEPTHS_FLOOR_SPEED_STEP = 0.25',
    'battle speed constants',
)
t = replace_once(
    t,
    'export function effectiveDepthsBattleSpeed(floor: number, chronoShard = true): number {\n  return DEPTHS_BASE_BATTLE_SPEED\n    + (chronoShard ? CHRONO_SHARD_BONUS : 0)\n    + depthsFloorSpeedBonus(floor)\n}',
    '''export function battleSpeedStructureBonus(level = 0): number {\n  const safeLevel = Math.max(0, Math.min(BATTLE_SPEED_STRUCTURE_MAX_LEVEL, Math.floor(Number(level) || 0)))\n  return safeLevel * BATTLE_SPEED_STRUCTURE_STEP\n}\n\nexport function effectiveDepthsBattleSpeed(floor: number, chronoShard = true, structureLevel = 0): number {\n  return DEPTHS_BASE_BATTLE_SPEED\n    + (chronoShard ? CHRONO_SHARD_BONUS : 0)\n    + battleSpeedStructureBonus(structureLevel)\n    + depthsFloorSpeedBonus(floor)\n}''',
    'effective battle speed',
)
t = replace_once(
    t,
    'export function estimateBattleSeconds(floor: number, turns: number, chronoShard = true): number {\n  const speed = effectiveDepthsBattleSpeed(floor, chronoShard)',
    'export function estimateBattleSeconds(floor: number, turns: number, chronoShard = true, structureLevel = 0): number {\n  const speed = effectiveDepthsBattleSpeed(floor, chronoShard, structureLevel)',
    'estimate battle signature',
)
t = replace_once(
    t,
    'export function estimateDepthClearSeconds(depth: number, averageTurnsPerBattle: number, chronoShard = true): number {',
    'export function estimateDepthClearSeconds(depth: number, averageTurnsPerBattle: number, chronoShard = true, structureLevel = 0): number {',
    'estimate run signature',
)
t = replace_once(
    t,
    '    seconds += estimateBattleSeconds(floor, avgTurns, chronoShard)',
    '    seconds += estimateBattleSeconds(floor, avgTurns, chronoShard, structureLevel)',
    'estimate run call',
)
write(p, t)

# Browser worker passes the selected structure level into time estimates.
p = 'src/browser-worker.ts'
t = read(p)
t = replace_once(t, '  bountifulDepths?: boolean\n}', '  bountifulDepths?: boolean\n  battleSpeedStructureLevel?: number\n}', 'worker request structure level')
t = replace_once(t, 'function summarize(results: DepthsRunResult[], bountifulDepths = false) {', 'function summarize(results: DepthsRunResult[], bountifulDepths = false, battleSpeedStructureLevel = 0) {', 'worker summarize signature')
t = replace_once(t, 'estimateDepthClearSeconds(estimate.low, averageTurnsPerBattle, true)', 'estimateDepthClearSeconds(estimate.low, averageTurnsPerBattle, true, battleSpeedStructureLevel)', 'worker low time')
t = replace_once(t, 'estimateDepthClearSeconds(estimate.medianDepth, averageTurnsPerBattle, true)', 'estimateDepthClearSeconds(estimate.medianDepth, averageTurnsPerBattle, true, battleSpeedStructureLevel)', 'worker median time')
t = replace_once(t, 'estimateDepthClearSeconds(estimate.high, averageTurnsPerBattle, true)', 'estimateDepthClearSeconds(estimate.high, averageTurnsPerBattle, true, battleSpeedStructureLevel)', 'worker high time')
t = replace_once(t, 'result: summarize(results, request.bountifulDepths)', 'result: summarize(results, request.bountifulDepths, request.battleSpeedStructureLevel)', 'worker summarize call')
write(p, t)

# Non-browser batch API stays source-aligned with the timing option.
p = 'src/engine/simulation.ts'
t = read(p)
t = replace_once(t, 'export interface DepthsBatchOptions extends DepthsSimulationOptions {\n  runs?: number\n}', 'export interface DepthsBatchOptions extends DepthsSimulationOptions {\n  runs?: number\n  battleSpeedStructureLevel?: number\n}', 'batch structure option')
t = replace_once(t, 'estimateDepthClearSeconds(estimate.low, averageTurnsPerBattle, true)', 'estimateDepthClearSeconds(estimate.low, averageTurnsPerBattle, true, options.battleSpeedStructureLevel)', 'batch low time')
t = replace_once(t, 'estimateDepthClearSeconds(estimate.medianDepth, averageTurnsPerBattle, true)', 'estimateDepthClearSeconds(estimate.medianDepth, averageTurnsPerBattle, true, options.battleSpeedStructureLevel)', 'batch median time')
t = replace_once(t, 'estimateDepthClearSeconds(estimate.high, averageTurnsPerBattle, true)', 'estimateDepthClearSeconds(estimate.high, averageTurnsPerBattle, true, options.battleSpeedStructureLevel)', 'batch high time')
write(p, t)

# --- Card reworks ---
p = 'src/data/abilities-1.json'
t = read(p)
t = replace_once(t, '"Frail":"Damage taken is doubled."', '"Frail":"Takes 1.5x damage and deals 1.5x damage."', 'Frail description')
write(p, t)

p = 'src/data/abilities-3.json'
t = read(p)
t = replace_once(t, '"Long Reach":"If there is a card in the opponent\'s deck, attack that instead."', '"Long Reach":"Attacks a random living card in the opponent\'s deck."', 'Long Reach description')
write(p, t)

p = 'src/engine/battle-v2.ts'
t = read(p)
t = replace_once(t, "    case 'Vainglory': if (attacker.hp / attacker.maxHp > 0.5) damage *= 1.5; break\n    case 'Modesty': damage *= 0.7; break", "    case 'Vainglory': if (attacker.hp / attacker.maxHp > 0.5) damage *= 1.5; break\n    case 'Frail': damage *= 1.5; break\n    case 'Modesty': damage *= 0.7; break", 'Frail outgoing damage')
t = replace_once(t, "    case 'Frail': damage *= 2; break", "    case 'Frail': damage *= 1.5; break", 'Frail incoming damage')
old_long = '''  const targetDeck = runtime.state.teams[target.team]\n  const longReachTarget = hasAbility(runtime, attacker, 'Long Reach') && targetDeck[0] === target ? targetDeck[1] : undefined\n  if (longReachTarget) pushAbilityDebug(runtime, attacker, 'Long Reach bypassed ' + (effectiveCardName(target) || target.definition.name) + ' and attacked ' + (effectiveCardName(longReachTarget) || longReachTarget.definition.name) + ' in the deck.')\n  const hpTarget = longReachTarget || target'''
new_long = '''  const targetDeck = runtime.state.teams[target.team]\n  let longReachTarget: CombatCard | undefined\n  if (hasAbility(runtime, attacker, 'Long Reach') && targetDeck[0] === target && targetDeck.length) {\n    const randomIndex = Math.min(targetDeck.length - 1, Math.floor(rand(runtime, attacker.team) * targetDeck.length))\n    longReachTarget = targetDeck[randomIndex]\n    pushAbilityDebug(runtime, attacker, 'Long Reach randomly targeted ' + (effectiveCardName(longReachTarget) || longReachTarget.definition.name) + ' from the living enemy deck.')\n  }\n  const hpTarget = longReachTarget || target'''
t = replace_once(t, old_long, new_long, 'Long Reach random target')
write(p, t)

# --- Much more intensive Tower cheese search ---
p = 'src/engine/tower.ts'
t = read(p)
t = replace_once(t, "import cards from '../data/cards'", "import cards from '../data/cards'\nimport auras from '../data/auras'", 'tower aura import')
t = replace_once(t, "  'Noveau Riche',\n] as const", "  'Noveau Riche',\n  'True Prophet',\n] as const", 'True Prophet cheese pool')
t = replace_once(t, "  phase: 'quick' | 'order' | 'aura' | 'final'", "  phase: 'quick' | 'order' | 'aura' | 'final' | 'exhaustive' | 'verify'", 'tower progress phases')

intensive = r'''

export interface TowerCheeseIntensivePlan {
  orderedTeams: number
  auraVariants: number
  variants: number
  runsPerVariant: number
  plannedDiscoveryBattles: number
}

function orderedCheeseTeams(values: string[]): string[][] {
  const result: string[][] = []
  const current: string[] = []
  const walk = () => {
    if (current.length === 4) {
      result.push([...current])
      return
    }
    for (const name of values) {
      if (name === 'Parallax' && current.includes('Parallax')) continue
      current.push(name)
      walk()
      current.pop()
    }
  }
  walk()
  return result
}

function intensiveCheeseAuraVariants(): Array<TeamLoadout['abilityAura']> {
  const borders = [null, 'Platinum', 'Crystal', 'Galaxy'] as const
  const variants: Array<TeamLoadout['abilityAura']> = [null]
  const skillAuras = auras
    .filter((aura) => !aura.unobtainable && aura.type === 'Skill')
    .sort((a, b) => a.name.localeCompare(b.name))
  for (const aura of skillAuras) {
    for (const border of borders) variants.push({ auraName: aura.name, border })
  }
  return variants
}

function intensiveSearchSpace() {
  const pool = towerCheeseCandidatePool()
  const orderedTeams = orderedCheeseTeams(pool)
  const auraVariants = intensiveCheeseAuraVariants()
  const variants = orderedTeams.length * auraVariants.length
  const runsPerVariant = Math.max(1, Math.ceil(1_000_000 / Math.max(1, variants)))
  return { pool, orderedTeams, auraVariants, variants, runsPerVariant }
}

export function towerCheeseIntensivePlan(): TowerCheeseIntensivePlan {
  const space = intensiveSearchSpace()
  return {
    orderedTeams: space.orderedTeams.length,
    auraVariants: space.auraVariants.length,
    variants: space.variants,
    runsPerVariant: space.runsPerVariant,
    plannedDiscoveryBattles: space.variants * space.runsPerVariant,
  }
}

/**
 * Deliberately expensive Tower search. Unlike the fast search, this does not prune by anchors,
 * order, or a small aura list. Every legal ordered four-card lineup in the cheese pool is tested
 * with no aura and every obtainable Skill Aura at Base/Platinum/Crystal/Galaxy. The discovery pass
 * is guaranteed to execute at least one million battles, then the best candidates get an independent
 * 2,000-battle verification pass.
 */
export function searchTowerCheeseIntensive(
  enemyNames: string[],
  floor: number,
  difficulty: TowerDifficulty,
  seed = 1,
  onProgress?: (progress: TowerCheeseSearchProgress) => void,
): TowerCheeseSearchResult {
  const enemies = buildTowerEnemies(enemyNames, floor, difficulty)
  const { pool, orderedTeams, auraVariants, variants, runsPerVariant } = intensiveSearchSpace()
  if (!pool.length) throw new Error('Tower cheese candidate pool is empty.')

  const simulations = { value: 0 }
  const stageRng = new SeededRng(seed || 1)
  const nextSeed = () => Math.floor(stageRng.next() * 0x7fffffff) || 1
  const contenders: Array<{ loadout: TeamLoadout; score: SampleScore }> = []
  const keep = 80
  let completed = 0

  for (const names of orderedTeams) {
    for (const auraVariant of auraVariants) {
      const loadout: TeamLoadout = {
        ...loadoutFor(names, null),
        abilityAura: auraVariant ? { ...auraVariant } : null,
      }
      const score = sampleLoadout(loadout, enemies, runsPerVariant, nextSeed(), simulations)
      contenders.push({ loadout, score })
      if (contenders.length >= keep * 2) {
        contenders.sort((a, b) => compareSamples(a.score, b.score))
        contenders.splice(keep)
      }
      completed += 1
      if (completed % 200 === 0 || completed === variants) {
        onProgress?.({ phase: 'exhaustive', completed, total: variants, battleSimulations: simulations.value })
      }
    }
  }

  contenders.sort((a, b) => compareSamples(a.score, b.score))
  const verifyPool = contenders.slice(0, Math.min(24, contenders.length))
  const recommendations: TowerCheeseCandidate[] = []
  for (let index = 0; index < verifyPool.length; index++) {
    const entry = verifyPool[index]
    const score = sampleLoadout(entry.loadout, enemies, 2_000, nextSeed(), simulations)
    recommendations.push(candidate(entry.loadout, score))
    onProgress?.({ phase: 'verify', completed: index + 1, total: verifyPool.length, battleSimulations: simulations.value })
  }
  recommendations.sort(compareCandidates)

  return {
    recommendations: recommendations.slice(0, 10),
    anchorCards: [],
    candidatePool: pool,
    combinations: variants,
    battleSimulations: simulations.value,
  }
}
'''
if 'export function searchTowerCheeseIntensive(' in t:
    raise SystemExit('intensive search already exists')
t = t.rstrip() + intensive + '\n'
write(p, t)

# Tower worker selects fast vs intensive search.
p = 'src/tower-worker.ts'
t = read(p)
t = replace_once(t, '  searchTowerCheese,\n  simulateTowerBatch,', '  searchTowerCheese,\n  searchTowerCheeseIntensive,\n  simulateTowerBatch,', 'tower worker intensive import')
t = replace_once(t, '  seed: number\n}', '  seed: number\n  intensive?: boolean\n}', 'tower worker request intensive flag')
t = replace_once(t, '      const result = searchTowerCheese(request.enemyNames, request.floor, request.difficulty, request.seed, (progress) => {', '      const search = request.intensive ? searchTowerCheeseIntensive : searchTowerCheese\n      const result = search(request.enemyNames, request.floor, request.difficulty, request.seed, (progress) => {', 'tower worker search dispatch')
write(p, t)

# --- Live page UI: 14 bans, permanent 3, no legacy checkbox, structure level, intensive button ---
p = 'index.html'
t = read(p)
t = replace_once(t, 'const MAX_DEPTH_BANS=12;', 'const MAX_DEPTH_BANS=14;', 'UI max bans')
t = replace_once(t, "const DEPTHS_DEFAULT_BANS=new Set(['Vampire Lord']);", "const DEPTHS_DEFAULT_BANS=new Set(['Vampire Lord','Parallax','Samurai']);", 'UI default bans')
t = replace_once(t, "  const LEGACY_DEPTHS_BANS=new Set(['Samurai','Seraphim','Loki','Fuxi','Parallax','Nán Fāng Zhū Què','Brachiosaurus','Jersey Devil']);\n", '', 'remove UI legacy set')
t = replace_once(t, "bountifulDepths:false,rebanLegacyDepths:true,runs:15", "bountifulDepths:false,rebanLegacyDepths:false,battleSpeedStructureLevel:0,runs:15", 'UI state structure/reban')
t = replace_once(t, '.filter(c=>!state.rebanLegacyDepths||!LEGACY_DEPTHS_BANS.has(c.name))', '', 'UI legacy candidate filter')
t = replace_once(t, '.tower-build-row{display:flex;justify-content:flex-end;padding:0 16px 16px}', '.tower-build-row{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;padding:0 16px 16px}.tower-make.intensive{border-color:#66548b;background:#181226;color:#e2d5ff}.tower-make.cancel{border-color:#523039;background:#160e11;color:#d7a7b0}', 'tower button styles')
old_build = '<div class="tower-build-row"><button class="tower-make" data-make-tower-team ${state.towerSearchRunning||state.towerSimRunning?\'disabled\':\'\'}>${state.towerSearchRunning?esc(state.towerSearchLabel||\'Searching…\'):\'Search Cheese Decks\'}</button></div>'
new_build = '<div class="tower-build-row"><button class="tower-make" data-make-tower-team ${state.towerSearchRunning||state.towerSimRunning?\'disabled\':\'\'}>Quick Search</button><button class="tower-make intensive" data-make-tower-team-intensive ${state.towerSearchRunning||state.towerSimRunning?\'disabled\':\'\'}>${state.towerSearchRunning&&state.towerSearchMode===\'intensive\'?esc(state.towerSearchLabel||\'Intensive searching…\'):\'Intensive 1M+ Search\'}</button>${state.towerSearchRunning?\'<button class="tower-make cancel" data-cancel-tower-search>Cancel Search</button>\':\'\'}</div>'
t = replace_once(t, old_build, new_build, 'tower build buttons')
t = replace_once(t, "towerSearch:null,towerSearchRunning:false,towerSearchLabel:''", "towerSearch:null,towerSearchRunning:false,towerSearchLabel:'',towerSearchMode:'quick'", 'tower search mode state')
t = replace_once(t, "const phase=pg.phase==='quick'?'Testing combinations':pg.phase==='order'?'Optimizing order':pg.phase==='aura'?'Testing auras':pg.phase==='final'?'Verifying finalists':'Starting search';", "const phase=pg.phase==='quick'?'Testing combinations':pg.phase==='order'?'Optimizing order':pg.phase==='aura'?'Testing auras':pg.phase==='final'?'Verifying finalists':pg.phase==='exhaustive'?'Exhaustive deck + aura search':pg.phase==='verify'?'Heavy finalist verification':'Starting search';", 'tower intensive progress label')
t = replace_once(t, "const anchors=(search.anchorCards||[]).length?`Required counters: ${(search.anchorCards||[]).map(esc).join(' · ')}`:'No hard counter required for this enemy team.';", "const anchors=state.towerSearchMode==='intensive'?'All ordered cheese-pool decks · every obtainable Ability Aura · Base/Platinum/Crystal/Galaxy':((search.anchorCards||[]).length?`Required counters: ${(search.anchorCards||[]).map(esc).join(' · ')}`:'No hard counter required for this enemy team.');", 'tower intensive result subtitle')
t = replace_once(t, "<span>${full(search.combinations||0)} combinations · ${full(search.battleSimulations||0)} battles</span>", "<span>${full(search.combinations||0)} ${state.towerSearchMode==='intensive'?'deck/aura variants':'combinations'} · ${full(search.battleSimulations||0)} battles</span>", 'tower result variant label')
t = replace_once(t, "This is an unranked shortlist from repeated battle tests. Load a deck, then use the existing 10,000-run simulation for the final check.", "${state.towerSearchMode==='intensive'?'Intensive mode exhaustively tests every ordered deck in the cheese pool against every obtainable Ability Aura at every aura border, then heavily verifies the finalists.':'This is a fast shortlist from repeated battle tests.'} Load a deck, then use the existing 10,000-run simulation for the final check.", 'tower result note')
t = replace_once(t, "root.querySelector('[data-make-tower-team]')?.addEventListener('click',runTowerCheeseSearch);root.querySelectorAll('[data-load-cheese-result]')", "root.querySelector('[data-make-tower-team]')?.addEventListener('click',()=>runTowerCheeseSearch('quick'));root.querySelector('[data-make-tower-team-intensive]')?.addEventListener('click',()=>runTowerCheeseSearch('intensive'));root.querySelector('[data-cancel-tower-search]')?.addEventListener('click',cancelTowerCheeseSearch);root.querySelectorAll('[data-load-cheese-result]')", 'tower button bindings')
t = replace_once(t, '  function runTowerCheeseSearch(){', "  function runTowerCheeseSearch(mode='quick'){", 'tower search mode signature')
t = replace_once(t, "state.towerResult=null;state.towerSim=null;state.towerSearch={progress:{phase:'quick',completed:0,total:0,battleSimulations:0}};state.towerSearchRunning=true;state.towerSearchLabel='Starting search…';", "state.towerResult=null;state.towerSim=null;state.towerSearchMode=mode==='intensive'?'intensive':'quick';state.towerSearch={progress:{phase:state.towerSearchMode==='intensive'?'exhaustive':'quick',completed:0,total:0,battleSimulations:0}};state.towerSearchRunning=true;state.towerSearchLabel=state.towerSearchMode==='intensive'?'Starting 1M+ search…':'Starting quick search…';", 'tower search state mode')
t = replace_once(t, "towerWorker.postMessage({id:towerPendingId,kind:'tower-cheese-search',enemyNames:[...state.towerEnemies],floor:state.towerFloor,difficulty:state.towerDifficulty,seed});", "towerWorker.postMessage({id:towerPendingId,kind:'tower-cheese-search',enemyNames:[...state.towerEnemies],floor:state.towerFloor,difficulty:state.towerDifficulty,seed,intensive:state.towerSearchMode==='intensive'});", 'tower search worker message')
marker = '  function loadTowerCheeseRecommendation(index){'
cancel_fn = '''  function cancelTowerCheeseSearch(){\n    if(!state.towerSearchRunning)return;\n    if(towerWorker){towerWorker.terminate();towerWorker=null}\n    towerPendingId=0;state.towerSearchRunning=false;state.towerSearchLabel='';state.towerSearch={error:'Tower cheese search cancelled.'};startTowerWorker();render();\n  }\n'''
if marker not in t:
    raise SystemExit('cancel function insertion marker missing')
t = t.replace(marker, cancel_fn + marker, 1)

# Remove the pre-update reban control from UI/persistence/restore.
t = regex_once(t, r'<label class="reban-toggle"><input type="checkbox" data-reban-banned \$\{state\.rebanLegacyDepths\?\'checked\':\'\'\}><span>Reban banned cards</span></label>', '', 'remove reban checkbox')
t = replace_once(t, 'Optional player ban slots. Choose anywhere from 0 to 12. Reban banned cards restores the eight pre-update bans without using these slots; Vampire Lord stays banned either way.', 'Optional player ban slots. Choose anywhere from 0 to 14. Vampire Lord, Parallax, and Samurai are permanently banned and do not use these slots.', 'ban help text')
t = replace_once(t, 'rebanLegacyDepths:state.rebanLegacyDepths,', '', 'persist reban removal')
t = regex_once(t, r"state\.rebanLegacyDepths=s\.rebanLegacyDepths===undefined\?true:Boolean\(s\.rebanLegacyDepths\);state\.depthBans=(.*?);if\(state\.rebanLegacyDepths\)state\.depthBans=state\.depthBans\.filter\(name=>!LEGACY_DEPTHS_BANS\.has\(name\)\);", r"state.rebanLegacyDepths=false;state.depthBans=\1;", 'restore legacy removal')
t = regex_once(t, r"root\.querySelector\('\[data-reban-banned\]'\)\?\.addEventListener\('change',e=>\{.*?\}\);", '', 'remove reban event', flags=re.S)

# Add the structure level selector beside the existing run settings.
structure_ui = '<label class="sim-field"><span>Battle Speed Structure</span><select id="battleSpeedStructureLevel" style="width:100%;color:var(--text);background:#0a0f16;border:1px solid #263142;border-radius:10px;padding:11px 12px;outline:none">${Array.from({length:8},(_,level)=>`<option value="${level}" ${state.battleSpeedStructureLevel===level?\'selected\':\'\'}>Level ${level} · +${(level*.25).toFixed(2)} Battle Speed</option>`).join(\'\')}</select></label>'
t = replace_once(t, '<label class="sim-field"><span>Floor cap</span><input id="capInput" type="number" min="1" max="50000" value="${state.cap}"></label>', '<label class="sim-field"><span>Floor cap</span><input id="capInput" type="number" min="1" max="50000" value="${state.cap}"></label>'+structure_ui, 'structure UI')
t = replace_once(t, "<small>${duration(r.estimatedSecondsLow)}–${duration(r.estimatedSecondsHigh)} · Battle Speed 3 + Chrono Shard + floor scaling</small>", "<small>${duration(r.estimatedSecondsLow)}–${duration(r.estimatedSecondsHigh)} · Battle Speed 3 + Chrono Shard + Structure L${state.battleSpeedStructureLevel} + floor scaling</small>", 'result timing note')
t = replace_once(t, 'bountifulDepths:state.bountifulDepths,runs:state.runs', 'bountifulDepths:state.bountifulDepths,battleSpeedStructureLevel:state.battleSpeedStructureLevel,runs:state.runs', 'persist structure')
t = replace_once(t, 'state.bountifulDepths=Boolean(s.bountifulDepths);state.rebanLegacyDepths=false;', 'state.bountifulDepths=Boolean(s.bountifulDepths);state.battleSpeedStructureLevel=Math.max(0,Math.min(7,Number(s.battleSpeedStructureLevel)||0));state.rebanLegacyDepths=false;', 'restore structure')
t = replace_once(t, "root.querySelector('#capInput')?.addEventListener('change',e=>{state.cap=Math.min(50000,Math.max(1,Number(e.target.value)||50000));persist();render()});", "root.querySelector('#capInput')?.addEventListener('change',e=>{state.cap=Math.min(50000,Math.max(1,Number(e.target.value)||50000));persist();render()});root.querySelector('#battleSpeedStructureLevel')?.addEventListener('change',e=>{state.battleSpeedStructureLevel=Math.max(0,Math.min(7,Number(e.target.value)||0));state.teams.forEach(t=>{t.result=null;t.elapsedMs=0;t.lastError=''});persist();render()});", 'structure event')
t = replace_once(t, "bountifulDepths:state.bountifulDepths})", "bountifulDepths:state.bountifulDepths,battleSpeedStructureLevel:state.battleSpeedStructureLevel})", 'worker structure message')
write(p, t)

# --- Regression updates ---
p = 'scripts/depths-regression.ts'
t = read(p)
t = replace_once(t, '// They are optional (0..12), while the game\'s built-in hard exclusions always stay excluded.', '// They are optional (0..14), while the game\'s built-in hard exclusions always stay excluded.', 'depth regression comment')
t = replace_once(t, "assert(eligibleNames.length > 12, 'Expected enough Depth-eligible cards for ban regression')", "assert(eligibleNames.length > MAX_DEPTH_BANS, 'Expected enough Depth-eligible cards for ban regression')", 'depth regression eligible count')
t = replace_once(t, "assert(cappedPool.includes(overCapBans[MAX_DEPTH_BANS]), 'Player Depth bans must cap at 12')", "assert(cappedPool.includes(overCapBans[MAX_DEPTH_BANS]), 'Player Depth bans must cap at 14')", 'depth regression cap message')
old_block = re.search(r"\{\n  const longReach = cardByAbility\('Long Reach'\)[\s\S]*?\n\}\n\n\{\n  const longmu", t)
if not old_block:
    raise SystemExit('Long Reach regression block not found')
new_block = r'''{
  const longReach = cardByAbility('Long Reach')
  const damage = getAttack(longReach, [])
  const hp = getHealth(longReach, [])
  const activeHealth = damage * 100 + 100
  const benchHealth = damage * 100 + 200
  let hitActive = false
  let hitBench = false
  for (let seed = 1; seed <= 80 && !(hitActive && hitBench); seed++) {
    const result = simulateBattleV2(
      loadout([longReach.name]),
      [namedDummy('__Long Reach Active__', activeHealth, hp * 10), namedDummy('__Long Reach Bench__', benchHealth, 0)],
      seed,
      1,
      true,
      false,
    )
    const active = findBattleCard(result, '__Long Reach Active__')
    const bench = findBattleCard(result, '__Long Reach Bench__')
    if (active && active.hp < activeHealth) hitActive = true
    if (bench && bench.hp < benchHealth) hitBench = true
  }
  assert(hitActive && hitBench, 'Long Reach should randomly target different living cards across deterministic seeds')
}

{
  const cherub = cardByName('Cherub')
  const damage = getAttack(cherub, [])
  const hp = getHealth(cherub, [])
  const enemyHealth = damage * 100
  const enemyAttack = hp * 0.1
  const result = simulateBattleV2(loadout([cherub.name]), [namedDummy('__Frail Target__', enemyHealth, enemyAttack)], 7711, 2, true, false)
  const enemy = findBattleCard(result, '__Frail Target__')
  const holder = findBattleCard(result, cherub.name)
  assert(enemy && holder, 'Cherub Frail regression lost a prepared card')
  assert(Math.abs((enemyHealth - enemy.hp) - damage * 1.5) <= Math.max(1e-6, damage * 1e-9), 'Cherub should deal 1.5x damage')
  assert(Math.abs((hp - holder.hp) - enemyAttack * 1.5) <= Math.max(1e-6, enemyAttack * 1e-9), 'Cherub should take 1.5x damage')
}

{
  const longmu'''
t = t[:old_block.start()] + new_block + t[old_block.end():]
write(p, t)

p = 'scripts/depths-time-regression.ts'
t = read(p)
t = replace_once(t, "import { depthsFloorSpeedBonus, effectiveDepthsBattleSpeed, estimateBattleSeconds, inBattleAcceleration } from '../src/engine/depths-time'", "import { battleSpeedStructureBonus, depthsFloorSpeedBonus, effectiveDepthsBattleSpeed, estimateBattleSeconds, inBattleAcceleration } from '../src/engine/depths-time'", 'time regression import')
t = replace_once(t, "assert(effectiveDepthsBattleSpeed(100, true) === 4.25, 'Floor 100 Battle Speed should include +0.25')", "assert(effectiveDepthsBattleSpeed(100, true) === 4.25, 'Floor 100 Battle Speed should include +0.25')\nassert(battleSpeedStructureBonus(7) === 1.75, 'Max Battle Speed structure should add +1.75')\nassert(effectiveDepthsBattleSpeed(1, true, 7) === 5.75, 'Max structure Battle Speed mismatch')", 'time regression structure assertions')
write(p, t)

p = 'scripts/tower-cheese-search-regression.ts'
t = read(p)
t = replace_once(t, "import { isTowerCheeseCandidateLegal, towerCheeseAnchors, towerCheeseCandidatePool } from '../src/engine/tower'", "import { isTowerCheeseCandidateLegal, towerCheeseAnchors, towerCheeseCandidatePool, towerCheeseIntensivePlan } from '../src/engine/tower'", 'tower regression import')
t = replace_once(t, '"Hell\'s Army", \'Noveau Riche\']', '"Hell\'s Army", \'Noveau Riche\', \'True Prophet\']', 'tower regression expected pool')
t = replace_once(t, "assert.equal(isTowerCheeseCandidateLegal(['Parallax', 'Parallax', 'Judgment Day', 'Pandora']), false)\nconsole.log", "assert.equal(isTowerCheeseCandidateLegal(['Parallax', 'Parallax', 'Judgment Day', 'Pandora']), false)\nconst intensivePlan = towerCheeseIntensivePlan()\nassert.ok(intensivePlan.plannedDiscoveryBattles >= 1_000_000, 'Intensive cheese search must plan at least one million discovery battles')\nassert.ok(intensivePlan.auraVariants > 4, 'Intensive cheese search should test many Ability Aura/border variants')\nassert.ok(intensivePlan.orderedTeams > 1_000, 'Intensive cheese search should test a large ordered deck space')\nconsole.log", 'tower regression intensive plan')
write(p, t)

# Current live page uses versioned Worker URLs; keep the static validator aligned.
p = 'scripts/validate-ui.mjs'
t = read(p)
t = replace_once(t, '  "new Worker(\'./browser/depths-worker.js\')",\n  "new Worker(\'./browser/tower-worker.js\')",', '  "./browser/depths-worker.js",\n  "./browser/tower-worker.js",', 'UI worker validator')
write(p, t)

print('Aug 19 intensive/update patch applied successfully.')

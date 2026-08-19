import cards from '../data/cards'
import auras from '../data/auras'
import type { BattleResult, DepthsEnemy, TeamCard, TeamLoadout } from '../types'
import { simulateBattleV2 } from './battle-v2'
import { SeededRng } from './rng'

export type TowerDifficulty = 'Normal' | 'Hard' | 'Extreme' | 'Hell' | 'Impossible'

const DIFFICULTY_ID: Record<TowerDifficulty, number> = {
  Normal: 1,
  Hard: 2,
  Extreme: 3,
  Hell: 5,
  Impossible: 6,
}

const CARD_BY_NAME = new Map(cards.map((card) => [card.name, card] as const))

/**
 * Small, intentionally curated cheese pool. The search is not a general deck builder:
 * these are cards players have identified as plausible Tower cheese pieces.
 * Fuzzy aliases let this survive harmless display-name changes (for example Kira variants).
 */
const CHEESE_CARD_ALIASES = [
  'Judgment Day',
  'Robin Hood',
  'Parallax',
  'Pandora',
  'Kuchisake-onna',
  'Fate Seamstress',
  'Kira',
  'Surtr',
  'Control Freak',
  "Hell's Army",
  'Noveau Riche',
  'True Prophet',
] as const

const CHEESE_AURAS = [null, 'End Times', 'Flame Wizard'] as const

export interface TowerBatchResult {
  runs: number
  wins: number
  losses: number
  draws: number
  winRate: number
  averageTurns: number
  minTurns: number
  maxTurns: number
  trusted: boolean
  unsupportedAbilities: string[]
}

export interface TowerCheeseCandidate {
  loadout: TeamLoadout
  wins: number
  runs: number
  winRate: number
  progress: number
  averageTurns: number
  trusted: boolean
  unsupportedAbilities: string[]
}

export interface TowerCheeseSearchResult {
  recommendations: TowerCheeseCandidate[]
  anchorCards: string[]
  candidatePool: string[]
  combinations: number
  battleSimulations: number
}

export interface TowerCheeseSearchProgress {
  phase: 'quick' | 'order' | 'aura' | 'final' | 'exhaustive' | 'verify'
  completed: number
  total: number
  battleSimulations: number
}

interface SampleScore {
  wins: number
  runs: number
  progress: number
  averageTurns: number
  trusted: boolean
  unsupportedAbilities: string[]
}

export function towerStagePower(floor: number, difficulty: TowerDifficulty): number {
  const stage = Math.max(1, Math.floor(floor))
  const stageValue = 6_000 + Math.pow(stage, 3) * 50
  const difficultyId = DIFFICULTY_ID[difficulty]
  return Math.ceil(2 * Math.sqrt(stageValue / 2) * Math.pow(4, difficultyId - 1))
}

export function buildTowerEnemies(
  enemyNames: string[],
  floor: number,
  difficulty: TowerDifficulty,
): DepthsEnemy[] {
  if (enemyNames.length !== 4) throw new Error('Tower battles require exactly four enemies.')
  const power = towerStagePower(floor, difficulty)
  return enemyNames.map((name) => {
    const card = CARD_BY_NAME.get(name)
    if (!card) throw new Error(`Unknown Tower enemy: ${name}`)
    // The generated bordered Tower difficulties use the generated HP directly.
    // Normal and Impossible preserve a card's special HP multiplier.
    const preserveHpMultiplier = difficulty === 'Normal' || difficulty === 'Impossible'
    const health = Math.ceil(power * (preserveHpMultiplier ? (card.hpMultiplier || 1) : 1))
    return {
      card,
      power,
      attack: Math.ceil(power / 2),
      health,
    }
  })
}

export function simulateTowerBatch(
  loadout: TeamLoadout,
  enemyNames: string[],
  floor: number,
  difficulty: TowerDifficulty,
  runs = 1_000,
  seed = 1,
  onProgress?: (completed: number, total: number) => void,
): TowerBatchResult {
  const total = Math.min(10_000, Math.max(1, Math.floor(runs)))
  const enemies = buildTowerEnemies(enemyNames, floor, difficulty)
  const seedRng = new SeededRng(seed || 1)
  const unsupported = new Set<string>()
  let wins = 0
  let losses = 0
  let draws = 0
  let totalTurns = 0
  let minTurns = Number.POSITIVE_INFINITY
  let maxTurns = 0

  for (let index = 0; index < total; index++) {
    const battleSeed = Math.floor(seedRng.next() * 0x7fffffff) || index + 1
    const battle = simulateBattleV2(loadout, enemies, battleSeed, 2_000, true, false)
    if (battle.winner === 'Allies') wins += 1
    else if (battle.winner === 'Enemies') losses += 1
    else draws += 1
    totalTurns += battle.turns
    minTurns = Math.min(minTurns, battle.turns)
    maxTurns = Math.max(maxTurns, battle.turns)
    for (const ability of battle.unsupportedAbilities) unsupported.add(ability)
    if ((index + 1) % 25 === 0 || index + 1 === total) onProgress?.(index + 1, total)
  }

  return {
    runs: total,
    wins,
    losses,
    draws,
    winRate: wins / total,
    averageTurns: totalTurns / total,
    minTurns: Number.isFinite(minTurns) ? minTurns : 0,
    maxTurns,
    trusted: unsupported.size === 0,
    unsupportedAbilities: [...unsupported].sort(),
  }
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function resolveCheeseCard(alias: string): string | null {
  if (CARD_BY_NAME.has(alias)) return alias
  const wanted = normalizeName(alias)
  const candidates = cards
    .filter((card) => !card.unobtainable)
    .filter((card) => normalizeName(card.name).includes(wanted) || wanted.includes(normalizeName(card.name)))
    .sort((a, b) => Math.abs(normalizeName(a.name).length - wanted.length) - Math.abs(normalizeName(b.name).length - wanted.length))
  return candidates[0]?.name ?? null
}

export function towerCheeseCandidatePool(): string[] {
  const resolved = CHEESE_CARD_ALIASES.map(resolveCheeseCard).filter((name): name is string => Boolean(name))
  return [...new Set(resolved)]
}

/** Tower cheese inventory rules that differ from normal duplicate-friendly search. */
export function isTowerCheeseCandidateLegal(names: readonly string[]): boolean {
  return names.filter((name) => name === 'Parallax').length <= 1
}

/** Known hard-counter knowledge is deliberately tiny. It constrains the search, not the whole deck. */
export function towerCheeseAnchors(enemyNames: string[]): string[] {
  const enemies = enemyNames.map((name) => CARD_BY_NAME.get(name)).filter(Boolean)
  const anchors: string[] = []
  if (enemies.some((enemy) => enemy?.name === 'Sable The Envious' || enemy?.ability === 'Jealousy')) anchors.push('Robin Hood')
  if (enemies.some((enemy) => enemy?.name === 'Inari')) anchors.push('Noveau Riche')
  return anchors.filter((name) => CARD_BY_NAME.has(name))
}

function combinationsWithReplacement(values: string[], choose: number): string[][] {
  const result: string[][] = []
  const current: string[] = []
  const walk = (start: number, left: number) => {
    if (left === 0) {
      result.push([...current])
      return
    }
    for (let index = start; index < values.length; index++) {
      current.push(values[index])
      walk(index, left - 1)
      current.pop()
    }
  }
  walk(0, choose)
  return result
}

function uniquePermutations(values: string[]): string[][] {
  const result: string[][] = []
  const used = new Array(values.length).fill(false)
  const current: string[] = []
  const seen = new Set<string>()
  const walk = () => {
    if (current.length === values.length) {
      const key = current.join('\u0000')
      if (!seen.has(key)) {
        seen.add(key)
        result.push([...current])
      }
      return
    }
    for (let index = 0; index < values.length; index++) {
      if (used[index]) continue
      used[index] = true
      current.push(values[index])
      walk()
      current.pop()
      used[index] = false
    }
  }
  walk()
  return result
}

function loadoutFor(names: string[], auraName: string | null): TeamLoadout {
  return {
    cards: names.map((cardName): TeamCard => ({ cardName, borders: [] })),
    statAura: null,
    abilityAura: auraName ? { auraName, border: null } : null,
  }
}

function battleProgress(battle: BattleResult): number {
  if (battle.winner === 'Allies') return 1
  const alive = battle.state.teams.Enemies
  const fallen = battle.state.fallen.Enemies
  const total = Math.max(1, alive.length + fallen.length)
  let cleared = fallen.length
  for (const enemy of alive) {
    const damageFraction = enemy.maxHp > 0 ? Math.max(0, Math.min(1, 1 - enemy.hp / enemy.maxHp)) : 0
    cleared += damageFraction
  }
  return Math.max(0, Math.min(0.999999, cleared / total))
}

function sampleLoadout(
  loadout: TeamLoadout,
  enemies: DepthsEnemy[],
  runs: number,
  batchSeed: number,
  simulationCounter: { value: number },
): SampleScore {
  const total = Math.max(1, Math.floor(runs))
  const rng = new SeededRng(batchSeed || 1)
  const unsupported = new Set<string>()
  let wins = 0
  let progress = 0
  let turns = 0
  let trusted = true
  for (let index = 0; index < total; index++) {
    const battleSeed = Math.floor(rng.next() * 0x7fffffff) || index + 1
    const battle = simulateBattleV2(loadout, enemies, battleSeed, 2_000, true, false)
    simulationCounter.value += 1
    if (battle.winner === 'Allies') wins += 1
    progress += battleProgress(battle)
    turns += battle.turns
    trusted = trusted && battle.trusted
    for (const ability of battle.unsupportedAbilities) unsupported.add(ability)
  }
  return {
    wins,
    runs: total,
    progress: progress / total,
    averageTurns: turns / total,
    trusted,
    unsupportedAbilities: [...unsupported].sort(),
  }
}

function compareSamples(a: SampleScore, b: SampleScore): number {
  return b.wins / b.runs - a.wins / a.runs
    || b.progress - a.progress
    || a.averageTurns - b.averageTurns
}

function compareCandidates(a: TowerCheeseCandidate, b: TowerCheeseCandidate): number {
  return b.winRate - a.winRate
    || b.progress - a.progress
    || a.averageTurns - b.averageTurns
}

function candidate(loadout: TeamLoadout, score: SampleScore): TowerCheeseCandidate {
  return {
    loadout,
    wins: score.wins,
    runs: score.runs,
    winRate: score.wins / score.runs,
    progress: score.progress,
    averageTurns: score.averageTurns,
    trusted: score.trusted,
    unsupportedAbilities: score.unsupportedAbilities,
  }
}

export function searchTowerCheese(
  enemyNames: string[],
  floor: number,
  difficulty: TowerDifficulty,
  seed = 1,
  onProgress?: (progress: TowerCheeseSearchProgress) => void,
): TowerCheeseSearchResult {
  const enemies = buildTowerEnemies(enemyNames, floor, difficulty)
  const pool = towerCheeseCandidatePool()
  const anchors = towerCheeseAnchors(enemyNames)
  const missingSlots = 4 - anchors.length
  if (missingSlots < 0) throw new Error('More than four required Tower counters were selected.')
  if (!pool.length) throw new Error('Tower cheese candidate pool is empty.')

  const extras = combinationsWithReplacement(pool, missingSlots)
  const rawTeams = extras.map((extra) => [...anchors, ...extra])
  const uniqueTeams: string[][] = []
  const teamKeys = new Set<string>()
  for (const team of rawTeams) {
    const key = [...team].sort().join('\u0000')
    if (team.length !== 4 || teamKeys.has(key) || !isTowerCheeseCandidateLegal(team)) continue
    teamKeys.add(key)
    uniqueTeams.push(team)
  }

  const simulations = { value: 0 }
  const stageRng = new SeededRng(seed || 1)
  const nextSeed = () => Math.floor(stageRng.next() * 0x7fffffff) || 1

  // Stage 1: every multiset gets several different orders. This avoids eliminating a team only
  // because its first arbitrary order was bad, while keeping the exhaustive pass affordable.
  const quick: Array<{ names: string[]; loadout: TeamLoadout; score: SampleScore }> = []
  for (let index = 0; index < uniqueTeams.length; index++) {
    const names = uniqueTeams[index]
    const orders = uniquePermutations(names).slice(0, 4)
    let best: { loadout: TeamLoadout; score: SampleScore } | null = null
    for (const order of orders) {
      const loadout = loadoutFor(order, null)
      const score = sampleLoadout(loadout, enemies, 4, nextSeed(), simulations)
      if (!best || compareSamples(score, best.score) < 0) best = { loadout, score }
    }
    if (best) quick.push({ names, ...best })
    if (index % 10 === 0 || index + 1 === uniqueTeams.length) {
      onProgress?.({ phase: 'quick', completed: index + 1, total: uniqueTeams.length, battleSimulations: simulations.value })
    }
  }
  quick.sort((a, b) => compareSamples(a.score, b.score))

  // Stage 2: fully optimize order for the strongest candidate multisets.
  const orderPool = quick.slice(0, Math.min(60, quick.length))
  const ordered: Array<{ loadout: TeamLoadout; score: SampleScore }> = []
  for (let index = 0; index < orderPool.length; index++) {
    const entry = orderPool[index]
    let best: { loadout: TeamLoadout; score: SampleScore } | null = null
    for (const order of uniquePermutations(entry.names)) {
      const loadout = loadoutFor(order, null)
      const score = sampleLoadout(loadout, enemies, 6, nextSeed(), simulations)
      if (!best || compareSamples(score, best.score) < 0) best = { loadout, score }
    }
    if (best) ordered.push(best)
    onProgress?.({ phase: 'order', completed: index + 1, total: orderPool.length, battleSimulations: simulations.value })
  }
  ordered.sort((a, b) => compareSamples(a.score, b.score))

  // Stage 3: test the two known cheese auras plus no aura. Aura choice is allowed to rescue a team
  // that looked mediocre without one, especially the Hells/Kuchi/Control + Flame Wizard family.
  const auraPool = ordered.slice(0, Math.min(30, ordered.length))
  const auraOptimized: Array<{ loadout: TeamLoadout; score: SampleScore }> = []
  for (let index = 0; index < auraPool.length; index++) {
    const entry = auraPool[index]
    let best: { loadout: TeamLoadout; score: SampleScore } | null = null
    for (const auraName of CHEESE_AURAS) {
      const loadout = { ...entry.loadout, abilityAura: auraName ? { auraName, border: null } : null }
      const score = sampleLoadout(loadout, enemies, 12, nextSeed(), simulations)
      if (!best || compareSamples(score, best.score) < 0) best = { loadout, score }
    }
    if (best) auraOptimized.push(best)
    onProgress?.({ phase: 'aura', completed: index + 1, total: auraPool.length, battleSimulations: simulations.value })
  }
  auraOptimized.sort((a, b) => compareSamples(a.score, b.score))

  // Stage 4: independent verification batch. Final results are intentionally a shortlist rather
  // than a claimed perfect ranking; the existing 10,000-run button remains the final verifier.
  const finalPool = auraOptimized.slice(0, Math.min(12, auraOptimized.length))
  const recommendations: TowerCheeseCandidate[] = []
  for (let index = 0; index < finalPool.length; index++) {
    const entry = finalPool[index]
    const score = sampleLoadout(entry.loadout, enemies, 100, nextSeed(), simulations)
    recommendations.push(candidate(entry.loadout, score))
    onProgress?.({ phase: 'final', completed: index + 1, total: finalPool.length, battleSimulations: simulations.value })
  }
  recommendations.sort(compareCandidates)

  return {
    recommendations: recommendations.slice(0, 10),
    anchorCards: anchors,
    candidatePool: pool,
    combinations: uniqueTeams.length,
    battleSimulations: simulations.value,
  }
}

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


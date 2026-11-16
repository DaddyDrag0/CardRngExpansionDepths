import type { BattleDebug, TeamLoadout } from '../types'
import { generateDepthsTeam } from './depths'
import { SeededRng } from './rng'
import { simulateBattleV2 } from './battle-v2'
import { auraPacksForClearedRange } from './depths-rewards'
import { estimateDepthClearSeconds, estimateBattleSeconds } from './depths-time'

export interface DepthsRunResult {
  deathFloor: number
  floorsCleared: number
  battles: number
  /** Simulation samples only every Nth floor; intervening floors are estimates. */
  floorStride?: number
  sampled?: boolean
  deathFloorLow?: number
  totalTurns: number
  /** Source-aware playback estimate from each real simulated floor, when timing is requested. */
  playbackSeconds?: number
  endingEnemies: string[]
  trusted: boolean
  unsupportedAbilities: string[]
  runSeed: number
  floorSeed?: number
  battleSeed?: number
  turnLimitReached?: boolean
  turnLimitEnemy?: string
  turnLimitAlly?: string
  debug?: BattleDebug
}

export interface DepthsBatchResult {
  runs: DepthsRunResult[]
  averageFloor: number
  medianFloor: number
  minFloor: number
  maxFloor: number
  estimatedFloorLow: number
  estimatedFloorHigh: number
  auraPackLow: number
  auraPackMedian: number
  auraPackHigh: number
  averageTurnsPerBattle: number
  estimatedSecondsLow: number
  estimatedSecondsMedian: number
  estimatedSecondsHigh: number
  auraCardsPerHour: number
  trusted: boolean
  unsupportedAbilities: string[]
  floorStride?: number
  sampled?: boolean
}

export interface DepthsTimingSettings {
  chronoShard?: boolean
  chronoShardLevel?: number
  battleSpeedStructureLevel?: number
  skillTreeBattleSpeedLevel?: number
  floorOverheadSeconds?: number
  baseBattleSpeed?: number
  blessingMultiplier?: number
  attackAnimationScale?: number
}
export interface DepthsSimulationOptions {
  startFloor?: number
  floorCap?: number
  seed?: number
  battleTurnCap?: number
  throwOnBattleTurnCap?: boolean
  /** Optional player-unlocked Depth bans. Default game exclusions remain active separately. */
  bannedCardNames?: string[]
  /** Temporarily restore the eight pre-update default Depth bans. Does not consume player ban slots. */
  rebanLegacyDepths?: boolean
  /** Hard Mode keeps the real floor number but gives enemies stats from floor ×10. */
  hardMode?: boolean
  /** Skip expensive loss replays during batch estimation; regenerate only on click. */
  lazyDebug?: boolean
  /** 10/15/20/25 in Normal; 1/2/3 in Hard. Never claims skipped floors were simulated. */
  floorStride?: number
  timing?: DepthsTimingSettings
}

export interface DepthsBatchOptions extends DepthsSimulationOptions {
  runs?: number
  battleSpeedStructureLevel?: number
  chronoShard?: boolean
}

export type DepthsProgressCallback = (floor: number, battleTurn?: number, enemyNames?: string[]) => void

function mixSeed(runSeed: number, floor: number): number {
  let x = (runSeed ^ Math.imul(floor, 0x9e3779b1)) >>> 0
  x ^= x >>> 16
  x = Math.imul(x, 0x85ebca6b) >>> 0
  x ^= x >>> 13
  x = Math.imul(x, 0xc2b2ae35) >>> 0
  return (x ^ (x >>> 16)) >>> 0
}

/** Every Depth floor starts a new full battle with a fresh copy of the selected team. */
export function simulateDepthsRun(
  loadout: TeamLoadout,
  options: DepthsSimulationOptions = {},
  onProgress?: DepthsProgressCallback,
): DepthsRunResult {
  const startFloor = Math.max(1, Math.floor(options.startFloor ?? 1))
  const floorCap = Math.max(startFloor, Math.floor(options.floorCap ?? 300_000))
  const runSeed = options.seed ?? 1
  const unsupported = new Set<string>()
  let totalTurns = 0
  let battles = 0
  let playbackSeconds = 0
  const accepted = options.hardMode ? [1, 2, 3] : [1, 10, 15, 20, 25]
  const floorStride = accepted.includes(Number(options.floorStride)) ? Number(options.floorStride) : 1
  let lastSampled = startFloor - 1
  for (let floor = Math.min(floorCap, Math.ceil(startFloor / floorStride) * floorStride); floor <= floorCap; floor = Math.min(floorCap, floor + floorStride)) {
    const representedFloors = floor - lastSampled
    const floorSeed = mixSeed(runSeed, floor)
    const enemies = generateDepthsTeam(
      floor,
      floorSeed,
      options.bannedCardNames,
      options.rebanLegacyDepths,
      options.hardMode ? 10 : 1,
    )
    const enemyNames = enemies.map((enemy) => enemy.card.name)
    onProgress?.(floor, undefined, enemyNames)
    const hasTurnCap = Number.isFinite(options.battleTurnCap)
    const maxTurns = hasTurnCap ? Math.max(1, Math.floor(options.battleTurnCap as number)) : Number.POSITIVE_INFINITY
    const battle = simulateBattleV2(
      loadout, enemies, floorSeed ^ 0x51ed270b, maxTurns, hasTurnCap, false,
      (battleTurn) => onProgress?.(floor, battleTurn, enemyNames),
    )
    battles += 1
    totalTurns += battle.turns
    if (options.timing) {
      const time = options.timing
      playbackSeconds += estimateBattleSeconds(
        floor, battle.turns, time.chronoShard ?? true, time.battleSpeedStructureLevel ?? 0,
        time.skillTreeBattleSpeedLevel ?? 0, time.chronoShardLevel ?? 0,
        time.floorOverheadSeconds ?? 0.8, time.baseBattleSpeed ?? 3,
        time.blessingMultiplier ?? 1, time.attackAnimationScale ?? 1,
      ) * representedFloors
    }
    for (const ability of battle.unsupportedAbilities) unsupported.add(ability)

    if (options.throwOnBattleTurnCap && battle.unsupportedAbilities.includes('Battle turn cap reached')) {
      const battleSeed = floorSeed ^ 0x51ed270b
      throw new Error(
        `Long battle diagnostic: floor ${floor.toLocaleString('en-US')} reached ${maxTurns.toLocaleString('en-US')} turns vs ${enemyNames.join(' | ')}. ` +
        `Run seed ${runSeed}; floor seed ${floorSeed}; battle seed ${battleSeed}.`,
      )
    }

    if (battle.winner !== 'Allies') {
      // Re-run only the losing battle with tracing enabled. This keeps thousands of
      // winning floors fast while still making the exact loss fully inspectable.
      const debugBattle = options.lazyDebug ? null : simulateBattleV2(
        loadout, enemies, floorSeed ^ 0x51ed270b, maxTurns, hasTurnCap, true,
        (battleTurn) => onProgress?.(floor, battleTurn, enemyNames),
      )
      onProgress?.(floor, undefined, enemyNames)
      return {
        deathFloor: floor,
        floorsCleared: floor - startFloor,
        battles,
        floorStride,
        sampled: floorStride > 1,
        deathFloorLow: lastSampled + 1,
        totalTurns,
        ...(options.timing ? { playbackSeconds } : {}),
        endingEnemies: enemies.map((enemy) => enemy.card.name),
        trusted: unsupported.size === 0,
        unsupportedAbilities: [...unsupported].sort(),
        runSeed,
        floorSeed,
        battleSeed: floorSeed ^ 0x51ed270b,
        turnLimitReached: debugBattle?.turnLimitReached ?? battle.turnLimitReached,
        turnLimitEnemy: debugBattle?.debug?.turnLimit?.enemy,
        turnLimitAlly: debugBattle?.debug?.turnLimit?.ally,
        debug: debugBattle?.debug,
      }
    }
    lastSampled = floor
    if (floor === floorCap) break
  }

  onProgress?.(floorCap)
  return {
    deathFloor: floorCap + 1,
    floorsCleared: floorCap - startFloor + 1,
    battles,
    floorStride,
    sampled: floorStride > 1,
    totalTurns,
    ...(options.timing ? { playbackSeconds } : {}),
    endingEnemies: [],
    trusted: unsupported.size === 0,
    unsupportedAbilities: [...unsupported].sort(),
    runSeed,
  }
}

export function simulateDepthsBatch(
  loadout: TeamLoadout,
  options: DepthsBatchOptions = {},
): DepthsBatchResult {
  const runs = Math.max(1, Math.floor(options.runs ?? 15))
  const seed = options.seed ?? 1
  const seedRng = new SeededRng(seed)
  const results: DepthsRunResult[] = []
  const unsupported = new Set<string>()

  for (let index = 0; index < runs; index++) {
    const runSeed = Math.floor(seedRng.next() * 0x7fffffff) || index + 1
    const result = simulateDepthsRun(loadout, {
      startFloor: options.startFloor,
      floorCap: options.floorCap,
      seed: runSeed,
      battleTurnCap: options.battleTurnCap,
      bannedCardNames: options.bannedCardNames,
      rebanLegacyDepths: options.rebanLegacyDepths,
      hardMode: options.hardMode,
      floorStride: options.floorStride,
      lazyDebug: options.lazyDebug,
      timing: options.timing,
    })
    results.push(result)
    for (const ability of result.unsupportedAbilities) unsupported.add(ability)
  }

  const floors = results.map((result) => result.deathFloor).sort((a, b) => a - b)
  const middle = Math.floor(floors.length / 2)
  const medianFloor = floors.length % 2
    ? floors[middle]
    : (floors[middle - 1] + floors[middle]) / 2
  const observedMinFloor = floors[0]
  const observedMaxFloor = floors[floors.length - 1]
  const medianDepth = Math.max(1, Math.round(medianFloor))
  const estimatedFloorLow = Math.max(observedMinFloor, Math.max(1, Math.round(medianFloor * 0.9)))
  const estimatedFloorHigh = Math.min(observedMaxFloor, Math.max(1, Math.round(medianFloor * 1.1)))
  const startFloor = Math.max(1, Math.floor(Number(options.startFloor) || 1))
  const earnedPacks = (deathFloor: number) => auraPacksForClearedRange(startFloor, deathFloor, Boolean(options.hardMode))
  const estimate = {
    low: estimatedFloorLow,
    high: estimatedFloorHigh,
    medianDepth,
    auraPackLow: earnedPacks(estimatedFloorLow),
    auraPackMedian: earnedPacks(medianDepth),
    auraPackHigh: earnedPacks(estimatedFloorHigh),
  }
  const totalBattles = results.reduce((sum, result) => sum + result.battles, 0)
  const allTurns = results.reduce((sum, result) => sum + result.totalTurns, 0)
  const averageTurnsPerBattle = totalBattles > 0 ? allTurns / totalBattles : 0
  const times = results.map(run => run.playbackSeconds).filter((time): time is number => Number.isFinite(time))
    .sort((a, b) => a - b)
  const estimatedSecondsLow = times.length ? times[Math.floor((times.length - 1) * 0.1)]
    : estimateDepthClearSeconds(estimate.low, averageTurnsPerBattle,
      options.timing?.chronoShard ?? options.chronoShard ?? true,
      options.timing?.battleSpeedStructureLevel ?? options.battleSpeedStructureLevel ?? 0,
      options.timing?.skillTreeBattleSpeedLevel ?? 0,
      options.timing?.chronoShardLevel ?? 0,
      options.timing?.floorOverheadSeconds ?? 0.8,
      options.timing?.baseBattleSpeed ?? 3,
      options.timing?.blessingMultiplier ?? 1,
      options.timing?.attackAnimationScale ?? 1)
  const estimatedSecondsMedian = times.length ? times[Math.floor((times.length - 1) / 2)]
    : estimateDepthClearSeconds(estimate.medianDepth, averageTurnsPerBattle,
      options.timing?.chronoShard ?? options.chronoShard ?? true,
      options.timing?.battleSpeedStructureLevel ?? options.battleSpeedStructureLevel ?? 0,
      options.timing?.skillTreeBattleSpeedLevel ?? 0,
      options.timing?.chronoShardLevel ?? 0,
      options.timing?.floorOverheadSeconds ?? 0.8,
      options.timing?.baseBattleSpeed ?? 3,
      options.timing?.blessingMultiplier ?? 1,
      options.timing?.attackAnimationScale ?? 1)
  const estimatedSecondsHigh = times.length ? times[Math.ceil((times.length - 1) * 0.9)]
    : estimateDepthClearSeconds(estimate.high, averageTurnsPerBattle,
      options.timing?.chronoShard ?? options.chronoShard ?? true,
      options.timing?.battleSpeedStructureLevel ?? options.battleSpeedStructureLevel ?? 0,
      options.timing?.skillTreeBattleSpeedLevel ?? 0,
      options.timing?.chronoShardLevel ?? 0,
      options.timing?.floorOverheadSeconds ?? 0.8,
      options.timing?.baseBattleSpeed ?? 3,
      options.timing?.blessingMultiplier ?? 1,
      options.timing?.attackAnimationScale ?? 1)
  const totalSimulatedPacks = results.reduce((sum,run)=>sum+earnedPacks(run.deathFloor),0)
  const totalSimulatedSeconds = results.reduce((sum,run)=>sum+(run.playbackSeconds??0),0)
  const auraCardsPerHour = times.length===results.length&&totalSimulatedSeconds>0
    ? totalSimulatedPacks*3600/totalSimulatedSeconds
    : estimatedSecondsMedian>0?estimate.auraPackMedian*3600/estimatedSecondsMedian:0

  return {
    runs: results,
    averageFloor: floors.reduce((sum, floor) => sum + floor, 0) / floors.length,
    medianFloor,
    minFloor: floors[0],
    maxFloor: floors[floors.length - 1],
    estimatedFloorLow: estimate.low,
    estimatedFloorHigh: estimate.high,
    auraPackLow: estimate.auraPackLow,
    auraPackMedian: estimate.auraPackMedian,
    auraPackHigh: estimate.auraPackHigh,
    averageTurnsPerBattle,
    estimatedSecondsLow,
    estimatedSecondsMedian,
    estimatedSecondsHigh,
    auraCardsPerHour,
    trusted: unsupported.size === 0,
    unsupportedAbilities: [...unsupported].sort(),
    floorStride: results[0]?.floorStride,
    sampled: results.some(result => result.sampled),
  }
}

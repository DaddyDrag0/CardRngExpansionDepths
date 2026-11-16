/**
 * Depths reward helpers recovered from the game sources.
 *
 * Card RNG Expansion keeps this Util.StageATK helper:
 *   ceil(calculateA(3000 + floor^2.7 * 40, 1) / 2)
 * and calculateA(x, 1) = sqrt(x / 2) * 2, so StageATK simplifies to:
 *   ceil(sqrt((3000 + floor^2.7 * 40) / 2))
 *
 * Aura Pack rewards are cumulative. The per-floor reward scales through floor
 * 5,000, then stays at the floor-5,000 amount for every later floor.
 */
export const AURA_PACK_SCALING_CAP_FLOOR = 5000

export function depthsRewardStageAttack(floor: number): number {
  const safeFloor = Math.max(1, Math.floor(Number(floor) || 1))
  return Math.ceil(Math.sqrt((3000 + Math.pow(safeFloor, 2.7) * 40) / 2))
}

export function auraPacksForDepth(depth: number): number {
  const endFloor = Math.max(0, Math.floor(Number(depth) || 0))
  if (endFloor <= 0) return 0

  const scalingEnd = Math.min(endFloor, AURA_PACK_SCALING_CAP_FLOOR)
  let packs = 0
  for (let floor = 1; floor <= scalingEnd; floor++) {
    packs += Math.ceil(depthsRewardStageAttack(floor) / 500)
  }

  if (endFloor > AURA_PACK_SCALING_CAP_FLOOR) {
    const cappedPacksPerFloor = Math.ceil(depthsRewardStageAttack(AURA_PACK_SCALING_CAP_FLOOR) / 500)
    packs += (endFloor - AURA_PACK_SCALING_CAP_FLOOR) * cappedPacksPerFloor
  }

  return packs
}

/** Reward only successfully cleared floors and exclude any skipped starting floors. */
export function auraPacksForClearedRange(startFloor: number, deathFloor: number, hardMode = false): number {
  const start = Math.max(1, Math.floor(Number(startFloor) || 1))
  const lastCleared = Math.max(start - 1, Math.floor(Number(deathFloor) || 1) - 1)
  const earned = auraPacksForDepth(lastCleared) - auraPacksForDepth(start - 1)
  return Math.max(0, earned) * (hardMode ? 3 : 1)
}

export const POTION_DROP_CAP_FLOOR = 5000
export const BOUNTIFUL_DEPTHS_DROP_MULTIPLIER = 1.25
export const BOUNTIFUL_DELVE_BONUSES = [25,30,35,40,50] as const
export function bountifulDelveMultiplier(level=0):number {
  const index=Math.max(0,Math.min(4,Math.floor(Number(level)||0)))
  return 1+BOUNTIFUL_DELVE_BONUSES[index]/100
}
// CYBERPUNK Roblox DepthsLootConfig: rare-first, mutually-exclusive floor rolls.
export const JACKPOT_POTION_BASE_ODDS = 750_000
export const JACKPOT_POTION_CAP_ODDS = 750_000
export const RARE_WEATHER_POTION_BASE_ODDS = 17_500_000
export const RARE_WEATHER_POTION_CAP_ODDS = 17_500_000

const EARLIER_NORMAL_DROP_ODDS = [
  17_500_000, // Rare Weather Potion
  1_100_000, // Legendary Speed Potion
  1_100_000, // Legendary Luck Potion
  1_000_000, // Elixir
  800_000, // Structure Coin
] as const

function normalFloorDropFactor(floor: number, bountiful: boolean, bountifulLevel = 0): number {
  const safeFloor = Math.max(1, Math.floor(Number(floor) || 1))
  const stageAttack = depthsRewardStageAttack(Math.min(POTION_DROP_CAP_FLOOR, safeFloor))
  return (1 + stageAttack / 100) * (bountiful ? bountifulDelveMultiplier(bountifulLevel) : 1)
}

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

/**
 * FloorOdds sorts items rarest-first and rolls them sequentially.
 * A Jackpot Potion can only drop when the five rarer normal drops miss.
 */
export function jackpotPotionChanceForFloor(floor: number, bountiful = false, bountifulLevel = 0): number {
  const factor = normalFloorDropFactor(floor, bountiful, bountifulLevel)
  let chanceRemaining = 1
  for (const denominator of EARLIER_NORMAL_DROP_ODDS) {
    chanceRemaining *= 1 - Math.min(1, factor / denominator)
  }
  return chanceRemaining * Math.min(1, factor / JACKPOT_POTION_BASE_ODDS)
}

/** Rare Weather Potion is first in the mutually-exclusive Normal drop table. */
export function rareWeatherPotionChanceForFloor(floor: number, bountiful = false, bountifulLevel = 0): number {
  return Math.min(1, normalFloorDropFactor(floor, bountiful, bountifulLevel) / RARE_WEATHER_POTION_BASE_ODDS)
}

function summarizePotionDrops(
  depth: number,
  chanceForFloor: (floor: number, bountiful: boolean, level:number) => number,
  bountiful: boolean,
  bountifulLevel = 0,
  startFloor = 1,
): PotionDropStat {
  const endFloor = Math.max(0, Math.floor(Number(depth) || 0))
  const firstFloor = Math.max(1, Math.floor(Number(startFloor) || 1))
  if (endFloor < firstFloor) return { expected: 0, atLeastOne: 0, oneInRuns: Infinity, endFloorOneIn: Infinity }

  const scalingEnd = Math.min(endFloor, POTION_DROP_CAP_FLOOR)
  let expected = 0
  let logNoDrop = 0
  for (let floor = firstFloor; floor <= scalingEnd; floor++) {
    const chance = chanceForFloor(floor, bountiful, bountifulLevel)
    expected += chance
    logNoDrop += Math.log1p(-chance)
  }

  if (endFloor > POTION_DROP_CAP_FLOOR) {
    const extraFloors = endFloor - Math.max(POTION_DROP_CAP_FLOOR, firstFloor - 1)
    const cappedChance = chanceForFloor(POTION_DROP_CAP_FLOOR + 1, bountiful, bountifulLevel)
    expected += extraFloors * cappedChance
    logNoDrop += extraFloors * Math.log1p(-cappedChance)
  }

  const atLeastOne = Math.min(1, Math.max(0, 1 - Math.exp(logNoDrop)))
  const endFloorChance = chanceForFloor(endFloor, bountiful, bountifulLevel)
  return {
    expected,
    atLeastOne,
    oneInRuns: atLeastOne > 0 ? 1 / atLeastOne : Infinity,
    endFloorOneIn: endFloorChance > 0 ? 1 / endFloorChance : Infinity,
  }
}

export function potionDropsForDepth(depth: number, bountiful = false, bountifulLevel = 0, startFloor = 1): PotionDropSummary {
  const safeDepth = Math.max(0, Math.floor(Number(depth) || 0))
  return {
    depth: safeDepth,
    bountiful,
    jackpot: summarizePotionDrops(safeDepth, jackpotPotionChanceForFloor, bountiful, bountifulLevel, startFloor),
    rareWeather: summarizePotionDrops(safeDepth, rareWeatherPotionChanceForFloor, bountiful, bountifulLevel, startFloor),
  }
}

export function potionDropRangeForMedian(medianFloor: number, margin = 0.15, bountiful = false, bountifulLevel = 0) {
  const range = estimatedDepthRange(medianFloor, margin)
  const medianDepth = Math.max(1, Math.round(Number(medianFloor) || 1))
  return {
    ...range,
    medianDepth,
    bountiful,
    low: potionDropsForDepth(range.low, bountiful, bountifulLevel),
    median: potionDropsForDepth(medianDepth, bountiful, bountifulLevel),
    high: potionDropsForDepth(range.high, bountiful, bountifulLevel),
  }
}

export function estimatedDepthRange(medianFloor: number, margin = 0.15): { low: number; high: number } {
  const median = Math.max(1, Number(medianFloor) || 1)
  const safeMargin = Math.max(0, Number(margin) || 0)
  return {
    low: Math.max(1, Math.round(median * (1 - safeMargin))),
    high: Math.max(1, Math.round(median * (1 + safeMargin))),
  }
}

export function auraPackRangeForMedian(medianFloor: number, margin = 0.15) {
  const range = estimatedDepthRange(medianFloor, margin)
  const medianDepth = Math.max(1, Math.round(Number(medianFloor) || 1))
  return {
    ...range,
    medianDepth,
    auraPackLow: auraPacksForDepth(range.low),
    auraPackMedian: auraPacksForDepth(medianDepth),
    auraPackHigh: auraPacksForDepth(range.high),
  }
}

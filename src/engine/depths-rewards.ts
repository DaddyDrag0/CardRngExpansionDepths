/**
 * Depths reward helpers recovered from the game sources.
 *
 * Card RNG Expansion keeps this Util.StageATK helper:
 *   ceil(calculateA(3000 + floor^2.7 * 40, 1) / 2)
 * and calculateA(x, 1) = sqrt(x / 2) * 2, so StageATK simplifies to:
 *   ceil(sqrt((3000 + floor^2.7 * 40) / 2))
 *
 * The original server Depths reward handler awards Aura Packs cumulatively:
 *   numPacks += ceil(Util.StageATK(floor) / 500)
 * for every floor from 1 through the ending Depths floor.
 *
 * The Expansion save does not contain that server remote handler, but it keeps
 * the same StageATK helper used by that reward code.
 */
export function depthsRewardStageAttack(floor: number): number {
  const safeFloor = Math.max(1, Math.floor(Number(floor) || 1))
  return Math.ceil(Math.sqrt((3000 + Math.pow(safeFloor, 2.7) * 40) / 2))
}

export function auraPacksForDepth(depth: number): number {
  const endFloor = Math.max(0, Math.floor(Number(depth) || 0))
  let packs = 0
  for (let floor = 1; floor <= endFloor; floor++) {
    packs += Math.ceil(depthsRewardStageAttack(floor) / 500)
  }
  return packs
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
  return {
    ...range,
    auraPackLow: auraPacksForDepth(range.low),
    auraPackHigh: auraPacksForDepth(range.high),
  }
}

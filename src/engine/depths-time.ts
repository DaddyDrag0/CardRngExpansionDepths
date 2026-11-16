/**
 * Source-aligned Depths playback speed model recovered from Expansion BattleClient.
 *
 * In Depths, the user's normal BattleSpeed setting is capped at 3.
 * Chrono Shard adds +1 to +2 Battle Speed based on its upgrade level.
 * Every 100 Depths floors adds +0.25 Battle Speed, capped at +4.5.
 *
 * BattleClient also accelerates long fights by multiplying animation speed after
 * the 10th/20th/40th/60th Attack event by 2x/3x/5x/10x respectively.
 *
 * Depths playback timing is estimated per simulated floor from the actual
 * simulated turn count, using source-derived speed and acceleration rules.
 * The client exposes event-specific animation durations, but the battle
 * simulator does not preserve their individual playback traces.
 * The attack phase has a 0.2-second minimum. A separate configurable
 * 0.8-second per-floor transition allowance covers UI/animation delays that
 * were omitted from the too-optimistic attack-only estimate. This allowance
 * is a provisional calibration; the client does not expose the server-side
 * `battlecd` duration. It can be adjusted against real-world run times.
 * Ability-specific animation delays are not separately modeled.
 */
export const DEPTHS_BASE_BATTLE_SPEED = 3
export const CHRONO_SHARD_BONUS = 1
export const CHRONO_SHARD_UPGRADE_BONUSES = [1, 1.25, 1.5, 1.75, 2] as const
export function chronoShardRelicBonus(level=0):number {
  const index=Math.max(0,Math.min(4,Math.floor(Number(level)||0)))
  return CHRONO_SHARD_UPGRADE_BONUSES[index]
}
export const BATTLE_SPEED_STRUCTURE_MAX_LEVEL = 7
export const BATTLE_SPEED_STRUCTURE_STEP = 0.25
export const BATTLE_SPEED_SKILL_TREE_MAX_LEVEL = 6
export const BATTLE_SPEED_SKILL_TREE_BONUSES = [0, 0.5, 1, 1.5, 2.5, 4, 5.5] as const
export const DEPTHS_FLOOR_SPEED_STEP = 0.25
export const DEPTHS_FLOOR_SPEED_STEP_FLOORS = 100
export const DEPTHS_FLOOR_SPEED_BONUS_CAP = 4.5
export const BASE_ATTACK_ANIMATION_SECONDS = 1
export const MIN_DEPTHS_BATTLE_SECONDS = 0.2
export const DEFAULT_DEPTHS_FLOOR_OVERHEAD_SECONDS = 0.8
export function normalizeDepthsFloorOverhead(seconds = DEFAULT_DEPTHS_FLOOR_OVERHEAD_SECONDS): number {
  const value = Number(seconds)
  return Number.isFinite(value) ? Math.max(0, Math.min(3, value)) : DEFAULT_DEPTHS_FLOOR_OVERHEAD_SECONDS
}

export function depthsFloorSpeedBonus(floor: number): number {
  const safeFloor = Math.max(1, Math.floor(Number(floor) || 1))
  return Math.min(
    DEPTHS_FLOOR_SPEED_BONUS_CAP,
    Math.floor(safeFloor / DEPTHS_FLOOR_SPEED_STEP_FLOORS) * DEPTHS_FLOOR_SPEED_STEP,
  )
}

export function battleSpeedStructureBonus(level = 0): number {
  const safeLevel = Math.max(0, Math.min(BATTLE_SPEED_STRUCTURE_MAX_LEVEL, Math.floor(Number(level) || 0)))
  return safeLevel * BATTLE_SPEED_STRUCTURE_STEP
}

export function battleSpeedSkillTreeBonus(level = 0): number {
  const safeLevel = Math.max(0, Math.min(BATTLE_SPEED_SKILL_TREE_MAX_LEVEL, Math.floor(Number(level) || 0)))
  return BATTLE_SPEED_SKILL_TREE_BONUSES[safeLevel]
}

export function effectiveDepthsBattleSpeed(
  floor: number,
  chronoShard = true,
  structureLevel = 0,
  skillTreeLevel = 0,
  chronoShardLevel = 0,
  baseBattleSpeed = DEPTHS_BASE_BATTLE_SPEED,
  blessingMultiplier = 1,
): number {
  const selectedSpeed = Number(baseBattleSpeed)
  const base = [1, 1.5, 2, 3].includes(selectedSpeed) ? selectedSpeed : DEPTHS_BASE_BATTLE_SPEED
  const blessing = [1.5, 2].includes(Number(blessingMultiplier)) ? Number(blessingMultiplier) : 1
  return (base
    + (chronoShard ? chronoShardRelicBonus(chronoShardLevel) : 0)
    + battleSpeedStructureBonus(structureLevel)
    + battleSpeedSkillTreeBonus(skillTreeLevel)
    + depthsFloorSpeedBonus(floor)) * blessing
}

export function inBattleAcceleration(attackNumber: number): number {
  const attack = Math.max(1, Math.floor(Number(attackNumber) || 1))
  if (attack >= 60) return 10
  if (attack >= 40) return 5
  if (attack >= 20) return 3
  if (attack >= 10) return 2
  return 1
}

/** Event-count playback approximation. Accelerates at 10/20/40/60 Attack events.
 * Piecewise constant integration makes a 10,000-event fight O(1) rather than
 * looping 10,000 times and enables floor-specific timing per Depths battle.
 */
export function attackAnimationSecondsForCount(turns: number, effectiveSpeed: number, animationScale = 1): number {
  const count = Math.max(0, Number(turns) || 0)
  const pace = Math.max(0.1, Math.min(5, Number(animationScale) || 1))
  const segments: readonly [number, number, number][] = [
    [0, 9, 1], [9, 19, 2], [19, 39, 3], [39, 59, 5], [59, Infinity, 10],
  ]
  let units = 0
  for (const [start, end, multiplier] of segments) {
    const actions = Math.max(0, Math.min(count, end) - start)
    if (actions) units += actions / multiplier
  }
  return units * BASE_ATTACK_ANIMATION_SECONDS * pace / Math.max(0.01, effectiveSpeed)
}

export function estimateBattleSeconds(
  floor: number,
  turns: number,
  chronoShard = true,
  structureLevel = 0,
  skillTreeLevel = 0,
  chronoShardLevel = 0,
  floorOverheadSeconds = DEFAULT_DEPTHS_FLOOR_OVERHEAD_SECONDS,
  baseBattleSpeed = DEPTHS_BASE_BATTLE_SPEED,
  blessingMultiplier = 1,
  animationScale = 1,
): number {
  const speed = effectiveDepthsBattleSpeed(floor, chronoShard, structureLevel, skillTreeLevel, chronoShardLevel, baseBattleSpeed, blessingMultiplier)
  return normalizeDepthsFloorOverhead(floorOverheadSeconds)
    + Math.max(MIN_DEPTHS_BATTLE_SECONDS, attackAnimationSecondsForCount(turns, speed, animationScale))
}

/** Estimate a full run using the batch's observed average turns per battle. */
export function estimateDepthClearSeconds(
  depth: number,
  averageTurnsPerBattle: number,
  chronoShard = true,
  structureLevel = 0,
  skillTreeLevel = 0,
  chronoShardLevel = 0,
  floorOverheadSeconds = DEFAULT_DEPTHS_FLOOR_OVERHEAD_SECONDS,
  baseBattleSpeed = DEPTHS_BASE_BATTLE_SPEED,
  blessingMultiplier = 1,
  animationScale = 1,
): number {
  const endFloor = Math.max(0, Math.floor(Number(depth) || 0))
  const avgTurns = Math.max(0, Number(averageTurnsPerBattle) || 0)
  let seconds = 0
  for (let floor = 1; floor <= endFloor; floor++) {
    seconds += estimateBattleSeconds(floor, avgTurns, chronoShard, structureLevel, skillTreeLevel, chronoShardLevel, floorOverheadSeconds, baseBattleSpeed, blessingMultiplier, animationScale)
  }
  return seconds
}

export function formatDurationParts(seconds: number): { hours: number; minutes: number; seconds: number } {
  const whole = Math.max(0, Math.round(Number(seconds) || 0))
  return {
    hours: Math.floor(whole / 3600),
    minutes: Math.floor((whole % 3600) / 60),
    seconds: whole % 60,
  }
}

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
 * Timing uses a simplified estimate: each attack takes 1 second divided by
 * effective Battle Speed (and by any long-battle acceleration multiplier).
 * Floors take at least 0.2 seconds. Unlike the previous model, there is no
 * extra fixed battle-start or per-floor delay.
 *
 * The client does not expose the server-controlled `battlecd` duration, so
 * this is a user-calibrated prediction, not a measured server timing guarantee.
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
export const BATTLE_SPEED_SKILL_TREE_MAX_LEVEL = 4
export const BATTLE_SPEED_SKILL_TREE_BONUSES = [0, 0.5, 1, 1.5, 2.5] as const
export const DEPTHS_FLOOR_SPEED_STEP = 0.25
export const DEPTHS_FLOOR_SPEED_STEP_FLOORS = 100
export const DEPTHS_FLOOR_SPEED_BONUS_CAP = 4.5
export const BASE_ATTACK_ANIMATION_SECONDS = 1
export const MIN_DEPTHS_BATTLE_SECONDS = 0.2

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
): number {
  return DEPTHS_BASE_BATTLE_SPEED
    + (chronoShard ? chronoShardRelicBonus(chronoShardLevel) : 0)
    + battleSpeedStructureBonus(structureLevel)
    + battleSpeedSkillTreeBonus(skillTreeLevel)
    + depthsFloorSpeedBonus(floor)
}

export function inBattleAcceleration(attackNumber: number): number {
  const attack = Math.max(1, Math.floor(Number(attackNumber) || 1))
  if (attack >= 60) return 10
  if (attack >= 40) return 5
  if (attack >= 20) return 3
  if (attack >= 10) return 2
  return 1
}

function attackAnimationSecondsForCount(turns: number, effectiveSpeed: number): number {
  const count = Math.max(0, Number(turns) || 0)
  const whole = Math.floor(count)
  const fractional = count - whole
  let seconds = 0
  for (let attack = 1; attack <= whole; attack++) {
    seconds += BASE_ATTACK_ANIMATION_SECONDS / (effectiveSpeed * inBattleAcceleration(attack))
  }
  if (fractional > 0) {
    seconds += fractional * BASE_ATTACK_ANIMATION_SECONDS / (effectiveSpeed * inBattleAcceleration(whole + 1))
  }
  return seconds
}

export function estimateBattleSeconds(
  floor: number,
  turns: number,
  chronoShard = true,
  structureLevel = 0,
  skillTreeLevel = 0,
  chronoShardLevel = 0,
): number {
  const speed = effectiveDepthsBattleSpeed(floor, chronoShard, structureLevel, skillTreeLevel, chronoShardLevel)
  return Math.max(MIN_DEPTHS_BATTLE_SECONDS, attackAnimationSecondsForCount(turns, speed))
}

/** Estimate a full run using the batch's observed average turns per battle. */
export function estimateDepthClearSeconds(
  depth: number,
  averageTurnsPerBattle: number,
  chronoShard = true,
  structureLevel = 0,
  skillTreeLevel = 0,
  chronoShardLevel = 0,
): number {
  const endFloor = Math.max(0, Math.floor(Number(depth) || 0))
  const avgTurns = Math.max(0, Number(averageTurnsPerBattle) || 0)
  let seconds = 0
  for (let floor = 1; floor <= endFloor; floor++) {
    seconds += estimateBattleSeconds(floor, avgTurns, chronoShard, structureLevel, skillTreeLevel, chronoShardLevel)
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

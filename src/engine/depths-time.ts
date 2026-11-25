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
 * Ability-specific animation delays and server/network stalls are not separately modeled. UI defaults to a provisional longer-run overhead of 2.76s; the 0.36s source-calibration constant below is retained for short playback tests. Neither value is a proven server cooldown.
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
// DummyLab calibration (2026-11-22): 3,334 recorded Target Dummy fights at in-game 1x fit
// 0.37 s battle start + 0.405 s per accelerated attack unit + 0.536 s per card death
// (mean error 0.6 s). Revives and shields added no time beyond the turns they cause.
export const BASE_ATTACK_ANIMATION_SECONDS = 0.405
export const BATTLE_START_SECONDS = 0.37
export const CARD_DEATH_SECONDS = 0.536
export const MIN_DEPTHS_BATTLE_SECONDS = 0.2
// Depths recordings (2026-11-22/23, Galaxy Chrono, 7 speed setups, 2 decks):
//  deck A (base Fuxi, Zen-kai, Volcano Spirit, 2x Julius Leader; simulated ~10 turns, 5 deaths per floor): 2.9 s (3x B45-400), 2.7 s (1x B1300), 2.46 s (1x B1772),
//  2.10 s (3x B1790), 1.75 s (3x + skill tree 5.5, B2150);
//  deck B (Triceratops carry-over) kills all 4 enemies with 1 attack: 1.32 s (1x B2680), 0.84 s (3x + 5.5, B2900).
// Fit (all within ~0.05 s): floor = 0.36 s fixed + 0.087 s per extra attack unit (not sped up)
//  + (1.0 + 0.124 per attack unit + 1.52 per card death) / full stacked Battle Speed.
export const DEFAULT_DEPTHS_FLOOR_OVERHEAD_SECONDS = 0.36
export const DEPTHS_UNSCALED_SECONDS_PER_EXTRA_ATTACK = 0.087
export const DEPTHS_BATTLE_START_SECONDS = 1.0
export const DEPTHS_ATTACK_SECONDS = 0.124
export const DEPTHS_DEATH_SECONDS = 1.52
/** Cards that die on an average Depths floor when only an average turn count is known. */
export const DEPTHS_DEFAULT_DEATHS_PER_FLOOR = 4
export function normalizeDepthsFloorOverhead(seconds = DEFAULT_DEPTHS_FLOOR_OVERHEAD_SECONDS): number {
  const value = Number(seconds)
  return Number.isFinite(value) ? Math.max(0, Math.min(10, value)) : DEFAULT_DEPTHS_FLOOR_OVERHEAD_SECONDS
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
  // Retained for legacy positional callers; temporary blessings never affect sustained timing.
  _legacyBlessingMultiplier = 1,
): number {
  const selectedSpeed = Number(baseBattleSpeed)
  const base = [1, 1.5, 2, 3].includes(selectedSpeed) ? selectedSpeed : DEPTHS_BASE_BATTLE_SPEED
  return (base
    + (chronoShard ? chronoShardRelicBonus(chronoShardLevel) : 0)
    + battleSpeedStructureBonus(structureLevel)
    + battleSpeedSkillTreeBonus(skillTreeLevel)
    + depthsFloorSpeedBonus(floor))
}

/** Speed the battle animations play at: the full stacked Battle Speed (no cap; see the fit above). */
export function depthsPlaybackSpeed(
  floor: number,
  chronoShard = true,
  structureLevel = 0,
  skillTreeLevel = 0,
  chronoShardLevel = 0,
  baseBattleSpeed = DEPTHS_BASE_BATTLE_SPEED,
  blessingMultiplier = 1,
): number {
  return effectiveDepthsBattleSpeed(floor, chronoShard, structureLevel, skillTreeLevel, chronoShardLevel, baseBattleSpeed, blessingMultiplier)
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
export function attackAnimationSecondsForCount(turns: number, effectiveSpeed: number, animationScale = 1, deaths = 0): number {
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
  const dead = Math.max(0, Number(deaths) || 0)
  return (BATTLE_START_SECONDS + units * BASE_ATTACK_ANIMATION_SECONDS + dead * CARD_DEATH_SECONDS) * pace / Math.max(0.01, effectiveSpeed)
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
  deaths = 0,
): number {
  const speed = Math.max(0.1, depthsPlaybackSpeed(floor, chronoShard, structureLevel, skillTreeLevel, chronoShardLevel, baseBattleSpeed, blessingMultiplier))
  const units = acceleratedAttackUnits(turns)
  const pace = Math.max(0.1, Math.min(5, Number(animationScale) || 1))
  const dead = Math.max(0, Number(deaths) || 0)
  return normalizeDepthsFloorOverhead(floorOverheadSeconds)
    + DEPTHS_UNSCALED_SECONDS_PER_EXTRA_ATTACK * Math.max(0, units - 1)
    + Math.max(MIN_DEPTHS_BATTLE_SECONDS, (DEPTHS_BATTLE_START_SECONDS + DEPTHS_ATTACK_SECONDS * units + DEPTHS_DEATH_SECONDS * dead) * pace / speed)
}

/** Attack count after the 10/20/40/60-attack in-battle acceleration (O(1) for huge counts). */
export function acceleratedAttackUnits(turns: number): number {
  const count = Math.max(0, Number(turns) || 0)
  const segments: readonly [number, number, number][] = [[0, 9, 1], [9, 19, 2], [19, 39, 3], [39, 59, 5], [59, Infinity, 10]]
  let units = 0
  for (const [start, end, multiplier] of segments) units += Math.max(0, Math.min(count, end) - start) / multiplier
  return units
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
    seconds += estimateBattleSeconds(floor, avgTurns, chronoShard, structureLevel, skillTreeLevel, chronoShardLevel, floorOverheadSeconds, baseBattleSpeed, blessingMultiplier, animationScale, DEPTHS_DEFAULT_DEATHS_PER_FLOOR)
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

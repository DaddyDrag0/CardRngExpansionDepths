import type { BattleDebug, BattleResult, TeamLoadout } from '../types'
import { simulateBattleV2 } from './battle-v2'
import { SeededRng } from './rng'
import { buildTowerEnemies, type TowerBatchResult, type TowerDifficulty } from './tower'

export interface TowerWinningRunSummary {
  /** 1-based position inside the requested simulation batch. */
  run: number
  seed: number
  turns: number
  patternId: number
  survivingAllies: string[]
  fallenAllies: string[]
}

export interface TowerWinningReplay {
  run: number
  seed: number
  winner: BattleResult['winner']
  turns: number
  trusted: boolean
  unsupportedAbilities: string[]
  debug: BattleDebug
}

export interface LoggedTowerBatchResult extends TowerBatchResult {
  /**
   * Every winning run in the batch, stored as a compact summary only.
   * Full BattleDebug data is generated later, for one exact seed at a time, when the user opens it.
   */
  winningRuns: TowerWinningRunSummary[]
  winningPatternCount: number
}

interface WinPattern {
  id: number
  count: number
}

function winPatternSignature(battle: BattleResult): {
  signature: string
  survivingAllies: string[]
  fallenAllies: string[]
} {
  const survivingAllies = battle.state.teams.Allies.map((card) => card.definition.name)
  const fallenAllies = battle.state.fallen.Allies.map((card) => card.definition.name)
  const survivorState = battle.state.teams.Allies.map((card) => {
    const hpBucket = card.maxHp > 0
      ? Math.max(0, Math.min(10, Math.round((card.hp / card.maxHp) * 10)))
      : 0
    return `${card.definition.name}:${hpBucket}`
  })
  return {
    signature: `${battle.turns}|alive:${survivorState.join('>')}|fallen:${fallenAllies.join('>')}`,
    survivingAllies,
    fallenAllies,
  }
}

/**
 * Run the normal Tower batch while keeping a tiny summary for EVERY win.
 *
 * This intentionally does NOT capture BattleDebug inside the batch loop. A 10,000-run test therefore
 * still performs 10,000 normal battles rather than generating thousands of giant logs. Each winning
 * seed can be replayed later with replayTowerWinningRun() when the user actually opens that battle.
 */
export function simulateTowerBatchLogged(
  loadout: TeamLoadout,
  enemyNames: string[],
  floor: number,
  difficulty: TowerDifficulty,
  runs = 1_000,
  seed = 1,
  onProgress?: (completed: number, total: number) => void,
): LoggedTowerBatchResult {
  const total = Math.min(10_000, Math.max(1, Math.floor(runs)))
  const enemies = buildTowerEnemies(enemyNames, floor, difficulty)
  const seedRng = new SeededRng(seed || 1)
  const unsupported = new Set<string>()
  const patterns = new Map<string, WinPattern>()
  const winningRuns: TowerWinningRunSummary[] = []
  let wins = 0
  let losses = 0
  let draws = 0
  let totalTurns = 0
  let minTurns = Number.POSITIVE_INFINITY
  let maxTurns = 0

  for (let index = 0; index < total; index++) {
    const battleSeed = Math.floor(seedRng.next() * 0x7fffffff) || index + 1
    const battle = simulateBattleV2(loadout, enemies, battleSeed, 2_000, true, false)

    if (battle.winner === 'Allies') {
      wins += 1
      const outcome = winPatternSignature(battle)
      let pattern = patterns.get(outcome.signature)
      if (!pattern) {
        pattern = { id: patterns.size + 1, count: 0 }
        patterns.set(outcome.signature, pattern)
      }
      pattern.count += 1
      winningRuns.push({
        run: index + 1,
        seed: battleSeed,
        turns: battle.turns,
        patternId: pattern.id,
        survivingAllies: outcome.survivingAllies,
        fallenAllies: outcome.fallenAllies,
      })
    } else if (battle.winner === 'Enemies') losses += 1
    else draws += 1

    totalTurns += battle.turns
    minTurns = Math.min(minTurns, battle.turns)
    maxTurns = Math.max(maxTurns, battle.turns)
    for (const ability of battle.unsupportedAbilities) unsupported.add(ability)
    if (onProgress && (index === total - 1 || (index + 1) % 25 === 0)) onProgress(index + 1, total)
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
    winningRuns,
    winningPatternCount: patterns.size,
  }
}

/** Replay one exact batch seed with full debug capture. This work only happens when that battle is opened. */
export function replayTowerWinningRun(
  loadout: TeamLoadout,
  enemyNames: string[],
  floor: number,
  difficulty: TowerDifficulty,
  battleSeed: number,
  run = 0,
): TowerWinningReplay {
  const enemies = buildTowerEnemies(enemyNames, floor, difficulty)
  const battle = simulateBattleV2(loadout, enemies, battleSeed, 2_000, true, true)
  if (!battle.debug) throw new Error('Tower replay did not produce battle debug data.')
  return {
    run,
    seed: battleSeed,
    winner: battle.winner,
    turns: battle.turns,
    trusted: battle.trusted,
    unsupportedAbilities: battle.unsupportedAbilities,
    debug: battle.debug,
  }
}

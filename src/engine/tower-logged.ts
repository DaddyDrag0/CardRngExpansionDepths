import type { BattleDebug, BattleResult, TeamLoadout } from '../types'
import { simulateBattleV2 } from './battle-v2'
import { SeededRng } from './rng'
import { buildTowerEnemies, type TowerBatchResult, type TowerDifficulty } from './tower'

export const MAX_TOWER_WIN_LOGS = 8
export const MAX_TOWER_LOG_EVENTS = 2_000

export interface TowerWinningLog {
  seed: number
  turns: number
  occurrences: number
  signature: string
  survivingAllies: string[]
  fallenAllies: string[]
  eventCount: number
  eventsTruncated: boolean
  debug: BattleDebug
}

export interface LoggedTowerBatchResult extends TowerBatchResult {
  winningLogs: TowerWinningLog[]
  winningPatternCount: number
  winningLogsTruncated: boolean
}

interface WinPattern {
  count: number
  seed: number
  turns: number
  signature: string
  survivingAllies: string[]
  fallenAllies: string[]
}

function winPattern(battle: BattleResult): Omit<WinPattern, 'count' | 'seed' | 'turns'> {
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

function trimDebug(debug: BattleDebug): { debug: BattleDebug; eventCount: number; eventsTruncated: boolean } {
  const eventCount = debug.events.length
  if (eventCount <= MAX_TOWER_LOG_EVENTS) return { debug, eventCount, eventsTruncated: false }

  const half = Math.floor(MAX_TOWER_LOG_EVENTS / 2)
  return {
    debug: {
      ...debug,
      events: [...debug.events.slice(0, half), ...debug.events.slice(-half)],
    },
    eventCount,
    eventsTruncated: true,
  }
}

function chooseRepresentativePatterns(patterns: WinPattern[]): WinPattern[] {
  const byFrequency = [...patterns].sort(
    (a, b) => b.count - a.count || a.turns - b.turns || a.signature.localeCompare(b.signature),
  )
  const selected = byFrequency.slice(0, Math.min(6, MAX_TOWER_WIN_LOGS))

  if (patterns.length) {
    const fastest = [...patterns].sort((a, b) => a.turns - b.turns || b.count - a.count)[0]
    const slowest = [...patterns].sort((a, b) => b.turns - a.turns || b.count - a.count)[0]
    for (const edge of [fastest, slowest]) {
      if (selected.length >= MAX_TOWER_WIN_LOGS) break
      if (edge && !selected.some((entry) => entry.signature === edge.signature)) selected.push(edge)
    }
  }

  for (const entry of byFrequency) {
    if (selected.length >= MAX_TOWER_WIN_LOGS) break
    if (!selected.some((item) => item.signature === entry.signature)) selected.push(entry)
  }
  return selected
}

/**
 * Tower batch simulation with selective winning-run diagnostics.
 *
 * The main batch still runs with captureDebug=false. Winning outcomes are grouped using a
 * cheap signature. Only up to MAX_TOWER_WIN_LOGS representative winning seeds are replayed
 * after the batch with captureDebug=true, so a 10,000-run cheese test never creates 10,000
 * full debug logs.
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
      const pattern = winPattern(battle)
      const existing = patterns.get(pattern.signature)
      if (existing) existing.count += 1
      else {
        patterns.set(pattern.signature, {
          ...pattern,
          count: 1,
          seed: battleSeed,
          turns: battle.turns,
        })
      }
    } else if (battle.winner === 'Enemies') losses += 1
    else draws += 1

    totalTurns += battle.turns
    minTurns = Math.min(minTurns, battle.turns)
    maxTurns = Math.max(maxTurns, battle.turns)
    for (const ability of battle.unsupportedAbilities) unsupported.add(ability)
    if (onProgress && (index === total - 1 || (index + 1) % 25 === 0)) onProgress(index + 1, total)
  }

  const patternList = [...patterns.values()]
  const selected = chooseRepresentativePatterns(patternList)
  const winningLogs: TowerWinningLog[] = []

  for (const entry of selected) {
    const replay = simulateBattleV2(loadout, enemies, entry.seed, 2_000, true, true)
    if (replay.winner !== 'Allies' || !replay.debug) continue
    const trimmed = trimDebug(replay.debug)
    winningLogs.push({
      seed: entry.seed,
      turns: entry.turns,
      occurrences: entry.count,
      signature: entry.signature,
      survivingAllies: entry.survivingAllies,
      fallenAllies: entry.fallenAllies,
      eventCount: trimmed.eventCount,
      eventsTruncated: trimmed.eventsTruncated,
      debug: trimmed.debug,
    })
  }

  winningLogs.sort(
    (a, b) => b.occurrences - a.occurrences || a.turns - b.turns || a.signature.localeCompare(b.signature),
  )

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
    winningLogs,
    winningPatternCount: patternList.length,
    winningLogsTruncated: patternList.length > winningLogs.length,
  }
}

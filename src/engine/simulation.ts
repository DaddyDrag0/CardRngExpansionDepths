import type { BattleDebug, TeamLoadout } from '../types'
import { generateDepthsTeam } from './depths'
import { SeededRng } from './rng'
import { simulateBattleV2 } from './battle-v2'

export interface DepthsRunResult {
  deathFloor: number
  floorsCleared: number
  battles: number
  totalTurns: number
  endingEnemies: string[]
  trusted: boolean
  unsupportedAbilities: string[]
  runSeed: number
  floorSeed?: number
  battleSeed?: number
  debug?: BattleDebug
}

export interface DepthsBatchResult {
  runs: DepthsRunResult[]
  averageFloor: number
  medianFloor: number
  minFloor: number
  maxFloor: number
  trusted: boolean
  unsupportedAbilities: string[]
}

export interface DepthsSimulationOptions {
  startFloor?: number
  floorCap?: number
  seed?: number
  battleTurnCap?: number
}

export interface DepthsBatchOptions extends DepthsSimulationOptions {
  runs?: number
}

export type DepthsProgressCallback = (floor: number) => void

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
  const floorCap = Math.max(startFloor, Math.floor(options.floorCap ?? 50_000))
  const runSeed = options.seed ?? 1
  const unsupported = new Set<string>()
  let totalTurns = 0
  let battles = 0

  for (let floor = startFloor; floor <= floorCap; floor++) {
    onProgress?.(floor)
    const floorSeed = mixSeed(runSeed, floor)
    const enemies = generateDepthsTeam(floor, floorSeed)
    const hasTurnCap = Number.isFinite(options.battleTurnCap)
    const maxTurns = hasTurnCap ? Math.max(1, Math.floor(options.battleTurnCap as number)) : Number.POSITIVE_INFINITY
    const battle = simulateBattleV2(loadout, enemies, floorSeed ^ 0x51ed270b, maxTurns, hasTurnCap)
    battles += 1
    totalTurns += battle.turns
    for (const ability of battle.unsupportedAbilities) unsupported.add(ability)

    if (battle.winner !== 'Allies') {
      onProgress?.(floor)
      return {
        deathFloor: floor,
        floorsCleared: floor - startFloor,
        battles,
        totalTurns,
        endingEnemies: enemies.map((enemy) => enemy.card.name),
        trusted: unsupported.size === 0,
        unsupportedAbilities: [...unsupported].sort(),
        runSeed,
        floorSeed,
        battleSeed: floorSeed ^ 0x51ed270b,
        debug: battle.debug,
      }
    }
  }

  onProgress?.(floorCap)
  return {
    deathFloor: floorCap + 1,
    floorsCleared: floorCap - startFloor + 1,
    battles,
    totalTurns,
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
    })
    results.push(result)
    for (const ability of result.unsupportedAbilities) unsupported.add(ability)
  }

  const floors = results.map((result) => result.deathFloor).sort((a, b) => a - b)
  const middle = Math.floor(floors.length / 2)
  const medianFloor = floors.length % 2
    ? floors[middle]
    : (floors[middle - 1] + floors[middle]) / 2

  return {
    runs: results,
    averageFloor: floors.reduce((sum, floor) => sum + floor, 0) / floors.length,
    medianFloor,
    minFloor: floors[0],
    maxFloor: floors[floors.length - 1],
    trusted: unsupported.size === 0,
    unsupportedAbilities: [...unsupported].sort(),
  }
}

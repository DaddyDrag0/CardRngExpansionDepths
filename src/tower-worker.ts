/// <reference lib="webworker" />

import { searchTowerCheese, searchTowerCheeseIntensive, type TowerCheeseSearchProgress, type TowerDifficulty } from './engine/tower'
import { replayTowerWinningRun, simulateTowerBatchLogged } from './engine/tower-logged'
import type { TeamLoadout } from './types'

interface TowerSimulationRequest {
  id: number
  kind: 'tower-batch'
  loadout: TeamLoadout
  enemyNames: string[]
  floor: number
  difficulty: TowerDifficulty
  runs: number
  seed: number
}

interface TowerWinDebugRequest {
  id: number
  kind: 'tower-win-debug'
  loadout: TeamLoadout
  enemyNames: string[]
  floor: number
  difficulty: TowerDifficulty
  seed: number
  run: number
}

interface TowerCheeseSearchRequest {
  id: number
  kind: 'tower-cheese-search'
  enemyNames: string[]
  floor: number
  difficulty: TowerDifficulty
  seed: number
  intensive?: boolean
  excludedCards?: string[]
  addedCards?: string[]
  hasEndTimes?: boolean
  shardIndex?: number
  shardCount?: number
}

type TowerRequest = TowerSimulationRequest | TowerWinDebugRequest | TowerCheeseSearchRequest

self.onmessage = (event: MessageEvent<TowerRequest>) => {
  const request = event.data
  const started = performance.now()
  try {
    if (request.kind === 'tower-cheese-search') {
      const progress = (update: TowerCheeseSearchProgress) =>
        self.postMessage({ kind: 'tower-cheese-progress', id: request.id, ...update })
      const poolOptions = { excludedCards: request.excludedCards || [], addedCards: request.addedCards || [], hasEndTimes: request.hasEndTimes !== false }
      const result = request.intensive
        ? searchTowerCheeseIntensive(
            request.enemyNames, request.floor, request.difficulty, request.seed, progress,
            { ...poolOptions, shardIndex: request.shardIndex, shardCount: request.shardCount },
          )
        : searchTowerCheese(request.enemyNames, request.floor, request.difficulty, request.seed, progress, poolOptions)
      self.postMessage({
        id: request.id,
        kind: 'tower-cheese-result',
        ok: true,
        elapsedMs: performance.now() - started,
        result,
      })
      return
    }

    if (request.kind === 'tower-win-debug') {
      const result = replayTowerWinningRun(
        request.loadout,
        request.enemyNames,
        request.floor,
        request.difficulty,
        request.seed,
        request.run,
      )
      self.postMessage({
        id: request.id,
        kind: 'tower-win-debug-result',
        ok: true,
        elapsedMs: performance.now() - started,
        result,
      })
      return
    }

    const result = simulateTowerBatchLogged(
      request.loadout,
      request.enemyNames,
      request.floor,
      request.difficulty,
      request.runs,
      request.seed,
      (completed, total) => {
        self.postMessage({ kind: 'tower-progress', id: request.id, completed, total })
      },
    )
    self.postMessage({
      id: request.id,
      kind: 'tower-result',
      ok: true,
      elapsedMs: performance.now() - started,
      result,
    })
  } catch (error) {
    const kind = request.kind === 'tower-cheese-search'
      ? 'tower-cheese-result'
      : request.kind === 'tower-win-debug'
        ? 'tower-win-debug-result'
        : 'tower-result'
    self.postMessage({
      id: request.id,
      kind,
      ok: false,
      elapsedMs: performance.now() - started,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

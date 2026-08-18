/// <reference lib="webworker" />

import { searchTowerCheese, simulateTowerBatch, type TowerDifficulty } from './engine/tower'
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

interface TowerCheeseSearchRequest {
  id: number
  kind: 'tower-cheese-search'
  enemyNames: string[]
  floor: number
  difficulty: TowerDifficulty
  seed: number
}

type TowerRequest = TowerSimulationRequest | TowerCheeseSearchRequest

self.onmessage = (event: MessageEvent<TowerRequest>) => {
  const request = event.data
  const started = performance.now()
  try {
    if (request.kind === 'tower-cheese-search') {
      const result = searchTowerCheese(
        request.enemyNames,
        request.floor,
        request.difficulty,
        request.seed,
        (progress) => self.postMessage({ kind: 'tower-cheese-progress', id: request.id, ...progress }),
      )
      self.postMessage({
        id: request.id,
        kind: 'tower-cheese-result',
        ok: true,
        elapsedMs: performance.now() - started,
        result,
      })
      return
    }

    const result = simulateTowerBatch(
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
    self.postMessage({
      id: request.id,
      kind: request.kind === 'tower-cheese-search' ? 'tower-cheese-result' : 'tower-result',
      ok: false,
      elapsedMs: performance.now() - started,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

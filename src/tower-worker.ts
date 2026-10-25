/// <reference lib="webworker" />

import { searchTowerCheese, searchTowerCheeseIntensive, type TowerCheeseSearchProgress, type TowerDifficulty } from './engine/tower'
import { replayTowerWinningRun, simulateTowerBatchLogged } from './engine/tower-logged'
import type { TeamLoadout, BorderName } from './types'
import { halloweenStage, simulateHalloweenTower, searchHalloweenTower } from './engine/halloween-tower'

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
  hasGuardianAngel?: boolean
  shardIndex?: number
  shardCount?: number
}

interface HalloweenTowerRequest {
  id: number
  kind: 'halloween-stage' | 'halloween-sim' | 'halloween-search'
  floor: number
  seed: number
  enemyNames?: string[]
  loadout?: TeamLoadout
  current?: TeamLoadout
  runs?: number
  pool?: string[]
  borders?: BorderName[]
  extraBans?: string[]
}

type TowerRequest = TowerSimulationRequest | TowerWinDebugRequest | TowerCheeseSearchRequest | HalloweenTowerRequest

self.onmessage = (event: MessageEvent<TowerRequest>) => {
  const request = event.data
  const started = performance.now()
  try {
    if (request.kind === 'halloween-stage') {
      self.postMessage({kind:'halloween-stage-result',id:request.id,ok:true,
        result:{enemies:halloweenStage(request.floor,request.seed)}})
      return
    }
    if (request.kind === 'halloween-sim') {
      if (!request.loadout || !request.enemyNames) throw new Error('Halloween loadout and opponents required')
      const result=simulateHalloweenTower(request.loadout,request.enemyNames,request.floor,request.runs||100,
        request.seed,request.extraBans||[],(done,total)=>{
          self.postMessage({kind:'halloween-progress',id:request.id,done,total})
        })
      self.postMessage({kind:'halloween-result',id:request.id,ok:true,elapsedMs:performance.now()-started,result})
      return
    }
    if (request.kind === 'halloween-search') {
      if (!request.enemyNames) throw new Error('Halloween opponents required')
      const result=searchHalloweenTower(request.enemyNames,request.floor,request.seed,{
        pool:request.pool,borders:request.borders,extraBans:request.extraBans,current:request.current,
      },(done,total)=>{
        self.postMessage({kind:'halloween-progress',id:request.id,done,total})
      })
      self.postMessage({kind:'halloween-result',id:request.id,ok:true,elapsedMs:performance.now()-started,result})
      return
    }
    if (request.kind === 'tower-cheese-search') {
      const progress = (update: TowerCheeseSearchProgress) =>
        self.postMessage({ kind: 'tower-cheese-progress', id: request.id, ...update })
      const poolOptions = {
        excludedCards: request.excludedCards || [],
        addedCards: request.addedCards || [],
        hasEndTimes: request.hasEndTimes !== false,
        hasGuardianAngel: request.hasGuardianAngel !== false,
      }
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

    const batch = request as TowerSimulationRequest
    const result = simulateTowerBatchLogged(
      batch.loadout,
      batch.enemyNames,
      batch.floor,
      batch.difficulty,
      batch.runs,
      batch.seed,
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
    const kind = request.kind.startsWith('halloween-') ? (request.kind === 'halloween-stage' ? 'halloween-stage-result' : 'halloween-result')
      : request.kind === 'tower-cheese-search'
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

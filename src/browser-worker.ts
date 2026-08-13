/// <reference lib="webworker" />

import { simulateDepthsRun, type DepthsRunResult } from './engine/simulation'
import { SeededRng } from './engine/rng'
import type { TeamLoadout } from './types'

interface BatchRequest {
  kind?: 'batch'
  id: number
  loadout: TeamLoadout
  runs: number
  floorCap: number
  seed: number
  browserTurnCap?: number
}

interface SingleRunRequest {
  kind: 'single-run'
  id: number
  loadout: TeamLoadout
  floorCap: number
  batchSeed: number
  runIndex: number
  browserTurnCap: number
}

type SimulationRequest = BatchRequest | SingleRunRequest

function runSeed(batchSeed: number, runIndex: number): number {
  const rng = new SeededRng(batchSeed)
  let seed = 1
  for (let index = 0; index <= runIndex; index++) {
    seed = Math.floor(rng.next() * 0x7fffffff) || index + 1
  }
  return seed
}

function summarize(results: DepthsRunResult[]) {
  const unsupported = new Set<string>()
  for (const result of results) {
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

function simulateOne(request: SingleRunRequest): DepthsRunResult {
  return simulateDepthsRun(request.loadout, {
    floorCap: request.floorCap,
    seed: runSeed(request.batchSeed, request.runIndex),
    battleTurnCap: request.browserTurnCap,
  })
}

async function simulateParallel(request: BatchRequest): Promise<DepthsRunResult[]> {
  const runs = Math.max(1, Math.floor(request.runs))
  const browserTurnCap = Math.max(1, Math.floor(request.browserTurnCap ?? 10_000))
  const hardware = Math.max(1, Number(self.navigator.hardwareConcurrency) || 4)
  const workerCount = Math.min(runs, Math.max(1, Math.min(8, hardware - 1 || 1)))

  if (workerCount <= 1 || runs === 1) {
    return Array.from({ length: runs }, (_, runIndex) => simulateOne({
      kind: 'single-run',
      id: request.id,
      loadout: request.loadout,
      floorCap: request.floorCap,
      batchSeed: request.seed,
      runIndex,
      browserTurnCap,
    }))
  }

  const results = new Array<DepthsRunResult>(runs)
  const workers: Worker[] = []
  let nextRun = 0
  let completed = 0
  let settled = false

  return new Promise((resolve, reject) => {
    const stopAll = () => {
      for (const worker of workers) worker.terminate()
    }

    const finishIfDone = () => {
      if (!settled && completed === runs) {
        settled = true
        stopAll()
        resolve(results)
      }
    }

    const dispatch = (worker: Worker) => {
      if (settled) return
      if (nextRun >= runs) {
        finishIfDone()
        return
      }

      const runIndex = nextRun++
      worker.onmessage = (event: MessageEvent) => {
        const message = event.data
        if (!message?.ok) {
          if (!settled) {
            settled = true
            stopAll()
            reject(new Error(message?.error || 'Parallel simulation worker failed'))
          }
          return
        }
        results[runIndex] = message.result
        completed += 1
        dispatch(worker)
        finishIfDone()
      }
      worker.onerror = (event) => {
        if (!settled) {
          settled = true
          stopAll()
          reject(new Error(event.message || 'Parallel simulation worker failed'))
        }
      }
      worker.postMessage({
        kind: 'single-run',
        id: request.id,
        loadout: request.loadout,
        floorCap: request.floorCap,
        batchSeed: request.seed,
        runIndex,
        browserTurnCap,
      } satisfies SingleRunRequest)
    }

    try {
      for (let index = 0; index < workerCount; index++) {
        const worker = new Worker(self.location.href)
        workers.push(worker)
        dispatch(worker)
      }
    } catch (error) {
      stopAll()
      settled = true
      reject(error)
    }
  })
}

self.onmessage = async (event: MessageEvent<SimulationRequest>) => {
  const request = event.data
  const started = performance.now()

  try {
    if (request.kind === 'single-run') {
      self.postMessage({
        id: request.id,
        ok: true,
        elapsedMs: performance.now() - started,
        result: simulateOne(request),
      })
      return
    }

    const results = await simulateParallel(request)
    self.postMessage({
      id: request.id,
      ok: true,
      elapsedMs: performance.now() - started,
      result: summarize(results),
    })
  } catch (error) {
    self.postMessage({
      id: request.id,
      ok: false,
      elapsedMs: performance.now() - started,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

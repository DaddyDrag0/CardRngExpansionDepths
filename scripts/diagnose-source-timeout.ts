import { simulateDepthsBatch } from '../src/engine/simulation'
import type { TeamLoadout } from '../src/types'

const loadout: TeamLoadout = {
  cards: [
    { cardName: 'Fuxi', borders: [] },
    { cardName: 'Shuten-dōji', borders: ['Platinum', 'Galaxy'] },
    { cardName: 'Chronus The Hoarder', borders: ['Platinum', 'Crystal', 'Galaxy'] },
    { cardName: 'Malik The Sovereign', borders: ['Platinum', 'Crystal', 'Galaxy'] },
  ],
  statAura: { auraName: 'Desmond Of Despair', border: 'Galaxy' },
  abilityAura: { auraName: 'Berserker', border: 'Galaxy' },
}

const result = simulateDepthsBatch(loadout, {
  runs: 20,
  startFloor: 1,
  floorCap: 16000,
  seed: 0x51a7cafe,
  battleTurnCap: 1000,
})
console.log(JSON.stringify({
  average: Number(result.averageFloor.toFixed(1)), median: result.medianFloor,
  low: result.minFloor, high: result.maxFloor,
  floors: result.runs.map((r) => r.deathFloor),
  turnCaps: result.runs.filter((r) => r.turnLimitReached).length,
}))

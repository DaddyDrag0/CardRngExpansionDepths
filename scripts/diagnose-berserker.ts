import { simulateDepthsBatch } from '../src/engine/simulation'
import type { AuraBorderName, TeamLoadout } from '../src/types'

const cards: TeamLoadout['cards'] = [
  { cardName: 'Fuxi', borders: [] },
  { cardName: 'Shuten-dōji', borders: ['Platinum', 'Galaxy'] },
  { cardName: 'Chronus The Hoarder', borders: ['Platinum', 'Crystal', 'Galaxy'] },
  { cardName: 'Malik The Sovereign', borders: ['Platinum', 'Crystal', 'Galaxy'] },
]

const variants: Array<{ label: string; border?: AuraBorderName; noAura?: boolean; statBorder?: AuraBorderName }> = [
  { label: 'Berserker Galaxy 20%', border: 'Galaxy' },
  { label: 'Berserker Crystal 15%', border: 'Crystal' },
  { label: 'Berserker Platinum 10%', border: 'Platinum' },
  { label: 'Berserker Base 5%' },
  { label: 'No ability aura', noAura: true },
  { label: 'Desmond Crystal + Berserker Galaxy', border: 'Galaxy', statBorder: 'Crystal' },
]

for (const variant of variants) {
  const loadout: TeamLoadout = {
    cards,
    statAura: { auraName: 'Desmond Of Despair', border: variant.statBorder ?? 'Galaxy' },
    abilityAura: variant.noAura ? null : { auraName: 'Berserker', border: variant.border ?? null },
  }
  const result = simulateDepthsBatch(loadout, {
    runs: 20,
    startFloor: 9000,
    floorCap: 16000,
    seed: 0x51a7cafe,
    battleTurnCap: 10000,
  })
  const floors = result.runs.map((r) => r.deathFloor)
  console.log(JSON.stringify({
    label: variant.label,
    average: Number(result.averageFloor.toFixed(1)),
    median: result.medianFloor,
    low: result.minFloor,
    high: result.maxFloor,
    floors,
  }))
}

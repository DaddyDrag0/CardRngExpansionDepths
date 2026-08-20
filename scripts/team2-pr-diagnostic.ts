import { simulateDepthsBatch } from '../src/engine/simulation'
import type { TeamLoadout } from '../src/types'

const loadout: TeamLoadout = {
  cards: [
    { cardName: 'Fuxi', borders: [] },
    { cardName: 'Cosmic Pop Star', borders: ['Platinum'] },
    { cardName: 'Meteosaurus', borders: ['Platinum', 'Galaxy'] },
    { cardName: 'Priest', borders: ['Platinum', 'Galaxy'] },
  ],
  statAura: { auraName: 'Yggdrasil', border: 'Galaxy' },
  abilityAura: { auraName: 'Vampire Matron', border: 'Galaxy' },
}
const bannedCardNames = ['Surt','Yamato no Orochi','Poison Witch','Piccolo','Mastermind','Cosmic Pop Star']
const result = simulateDepthsBatch(loadout, {
  runs: 100,
  startFloor: 1,
  floorCap: 12000,
  seed: 0x26082026,
  battleTurnCap: 10000,
  bannedCardNames,
  battleSpeedStructureLevel: 7,
})
const floors = result.runs.map(r => r.deathFloor).sort((a,b)=>a-b)
const q = (p:number) => {
  const x=(floors.length-1)*p, lo=Math.floor(x), hi=Math.ceil(x)
  return lo===hi?floors[lo]:floors[lo]+(floors[hi]-floors[lo])*(x-lo)
}
const enemyCounts: Record<string,number> = {}
for (const run of result.runs) for (const name of run.endingEnemies) enemyCounts[name]=(enemyCounts[name]||0)+1
console.log('TEAM2_DIAGNOSTIC', JSON.stringify({
  min:floors[0], p01:q(.01), p05:q(.05), p10:q(.10), p25:q(.25), median:q(.5), p75:q(.75), p90:q(.9), p95:q(.95), max:floors.at(-1), average:result.averageFloor,
  below4900:floors.filter(f=>f<4900).length,
  below5200:floors.filter(f=>f<5200).length,
  below5500:floors.filter(f=>f<5500).length,
  below5800:floors.filter(f=>f<5800).length,
  estimatedLow:result.estimatedFloorLow,
  estimatedHigh:result.estimatedFloorHigh,
  topEnemies:Object.entries(enemyCounts).sort((a,b)=>b[1]-a[1]).slice(0,15),
  lowest:result.runs.sort((a,b)=>a.deathFloor-b.deathFloor).slice(0,10).map(r=>({floor:r.deathFloor,enemies:r.endingEnemies,unsupported:r.unsupportedAbilities}))
}))

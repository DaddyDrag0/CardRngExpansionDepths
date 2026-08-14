import { generateDepthsTeam } from '../src/engine/depths'
import { SeededRng } from '../src/engine/rng'
import { simulateBattleV2 } from '../src/engine/battle-v2'
import type { TeamLoadout } from '../src/types'

const loadout: TeamLoadout = {
  cards: [
    { cardName: 'Priest', borders: ['Platinum', 'Galaxy'] },
    { cardName: 'Fuxi', borders: ['Platinum'] },
    { cardName: "Hell's Army", borders: ['Platinum', 'Ruby'] },
    { cardName: 'Parallax', borders: ['Platinum'] },
  ],
  statAura: { auraName: 'Elohim', border: 'Galaxy' },
  abilityAura: { auraName: 'Synth Human', border: 'Galaxy' },
}

function mixSeed(runSeed: number, floor: number): number {
  let x = (runSeed ^ Math.imul(floor, 0x9e3779b1)) >>> 0
  x ^= x >>> 16
  x = Math.imul(x, 0x85ebca6b) >>> 0
  x ^= x >>> 13
  x = Math.imul(x, 0xc2b2ae35) >>> 0
  return (x ^ (x >>> 16)) >>> 0
}

const batchSeeds = [1, 7, 12345, 987654321, 1682432732, 0x6d2b79f5]
const runSeeds: number[] = []
for (const batchSeed of batchSeeds) {
  const rng = new SeededRng(batchSeed)
  for (let i = 0; i < 8; i++) runSeeds.push(Math.floor(rng.next() * 0x7fffffff) || i + 1)
}

let maxTurns = 0
let maxInfo = ''
let capped = 0
let over500 = 0
let over1000 = 0
let battles = 0
const start = performance.now()

for (let r = 0; r < runSeeds.length; r++) {
  const runSeed = runSeeds[r]
  for (let floor = 12_900; floor <= 13_500; floor++) {
    const floorSeed = mixSeed(runSeed, floor)
    const enemies = generateDepthsTeam(floor, floorSeed)
    const battle = simulateBattleV2(loadout, enemies, floorSeed ^ 0x51ed270b, 5_000, true)
    battles++
    if (battle.turns > maxTurns) {
      maxTurns = battle.turns
      maxInfo = `runSeed=${runSeed} floor=${floor} turns=${battle.turns} winner=${battle.winner} enemies=${enemies.map(e => e.card.name).join(' | ')}`
    }
    if (battle.turns >= 500) over500++
    if (battle.turns >= 1000) over1000++
    if (battle.unsupportedAbilities.includes('Battle turn cap reached')) {
      capped++
      console.log(`CAP runSeed=${runSeed} floor=${floor} enemies=${enemies.map(e => e.card.name).join(' | ')}`)
      // Stop early once we prove a real cyclic battle exists.
      if (capped >= 3) break
    }
  }
  if (capped >= 3) break
}

const elapsed = performance.now() - start
console.log(JSON.stringify({ battles, elapsedMs: Math.round(elapsed), maxTurns, maxInfo, over500, over1000, capped }, null, 2))

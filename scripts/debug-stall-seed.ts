import { generateDepthsTeam } from '../src/engine/depths'

function mixSeed(runSeed: number, floor: number): number {
  let x = (runSeed ^ Math.imul(floor, 0x9e3779b1)) >>> 0
  x ^= x >>> 16
  x = Math.imul(x, 0x85ebca6b) >>> 0
  x ^= x >>> 13
  x = Math.imul(x, 0xc2b2ae35) >>> 0
  return (x ^ (x >>> 16)) >>> 0
}

const runSeed = 983450096
const floor = 97
const floorSeed = mixSeed(runSeed, floor)
const enemies = generateDepthsTeam(floor, floorSeed)
console.log(JSON.stringify({ runSeed, floor, floorSeed, enemies: enemies.map((enemy) => ({ name: enemy.card.name, ability: enemy.card.ability })) }, null, 2))

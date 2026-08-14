import { simulateBattleV2 } from '../src/engine/battle-v2'
import { generateDepthsTeam } from '../src/engine/depths'
import type { TeamLoadout } from '../src/types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

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
const enemyNames = enemies.map((enemy) => enemy.card.name)

assert(
  JSON.stringify(enemyNames) === JSON.stringify(['Anubis', 'Darling', 'Anubis', 'ToadBoiGaming']),
  `Reproduced floor changed: ${enemyNames.join(' | ')}`,
)

const regressionLoadout: TeamLoadout = {
  cards: ['Behemoth', 'Tyrannodon', 'Surtr', 'Kraken'].map((cardName) => ({
    cardName,
    borders: ['Galaxy'],
  })),
}

const battle = simulateBattleV2(
  regressionLoadout,
  enemies,
  floorSeed ^ 0x51ed270b,
  5_000,
  true,
)

assert(battle.winner === 'Allies', `Duplicate-Anubis regression did not resolve as an ally win: ${battle.winner}`)
assert(!battle.unsupportedAbilities.includes('Battle turn cap reached'), 'Duplicate-Anubis regression hit the emergency turn cap')
assert(battle.turns < 1_000, `Duplicate-Anubis regression still took too long: ${battle.turns} turns`)

console.log(JSON.stringify({
  runSeed,
  floor,
  floorSeed,
  enemies: enemies.map((enemy) => ({ name: enemy.card.name, ability: enemy.card.ability })),
  result: { winner: battle.winner, turns: battle.turns },
}, null, 2))

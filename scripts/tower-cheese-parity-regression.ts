import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  evaluateTowerCheeseLoadout,
  simulateTowerBatch,
  type TowerDifficulty,
} from '../src/engine/tower'
import { simulateTowerBatchLogged } from '../src/engine/tower-logged'
import type { TeamLoadout } from '../src/types'

// Each Cheese Maker candidate must match the actual 10k-capable Tower simulator
// on the SAME battle seeds; quick/deep search uses exact combat, not a proxy model.
const loadout = (names: string[], auraName: string | null = null): TeamLoadout => ({
  cards: names.map((cardName) => ({ cardName, borders: [] })),
  statAura: null,
  abilityAura: auraName ? { auraName, border: null } : null,
})
const scenarios: Array<{
  label: string
  team: TeamLoadout
  enemies: string[]
  floor: number
  difficulty: TowerDifficulty
  runs: number
  seed: number
}> = [
  {
    label: 'easy deterministic sweep',
    team: loadout(['Behemoth', 'Behemoth', 'Behemoth', 'Behemoth']),
    enemies: ['Baby Skeleton', 'Baby Skeleton', 'Baby Skeleton', 'Baby Skeleton'],
    floor: 1, difficulty: 'Normal', runs: 32, seed: 424242,
  },
  {
    label: 'RNG-dependent Tower cheese with Storm Spirit',
    team: loadout(['Judgment Day', 'Robin Hood', 'Robin Hood', 'Robin Hood'], 'Storm Spirit'),
    enemies: ["Heaven's Armor", "Hell's Army", 'Judgment Day', 'Sable The Envious'],
    floor: 105, difficulty: 'Impossible', runs: 32, seed: 99148,
  },
  {
    label: 'Halloween cards and counterattacks',
    team: loadout(['Ghost', 'Neighbor', 'The Faceless', 'Pumpkin King']),
    enemies: ['Baby Skeleton', 'Baby Skeleton', 'Baby Skeleton', 'Baby Skeleton'],
    floor: 10, difficulty: 'Normal', runs: 32, seed: 7118,
  },
]
for (const fixture of scenarios) {
  const args = [fixture.team, fixture.enemies, fixture.floor, fixture.difficulty, fixture.runs, fixture.seed] as const
  const cheese = evaluateTowerCheeseLoadout(...args)
  const tower = simulateTowerBatch(...args)
  const logged = simulateTowerBatchLogged(...args)
  assert.equal(cheese.runs, tower.runs, fixture.label + ': run count mismatch')
  assert.equal(cheese.wins, tower.wins, fixture.label + ': win count mismatch')
  assert.equal(cheese.winRate, tower.winRate, fixture.label + ': rate mismatch')
  assert.equal(cheese.averageTurns, tower.averageTurns, fixture.label + ': turn average mismatch')
  assert.equal(cheese.trusted, tower.trusted, fixture.label + ': trust mismatch')
  assert.deepEqual(cheese.unsupportedAbilities, tower.unsupportedAbilities,
    fixture.label + ': unsupported ability mismatch')
  assert.equal(cheese.wins, logged.wins, fixture.label + ': logged Tower simulation mismatch')
  assert.equal(logged.winningRuns.length, cheese.wins, fixture.label + ': per-win log mismatch')
}

// Verify that Deep Search samples on identical discovery seeds across deck
// variants/shards and independent but common verification seeds.
const engine = readFileSync('src/engine/tower.ts', 'utf8')
const ui = readFileSync('src/depths-ui.js', 'utf8')
assert.match(engine, /const discoverySeed = nextSeed\(\)/)
assert.match(engine, /const verificationSeed = nextSeed\(\)/)
assert.match(engine, /sampleLoadout\(loadout, enemies, runsPerVariant, discoverySeed, simulations\)/)
assert.match(engine, /sampleLoadout\(entry\.loadout, enemies, verifyRuns, verificationSeed, simulations\)/)
assert.doesNotMatch(ui, /const shardSeed=/)
assert.match(ui, /seed,intensive:true/)
assert.match(ui, /95% interval/)
assert.match(ui, /towerWinRateInterval\(rec\.wins,rec\.runs\)/)
console.log('Tower Cheese Maker / Tower batch parity passed across deterministic, RNG, and Halloween cases.')

import cards from '../src/data/cards'
import { simulateBattleV2 } from '../src/engine/battle-v2'
import { isDepthsSourceEligible } from '../src/engine/depths'
import { simulateDepthsBatch, simulateDepthsRun } from '../src/engine/simulation'
import { getPower } from '../src/engine/stats'
import type { BattleResult, CardDefinition, CombatCard, DepthsEnemy, TeamLoadout } from '../src/types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function findBattleCard(result: BattleResult, name: string): CombatCard | undefined {
  return [
    ...result.state.teams.Allies,
    ...result.state.fallen.Allies,
    ...result.state.teams.Enemies,
    ...result.state.fallen.Enemies,
  ].find((card) => card.definition.name === name)
}

const dummyDefinition: CardDefinition = {
  name: '__Regression Dummy__',
  imageAssetId: null,
  rarity: 1,
  statMultiplier: 1,
  hpMultiplier: 1,
  ability: null,
  weather: null,
  pack: null,
  boss: false,
  unobtainable: false,
  expires: false,
}

function dummyEnemy(health = 1, attack = 1): DepthsEnemy {
  return {
    card: { ...dummyDefinition },
    power: Math.max(1, attack * 2),
    attack,
    health,
  }
}

// Execute one representative of every ability that can naturally appear in Depths.
// This catches runtime exceptions that a coverage-set check cannot catch.
const representatives = new Map<string, (typeof cards)[number]>()
for (const card of cards) {
  if (!isDepthsSourceEligible(card) || !card.ability || representatives.has(card.ability)) continue
  representatives.set(card.ability, card)
}

assert(representatives.size === 176, `Expected 176 Depths abilities, found ${representatives.size}`)

let executed = 0
for (const [ability, card] of representatives) {
  const loadout: TeamLoadout = { cards: [{ cardName: card.name, borders: [] }] }
  const battle = simulateBattleV2(loadout, [dummyEnemy()], 10_000 + executed)
  assert(battle.turns > 0 && battle.turns <= 2_000, `${ability}: invalid turn count ${battle.turns}`)
  assert(!battle.unsupportedAbilities.includes(ability), `${ability}: marked unsupported at runtime`)
  executed += 1
}

// Pandora must really hold two distinct simultaneously active bonuses, and seeded runs must agree.
const pandora = cards.find((card) => card.ability === "Pandora's Box")
assert(pandora, "Pandora's Box card missing")
const pandoraLoadout: TeamLoadout = { cards: [{ cardName: pandora.name, borders: [] }] }
const pandoraA = simulateBattleV2(pandoraLoadout, [dummyEnemy(1e30, 0)], 424_242)
const pandoraB = simulateBattleV2(pandoraLoadout, [dummyEnemy(1e30, 0)], 424_242)
const pandoraCardA = findBattleCard(pandoraA, pandora.name)
const pandoraCardB = findBattleCard(pandoraB, pandora.name)
assert(pandoraCardA && pandoraCardB, 'Pandora disappeared from battle state')
assert(pandoraCardA.bonusAbilities?.length === 2, `Pandora rolled ${pandoraCardA.bonusAbilities?.length ?? 0} bonuses instead of 2`)
assert(new Set(pandoraCardA.bonusAbilities).size === 2, 'Pandora rolled duplicate bonuses')
assert(
  JSON.stringify(pandoraCardA.bonusAbilities) === JSON.stringify(pandoraCardB.bonusAbilities),
  'Pandora is not deterministic for the same seed',
)

// Astraeus art is absent from the flattened card dataset, so the simulator resolves a seeded Constellar art.
const astraeus = cards.find((card) => card.ability === 'Constellar')
assert(astraeus, 'Astraeus / Constellar card missing')
const astraeusLoadout: TeamLoadout = { cards: [{ cardName: astraeus.name, borders: [] }] }
const astraeusA = simulateBattleV2(astraeusLoadout, [dummyEnemy(1e30, 0)], 77_777)
const astraeusB = simulateBattleV2(astraeusLoadout, [dummyEnemy(1e30, 0)], 77_777)
const astraeusCardA = findBattleCard(astraeusA, astraeus.name)
const astraeusCardB = findBattleCard(astraeusB, astraeus.name)
assert(astraeusCardA && astraeusCardB, 'Astraeus disappeared from battle state')
assert(astraeusCardA.abilityOverride?.startsWith('Constellar'), 'Astraeus did not resolve a Constellar art ability')
assert(astraeusCardA.abilityOverride === astraeusCardB.abilityOverride, 'Constellar art is not deterministic for the same seed')

// Use four strong eligible cards for run-level deterministic and high-floor checks.
const strongest = cards
  .filter(isDepthsSourceEligible)
  .map((card) => ({ card, power: getPower(card, []) }))
  .filter((entry) => Number.isFinite(entry.power) && entry.power > 0)
  .sort((a, b) => b.power - a.power)
  .slice(0, 4)
  .map((entry) => ({ cardName: entry.card.name, borders: [] as TeamLoadout['cards'][number]['borders'] }))

assert(strongest.length === 4, 'Could not build a four-card regression team')
const runLoadout: TeamLoadout = { cards: strongest }

const batchOptions = { runs: 3, startFloor: 1, floorCap: 20, seed: 98_765 }
const batchA = simulateDepthsBatch(runLoadout, batchOptions)
const batchB = simulateDepthsBatch(runLoadout, batchOptions)
assert(JSON.stringify(batchA) === JSON.stringify(batchB), 'Depths batch is not deterministic for identical inputs')
assert(batchA.runs.length === 3, 'Depths batch returned the wrong number of runs')
assert(batchA.runs.every((run) => run.battles >= 1 && run.battles <= 20), 'Depths batch produced an invalid battle count')
assert(batchA.runs.every((run) => Number.isFinite(run.totalTurns)), 'Depths batch produced a non-finite turn count')

const highFloor = simulateDepthsRun(runLoadout, { startFloor: 1_000, floorCap: 1_002, seed: 246_810 })
assert(highFloor.battles >= 1 && highFloor.battles <= 3, `High-floor run used ${highFloor.battles} battles`)
assert(highFloor.totalTurns >= 1 && highFloor.totalTurns <= 6_000, `High-floor run used ${highFloor.totalTurns} turns`)
assert(Number.isFinite(highFloor.deathFloor), 'High-floor run returned a non-finite death floor')

console.log(`Depths regression tests passed: executed ${executed}/176 abilities.`)
console.log(`Pandora seed bonuses: ${pandoraCardA.bonusAbilities?.join(' + ')}`)
console.log(`Constellar seed art: ${astraeusCardA.abilityOverride}`)
console.log(`Regression team: ${strongest.map((slot) => slot.cardName).join(' | ')}`)
console.log(`20-floor batch death floors: ${batchA.runs.map((run) => run.deathFloor).join(', ')}`)
console.log(`High-floor check: deathFloor=${highFloor.deathFloor}, battles=${highFloor.battles}, turns=${highFloor.totalTurns}`)

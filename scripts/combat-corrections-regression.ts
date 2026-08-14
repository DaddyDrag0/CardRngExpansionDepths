import cards from '../src/data/cards'
import { simulateBattleV2 } from '../src/engine/battle-v2'
import { simulateDepthsBatch } from '../src/engine/simulation'
import type { DepthsEnemy, TeamLoadout } from '../src/types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function card(name: string) {
  const found = cards.find((entry) => entry.name === name)
  if (!found) throw new Error(`Missing regression card: ${name}`)
  return found
}

// Erosion should not make a passive-modified normal attack nonlethal.
const marrowEnemy: DepthsEnemy[] = [{ card: card('Marrowclaw'), power: 100, attack: 50, health: 100 }]
const malikBattle = simulateBattleV2(
  { cards: [{ cardName: 'Malik The Sovereign', borders: ['Galaxy'] }] },
  marrowEnemy,
  111,
  100,
  true,
)
assert(malikBattle.winner === 'Allies', `Malik should normally kill Marrowclaw; got ${malikBattle.winner} at T${malikBattle.turns}`)
assert(malikBattle.turns <= 3, `Marrowclaw normal-attack regression took ${malikBattle.turns} turns`)
console.log('Erosion normal-attack regression passed:', malikBattle.turns, 'turns')

// Zombie Dragon's two-turn survival must expire on global combat turns even if
// the opponent chains extra turns and Zombie Dragon never gets to act.
const zombieEnemy: DepthsEnemy[] = [{ card: card('Zombie Dragon'), power: 100, attack: 50, health: 100 }]
const zombieBattle = simulateBattleV2(
  { cards: [{ cardName: 'Priest', borders: ['Galaxy'] }] },
  zombieEnemy,
  222,
  100,
  true,
)
assert(zombieBattle.winner === 'Allies', `Zombie Dragon global lifespan failed; got ${zombieBattle.winner} at T${zombieBattle.turns}`)
assert(zombieBattle.turns < 20, `Zombie Dragon remained alive too long: ${zombieBattle.turns} turns`)
console.log('Zombie Dragon global-turn regression passed:', zombieBattle.turns, 'turns')

// Pandora must not roll abilities that exist only on limited/expired cards.
const nonLimitedAbilities = new Set(cards.filter((entry) => !entry.expires).map((entry) => entry.ability).filter((name): name is string => Boolean(name)))
const limitedOnlyAbilities = new Set(
  cards.filter((entry) => entry.expires).map((entry) => entry.ability).filter((name): name is string => Boolean(name) && !nonLimitedAbilities.has(name)),
)
const harmless = { ...card('Trainee'), name: '__Pandora Regression Dummy__', ability: null }
for (let seed = 1; seed <= 300; seed++) {
  const result = simulateBattleV2(
    { cards: [{ cardName: 'Pandora', borders: ['Galaxy'] }] },
    [{ card: harmless, power: 1, attack: 0, health: 1 }],
    seed,
    20,
    true,
  )
  const pandora = [...result.state.teams.Allies, ...result.state.fallen.Allies].find((entry) => entry.definition.name === 'Pandora')
  for (const gained of pandora?.bonusAbilities || []) {
    assert(!limitedOnlyAbilities.has(gained), `Pandora rolled limited-only ability ${gained} at seed ${seed}`)
  }
}
console.log('Pandora limited-card ability regression passed across 300 seeds')

// Calibration snapshot for the known Shuten/Desmond/Berserker deck.
const calibration: TeamLoadout = {
  cards: [
    { cardName: 'Fuxi', borders: [] },
    { cardName: 'Shuten-dōji', borders: ['Platinum', 'Galaxy'] },
    { cardName: 'Chronus The Hoarder', borders: ['Platinum', 'Crystal', 'Galaxy'] },
    { cardName: 'Malik The Sovereign', borders: ['Platinum', 'Crystal', 'Galaxy'] },
  ],
  statAura: { auraName: 'Desmond Of Despair', border: 'Galaxy' },
  abilityAura: { auraName: 'Berserker', border: 'Galaxy' },
}
const calibrationResult = simulateDepthsBatch(calibration, {
  runs: 20,
  startFloor: 9000,
  floorCap: 15000,
  seed: 0x51a7cafe,
  battleTurnCap: 10000,
})
console.log('Shuten calibration:', JSON.stringify({
  average: Number(calibrationResult.averageFloor.toFixed(1)),
  median: calibrationResult.medianFloor,
  low: calibrationResult.minFloor,
  high: calibrationResult.maxFloor,
}))

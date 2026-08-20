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

// Pandora intentionally draws from the full supported card pool, including limited-card abilities.
// The older limited-only exclusion regression was removed because it contradicted the current engine contract.

// Storm Spirit must not jump to the next enemy when the primary attack kills its target.
const stormKillLoadout: TeamLoadout = {
  cards: [{ cardName: 'Titan', borders: ['Galaxy'] }],
  abilityAura: { auraName: 'Storm Spirit', border: 'Galaxy' },
}
const stormKillEnemies: DepthsEnemy[] = [
  { card: card('Wizard'), power: 1, attack: 0, health: 1 },
  { card: card('Wizard'), power: 1, attack: 0, health: 1 },
]
for (let seed = 1; seed <= 40; seed++) {
  const battle = simulateBattleV2(stormKillLoadout, stormKillEnemies, seed, 20, true, true)
  const badProc = battle.debug.events.some((event) => event.detail?.includes('Storm Spirit triggered'))
  assert(!badProc, `Storm Spirit incorrectly proc'd after a killing primary hit on seed ${seed}`)
}

// But Storm Spirit must still proc normally when the primary target survives.
const stormSurviveEnemy: DepthsEnemy[] = [{ card: card('Titan'), power: 1_000_000_000, attack: 0, health: 1_000_000_000 }]
let sawStormProc = false
for (let seed = 1; seed <= 80 && !sawStormProc; seed++) {
  const battle = simulateBattleV2(stormKillLoadout, stormSurviveEnemy, seed, 1, true, true)
  sawStormProc = battle.debug.events.some((event) => event.detail?.includes('Storm Spirit triggered'))
}
assert(sawStormProc, 'Storm Spirit should still be able to proc when the primary target survives')
console.log('Storm Spirit kill-gate regression passed')

// Live-game quirk: Triceratops Horned Attack overkill can kill a Parallax in the
// next slot without Paradox killing Triceratops in return.
const triceratopsBattle = simulateBattleV2(
  { cards: [{ cardName: 'Triceratops', borders: [] }] },
  [
    { card: card('Wizard'), power: 10, attack: 0, health: 10 },
    { card: card('Parallax'), power: 10, attack: 0, health: 10 },
  ],
  777,
  20,
  true,
  true,
)
assert(triceratopsBattle.winner === 'Allies', `Triceratops overkill should bypass Paradox; got ${triceratopsBattle.winner}`)
assert(triceratopsBattle.state.teams.Allies.some((entry) => entry.definition.name === 'Triceratops'), 'Triceratops should survive the Parallax overkill quirk')
assert(triceratopsBattle.state.fallen.Enemies.some((entry) => entry.definition.name === 'Parallax'), 'Parallax should die to Triceratops overkill')
console.log('Triceratops overkill/Parallax regression passed')

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

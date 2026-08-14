import cards from '../src/data/cards'
import auras from '../src/data/auras'
import { depthBudget, generateDepthsTeam } from '../src/engine/depths'
import { getAura, getSkillAuraValue, getStatAuraValue } from '../src/engine/auras'
import { getAttack, getHealth, rarityWithBorders } from '../src/engine/stats'
import { simulateBattleV2 } from '../src/engine/battle-v2'
import { getDepthsAbilityCoverage } from '../src/engine/support'
import type { CardDefinition, DepthsEnemy, TeamLoadout } from '../src/types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function close(actual: number, expected: number, epsilon = 1e-8) {
  assert(Math.abs(actual - expected) <= epsilon, `Expected ${expected}, got ${actual}`)
}

assert(cards.length > 250, 'Card data did not load')
assert(auras.length > 40, 'Aura data did not load')

const mastermind = cards.find((card) => card.name === 'Mastermind')
assert(mastermind, 'Mastermind missing')
close(rarityWithBorders(mastermind, ['Platinum', 'Crystal']), mastermind.rarity * 100 * 10_000)
assert(getHealth(mastermind) > getAttack(mastermind), 'Basic HP/ATK relationship is invalid')

const fate = getAura('Fate')
assert(fate, 'Fate aura missing')
close(getSkillAuraValue(fate), 25)
close(getSkillAuraValue(fate, 'Galaxy'), 100)

const kala = getAura('Kala')
assert(kala, 'Kala aura missing')
close(getStatAuraValue(kala, 'Galaxy'), 103)

close(depthBudget(1), 3040)
const teamA = generateDepthsTeam(250, 123456)
const teamB = generateDepthsTeam(250, 123456)
assert(teamA.length === 4, 'Depths must generate four enemies')
assert(teamA.map((x) => x.card.name).join('|') === teamB.map((x) => x.card.name).join('|'), 'Seeded Depths generation is not deterministic')

// A controlled no-ability battle verifies the turn/death skeleton without relying on card ability balance.
const dummy: CardDefinition = {
  name: '__Smoke Dummy__', imageAssetId: null, rarity: 1, statMultiplier: 1, hpMultiplier: 1,
  ability: null, weather: null, pack: null, boss: false, unobtainable: false, expires: false,
}
const enemies: DepthsEnemy[] = Array.from({ length: 4 }, (_, index) => ({
  card: { ...dummy, name: `__Smoke Enemy ${index + 1}__` },
  power: 10,
  attack: 5,
  health: 10,
}))
const loadout: TeamLoadout = {
  cards: [{ cardName: 'Mastermind', borders: ['Galaxy'] }],
}
const battle = simulateBattleV2(loadout, enemies, 7)
assert(battle.winner === 'Allies', 'Controlled battle should be won by the player card')
assert(battle.turns > 0, 'Controlled battle did not advance turns')

const fateBattle = simulateBattleV2({ cards: [{ cardName: 'Mastermind', borders: ['Galaxy'] }], abilityAura: { auraName: 'Fate' } }, enemies, 8)
assert(!fateBattle.unsupportedAbilities.includes('Aura: Fate'), 'Fate was incorrectly marked unsupported')

const coverage = getDepthsAbilityCoverage()
assert(coverage.total > 150, 'Depths ability coverage scan did not see the full pool')
assert(coverage.unsupported === 0, `Unimplemented Depths abilities remain: ${coverage.unsupportedAbilities.join(', ')}`)

const timeoutEnemies: DepthsEnemy[] = [{
  card: { ...dummy, name: '__Timeout Enemy__' },
  power: 1,
  attack: 0,
  health: 1e30,
}]
const timeoutBattle = simulateBattleV2(
  { cards: [{ cardName: 'Mastermind', borders: [] }] },
  timeoutEnemies,
  12345,
  10_000,
  true,
)
assert(!timeoutBattle.unsupportedAbilities.includes('Battle turn cap reached'), 'Stable active-pair timeout failed before emergency cap')
assert(timeoutBattle.turns >= 145 && timeoutBattle.turns <= 155, `Expansion timeout should end at about 150 no-progress turns, got ${timeoutBattle.turns}`)
assert(timeoutBattle.turnLimitReached, 'Expansion 150-turn limit did not mark the battle as ended by turn limit')
assert(timeoutBattle.winner === 'Draw', `Turn-limit battle should end without a normal winner, got ${timeoutBattle.winner}`)
console.log('Expansion 150-turn battle-ending regression passed:', timeoutBattle.turns, 'turns')

console.log(`Engine smoke tests passed: ${cards.length} cards, ${auras.length} auras.`)
console.log(`Source-aligned Depths ability coverage: ${coverage.supported}/${coverage.total} (${coverage.percent.toFixed(1)}%).`)
console.log(`Remaining unsupported Depths abilities (${coverage.unsupported}): ${coverage.unsupportedAbilities.join(' | ')}`)

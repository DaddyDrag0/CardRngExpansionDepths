import { strict as assert } from 'node:assert'
import cards from '../src/data/cards'
import { getAttack, getHealth } from '../src/engine/stats'
import { simulateBattleV2 } from '../src/engine/battle-v2'
import type { CardDefinition, DepthsEnemy, TeamLoadout } from '../src/types'

const find = (name: string) => {
  const card = cards.find((candidate) => candidate.name === name)
  assert(card, name + ' missing from catalog')
  return card
}
const neutral: CardDefinition = {
  name: '__Halloween Neutral__', imageAssetId: null, rarity: 1,
  statMultiplier: 1, hpMultiplier: 1, ability: null, weather: null,
  pack: null, boss: false, unobtainable: false, expires: false,
}
const enemy = (attack = 0): DepthsEnemy[] => [{
  card: neutral, attack, health: 1e12, power: 1e12,
}]
const deck = (...names: string[]): TeamLoadout => ({
  cards: names.map((cardName) => ({ cardName, borders: [] })),
})
const equalish = (actual: number, expected: number, label: string) => {
  assert(Math.abs(actual - expected) <= Math.max(2, Math.abs(expected) * 1e-8),
    label + ': expected ' + expected + ', got ' + actual)
}

// King of Horror increases other Halloween allies by 25% and receives
// the flat stat gains it grants them.
{
  const king = find('Pumpkin King')
  const ghost = find('Ghost')
  const result = simulateBattleV2(deck(king.name, ghost.name), enemy(), 2, 1)
  const allies = result.state.teams.Allies
  equalish(allies[0].damage, getAttack(king) + getAttack(ghost) * .25, 'King damage gain')
  equalish(allies[0].maxHp, getHealth(king) + getHealth(ghost) * .25, 'King HP gain')
  equalish(allies[1].damage, getAttack(ghost) * 1.25, 'Halloween ally buff')
}

// First Stone Vigil turn cannot attack; on the next turn it awakens and
// hits for double damage. Stone form lasts through the opponent's attack.
{
  const stone = find('Living Gargoyle')
  const stopped = simulateBattleV2(deck(stone.name), enemy(10000), 3, 1)
  equalish(stopped.state.teams.Enemies[0].hp, 1e12, 'Stone skipped first attack')
  const defending = simulateBattleV2(deck(stone.name), enemy(10000), 3, 2)
  equalish(getHealth(stone) - defending.state.teams.Allies[0].hp, 2000, 'Stone first-turn mitigation')
  const awakened = simulateBattleV2(deck(stone.name), enemy(10000), 3, 3)
  equalish(1e12 - awakened.state.teams.Enemies[0].hp, getAttack(stone) * 2, 'Stone awakening')
}

// Freddy gives fatigue on attacks; the third successful hit deals double
// damage after the second hit puts the enemy to sleep.
{
  const freddy = find('Freddy Krueger')
  const result = simulateBattleV2(deck(freddy.name), enemy(), 3, 4)
  equalish(1e12 - result.state.teams.Enemies[0].hp, getAttack(freddy) * 4, 'Freddy sleep bonus')
}

// Two planted seeds keep independent clocks. The seed from turn 1 bursts
// at the end of the victim's second turn, while the turn-3 seed remains.
{
  const tree = find('Eerie Tree')
  const result = simulateBattleV2(deck(tree.name), enemy(), 4, 4, false, true)
  equalish(1e12 - result.state.teams.Enemies[0].hp, getAttack(tree) * 3, 'Cursed Orchard burst')
  assert(result.debug?.events.some((event) => event.detail.includes('Cursed Orchard seed burst')),
    'Delayed seed explosion missing from battle trace')
}

// Living Armor receives a 75% reduction during the guard period, then
// passes 40% reduction to the next ally for three turns on death.
{
  const armor = find('Living Armor')
  const defended = simulateBattleV2(deck(armor.name), enemy(10000), 5, 2)
  equalish(getHealth(armor) - defended.state.teams.Allies[0].hp, 2500, 'Haunted guard reduction')
  const expired = simulateBattleV2(deck(armor.name), enemy(10000), 5, 4)
  equalish(getHealth(armor) - expired.state.teams.Allies[0].hp, 12500, 'Haunted guard expiry')
  const inherited = simulateBattleV2(deck(armor.name, 'Ghost'), enemy(1e20), 6, 2)
  const ghost = inherited.state.teams.Allies.find((c) => c.definition.name === 'Ghost')
  assert(ghost && ghost.counters.hauntedInheritedTurns === 3,
    'Living Armor did not pass inherited protection to the next ally')
}
console.log('Five Pumpkin Moon combat regression checks passed.')

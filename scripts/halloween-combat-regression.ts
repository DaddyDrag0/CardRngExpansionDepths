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
  const defended = simulateBattleV2(deck(armor.name), enemy(100), 5, 2)
  equalish(getHealth(armor) - defended.state.teams.Allies[0].hp, 25, 'Haunted guard reduction')
  const expired = simulateBattleV2(deck(armor.name), enemy(100), 5, 4)
  equalish(getHealth(armor) - expired.state.teams.Allies[0].hp, 125, 'Haunted guard expiry')
  const inherited = simulateBattleV2(deck(armor.name, 'Ghost'), enemy(1e20), 6, 2)
  const ghost = inherited.state.teams.Allies.find((c) => c.definition.name === 'Ghost')
  assert(ghost && ghost.counters.hauntedInheritedTurns === 3,
    'Living Armor did not pass inherited protection to the next ally')
}
console.log('Five Pumpkin Moon combat regression checks passed.')

const near = (actual: number, expected: number, label: string) => {
  assert(Math.abs(actual - expected) <= Math.max(4, Math.abs(expected) * 1e-8),
    label + ': expected ' + expected + ', got ' + actual)
}
const manySeeds = Array.from({ length: 64 }, (_, i) => i + 1)

// Trick or Treat uses two distinct outcomes, selected with a 50% entry roll.
{
  const card = find('Trick or Treater')
  let treats = 0
  let tricks = 0
  for (const seed of manySeeds) {
    const result = simulateBattleV2(deck(card.name), enemy(10000), seed, 1)
    const ally = result.state.teams.Allies[0]
    const foe = result.state.teams.Enemies[0]
    if (ally.damage > getAttack(card)) {
      treats += 1
      near(ally.damage, getAttack(card) * 1.25, 'Treat boosts ATK by 25%')
      near(foe.damage, 10000, 'Treat leaves enemy ATK unchanged')
    } else {
      tricks += 1
      near(foe.damage, 7500, 'Trick cuts enemy ATK by 25%')
    }
  }
  assert(treats > 0 && tricks > 0, 'Both Trick or Treat outcomes must occur')
}

// Neighbor counters the actual incoming hit and reduces enemy ATK once.
{
  const card = find('Neighbor')
  const result = simulateBattleV2(deck(card.name), enemy(100), 3, 2)
  near(result.state.teams.Enemies[0].damage, 80, 'First Neighbor counter debuff')
  near(1e12 - result.state.teams.Enemies[0].hp, getAttack(card) * 1.4, 'Neighbor 40% counter damage')
  assert(result.state.teams.Allies[0].flags.neighborCountered, 'Neighbor never countered')
  const mirror = simulateBattleV2(deck(card.name), [{
    card, attack: 100, health: 1e12, power: 1e12,
  }], 3, 2)
  assert(mirror.turns === 2, 'Mirror counterattack loop did not terminate')
}

// Venomous Web applies timed poison and consumes its next-attack miss roll.
{
  const card = find('Tarantula')
  const first = simulateBattleV2(deck(card.name), enemy(100), 5, 1)
  const poisoned = first.state.teams.Enemies[0]
  assert(poisoned.counters.poisonTurns === 2, 'Venom poison should last two turns')
  near(poisoned.counters.poisonFlat || 0, getAttack(card), 'Venom poison strength')
  assert(poisoned.counters.venomWebPending === 1, 'Venom miss should be pending')
  let missed = 0
  for (const seed of manySeeds) {
    const result = simulateBattleV2(deck(card.name), enemy(100), seed, 2, false, true)
    assert((result.state.teams.Enemies[0].counters.venomWebPending || 0) === 0,
      'Venom miss roll must be consumed by the next attack')
    if (result.debug?.events.some((e) => e.detail.includes('Venomous Web caused the next attack to miss'))) missed++
  }
  assert(missed > 0, 'Venomous Web never caused a miss across seeded battles')
}

// Ghost dodges 35% of incoming strikes; each dodge charges its next attack.
{
  const card = find('Ghost')
  let dodges = 0
  for (const seed of manySeeds) {
    const result = simulateBattleV2(deck(card.name), enemy(100), seed, 2)
    const ghost = result.state.teams.Allies[0]
    if (ghost.flags.intangibleNextAttack) {
      dodges++
      near(ghost.hp, ghost.maxHp, 'Intangible dodged all incoming damage')
      const followup = simulateBattleV2(deck(card.name), enemy(100), seed, 3)
      assert(!followup.state.teams.Allies[0].flags.intangibleNextAttack, 'Dodge bonus did not get consumed')
      near(1e12 - followup.state.teams.Enemies[0].hp, getAttack(card) * 2.5, 'Intangible next-attack bonus')
    }
  }
  assert(dodges > 0, 'Intangible dodge never triggered')
}

// Murder of Crows entry splash hits all living enemies, and every third
// normal attack is replaced with a second all-enemy splash for 30%.
{
  const card = find('Crow')
  const result = simulateBattleV2(deck(card.name), [...enemy(0), ...enemy(0)], 9, 5)
  const foes = result.state.teams.Enemies
  assert(foes.length === 2, 'Crow fixture lost a target')
  near(1e12 - foes[0].hp, getAttack(card) * 2.5, 'Crow front damage after three attacks')
  near(1e12 - foes[1].hp, getAttack(card) * 0.5, 'Crow bench splash damage')
  assert(result.state.teams.Allies[0].counters.crowAttacks === 3, 'Crow attack counter')
}

// The curse stacks once per affected enemy turn, capped at 75% ATK loss.
{
  const card = find('Grey Pumpkin')
  const result = simulateBattleV2(deck(card.name), enemy(10000), 1, 6)
  const foe = result.state.teams.Enemies[0]
  assert(foe.counters.witheringCurseStacks === 3, 'Withering Curse stacks at enemy turn end')
  near(foe.damage, 2500, 'Withering Curse final ATK')
}

// The Faceless grows eight pages, including while the card is benched.
{
  const card = find('The Faceless')
  const result = simulateBattleV2(deck('Ghost', card.name), enemy(0), 1, 5)
  const faceless = result.state.teams.Allies.find((c) => c.definition.name === card.name)
  assert(faceless, 'The Faceless missing')
  assert(faceless.counters.eightPages === 3, 'Benched Faceless should have three pages')
  near(faceless.damage, getAttack(card) * 1.6, 'Three pages grant +60% ATK')
  const capped = simulateBattleV2(deck('Ghost', card.name), enemy(0), 1, 19)
  const maxed = capped.state.teams.Allies.find((c) => c.definition.name === card.name)
  assert(maxed?.counters.eightPages === 8, 'Page stack cap should be eight')
  near(maxed!.damage, getAttack(card) * 2.6, 'Eight pages grant +160% ATK')
}

console.log('Seven additional Halloween3 ability regression checks passed.')


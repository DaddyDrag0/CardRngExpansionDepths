import assert from 'node:assert/strict'
import cards from '../src/data/cards'
import { simulateBattleV2 } from '../src/engine/battle-v2'
import { getAttack } from '../src/engine/stats'
import type { CardDefinition, DepthsEnemy, TeamLoadout } from '../src/types'

// Cross-card checks use known card definitions but controlled enemy stats.
// They exercise the engine, not just displayed Halloween descriptions.
const card = (name: string): CardDefinition => {
  const found = cards.find((candidate) => candidate.name === name)
  assert(found, name + ' missing from the catalog')
  return found
}
const dummy: CardDefinition = {
  name: '__Halloween Interaction Dummy__', imageAssetId: null, rarity: 1,
  statMultiplier: 1, hpMultiplier: 1, ability: null, weather: null,
  pack: null, boss: false, unobtainable: false, expires: false,
}
const team = (...names: string[]): TeamLoadout => ({
  cards: names.map((cardName) => ({ cardName, borders: [] })),
})
const foe = (name = dummy.name, attack = 0): DepthsEnemy[] => [{
  card: name === dummy.name ? dummy : card(name),
  health: 1e12, power: 1e12, attack,
}]
const close = (actual: number, expected: number, message: string) => {
  assert(Math.abs(actual - expected) <= Math.max(4, Math.abs(expected) * 1e-8),
    message + ': expected ' + expected + ', got ' + actual)
}

// Zero-damage swings must never charge Ghost's +50% next-attack bonus.
// Formerly defensive() rolled Intangible even after the attack had missed.
{
  for (let seed = 1; seed <= 96; seed++) {
    const result = simulateBattleV2(team('Ghost'), foe(dummy.name, 0), seed, 2)
    const ghost = result.state.teams.Allies[0]
    assert(ghost && !ghost.flags.intangibleNextAttack,
      'Ghost gained an evade attack bonus without facing a damaging swing, seed ' + seed)
  }
}

// A blocked attack should not cause Neighbor's retaliation or first-counter ATK debuff.
{
  const result = simulateBattleV2(team('Neighbor'), foe(dummy.name, 0), 2, 2)
  const neighbor = result.state.teams.Allies[0]
  assert(neighbor && !neighbor.flags.neighborCountered, 'Neighbor countered a zero-damage attack')
  close(result.state.teams.Enemies[0].damage, 0, 'No artificial damage on a zero-ATK enemy')
}

// Serket's Protection of Gods works from the bench against both Halloween
// poison and entry curses; unprotected counterparts receive the effects.
{
  const exposed = simulateBattleV2(team('Neighbor'), foe('Tarantula', 100), 4, 2)
  const defended = simulateBattleV2(team('Neighbor', 'Serket'), foe('Tarantula', 100), 4, 2)
  assert((exposed.state.teams.Allies[0]?.counters.poisonTurns || 0) === 2,
    'Unprotected Neighbor should receive Venomous Web poison')
  assert(!(defended.state.teams.Allies[0]?.counters.poisonTurns || 0),
    'Serket should block Venomous Web poison')
  const cursed = simulateBattleV2(team('Neighbor'), foe('Grey Pumpkin', 0), 5, 1)
  const protectedTeam = simulateBattleV2(team('Neighbor', 'Serket'), foe('Grey Pumpkin', 0), 5, 1)
  assert((cursed.state.teams.Allies[0]?.counters.witheringCurseStacks || 0) === 1,
    'Grey Pumpkin curse must affect unprotected entry target')
  assert(!(protectedTeam.state.teams.Allies[0]?.counters.witheringCursed || 0),
    'Serket must block curse application to an ally')
}

// Fuxi's ability lock is applied on entry before the opposing Halloween card
// can activate its own on-entry effect.
{
  const result = simulateBattleV2(team('Fuxi'), foe('Grey Pumpkin', 0), 3, 1)
  const fuxi = result.state.teams.Allies[0]
  assert(fuxi && !(fuxi.counters.witheringCursed || 0),
    'Order of the Cosmos allowed a disabled Grey Pumpkin entry curse')
}

// Pumpkin King's team-wide Halloween stat buff must work with The Faceless's
// own persistent page scaling and not multiply its Page bonus repeatedly.
{
  const result = simulateBattleV2(team('Pumpkin King', 'The Faceless'), foe(), 8, 5)
  const faceless = result.state.teams.Allies.find((ally) => ally.definition.name === 'The Faceless')
  assert(faceless && faceless.counters.eightPages === 3, 'Benched Faceless page count')
  close(faceless.damage, getAttack(card('The Faceless')) * 1.25 * 1.6,
    'Pumpkin King entry buff plus three Faceless pages')
}

console.log('Halloween cross-card interactions passed: zero-hit evasion, Neighbor, Serket, Fuxi, King + Faceless.')

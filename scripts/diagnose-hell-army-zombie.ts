import cards from '../src/data/cards'
import { simulateBattleV2 } from '../src/engine/battle-v2'
import type { DepthsEnemy, TeamLoadout } from '../src/types'

const zombie = cards.find(c => c.name === 'Zombie Dragon')
if (!zombie) throw new Error('Zombie Dragon missing')

const loadout: TeamLoadout = { cards: [{ cardName: "Hell's Army", borders: ['Galaxy'] }] }

for (const [label, hp, atk] of [
  ['low', 1000, 500],
  ['medium', 1_000_000, 500_000],
  ['high', 1_000_000_000, 500_000_000],
] as const) {
  const enemies: DepthsEnemy[] = [{ card: zombie, power: hp, health: hp, attack: atk }]
  const result = simulateBattleV2(loadout, enemies, 424242, 500, true, true)
  console.log(`CASE ${label}: winner=${result.winner} turns=${result.turns} trusted=${result.trusted}`)
  console.log('unsupported', result.unsupportedAbilities)
  console.log('live enemies', result.state.teams.Enemies.map(c => ({name:c.definition.name,hp:c.hp,sealed:c.flags.sealed,unholy:c.flags.unholyActive,turns:c.counters.unholyTurns})))
  console.log('fallen enemies', result.state.fallen.Enemies.map(c => ({name:c.definition.name,hp:c.hp,sealed:c.flags.sealed,unholy:c.flags.unholyActive,turns:c.counters.unholyTurns})))
  console.log('events')
  for (const e of result.debug?.events || []) console.log(`T${e.turn} [${e.type}] ${e.team} ${e.card}: ${e.detail}`)
}

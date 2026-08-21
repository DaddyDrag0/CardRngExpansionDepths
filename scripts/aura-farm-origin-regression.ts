import cards from '../src/data/cards'
import { simulateBattleV2 } from '../src/engine/battle-v2'
import type { DepthsEnemy, TeamLoadout } from '../src/types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}
function card(name: string) {
  const found = cards.find((entry) => entry.name === name)
  if (!found) throw new Error(`Missing regression card: ${name}`)
  return found
}

const loadout: TeamLoadout = {
  cards: [
    { cardName: "Terra's Aria", borders: ['Galaxy'] },
    { cardName: 'Piccolo', borders: [] },
    { cardName: 'Parallax', borders: [] },
  ],
}
const enemies: DepthsEnemy[] = [
  { card: card('Chaos'), power: 1e30, attack: 1_000_000, health: 1e30 },
]

for (let seed = 1; seed <= 300; seed++) {
  const battle = simulateBattleV2(loadout, enemies, seed, 2, true, true)
  const ids = battle.state.teams.Allies.map((entry) => entry.id)
  assert(new Set(ids).size === ids.length, `Origin/Aura Farm duplicated a player card on seed ${seed}: ${ids.join(', ')}`)
  assert(
    !battle.debug.events.some((event) => event.detail?.includes('Aura Farm protected Piccolo from a lethal hit')),
    `Piccolo incorrectly protected itself from a backline Origin hit on seed ${seed}`,
  )
  assert(
    battle.state.teams.Allies.some((entry) => entry.definition.name === "Terra's Aria") || battle.state.fallen.Allies.some((entry) => entry.definition.name === "Terra's Aria"),
    `Terra's Aria vanished from the lineup on seed ${seed}`,
  )
}
console.log('Aura Farm / Origin backline regression passed')

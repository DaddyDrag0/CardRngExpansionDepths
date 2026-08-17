import { strict as assert } from 'node:assert'
import cards from '../src/data/cards'
import { simulateBattleV2 } from '../src/engine/battle-v2'
import type { DepthsEnemy, TeamLoadout } from '../src/types'

function card(name: string) {
  const found = cards.find((entry) => entry.name === name)
  if (!found) throw new Error(`Missing card: ${name}`)
  return found
}

// Robin Hood / Defraud is intentionally bad in the live game:
// - each hit is based on 50% of the target's CURRENT HP, so Defraud itself can never finish the target;
// - Robin Hood loses 25% of Max HP after every attack, so with no healing/interference it kills itself on attack 4.
// Keep this behavior even if it looks like a bug or an ability that should be "fixed".
// Cherub is intentional here: Frail doubles incoming damage, which must STILL not let Defraud kill.
const loadout: TeamLoadout = {
  cards: [{ cardName: 'Robin Hood', borders: [] }],
}

const enemy: DepthsEnemy = {
  card: card('Cherub'),
  power: 1_000_000,
  health: 1_000_000,
  attack: 0,
}

const battle = simulateBattleV2(loadout, [enemy], 20260817, 20, false, true)

assert.equal(battle.winner, 'Enemies', 'Robin Hood should self-destruct before Defraud can kill a passive target')

const robinDeath = battle.debug?.events.some(
  (event) => event.type === 'death' && event.card === 'Robin Hood',
)
assert.equal(robinDeath, true, 'Robin Hood should die from Defraud self-damage')

const enemyDeath = battle.debug?.events.some(
  (event) => event.type === 'death' && event.card === 'Cherub',
)
assert.equal(enemyDeath, false, 'Defraud must remain non-lethal even when Frail would otherwise double its damage')

console.log('Robin Hood regression passed: Defraud cannot finish the target and Robin Hood self-destructs.')

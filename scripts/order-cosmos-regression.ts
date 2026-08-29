import { simulateBattleV2 } from '../src/engine/battle-v2'
import type { DepthsEnemy } from '../src/types'
import cards from '../src/data/cards'

function card(name: string) {
  const found = cards.find((c) => c.name === name)
  if (!found) throw new Error('Missing card: ' + name)
  return found
}

function cardWithAbility(ability: string) {
  const found = cards.find((c) => c.ability === ability)
  if (!found) throw new Error('Missing card with ability: ' + ability)
  return found
}

const shen = card('Shén Lóng')
const enemies: DepthsEnemy[] = [
  { card: shen, power: 1000, attack: 500, health: 1000 },
]
const result = simulateBattleV2({ cards: [{ cardName: 'Fuxi', borders: [] }] }, enemies, 17, 20, true, true)
const firstTurn = result.debug?.events.find((e) => e.type === 'turn')
if (!firstTurn?.detail.includes('defender 1000/1000 HP 500 ATK')) {
  throw new Error('Order of the Cosmos failed to suppress Shén Lóng entry ability: ' + (firstTurn?.detail || 'no turn event'))
}

// Fuxi also blocks abilities that would normally trigger after the enemy dies.
const blessing = cardWithAbility('Blessing')
const blessingBattle = simulateBattleV2(
  { cards: [{ cardName: 'Fuxi', borders: ['Galaxy'] }] },
  [
    { card: blessing, power: 1, attack: 0, health: 1 },
    { card: card('Wizard'), power: 100, attack: 0, health: 100 },
  ],
  18,
  20,
  true,
  true,
)
const blockedDeathAbility = blessingBattle.debug?.events.some((e) => e.type === 'ability' && e.card === blessing.name && e.detail.includes('Blessing'))
if (blockedDeathAbility) throw new Error('Order of the Cosmos allowed an enemy on-death Blessing to activate')

// Piccolo is the special exception: Aura Farm can still intercept from the bench
// if Piccolo has never appeared on-field yet.
const piccoloBattle = simulateBattleV2(
  { cards: [{ cardName: 'Fuxi', borders: ['Galaxy'] }] },
  [
    { card: card('Wizard'), power: 1, attack: 0, health: 1 },
    { card: card('Piccolo'), power: 100, attack: 0, health: 100 },
  ],
  19,
  20,
  true,
  true,
)
const auraFarmTriggered = piccoloBattle.debug?.events.some((e) => e.type === 'ability' && e.card === 'Piccolo' && e.detail.includes('Aura Farm protected'))
if (!auraFarmTriggered) throw new Error('Order of the Cosmos incorrectly blocked untouched bench Piccolo Aura Farm')

// Shuten-dōji: a confirmed Decapitate kill grants +20% stats and the extra turn.
const shutenBattle = simulateBattleV2(
  { cards: [{ cardName: 'Shuten-dōji', borders: ['Galaxy'] }] },
  [{ card: card('Wizard'), power: 1, attack: 0, health: 1 }],
  20,
  20,
  true,
  true,
)
const shutenGrowth = shutenBattle.debug?.events.some((e) => e.type === 'ability' && e.card === 'Shuten-dōji' && e.detail.includes('Decapitate') && e.detail.includes('ATK'))
if (!shutenGrowth) throw new Error('Shuten-dōji did not gain +20% stats on a confirmed Decapitate kill')

console.log('Order of the Cosmos + Piccolo exception + Shuten regression passed.')

import fs from 'node:fs'

const battlePath = 'src/engine/battle-v2.ts'
const regressionPath = 'scripts/order-cosmos-regression.ts'

let battle = fs.readFileSync(battlePath, 'utf8')
const oldHasAbility = `function hasAbility(runtime: Runtime, card: CombatCard | undefined, name: string): boolean {\n  if (!card || card.dead || card.flags.sealed || (runtime.state.boosts[card.team].noAbilities || 0) > 0) return false\n  const opposingCard = active(runtime, OTHER_TEAM[card.team])`
const newHasAbility = `function hasAbility(runtime: Runtime, card: CombatCard | undefined, name: string): boolean {\n  if (!card || card.dead || card.flags.sealed) return false\n  const abilityLocked = (runtime.state.boosts[card.team].noAbilities || 0) > 0\n  const friendshipPassive = name === 'Friendship' && card.definition.ability === 'Friendship'\n  if (abilityLocked && !friendshipPassive) return false\n  const opposingCard = active(runtime, OTHER_TEAM[card.team])`
if (!battle.includes(oldHasAbility)) throw new Error('Could not find hasAbility Fuxi lock anchor')
battle = battle.replace(oldHasAbility, newHasAbility)
fs.writeFileSync(battlePath, battle)

let regression = fs.readFileSync(regressionPath, 'utf8')
const marker = `// Shuten-dōji: a confirmed Decapitate kill grants +20% stats and the extra turn.`
if (!regression.includes(marker)) throw new Error('Could not find Order of the Cosmos regression insertion marker')
const friendshipRegression = `// Friendship is a passive stat-link exception: Fuxi does not suppress the\n// robots' Friendship stat boost even while Order of the Cosmos is active.\nconst friendshipBattle = simulateBattleV2(\n  { cards: [{ cardName: 'Fuxi', borders: [] }] },\n  [\n    { card: card('A0-ON1'), power: 1000, attack: 500, health: 1000 },\n    { card: card('AK4-ON1'), power: 1000, attack: 500, health: 1000 },\n  ],\n  21,\n  20,\n  true,\n  true,\n)\nconst friendshipFirstTurn = friendshipBattle.debug?.events.find((e) => e.type === 'turn')\nif (!friendshipFirstTurn?.detail.includes('defender 1800/1800 HP 900 ATK')) {\n  throw new Error('Order of the Cosmos incorrectly suppressed Friendship passive stats: ' + (friendshipFirstTurn?.detail || 'no turn event'))\n}\n\n`
regression = regression.replace(marker, friendshipRegression + marker)
regression = regression.replace(
  `console.log('Order of the Cosmos + Piccolo exception + Shuten regression passed.')`,
  `console.log('Order of the Cosmos + Piccolo/Friendship exceptions + Shuten regression passed.')`,
)
fs.writeFileSync(regressionPath, regression)

console.log('Applied Friendship passive exception to Order of the Cosmos.')

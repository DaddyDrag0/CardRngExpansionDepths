import fs from 'node:fs'

const battlePath = 'src/engine/battle-v2.ts'
const regressionPath = 'scripts/order-cosmos-regression.ts'
let source = fs.readFileSync(battlePath, 'utf8')

function replaceOnce(label, before, after) {
  const first = source.indexOf(before)
  if (first < 0) throw new Error(`Could not find ${label} anchor`)
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`Found multiple ${label} anchors`)
  source = source.slice(0, first) + after + source.slice(first + before.length)
}

replaceOnce(
  'onEntry appeared-on-field marker',
  `  card.entered = true\n  noteUnsupported(runtime.state, card)`,
  `  card.entered = true\n  card.flags.appearedOnField = true\n  noteUnsupported(runtime.state, card)`,
)

replaceOnce(
  'Piccolo Aura Farm guard',
  `  const piccolo = deck[1]\n  if (!piccolo || piccolo === target || !alive(piccolo) || piccolo.definition.name !== 'Piccolo' || piccolo.flags.farmed) return { target, damage: incoming }\n  const protectedName = effectiveCardName(target) || target.definition.name`,
  `  const piccolo = deck[1]\n  if (!piccolo || piccolo === target || !alive(piccolo) || piccolo.definition.name !== 'Piccolo' || piccolo.flags.farmed) return { target, damage: incoming }\n  // Order of the Cosmos blocks Piccolo once Piccolo has actually appeared on-field.\n  // Live exception: an untouched bench Piccolo can still intercept with Aura Farm.\n  if ((runtime.state.boosts[piccolo.team].noAbilities || 0) > 0 && piccolo.flags.appearedOnField) return { target, damage: incoming }\n  const protectedName = effectiveCardName(target) || target.definition.name`,
)

replaceOnce(
  'Fuxi on-death suppression',
  `  if (dead.flags.suppressOnDeath) return\n\n  if (activeBonusAbilities(dead).length) {`,
  `  if (dead.flags.suppressOnDeath) return\n\n  // Order of the Cosmos suppresses the defeated card's death ability too.\n  // Nightmare Melody's counter decrement is cleanup for an already-created field,\n  // so keep that cleanup even while the ability itself is locked.\n  if ((runtime.state.boosts[team].noAbilities || 0) > 0) {\n    if (name === 'Nightmare Melody' && runtime.state.boosts[team].composerCount) {\n      runtime.state.boosts[team].composerCount = Math.max(0, (runtime.state.boosts[team].composerCount || 0) - 1)\n    }\n    return\n  }\n\n  if (activeBonusAbilities(dead).length) {`,
)

replaceOnce(
  'Shuten confirmed-kill growth',
  `      if (target.hp <= 0 && !unholySurvives) attacker.flags.extraTurn = true`,
  `      if (target.hp <= 0 && !unholySurvives) {\n        boostStats(attacker, 1.2)\n        attacker.flags.extraTurn = true\n      }`,
)

fs.writeFileSync(battlePath, source)

const regression = `import { simulateBattleV2 } from '../src/engine/battle-v2'\nimport type { DepthsEnemy } from '../src/types'\nimport cards from '../src/data/cards'\n\nfunction card(name: string) {\n  const found = cards.find((c) => c.name === name)\n  if (!found) throw new Error('Missing card: ' + name)\n  return found\n}\n\nfunction cardWithAbility(ability: string) {\n  const found = cards.find((c) => c.ability === ability)\n  if (!found) throw new Error('Missing card with ability: ' + ability)\n  return found\n}\n\nconst shen = card('Shén Lóng')\nconst enemies: DepthsEnemy[] = [\n  { card: shen, power: 1000, attack: 500, health: 1000 },\n]\nconst result = simulateBattleV2({ cards: [{ cardName: 'Fuxi', borders: [] }] }, enemies, 17, 20, true, true)\nconst firstTurn = result.debug?.events.find((e) => e.type === 'turn')\nif (!firstTurn?.detail.includes('defender 1000/1000 HP 500 ATK')) {\n  throw new Error('Order of the Cosmos failed to suppress Shén Lóng entry ability: ' + (firstTurn?.detail || 'no turn event'))\n}\n\n// Fuxi also blocks abilities that would normally trigger after the enemy dies.\nconst blessing = cardWithAbility('Blessing')\nconst blessingBattle = simulateBattleV2(\n  { cards: [{ cardName: 'Fuxi', borders: ['Galaxy'] }] },\n  [\n    { card: blessing, power: 1, attack: 0, health: 1 },\n    { card: card('Wizard'), power: 100, attack: 0, health: 100 },\n  ],\n  18,\n  20,\n  true,\n  true,\n)\nconst blockedDeathAbility = blessingBattle.debug?.events.some((e) => e.type === 'ability' && e.card === blessing.name && e.detail.includes('Blessing'))\nif (blockedDeathAbility) throw new Error('Order of the Cosmos allowed an enemy on-death Blessing to activate')\n\n// Piccolo is the special exception: Aura Farm can still intercept from the bench\n// if Piccolo has never appeared on-field yet.\nconst piccoloBattle = simulateBattleV2(\n  { cards: [{ cardName: 'Fuxi', borders: ['Galaxy'] }] },\n  [\n    { card: card('Wizard'), power: 1, attack: 0, health: 1 },\n    { card: card('Piccolo'), power: 100, attack: 0, health: 100 },\n  ],\n  19,\n  20,\n  true,\n  true,\n)\nconst auraFarmTriggered = piccoloBattle.debug?.events.some((e) => e.type === 'ability' && e.card === 'Piccolo' && e.detail.includes('Aura Farm protected'))\nif (!auraFarmTriggered) throw new Error('Order of the Cosmos incorrectly blocked untouched bench Piccolo Aura Farm')\n\n// Shuten-dōji: a confirmed Decapitate kill grants +20% stats and the extra turn.\nconst shutenBattle = simulateBattleV2(\n  { cards: [{ cardName: 'Shuten-dōji', borders: ['Galaxy'] }] },\n  [{ card: card('Wizard'), power: 1, attack: 0, health: 1 }],\n  20,\n  20,\n  true,\n  true,\n)\nconst shutenGrowth = shutenBattle.debug?.events.some((e) => e.type === 'ability' && e.card === 'Shuten-dōji' && e.detail.includes('Decapitate') && e.detail.includes('ATK'))\nif (!shutenGrowth) throw new Error('Shuten-dōji did not gain +20% stats on a confirmed Decapitate kill')\n\nconsole.log('Order of the Cosmos + Piccolo exception + Shuten regression passed.')\n`
fs.writeFileSync(regressionPath, regression)

console.log('Applied Fuxi suppression, Piccolo exception, and Shuten kill-growth corrections.')

import fs from 'node:fs'

function replaceOnce(path, before, after, label) {
  let text = fs.readFileSync(path, 'utf8')
  const count = text.split(before).length - 1
  if (count !== 1) throw new Error(`${label}: expected 1 match, found ${count}`)
  text = text.replace(before, after)
  fs.writeFileSync(path, text)
}

replaceOnce(
  'src/types.ts',
  `  type: 'turn' | 'death' | 'revive' | 'stall' | 'spawn'`,
  `  type: 'turn' | 'death' | 'revive' | 'stall' | 'spawn' | 'ability'`,
  'debug event ability type',
)

replaceOnce(
  'src/engine/battle-v2.ts',
  `    card.bonusAbilities = chosen\n    for (const gained of chosen) {`,
  `    card.bonusAbilities = chosen\n    if (runtime.captureDebug) pushDebugEvent(runtime, {\n      turn: runtime.state.turn,\n      type: 'ability',\n      team: card.team,\n      card: effectiveCardName(card) || card.definition.name,\n      detail: \`Pandora's Box rolled: \${chosen.join(' + ') || 'No abilities'}\`,\n      hp: card.hp,\n      maxHp: card.maxHp,\n      damage: card.damage,\n    })\n    for (const gained of chosen) {`,
  'Pandora debug event',
)

const regression = `import cards from '../src/data/cards'\nimport { simulateBattleV2 } from '../src/engine/battle-v2'\nimport type { DepthsEnemy, TeamLoadout } from '../src/types'\n\nfunction assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message) }\nconst dummy = cards.find((card) => card.name === 'Dummy') || cards.find((card) => !card.unobtainable && !card.boss)\nassert(dummy, 'No enemy card available for Pandora debug regression')\nconst enemy: DepthsEnemy[] = [{ card: dummy, power: 1, health: 1, attack: 1 }]\nconst loadout: TeamLoadout = { cards: [{ cardName: 'Pandora', borders: ['Galaxy'] }] }\nconst result = simulateBattleV2(loadout, enemy, 123456789, 100, true, true)\nconst event = result.debug?.events.find((entry) => entry.type === 'ability' && entry.card === 'Pandora' && entry.detail.startsWith(\"Pandora's Box rolled:\"))\nassert(event, 'Pandora ability-roll debug event missing')\nconst rolled = event.detail.replace(\"Pandora's Box rolled: \", '').split(' + ').filter(Boolean)\nassert(rolled.length === 2, 'Pandora debug event should show exactly two rolled abilities: ' + event.detail)\nconsole.log('Pandora debug log regression passed:', event.detail)\n`
fs.writeFileSync('scripts/pandora-debug-regression.ts', regression)

console.log('Added Pandora ability-roll debug logging.')

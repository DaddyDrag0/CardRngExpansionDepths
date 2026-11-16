import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import cards from '../src/data/cards'
import auras from '../src/data/auras'
import abilities from '../src/data/abilities'

// Fingerprints extracted from the supplied CYBERPUNK Card RNG Expansion(1).rbxl
// ModuleScript definitions (Cards, Abilities, AuraCards), not guessed totals.
function sourceNameHash(names: string[]): string {
  let value = 2166136261
  const sorted = [...new Set(names)].sort().join('\n')
  // FNV over UTF-16 units matches Roblox's source fingerprint for emoji/astral names.
  for (let i = 0; i < sorted.length; i++) {
    value = Math.imul(value ^ sorted.charCodeAt(i), 16777619) >>> 0
  }
  return value.toString(16).padStart(8, '0')
}
const imported = cards.filter((card) => !card.name.endsWith(' (Legacy)'))
assert.equal(imported.length, 350, 'Current CYBERPUNK game contains 350 distinct cards')
assert.equal(sourceNameHash(imported.map((card) => card.name)), '7511dcd5',
  'Card library differs from the 350 names in the uploaded Roblox source')
assert.equal(cards.length, 352, 'Keep two intentional Legacy variants alongside current cards')
assert.equal(auras.length, 72, 'Uploaded game contains 72 auras')
assert.equal(sourceNameHash(auras.map((aura) => aura.name)), '83048874',
  'Aura library names differ from the uploaded Roblox source')
assert.equal(Object.keys(abilities).length, 380, 'Uploaded game contains 380 ability descriptions')
assert.equal(sourceNameHash(Object.keys(abilities)), '934e569b',
  'Ability description keys differ from uploaded Roblox source')
const thumbs = JSON.parse(readFileSync('src/data/thumbnails.json', 'utf8')) as Record<string, unknown>
for (const entity of [...cards, ...auras]) {
  assert(entity.imageAssetId && thumbs[String(entity.imageAssetId)],
    'Missing thumbnail entry for ' + entity.name)
}
for (const [name, ability] of Object.entries({
  Rowy: 'Caught On Tape',
  D: 'Hack',
  Dave: 'Sandevistan',
  'The Smasher': 'Night City Massacre',
  'Night Witch': 'Hex',
  Bigfoot: 'Heard but not Seen',
  'The Drowned': 'Drowned',
  'The Drowned Monarch': 'Sunken Kingdom',
})) {
  const card = cards.find((c) => c.name === name)
  assert(card && card.ability === ability, 'Missing or incorrect card ' + name)
  assert(abilities[ability], 'Missing ability description ' + ability)
}
console.log('CYBERPUNK import complete: 350 source cards + 2 Legacy, 380 abilities, 72 auras; all image IDs covered.')

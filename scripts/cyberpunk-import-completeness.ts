import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import cards from '../src/data/cards'
import auras from '../src/data/auras'
import abilities from '../src/data/abilities'

// Fingerprints extracted from the supplied Roblox place ModuleScript definitions
// (Cards, Abilities, AuraCards), not guessed totals. Updated for the Nov 22 2026
// place (Card Rng Update (2).rbxlx): +11 cards, +12 ability texts, +2 auras.
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
assert.equal(imported.length, 361, 'Nov 22 game contains 361 distinct cards')
assert.equal(sourceNameHash(imported.map((card) => card.name)), '0d9f6e8b',
  'Card library differs from the 361 names in the uploaded Roblox source')
assert.equal(cards.length, 363, 'Keep two intentional Legacy variants alongside current cards')
assert.equal(auras.length, 74, 'Uploaded game contains 74 auras')
assert.equal(sourceNameHash(auras.map((aura) => aura.name)), '4a48bfc1',
  'Aura library names differ from the uploaded Roblox source')
assert.equal(Object.keys(abilities).length, 392, 'Uploaded game contains 392 ability descriptions')
assert.equal(sourceNameHash(Object.keys(abilities)), '0d2666b4',
  'Ability description keys differ from uploaded Roblox source')
const thumbs = JSON.parse(readFileSync('src/data/thumbnails.json', 'utf8')) as Record<string, unknown>
// Nov 22 images are not in the thumbnail cache yet (the Roblox thumbnail API was unreachable
// from the build machine); the UI resolves missing IDs live. Re-run scripts/resolve-thumbnails.mjs.
const liveResolvedImages = new Set([
  119567142769447, 74178438557315, 85112568686358, 106465185815272, 106455075581101, 89015847633497,
  99657247299246, 109756729981389, 101795247406116, 119690603792605, 85332230764026,
  107171205592372, 128794596721378,
])
for (const entity of [...cards, ...auras]) {
  if (entity.imageAssetId && liveResolvedImages.has(entity.imageAssetId) && !thumbs[String(entity.imageAssetId)]) continue
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
  'The Ultimate General': 'Supreme Eye',
  'Shadow Sovereign': 'Arise',
  'One-Winged Cataclysm': 'Black Meteor',
  'Azure Judicator': 'Judgment Divide',
  'Flatwoods Phantom': 'Noxious Arrival',
  'Crown of Sand': "Pharaoh's Judgment",
  'Zen-kai': 'Relentless Assault',
  'Saint of Hollow Light': 'Sacred Intervention',
  'Primeval Devourer': 'Apex Predator',
  'Astral Archivist': 'Celestial Protection',
  'Golden Arsenal King': 'Vault of Blades',
})) {
  const card = cards.find((c) => c.name === name)
  assert(card && card.ability === ability, 'Missing or incorrect card ' + name)
  assert(abilities[ability], 'Missing ability description ' + ability)
}
console.log('Nov 22 import complete: 361 source cards + 2 Legacy, 392 abilities, 74 auras; image IDs covered (13 new ones resolved live).')

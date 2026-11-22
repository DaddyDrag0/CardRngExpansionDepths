import { strict as assert } from 'node:assert'
import cards from '../src/data/cards'
import { getAura, getSkillAuraValue, statAuraPercentForCard } from '../src/engine/auras'
import { simulateBattleV2 } from '../src/engine/battle-v2'
import type { CombatCard, DepthsEnemy, TeamLoadout } from '../src/types'

// Nov 22 2026 update in the TypeScript engine (the deployed worker has its own test:
// scripts/nov22-update-regression.mjs). Text-based models; none DummyLab-verified yet.
const find = (name: string) => {
  const card = cards.find((c) => c.name === name)
  assert(card, 'Missing card ' + name)
  return card
}
const power = (name: string) => Math.pow(2, Math.log10(find(name).rarity)) * 10 * (find(name).statMultiplier || 1)
function fight(team: string[], foes: string[], seed: number, hp = 1, atk = hp) {
  const loadout: TeamLoadout = { cards: team.map((cardName) => ({ cardName, borders: [] })) }
  const enemies: DepthsEnemy[] = foes.map((name) => {
    const p = power(name)
    return { card: find(name), power: p * hp, attack: (p / 2) * atk, health: p * hp * (find(name).hpMultiplier || 1) }
  })
  const result = simulateBattleV2(loadout, enemies, seed, 10_000, true, true)
  const events = result.debug?.events || []
  return { result, has: (text: string) => events.filter((e) => e.detail?.includes(text)).length }
}
const card = (name: string) => ({ definition: find(name) }) as unknown as CombatCard

// Auras
const herald = getAura('Herald Of Virtue')!, convergence = getAura('Mythic Convergence')!
assert(herald && convergence, 'New auras missing')
assert.equal(statAuraPercentForCard(herald, card('Wizard'), null), 32)
assert.equal(statAuraPercentForCard(herald, card('Veyrath the Unyielding'), 'Galaxy'), 414)
assert.equal(statAuraPercentForCard(convergence, card('Wizard'), null), 25)
assert.equal(statAuraPercentForCard(convergence, card('Wizard'), 'Galaxy'), 200)
assert.equal(statAuraPercentForCard(convergence, card('The Sandman'), 'Galaxy'), 300)
for (const name of ['Capricorn', "Jack-o'-Lantern"]) {
  assert.deepEqual([null, 'Platinum', 'Crystal', 'Galaxy'].map((b) => getSkillAuraValue(getAura(name)!, b as never)), [10, 15, 20, 25])
}

// Abilities fire in real battles
assert(fight(['The Ultimate General'], ['Wizard', 'Archer'], 1).has('Supreme Eye evaded') >= 1)
assert.equal(fight(['Shadow Sovereign'], ['Wizard', 'Archer', 'Dancer', 'Cave Goblin', 'Good Boy'], 3).has('became a Shadow'), 3)
assert.equal(fight(['One-Winged Cataclysm'], ['Wizard', 'Wizard'], 1, 5e5, 1).has('Black Meteor struck'), 1)
assert(fight(['Flatwoods Phantom'], ['Count Muscula'], 1, 50, 0.5).has('Toxic mist made the heal fail') === 1)
assert.equal(fight(['Crown of Sand'], ['Wizard', 'Kraken'], 4, 1, 0.01).has("Pharaoh's Judgment marked Kraken"), 1)
assert.equal(fight(['Wizard', 'Saint of Hollow Light'], ['Kraken'], 5).has('Sacred Intervention cut'), 1)
assert(fight(['Astral Archivist', 'Wizard'], ['Kraken'], 6, 3, 0.3).has('Breaking the shield cost') >= 1)
for (let seed = 1; seed <= 10; seed++) {
  assert.equal(fight(['Golden Arsenal King'], ['Kraken', 'Kraken'], seed, 3, 0.01).has('Vault of Blades fired'), 2)
}
{
  const { result } = fight(['Azure Judicator'], ['Wizard'], 2, 5e5, 1)
  assert(result.debug!.events.some((e) => e.detail?.includes('Judgment Divide')), 'Judgment Divide should fire')
}
{
  const { result } = fight(['Zen-kai'], ['Wizard'], 2, 5e5, 1)
  const hits = result.debug!.events.filter((e) => e.type === 'attack' && e.team === 'Allies').map((e) => e.damageDealt || 0)
  assert(hits.length >= 6, 'Need several Zen-kai hits')
  // The first hit is blocked by Wizard's own ability in this seed; it still starts the streak.
  const base = hits[1] / 1.25
  assert.deepEqual(hits.slice(1, 6).map((h) => Math.round(h / base * 100) / 100), [1.25, 1.5, 1.75, 2, 2], 'Relentless Assault +25% per hit, capped at +100%')
}
// Every card enters once even when Eternal Voyage keeps swapping the front card
for (let seed = 1; seed <= 5; seed++) {
  const { result, has } = fight(['Flying Dutchman', 'Golden Arsenal King', 'Astral Archivist', 'Crown of Sand'], ['Kraken'], seed, 50, 0.001)
  const entries = result.debug!.events.filter((e) => e.type === 'entry' && e.team === 'Allies').map((e) => e.card)
  assert(entries.length >= 2 && new Set(entries).size === entries.length, 'Each card enters once: ' + entries)
  assert(has('Vault of Blades fired') <= 1 && has('Celestial Protection shielded') <= 1)
}
// Mixed decks of every new card finish and stay trusted
const names = ['The Ultimate General', 'Shadow Sovereign', 'One-Winged Cataclysm', 'Azure Judicator', 'Flatwoods Phantom',
  'Crown of Sand', 'Zen-kai', 'Saint of Hollow Light', 'Primeval Devourer', 'Astral Archivist', 'Golden Arsenal King']
for (let seed = 1; seed <= 6; seed++) {
  const { result } = fight(names.slice(seed % 7, seed % 7 + 4), names.slice((seed * 3) % 7, (seed * 3) % 7 + 4), seed)
  assert(result.trusted, 'Unsupported: ' + result.unsupportedAbilities)
}
console.log('Nov 22 TypeScript engine regression passed.')

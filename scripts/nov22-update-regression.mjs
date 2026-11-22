import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'

/**
 * Nov 22 2026 game update, checked in the deployed Depths worker (browser/depths-worker.js).
 * Source: Card Rng Update (2).rbxlx (Cards, Abilities and AuraCards modules). The export has the
 * ability TEXT but no server combat code, so these tests pin the text-based model; none of the
 * 11 new abilities is DummyLab-verified yet.
 */
const source = readFileSync('browser/depths-worker.js', 'utf8')
const exposed = source.replace(/\}\)\(\);\s*$/,
  'self.__n22={Ee,Be,Te,ws,aa,__nov22Mult,__nov22Enter,__nov22Final,__nov22Heal};})();')
assert.notEqual(exposed, source, 'Unable to expose the Depths worker')
const fake = { navigator: { hardwareConcurrency: 1 }, location: { href: 'mock' }, postMessage() {} }
new Function('self', 'performance', exposed)(fake, performance)
const w = fake.__n22

const power = card => Math.pow(2, Math.log10(card.rarity)) * 10 * (card.statMultiplier || 1)
// scale multiplies the dummy's HP; atk (default = scale) its ATK, so tanky low-damage dummies are easy to build.
function fight(attackers, dummies, seed, scale = 1, atk = scale) {
  const enemies = dummies.map(name => {
    const card = w.Be(name)
    assert(card, 'Missing card ' + name)
    const p = power(card)
    return { card, power: p * scale, attack: p / 2 * atk, health: p * scale * (card.hpMultiplier || 1) }
  })
  return w.Ee({ cards: attackers.map(cardName => ({ cardName, borders: [], mutationWeather: null })) }, enemies, seed, 10_000, true, true)
}
const details = (r, text, team) => r.debug.events.filter(e => e.detail?.includes(text) && (!team || e.team === team))

// --- card data: exact values from the Cards module ---
const expected = {
  'The Ultimate General': [500e6, 1, 1, 'Supreme Eye', null, 'Anime'],
  'Shadow Sovereign': [10e9, 1, 1, 'Arise', null, 'Anime'],
  'One-Winged Cataclysm': [5e9, 1, 1, 'Black Meteor', null, 'Video Game'],
  'Azure Judicator': [20e9, 1, 2, 'Judgment Divide', null, 'Video Game'],
  'Flatwoods Phantom': [55e6, 6, 1, 'Noxious Arrival', 'Virus', 'Cryptid'],
  'Crown of Sand': [750e6, 1, 1, "Pharaoh's Judgment", null, 'Egypt'],
  'Zen-kai': [1e9, 1, 2, 'Relentless Assault', null, 'Rising Sun'],
  'Saint of Hollow Light': [35e6, 5, 1, 'Sacred Intervention', 'Eclipse', 'Immortal'],
  'Primeval Devourer': [2e9, 1, 1, 'Apex Predator', null, 'Prehistoric'],
  'Astral Archivist': [3e9, 1, 1, 'Celestial Protection', null, 'Era2'],
  'Golden Arsenal King': [150e6, 3, 1, 'Vault of Blades', 'Rapture', 'Anime'],
}
for (const [name, [rarity, stat, hp, ability, weather, pack]] of Object.entries(expected)) {
  const c = w.Be(name)
  assert(c, 'Worker is missing ' + name)
  assert.deepEqual([c.rarity, c.statMultiplier, c.hpMultiplier, c.ability, c.weather, c.pack], [rarity, stat, hp, ability, weather, pack], name)
  assert(!c.unobtainable && !c.expires, name + ' is a regular collectible card')
}

// --- auras ---
const herald = w.Te('Herald Of Virtue'), convergence = w.Te('Mythic Convergence')
assert(herald && convergence, 'New auras are missing from the worker')
assert.equal(w.ws(herald, { definition: w.Be('Wizard') }, null), 32, 'Herald uses StatRarity 1M: 2^6/2 = 32%')
assert.equal(w.ws(herald, { definition: w.Be('Wizard') }, 'Galaxy'), 256)
assert.equal(w.ws(herald, { definition: w.Be('Kaelis the Absolute') }, 'Galaxy'), 414, 'Virtue cards get x1.6171875 (same as Dinosaur King)')
assert.equal(w.ws(convergence, { definition: w.Be('Wizard') }, null), 25, 'Mythic Convergence: 256 x 0.09765625 = 25%')
assert.deepEqual(['Platinum', 'Crystal', 'Galaxy'].map(b => w.ws(convergence, { definition: w.Be('Wizard') }, b)), [50, 100, 200])
assert.equal(w.ws(convergence, { definition: w.Be('Abyssal Siren') }, 'Galaxy'), 300, 'Mythical collection cards get x1.5')
assert.equal(w.ws(convergence, { definition: w.Be('Flatwoods Phantom') }, 'Galaxy'), 200, 'A plain weather card is not Mythical')
for (const name of ['Capricorn', "Jack-o'-Lantern"]) {
  assert.deepEqual([null, 'Platinum', 'Crystal', 'Galaxy'].map(b => w.aa(w.Te(name), b)), [10, 15, 20, 25], name + ' scales with aura borders')
}

// --- abilities ---
{ // Supreme Eye: evades the first normal attack from each enemy card once, then counters
  let evades = 0, counters = 0
  for (let seed = 1; seed <= 10; seed++) {
    const r = fight(['The Ultimate General'], ['Wizard', 'Archer', 'Dancer'], seed)
    const e = details(r, 'Supreme Eye evaded', 'Allies')
    assert(e.length <= 3, 'At most one evade per enemy card')
    assert.equal(new Set(e.map(x => x.detail)).size, e.length, 'Never evades the same enemy twice')
    evades += e.length
    counters += r.debug.events.filter(x => x.type === 'attack' && x.team === 'Allies' && x.card === 'The Ultimate General').length
  }
  assert(evades >= 10, 'Supreme Eye should evade in real fights, got ' + evades)
}
{ // Arise: kills become Shadows (max 3), each normal attack adds one strike per Shadow
  const r = fight(['Shadow Sovereign'], ['Wizard', 'Archer', 'Dancer', 'Cave Goblin', 'Good Boy'], 3)
  const shadows = details(r, 'became a Shadow', 'Allies')
  assert(shadows.length === 3, 'Five weak kills should cap at 3 Shadows, got ' + shadows.length)
  assert(details(r, 'Shadow (3/3)').length === 1)
}
{ // Black Meteor: once per battle, after 3 allied normal attacks
  for (let seed = 1; seed <= 5; seed++) {
    const r = fight(['One-Winged Cataclysm'], ['Wizard', 'Wizard'], seed, 5e5, 1)
    assert(details(r, 'Black Meteor struck', 'Allies').length <= 1, 'Black Meteor is once per battle')
  }
  const r = fight(['One-Winged Cataclysm'], ['Wizard', 'Wizard'], 1, 5e5, 1)
  assert.equal(details(r, 'Black Meteor struck', 'Allies').length, 1, 'Black Meteor fires after 3 normal attacks')
}
{ // Judgment Divide: every 3rd normal attack, 3 strikes on every enemy
  const r = fight(['Azure Judicator'], ['Wizard', 'Wizard'], 2, 5e5, 1)
  assert(r.debug.events.some(e => e.type === 'ability' && e.ability === 'Judgment Divide' || e.detail?.includes('Judgment Divide')), 'Judgment Divide should trigger')
}
{ // Noxious Arrival: the first heal of a misted enemy fails and hurts instead
  let fails = 0
  for (let seed = 1; seed <= 10; seed++) {
    const r = fight(['Flatwoods Phantom'], ['Count Muscula'], seed, 50, 0.5)
    const f = details(r, 'Toxic mist made the heal fail', 'Enemies')
    assert(f.length <= 1, 'Only the first heal fails')
    fails += f.length
  }
  assert(fails >= 1, 'Lifesteal under the mist should trip the failed heal')
}
{ // Pharaoh's Judgment: marks the highest-HP enemy; 3 boosted allied normal attacks
  const r = fight(['Crown of Sand'], ['Wizard', 'Kraken', 'Archer'], 4, 1, 0.01)
  const mark = details(r, "Pharaoh's Judgment marked", 'Allies')
  assert.equal(mark.length, 1)
  assert(mark[0].detail.includes('Kraken'), 'Highest-HP enemy is marked')
  assert(details(r, "Pharaoh's Judgment mark: +50%").length <= 3)
}
{ // Relentless Assault: +25% per consecutive hit on the same enemy, up to +100%; resets on a new target
  const zen = { id: 'z', team: 'Allies', definition: w.Be('Zen-kai'), hp: 1, maxHp: 1, damage: 1, dead: false, flags: {}, counters: {}, status: {}, borders: [] }
  const t1 = { id: 't1', team: 'Enemies', definition: w.Be('Wizard'), hp: 1, maxHp: 1, damage: 1, dead: false, flags: {}, counters: {}, status: {}, borders: [] }
  const t2 = { ...t1, id: 't2', counters: {} }
  const a = { state: { teams: { Allies: [zen], Enemies: [t1, t2] }, fallen: { Allies: [], Enemies: [] }, boosts: { Allies: {}, Enemies: {} }, turn: 1 }, rng: { next: () => .5 }, debug: { events: [] }, captureDebug: false, __nov22Normal: zen }
  const mults = [t1, t1, t1, t1, t1, t1, t2, t2].map(t => w.__nov22Mult(a, zen, t))
  assert.deepEqual(mults, [1, 1.25, 1.5, 1.75, 2, 2, 1, 1.25])
  a.__nov22Normal = null
  assert.equal(w.__nov22Mult(a, zen, t1), 1, 'Only normal attacks are boosted')
}
{ // Sacred Intervention: the first lethal normal attack on an ally deals 30% less, once per battle
  const r = fight(['Wizard', 'Saint of Hollow Light'], ['Kraken'], 5, 1)
  assert.equal(details(r, 'Sacred Intervention cut', 'Allies').length, 1, 'Fires exactly once')
}
{ // Apex Predator: x1.2 stats per Fossil
  const dev = { id: 'd', team: 'Allies', definition: w.Be('Primeval Devourer'), hp: 100, maxHp: 100, damage: 50, dead: false, flags: {}, counters: {}, status: { shield: 0 }, borders: [] }
  const foe = { id: 'f', team: 'Enemies', definition: w.Be('Wizard'), hp: 100, maxHp: 100, damage: 1, dead: false, flags: {}, counters: {}, status: { shield: 0 }, borders: [] }
  const a = { state: { teams: { Allies: [dev], Enemies: [foe] }, fallen: { Allies: [], Enemies: [] }, boosts: { Allies: { fossils: 2 }, Enemies: {} }, turn: 1 }, rng: { next: () => .5 }, debug: { events: [] }, captureDebug: false }
  w.__nov22Enter(a, dev)
  assert.ok(Math.abs(dev.damage - 72) < 1e-9 && Math.abs(dev.maxHp - 144) < 1e-9, 'Two Fossils give x1.44')
  w.__nov22Enter(a, dev)
  assert.ok(Math.abs(dev.damage - 72) < 1e-9, 'Entry buff applies once per card')
}
{ // Celestial Protection: 25% max HP shield on every ally; breaking it costs the attacker that much
  const r = fight(['Astral Archivist', 'Wizard'], ['Kraken'], 6, 3, 0.3)
  assert(details(r, 'Celestial shield absorbed', 'Allies').length >= 1)
  assert(details(r, 'Breaking the shield cost', 'Allies').length >= 1)
}
{ // Vault of Blades: 5-20 weapons per enemy on entry, each 5% damage
  for (let seed = 1; seed <= 20; seed++) {
    const r = fight(['Golden Arsenal King'], ['Kraken', 'Kraken', 'Kraken'], seed, 3, 0.01)
    const volleys = details(r, 'Vault of Blades fired', 'Allies')
    assert.equal(volleys.length, 3, 'One volley per enemy on entry')
    for (const v of volleys) {
      const n = Number(v.detail.match(/fired (\d+) weapons/)[1])
      assert(n >= 5 && n <= 20, 'Weapon count out of range: ' + n)
    }
  }
}
{ // Toxic mist heal guard: -30% healing after the first (failed) heal
  const c = { id: 'c', team: 'Enemies', definition: w.Be('Wizard'), hp: 50, maxHp: 100, damage: 1, dead: false, flags: {}, counters: { nov22MistTurns: 2, nov22MistHeal: 1, nov22MistDamage: 10 }, status: {}, borders: [] }
  const a = { state: { teams: { Allies: [], Enemies: [c] } }, debug: { events: [] }, captureDebug: false }
  w.__nov22Heal(a, () => { c.hp += 20 })
  assert.equal(c.hp, 40, 'First heal fails and deals the Phantom damage instead')
  w.__nov22Heal(a, () => { c.hp += 20 })
  assert.equal(c.hp, 54, 'Later heals are 30% weaker')
}

// --- Flying Dutchman fix: swapping cards to the front never repeats an on-entry ability ---
{
  for (let seed = 1; seed <= 5; seed++) {
    const r = fight(['Flying Dutchman', 'Golden Arsenal King', 'Astral Archivist', 'Crown of Sand'], ['Kraken'], seed, 50, 0.001)
    const entries = r.debug.events.filter(e => e.type === 'entry' && e.team === 'Allies')
    assert(entries.length >= 2, 'Eternal Voyage should swap other cards to the front')
    assert.equal(new Set(entries.map(e => e.card)).size, entries.length, 'Each card enters once, however often it is swapped back')
    for (const text of ['Vault of Blades fired', 'Celestial Protection shielded', "Pharaoh's Judgment marked"])
      assert(details(r, text, 'Allies').length <= 1, text + ' repeated after an Eternal Voyage swap (seed ' + seed + ')')
  }
}

// --- Stolen Spotlight: steal at most 250% of its own stats ---
assert(source.includes('e.damage+=Math.min(o.damage*.75,e.damage*2.5)'), 'Stolen Spotlight cap is in the worker')

// --- full live battles with every new card, both sides, stay finite and trusted ---
{
  const names = Object.keys(expected)
  for (let seed = 1; seed <= 6; seed++) {
    const team = names.slice((seed * 2) % names.length).concat(names).slice(0, 4)
    const foes = names.slice((seed * 3) % names.length).concat(names).slice(0, 4)
    const r = fight(team, foes, seed)
    assert(['Allies', 'Enemies', 'Draw'].includes(r.winner), 'Battle must finish')
    assert(!r.unsupportedAbilities?.some(a => names.some(n => expected[n][3] === a)), 'New abilities must not be reported unsupported: ' + r.unsupportedAbilities)
  }
}
console.log('Nov 22 update regression passed: 11 cards, 2 auras, Capricorn/Jack-o\'-Lantern border scaling, Dutchman entry guard, Stolen Spotlight cap.')

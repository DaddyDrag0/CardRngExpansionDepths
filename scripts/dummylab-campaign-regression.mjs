import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'

/**
 * DummyLab campaign 2026-11-20 (unbordered, 1x, no auras, 5% PvE bonus on player cards).
 * Nüwa vs Loki (b15 + cmp-00/004-006): Loki's God of Trickery copies Nüwa, and the copied
 * Creation and Restoration runs at once, so Loki's side also gets a created card (cmp-00/006:
 * a second dummy card appears when Loki-as-Nüwa falls). The old sim gave Nüwa 60/60; the game went
 * player, player, dummy.
 */
const GEM = 1.05
function load(file) {
  const source = readFileSync(file, 'utf8')
  const exposed = source.replace('var __redGemMultiplier=1;', `var __redGemMultiplier=${GEM};`)
    .replace(/\}\)\(\);\s*$/, 'self.__dlCR={Ee,Be};})();')
  assert.notEqual(source, exposed, 'Unable to expose ' + file)
  const fake = { navigator: { hardwareConcurrency: 1 }, location: { href: 'mock' }, postMessage() {} }
  new Function('self', 'performance', exposed)(fake, performance)
  return fake.__dlCR
}
function fight({ Ee, Be }, attackers, dummies, seed) {
  const power = card => Math.pow(2, Math.log10(card.rarity)) * 10 * (card.statMultiplier || 1)
  const enemies = dummies.map(name => {
    const card = Be(name), p = power(card)
    return { card, power: p, attack: p / 2, health: p * (card.hpMultiplier || 1) }
  })
  return Ee({ cards: attackers.map(cardName => ({ cardName, borders: [], mutationWeather: null })) }, enemies, seed, 10_000, true, true)
}
for (const file of ['browser/depths-worker.js', 'browser/tower-worker.js']) {
  const s = readFileSync(file, 'utf8')
  assert.ok(/case"God of Trickery":\{[^}]*i\.definition\.ability==="Creation and Restoration"&&\(e\.entered=!1,\w+\(a,e\)\);break\}/.test(s), file + ' Loki runs a copied Creation and Restoration')
}
const engine = load('browser/depths-worker.js')
const tally = { Allies: 0, Enemies: 0 }
let lokiSpawned = 0
for (let seed = 1; seed <= 60; seed++) {
  const r = fight(engine, ['Nüwa'], ['Loki'], seed)
  tally[r.winner] = (tally[r.winner] || 0) + 1
  if (r.debug.events.some(e => e.type === 'spawn' && e.team === 'Enemies')) lokiSpawned++
}
assert.ok(lokiSpawned >= 55, `Loki should almost always create a card after copying Nüwa, got ${lokiSpawned}/60`)
assert.ok(tally.Allies >= 10 && tally.Enemies >= 10, `Nüwa vs Loki should be a real coin flip, got ${JSON.stringify(tally)}`)
// Zombie Dragon vs Three-Legged Golden Crow+The Sandman+Tornado (cmp-02/016): Zombie Dragon kills Tornado
// on the turn its Unholy Creature survival runs out; the game ends the battle first and gives the player the win.
for (const file of ['browser/depths-worker.js', 'browser/tower-worker.js']) {
  const s = readFileSync(file, 'utf8')
  assert.ok(/\.teams\.Allies\.length&&\w\.teams\.Enemies\.length&&\w+\(\w\),\w\(\w\),/.test(s), file + ' Unholy Creature expiry waits for a live battle')
}
for (const seed of [1, 2, 3])
  assert.equal(fight(engine, ['Zombie Dragon'], ['Three-Legged Golden Crow', 'The Sandman', 'Tornado'], seed).winner, 'Allies', `Zombie Dragon should win after killing Tornado, seed ${seed}`)
console.log(`dummylab-campaign-regression: Nüwa vs Loki ${JSON.stringify(tally)}, Zombie Dragon Unholy finish ok`)

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'

/**
 * Ability audit 2026-11-21 fixes:
 * - Prehistoric Wrath (Behemoth): ATK x2 per kill, compounding (Drago tested in game). It was applied twice (after-hit
 *   and on-death), giving x4 per kill.
 * - Hidden in the Depths (Loch Ness) grows on both sides, not only the player's.
 * - Siren's Song rolls its 30% charm when an ENEMY of the Siren enters, not when a card on the Siren's side enters.
 * - Replay/debug number formatter no longer strips zeros from whole numbers (140k showed as "14k").
 */
function load(file) {
  const source = readFileSync(file, 'utf8')
  const exposed = source.replace('var __redGemMultiplier=1;', 'var __redGemMultiplier=1.05;')
    .replace(/\}\)\(\);\s*$/, 'self.__dlAF={Ee,Be};})();')
  assert.notEqual(source, exposed, 'Unable to expose ' + file)
  const fake = { navigator: { hardwareConcurrency: 1 }, location: { href: 'mock' }, postMessage() {} }
  new Function('self', 'performance', exposed)(fake, performance)
  return fake.__dlAF
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
  assert.ok(s.includes('case"Prehistoric Wrath":break'), file + ' Prehistoric Wrath has no after-hit doubling')
  assert.ok(!s.includes('if(e!=="Allies")return;'), file + ' Hidden in the Depths is not player-only')
  assert.ok(s.includes('if(enemies.some(x=>x.hp>0&&__v26Active(a,x,"Siren\'s Song"))'), file + " Siren's Song rolls on enemy entry")
  assert.ok(!s.includes('.replace(/\\.?0+$/,"")'), file + ' number formatter keeps whole-number zeros')
}
const engine = load('browser/depths-worker.js')
const r = fight(engine, ['Behemoth'], ['Ghoul', 'Ghoul', 'Ghoul'], 1)
const base = r.debug.events.find(e => e.type === 'entry' && e.card === 'Behemoth').damage
const wraths = r.debug.events.filter(e => e.type === 'ability' && e.ability === 'Prehistoric Wrath').map(e => e.damage)
assert.ok(wraths.length >= 2, 'Behemoth should kill at least two Ghouls')
assert.ok(Math.abs(wraths[0] / base - 2) < 1e-6, `first kill should double ATK, got x${wraths[0] / base}`)
assert.ok(Math.abs(wraths[1] / base - 4) < 1e-6, `second kill should give x4 total, got x${wraths[1] / base}`)
assert.ok(/ATK doubled to 69\.8k/.test(r.debug.events.filter(e => e.ability === 'Prehistoric Wrath')[1].detail), 'second kill detail shows 69.8k')
console.log('dummylab audit fixes regression ok')

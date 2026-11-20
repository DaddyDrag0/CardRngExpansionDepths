import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'

/**
 * DummyLab Shiny Steal pass 2026-11-19 (unbordered, 1x, no auras, 5% PvE bonus on player cards).
 * Read from the HP bars and ATK labels of 29 Jamiy fights (b2, b5, b10, b12, b14):
 *  - the hit uses Jamiy's ATK before the steal (Wind Spirit is left at ~1%, b14/018-019);
 *  - the steal drains 10% of the target's max HP from its current HP, max HP unchanged
 *    (Titan drops to 43% after Jamiy's first hit, not 59%; Inari's bar loses 10% per turn);
 *  - it lands after the target's own on-hit heals, so Skeleton King survives the third hit (b14/001-003);
 *  - it fires even when the hit is fully blocked (Inari's Final Tail, b14/008-009).
 * Open: Jamiy vs Shu (b14/012-013, game dummy 2/2) still goes to Jamiy.
 */
const GEM = 1.05
const SEEDS = [1, 2, 3]
function load(file) {
  const source = readFileSync(file, 'utf8')
  const exposed = source.replace('var __redGemMultiplier=1;', `var __redGemMultiplier=${GEM};`)
    .replace(/\}\)\(\);\s*$/, 'self.__dlSS={Ee,Be};})();')
  assert.notEqual(source, exposed, 'Unable to expose ' + file)
  const fake = { navigator: { hardwareConcurrency: 1 }, location: { href: 'mock' }, postMessage() {} }
  new Function('self', 'performance', exposed)(fake, performance)
  return fake.__dlSS
}
function fight({ Ee, Be }, attackers, dummies, seed) {
  const power = card => Math.pow(2, Math.log10(card.rarity)) * 10 * (card.statMultiplier || 1)
  const enemies = dummies.map(name => {
    const card = Be(name), p = power(card)
    return { card, power: p, attack: p / 2, health: p * (card.hpMultiplier || 1) }
  })
  return Ee({ cards: attackers.map(cardName => ({ cardName, borders: [], mutationWeather: null })) }, enemies, seed, 10_000, true, true)
}
const J = 'Jamiy the Bald One'
const SIDE = { player: 'Allies', dummy: 'Enemies' }
const WINNERS = [
  ['b2/044, b10/015-017, b12/001-003, b14/014-015', ['Titan'], [J], 'dummy'],
  ['b14/016-017', ['ToadBoiGaming'], [J], 'dummy'],
  ['b14/018-019 kept', ['Wind Spirit'], [J], 'player'],
  ['b14/020-021 kept', ['Bad Boys'], [J], 'player'],
  ['b5b/055-056, b14/001-003 kept: Undead heals before the steal', [J], ['Skeleton King'], 'dummy'],
  ['b14/004-005', [J], ['Anubis'], 'player'],
  ['b14/006-007', [J], ['Count Muscula'], 'player'],
  ['b14/008-009 kept: steal through Final Tail', [J], ['Inari'], 'player'],
  ['b14/010-011', [J], ['Poison Witch'], 'player'],
]
for (const file of ['browser/depths-worker.js', 'browser/tower-worker.js']) {
  const s = readFileSync(file, 'utf8')
  assert.equal(s.split('"Shiny Steal",()=>').length, 2, file + ' Shiny Steal fires from one place')
  assert.ok(/\w\(a,e,"Shiny Steal"\)&&t!==e&&\w\(a,e,"Shiny Steal",\(\)=>\{let (\w)=t\.damage\*\.1,(\w)=t\.maxHp\*\.1;t\.damage=Math\.max\(0,t\.damage-\1\),t\.hp-=\2,/.test(s), file + ' Shiny Steal drains current HP after the target heals')
}
const engine = load('browser/depths-worker.js')
for (const [id, attackers, dummies, want] of WINNERS)
  for (const seed of SEEDS)
    assert.equal(fight(engine, attackers, dummies, seed).winner, SIDE[want], `${id} seed ${seed}: ${attackers.join('+')} vs ${dummies.join('+')} should go to the ${want}`)
// Titan after Jamiy's first hit: 682 - 320 - 68 = 294 of 682 (43%, as in the video).
{
  const r = fight(engine, ['Titan'], [J], 1)
  const hit = r.debug.events.find(e => e.type === 'attack' && e.card === J)
  const after = hit.targetHpAfter / hit.targetMaxHp
  assert.ok(after < 0.5, `Titan should drop below 50% after Jamiy's first hit, got ${(100 * after).toFixed(1)}%`)
}
console.log(`dummylab-shiny-steal-regression: ${WINNERS.length} winners x ${SEEDS.length} seeds ok`)

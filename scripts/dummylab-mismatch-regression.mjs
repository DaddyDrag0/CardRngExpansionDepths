import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'

/**
 * DummyLab mismatch pass 2026-11-19 (unbordered, 1x, no auras, 5% PvE bonus on player cards).
 * Read frame by frame from the recordings' HP bars:
 *   Kitchen      - entry only opens the Domain; on each of its turns The Curse slashes 2-5 times for 35% ATK
 *                  (b5b/135-136: Pangu dropped in ~10% steps, 2-5 per Curse turn, never before Pangu's first attack;
 *                  b3/088: no hit on Ultimate Brawler before its first attack).
 *   Viral Breath - the Infected Maw loses 25% of its own max HP at the start of each of its turns; the opponent's
 *                  bar does not move (b5b/053-054, b2/153, b3/043).
 *   Ouroboros    - stolen stats last through Eonus' 4th attack (b4/037-038: Heaven's Armor fell to the 3rd hit
 *                  and never attacked again).
 */
const GEM = 1.05
const SEEDS = [1, 2, 3]

function load(file) {
  const source = readFileSync(file, 'utf8')
  const exposed = source.replace('var __redGemMultiplier=1;', `var __redGemMultiplier=${GEM};`)
    .replace(/\}\)\(\);\s*$/, 'self.__dlMM={Ee,Be};})();')
  assert.notEqual(source, exposed, 'Unable to expose ' + file)
  const fake = { navigator: { hardwareConcurrency: 1 }, location: { href: 'mock' }, postMessage() {} }
  new Function('self', 'performance', exposed)(fake, performance)
  return fake.__dlMM
}
function fight({ Ee, Be }, attackers, dummies, seed) {
  const power = card => Math.pow(2, Math.log10(card.rarity)) * 10 * (card.statMultiplier || 1)
  const enemies = dummies.map(name => {
    const card = Be(name), p = power(card)
    return { card, power: p, attack: p / 2, health: p * (card.hpMultiplier || 1) }
  })
  return Ee({ cards: attackers.map(cardName => ({ cardName, borders: [], mutationWeather: null })) }, enemies, seed, 10_000, true, true)
}
const SIDE = { player: 'Allies', dummy: 'Enemies' }
const WINNERS = [
  ['ovn-b4/037-038 Ouroboros lasts 4 attacks', ['Eonus'], ['Titan', "Heaven's Armor", 'Ragon'], 'player'],
  ['ovn-b7/001-003 kept', ['Eonus'], ["Heaven's Armor"], 'player'],
  ['ovn-b7/004-005 kept', ['Eonus'], ["Heaven's Armor", "Heaven's Armor"], 'dummy'],
  ['ovn-b5b/053-054 + b2/153 Viral Breath costs the Maw', ['Infected Maw'], ['Titan'], 'dummy'],
  ['b3/043 kept', ['Titan'], ['Infected Maw'], 'player'],
  ['b3/088 kept', ['Ultimate Brawler'], ['The Curse'], 'player'],
  ['ovn-b9/055-056 + b10/001-004 Restoration outlasts Unforgiving', ['Revenant'], ['Shu'], 'dummy'],
  ['b3/071 kept: Unforgiving still kills Titan', ['Revenant'], ['Titan'], 'player'],
  ['ovn-b5/041-042 kept: Restoration does not save Shu from a normal lethal hit', ['Hollow'], ['Shu'], 'player'],
]

const engine = load('browser/depths-worker.js')
for (const [id, attackers, dummies, want] of WINNERS)
  for (const seed of SEEDS)
    assert.equal(fight(engine, attackers, dummies, seed).winner, SIDE[want], `${id} seed ${seed}: ${attackers.join('+')} vs ${dummies.join('+')} should go to the ${want}`)

// Kitchen: nothing lands before Pangu's first attack except The Curse's own turn-1 slashes (2-5, each ~10% of Pangu),
// every Curse turn slashes 2-5 times, and the matchup is close (the game split it, the old engine gave the player 60/60).
{
  let dummyWins = 0
  for (let seed = 1; seed <= 40; seed++) {
    const r = fight(engine, ['The Curse'], ['Pangu'], seed)
    if (r.winner === 'Enemies') dummyWins++
    const perTurn = {}
    for (const e of r.debug.events) {
      if (e.type !== 'attack' || e.card !== 'The Curse') continue
      perTurn[e.turn] = (perTurn[e.turn] || 0) + 1
      const share = e.damageDealt / e.targetMaxHp
      if (e.targetHpAfter > 0) assert.ok(share > 0.07 && share < 0.13, `seed ${seed}: Kitchen slash took ${(100 * share).toFixed(1)}% of Pangu`)
    }
    for (const [turn, n] of Object.entries(perTurn)) assert.ok(n >= 2 && n <= 5 || Number(turn) === r.turns, `seed ${seed} turn ${turn}: ${n} slashes`)
  }
  assert.ok(dummyWins >= 8 && dummyWins <= 32, `The Curse vs Pangu should be close, got ${dummyWins}/40 dummy wins`)
}
// Viral Breath: Titan's bar never moves from the Maw's ability; the Maw pays 25% on its own turn.
{
  const r = fight(engine, ['Titan'], ['Infected Maw'], 1)
  const vb = r.debug.events.filter(e => e.type === 'ability' && e.ability === 'Viral Breath')
  assert.ok(vb.length > 0, 'Viral Breath should fire')
  for (const e of vb) assert.equal(e.card, 'Infected Maw')
  const titanHits = r.debug.events.filter(e => e.type === 'attack' && e.target === 'Titan')
  for (const e of titanHits) assert.equal(e.card, 'Infected Maw', 'only the Maw attack should damage Titan')
}
for (const file of ['browser/depths-worker.js', 'browser/tower-worker.js']) {
  const s = readFileSync(file, 'utf8')
  assert.ok(s.includes('case"Kitchen":{e.flags.kitchenDomain=!0;break}'), file + ' Kitchen entry opens the Domain only')
  assert.ok(/f\(a,e,"Kitchen"\)&&\(i=Math\.max\(i,2\+Math\.floor\(\w\(a,e\.team\)\*4\)\)\)/.test(s), file + ' Kitchen slashes every turn')
  assert.ok(/f\(a,e,"Viral Breath"\)&&\w\(a,e,"Viral Breath",\(\)=>\{e\.hp-=e\.maxHp\*\.25\}\)/.test(s), file + ' Viral Breath costs its holder')
  assert.ok(s.includes('e.counters.ouroborosTurns=4,e.flags.ouroborosActive=!0'), file + ' Ouroboros 4 attacks')
  assert.ok(s.includes('case"Restoration":(s.hp>0||f(a,e,"Unforgiving"))&&(s.hp+=i*.7);'), file + ' Restoration heals through a lethal Unforgiving hit')
}
console.log(`dummylab-mismatch-regression: ${WINNERS.length} winners x ${SEEDS.length} seeds plus Kitchen, Viral Breath checks ok`)

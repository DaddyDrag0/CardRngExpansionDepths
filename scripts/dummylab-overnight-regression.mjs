import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'

/**
 * DummyLab overnight campaign 2026-11-19 (unbordered, 1x, no auras, 5% PvE bonus on player cards).
 * Each case was recorded repeatedly with the same winner and explained frame by frame:
 *   Rewrite Existence  - a card whose ability was erased before it entered gets no entry effect (Riftwalker's
 *                        Behind Reality never fires after The False Creator entered first); Rewrite keeps the False
 *                        Creator's HP fraction instead of refilling it (bar 29% before and after REWRITTEN).
 *   Hack               - a hacked card with no living ally hits itself (Priest lost 39% = its own ATK).
 *   Lucid Dream        - the bonus is the last hit another ally dealt to that enemy (remembered across turns), and
 *                        Perfect Reflection negates and reflects it (Mirrorborn took 35%, Lucid #2 died to one hit).
 *   Jealousy           - attack-time abilities (Crushing Depths) move to Sable too (her first hit took 72% =
 *                        47% ATK + 25% of Tidal Executioner's max HP).
 *   Frigid Touch       - freezes the card it hits; it never freezes its own holder when the holder is hit.
 */
const GEM = 1.05
const SEEDS = [1, 2, 3]

function load(file) {
  const source = readFileSync(file, 'utf8')
  const exposed = source.replace('var __redGemMultiplier=1;', `var __redGemMultiplier=${GEM};`)
    .replace(/\}\)\(\);\s*$/, 'self.__dlON={Ee,Be};})();')
  assert.notEqual(source, exposed, 'Unable to expose ' + file)
  const fake = { navigator: { hardwareConcurrency: 1 }, location: { href: 'mock' }, postMessage() {} }
  new Function('self', 'performance', exposed)(fake, performance)
  return fake.__dlON
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
const FC = 'The False Creator', RW = 'Riftwalker', LK = 'The Lucid Knight', MB = 'The Mirrorborn'
const WINNERS = [
  ['ovn-b2/001-003 + b1/255', [FC], [RW], 'player'],
  ['ovn-b2/004-006 + b2/255', [RW], [FC], 'player'],
  ['ovn-b2/041-043 + b2/130', ['D'], ['Priest'], 'player'],
  ['ovn-b2/058-060 + b3/234', [MB], [LK, LK], 'player'],
  ['ovn-b3/015-016 Jealousy takes Crushing Depths', ['Sable The Envious'], ['Tidal Executioner'], 'player'],
  ['ovn-b3/017-018 kept', ['Tidal Executioner'], ['Sable The Envious'], 'player'],
  // kept: recorded twice or more with the same winner, already matching
  ['ovn-b2/007-008 kept', [FC], [LK], 'player'],
  ['ovn-b2/009-010 kept', [LK], [FC], 'dummy'],
  ['ovn-b2/011-012 kept', [RW], [LK], 'player'],
  ['ovn-b2/013-014 kept', [LK], [RW], 'dummy'],
  ['ovn-b2/015-016 kept', [RW], ['Titan', LK], 'dummy'],
  ['ovn-b2/022-023 kept', ["Heaven's Armor"], ['Yamato no Orochi'], 'player'],
  ['ovn-b2/026-027 kept', ['Yamato no Orochi'], ["Heaven's Armor"], 'dummy'],
  ['ovn-b2/034-037 kept', ['Titan'], ['Ice Queen'], 'player'],
  ['ovn-b2/048-051 kept', ['George Washington'], ['Assassin King'], 'player'],
  ['ovn-b2/052-053 kept', ['Assassin King'], ["Heaven's Armor"], 'dummy'],
  ['ovn-b2/061-062 kept', [MB], [LK], 'player'],
  // Healing Miracle: the active Doctor heals to full at the start of its 3rd own turn (b6/001 bar 17% -> 100%)
  ['ovn-b2/017-019 + b6/001-003 Healing Miracle own turns', ['Divine Doctor'], ['Yamato no Orochi'], 'player'],
  ['ovn-b6/004-005 Healing Miracle from the backline then active', ['Titan', 'Divine Doctor'], ['Yamato no Orochi'], 'player'],
]

const engine = load('browser/depths-worker.js')
for (const [id, attackers, dummies, want] of WINNERS)
  for (const seed of SEEDS)
    assert.equal(fight(engine, attackers, dummies, seed).winner, SIDE[want], `${id} seed ${seed}: ${attackers.join('+')} vs ${dummies.join('+')} should go to the ${want}`)

// Rewrite Existence keeps the HP fraction: after Riftwalker's 200% entry strike the False Creator is not refilled.
{
  const r = fight(engine, [RW], [FC], 1)
  const strike = r.debug.events.find(e => e.type === 'attack' && e.targetTeam === 'Enemies')
  const next = r.debug.events.filter(e => e.type === 'attack' && e.targetTeam === 'Enemies')[1]
  assert.ok(next && next.targetHpBefore < next.targetMaxHp * 0.35, `False Creator should stay near 29% after Rewrite (got ${next?.targetHpBefore}/${next?.targetMaxHp}, strike ${strike?.damageDealt})`)
}
// Hack with no ally: the hacked Priest hits itself for its own ATK.
{
  const r = fight(engine, ['D'], ['Priest'], 1)
  const self = r.debug.events.find(e => e.type === 'attack' && e.card === 'Priest' && e.target === 'Priest')
  assert.ok(self, 'hacked Priest should attack itself')
}
// Frigid Touch: Ice Queen can win against Titan (it froze Titan in the recordings), and is never frozen by being hit.
{
  let wins = 0
  for (let seed = 1; seed <= 40; seed++) {
    const r = fight(engine, ['Ice Queen'], ['Titan'], seed)
    if (r.winner === 'Allies') wins++
    const selfFreeze = r.debug.events.find(e => e.type === 'ability' && e.card === 'Ice Queen' && /Frigid Touch/.test(e.ability || '') && e.team === 'Allies' && /self stun/.test(e.detail || ''))
    assert.ok(!selfFreeze, `seed ${seed}: Ice Queen froze itself`)
  }
  assert.ok(wins >= 8 && wins <= 32, `Ice Queen vs Titan should be a coin-flip-ish matchup, got ${wins}/40 player wins`)
}
for (const file of ['browser/depths-worker.js', 'browser/tower-worker.js']) {
  const s = readFileSync(file, 'utf8')
  assert.ok(s.includes('e.hp=e.maxHp*(baseHP>0?Math.min(1,e.hp/baseHP):1);target.flags.sealed=true;'), file + ' Rewrite Existence HP fraction')
  assert.ok(s.includes('a.state.v26LastAllied'), file + ' Lucid Dream ally memory')
  assert.ok(s.includes('case"Frigid Touch":break;'), file + ' Frigid Touch removed from the when-hit switch')
}
for (const file of ['browser/depths-worker.js', 'browser/tower-worker.js']) {
  const s = readFileSync(file, 'utf8')
  assert.ok(s.includes('__dlMiracle(') && s.includes('healingMiracleOwn'), file + ' Healing Miracle own-turn heal')
}
console.log(`dummylab-overnight-regression: ${WINNERS.length} winners x ${SEEDS.length} seeds plus Rewrite, Hack, Frigid Touch, Healing Miracle checks ok`)

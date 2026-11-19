import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'

/**
 * Stone Vigil (Living Gargoyle), from DummyLab Target Dummy recordings (batch stone-vigil-01-20261119 plus the
 * unbordered-900 batches): unbordered cards, 1x speed, no auras, the account's 5% PvE bonus on player cards.
 *
 * Measured from HP-bar drops: the Gargoyle takes 80% less damage from entry until its first own turn, full damage
 * after its 1st own turn (the turn it does not attack), and 80% less again after its 2nd own turn (the 2x attack),
 * and so on. The skip / 2x-attack timing itself is unchanged.
 */
const GEM = 1.05
const SEEDS = [1, 2, 3]

function load(file) {
  const source = readFileSync(file, 'utf8')
  const exposed = source.replace('var __redGemMultiplier=1;', `var __redGemMultiplier=${GEM};`)
    .replace(/\}\)\(\);\s*$/, 'self.__dlSV={Ee,Be};})();')
  assert.notEqual(source, exposed, 'Unable to expose ' + file)
  const fake = { navigator: { hardwareConcurrency: 1 }, location: { href: 'mock' }, postMessage() {} }
  new Function('self', 'performance', exposed)(fake, performance)
  return fake.__dlSV
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
const LG = 'Living Gargoyle'
// [recording, attacker deck, dummy deck, game winner]
const WINNERS = [
  // fixed by this change (the live simulator picked the other side)
  ['b1/027_def0079', [LG], ['Elara the Gentle'], 'dummy'],
  ['b1/029_def0085', [LG], ['Fate Seamstress'], 'dummy'],
  ['b1/242_myth0066', [LG], ['Gorilla', 'Tidal Executioner'], 'dummy'],
  ['b3/015_def0045', [LG], ['Cave Goblin God'], 'dummy'],
  ['b3/027_def0081', [LG], ['Eonus'], 'dummy'],
  ['b3/183_atk0220', ['Sable The Envious'], [LG], 'dummy'],
  ['b3/242_myth0068', [LG], ['Tidal Executioner', 'Tidal Executioner'], 'dummy'],
  ['sv/022 Jealousy', ['Sable The Envious'], [LG], 'dummy'],
  // kept: dedicated Stone Vigil recordings that already matched
  ['sv/001', [LG], ["Heaven's Armor"], 'player'],
  ['sv/003', [LG], ['Ragon', 'Ragon', 'Ragon'], 'player'],
  ['sv/005', [LG], ['Yamato no Orochi', 'Yamato no Orochi', 'Yamato no Orochi'], 'player'],
  ['sv/007', [LG], ['Gilgamesh'], 'player'],
  ['sv/008', [LG], ['Priest', 'Priest'], 'player'],
  ['sv/010', ["Heaven's Armor"], [LG], 'dummy'],
  ['sv/012', ['Ragon'], [LG], 'player'],
  ['sv/014', ['Yamato no Orochi'], [LG], 'dummy'],
  ['sv/015', ['Priest'], [LG], 'dummy'],
  ['sv/017', ['Gilgamesh'], [LG], 'player'],
  ['sv/018 slot 2', ['Trainee', LG], ["Heaven's Armor"], 'player'],
  ['sv/020 slot 2', ["Heaven's Armor"], ['Trainee', LG], 'dummy'],
  ['sv/021 slot 3', ['Ragon'], ['Trainee', 'Trainee', LG], 'player'],
  ['sv/024 Jealousy', [LG], ['Sable The Envious'], 'player'],
]
// Hits on the Gargoyle as % of its max HP, in order, read from the HP bar (killing blows left out).
const HITS = [
  ['sv/010', ["Heaven's Armor"], [LG], 'Enemies', [4, 23, 3, 22]],
  ['sv/015', ['Priest'], [LG], 'Enemies', [2, 3, 19, 18]],
  ['sv/017', ['Gilgamesh'], [LG], 'Enemies', [6, 28, 5, 26, 6]],
  ['sv/005', [LG], ['Yamato no Orochi', 'Yamato no Orochi', 'Yamato no Orochi'], 'Allies', [7, 1, 9, 1, 7]],
  ['sv/007', [LG], ['Gilgamesh'], 'Allies', [18, 2, 19, 4, 16]],
]

const engine = load('browser/depths-worker.js')
for (const [id, attackers, dummies, want] of WINNERS) {
  for (const seed of SEEDS) {
    const r = fight(engine, attackers, dummies, seed)
    assert.equal(r.winner, SIDE[want], `${id} seed ${seed}: ${attackers.join('+')} vs ${dummies.join('+')} should go to the ${want}`)
  }
}
for (const [id, attackers, dummies, team, seen] of HITS) {
  const r = fight(engine, attackers, dummies, 1)
  const sim = r.debug.events
    .filter(e => e.type === 'attack' && e.damageDealt > 0 && e.targetTeam === team && e.targetHpAfter > 0)
    .map(e => 100 * e.damageDealt / e.targetMaxHp)
  for (let i = 0; i < seen.length; i++) {
    assert.ok(Math.abs(sim[i] - seen[i]) <= 3.5, `${id} hit ${i + 1}: game ${seen[i]}%, simulator ${sim[i]?.toFixed(1)}% (${sim.map(x => x.toFixed(0)).join(',')})`)
  }
}
for (const file of ['browser/depths-worker.js', 'browser/tower-worker.js']) {
  assert.ok(readFileSync(file, 'utf8').includes('case"Stone Vigil":(s.counters.stoneTurns||0)%2===0&&(t*=.2);'), file + ' Stone Vigil reduction rule')
}
console.log(`dummylab-stone-vigil-regression: ${WINNERS.length} winners x ${SEEDS.length} seeds, ${HITS.length} hit sequences ok`)

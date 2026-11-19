import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'

/**
 * Ground truth: DummyLab Target Dummy recordings, batches unbordered-900-b1/b2/b3-20261118 (no borders on either
 * side, the account's 5% PvE red-gem bonus on the player's cards). Every fight below has a game winner confirmed
 * from the recording (death animation and HP bars). "fixed" fights failed before the v5 engine fixes; "kept"
 * fights already matched and must keep matching.
 *   P0 player-card stat floor only lifts cards with a rarity-tier upgrade (Immortal Witch 0.8, Susanoo 0.9)
 *   P1 noAttack cards (The Sandman, Buddha) never attack
 *   P2 newer abilities obey Jealousy / Honor suppression (no End Times roll)
 *   P3 Perfect Reflection returns Eternal Slumber / Eternal Stillness turn skips
 *   P6 Accelerate adds one turn per cycle
 *   P4 both sides knocked out on the same turn: the side taking its turn wins, unless The Fall killed that attacker
 *      (then the defender wins); a 150-turn stall resolution stays a Draw
 */
const GEM = 1.05
const SEEDS = [1, 2, 3] // the seeds the DummyLab verifier compares with

function load(file) {
  const source = readFileSync(file, 'utf8')
  const exposed = source.replace('var __redGemMultiplier=1;', `var __redGemMultiplier=${GEM};`)
    .replace(/\}\)\(\);\s*$/, 'self.__dlV5={Ee,Be};})();')
  assert.notEqual(source, exposed, 'Unable to expose ' + file)
  const fake = { navigator: { hardwareConcurrency: 1 }, location: { href: 'mock' }, postMessage() {} }
  new Function('self', 'performance', exposed)(fake, performance)
  return fake.__dlV5
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
const CASES = [
  // P1 noAttack
  ['b2/240_myth0061 fixed', ['The Waking Comet'], ['The Sandman', 'Legends'], 'player'],
  ['b3/178_atk0205 fixed', ['Pumpkin King'], ['The Sandman'], 'player'],
  ['b3/201_atk0274 fixed', ['The Lucid Knight'], ['The Sandman'], 'player'],
  ['b3/202_atk0277 fixed', ['The Rake'], ['The Sandman'], 'player'],
  ['b3/233_myth0041 fixed', ['The Lucid Knight'], ['The Sandman', 'Legends'], 'player'],
  // P2 Jealousy vs newer abilities
  ['b1/250_inter0022 fixed', ['Veyrath the Unyielding'], ['Sable The Envious'], 'dummy'],
  ['b2/250_inter0023 fixed', ['Sable The Envious'], ['Gunslinger', 'Veyrath the Unyielding'], 'player'],
  ['b3/249_inter0021 fixed', ['Sable The Envious'], ['Veyrath the Unyielding'], 'player'],
  // P3 Perfect Reflection
  ['b1/228_myth0024 fixed', ['The Mirrorborn'], ['The Dreaming Shepherd', 'The Dreaming Shepherd'], 'player'],
  ['b2/187_atk0231 fixed', ['Serenity the Serene'], ['The Mirrorborn'], 'dummy'],
  // P6 Accelerate
  ['b1/178_atk0203 fixed', ['Priest'], ['Veyrath the Unyielding'], 'dummy'],
  // P4 same-turn double knockout: the side taking its turn wins; The Fall killing the attacker hands it to the defender
  ['b2/166_atk0168 fixed', ['Meteosaurus'], ['Velociraptor'], 'player'],
  ['b3/056_def0168 fixed', ['Velociraptor'], ['Meteosaurus'], 'dummy'],
  ['b3/114_atk0013 fixed', ['Ankylosaurus'], ['Gorilla'], 'dummy'],
  ['b2/132_atk0066 fixed', ['Demon Hunter'], ['Trainee'], 'dummy'],
  ['b1/053_def0157 fixed', ['Titan'], ['Lucifer'], 'dummy'],
]
const KEPT = JSON.parse(readFileSync(new URL('./dummylab-v5-kept-fights.json', import.meta.url), 'utf8'))

for (const file of ['browser/depths-worker.js']) {
  const engine = load(file)
  for (const [id, attackers, dummies, want] of [...CASES, ...KEPT]) {
    for (const seed of SEEDS) {
      const r = fight(engine, attackers, dummies, seed)
      assert.equal(r.winner, SIDE[want], `${id} seed ${seed}: ${attackers.join(', ')} vs ${dummies.join(', ')} should be won by the ${want}`)
    }
  }

  // P0: stat multiplier floor
  const { Be } = engine
  for (const [name, stat] of [['Immortal Witch', 0.8], ['Susanoo', 0.9], ['Triceratops', null], ['Kraken', null]]) {
    const card = Be(name)
    const expected = stat ?? (Number(card.rarityTier) > 1 ? Math.max(card.statMultiplier, card.rarityTier) : card.statMultiplier)
    const r = fight(engine, [name], ['Trainee'], 1)
    const got = r.debug.initialAllies[0].power / (Math.pow(2, Math.log10(card.rarity)) * 10 * GEM)
    assert.ok(Math.abs(got - expected) < 1e-6, `${name}: stat multiplier ${got}, expected ${expected}`)
  }

  // P1: The Sandman never attacks
  for (const seed of SEEDS) {
    const r = fight(engine, ['The Sandman'], ['Trainee', 'Trainee'], seed)
    const attacks = r.debug.events.filter(e => e.type === 'attack' && e.card === 'The Sandman')
    assert.equal(attacks.length, 0, 'The Sandman made a normal attack')
  }
}

// Every hand-maintained worker copy carries the same fixes.
for (const file of ['browser/depths-worker.js', 'browser/tower-worker.js']) {
  const s = readFileSync(file, 'utf8')
  assert.ok(s.includes(':(Number(r.statMultiplier)||1)'), file + ': P0 stat floor fix missing')
  assert.ok(/function \w+\(a,e\)\{return e\.definition\?\.noAttack===true\|\|/.test(s), file + ': P1 noAttack fix missing')
  assert.ok(s.includes('if(name!=="Honor"&&'), file + ': P2 suppression fix missing')
  assert.ok(s.includes('"Perfect Reflection"&&src?src:enemy'), file + ': P3 Slumber reflection fix missing')
  assert.ok(s.includes('==="Perfect Reflection"?e:c'), file + ': P3 Stillness reflection fix missing')
  assert.ok(s.includes('(e.counters.turnsPerTurn||0)+1,i+=1)'), file + ': P6 Accelerate fix missing')
  assert.ok(s.includes('e.hp<=0&&(a.__dlFallTurn=a.state.turn)') && s.includes('.__dlStall?"Draw":'), file + ': P4 double knockout fix missing')
}
console.log(`DummyLab v5 fixes passed: ${CASES.length} fixed and ${KEPT.length} kept recorded fights x ${SEEDS.length} seeds, stat floor, noAttack`)

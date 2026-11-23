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
// Eternal Slumber is a field effect from when The Dreaming Shepherd ENTERS: T-rex already used its first turn on
// Arcane Avian, then still skips a turn once the Shepherd arrives (fast6-00 s-tyrannosaurus-rex: dummy 3/3).
for (const file of ['browser/depths-worker.js', 'browser/tower-worker.js']) {
  const s = readFileSync(file, 'utf8')
  assert.ok(s.includes('if(ability==="Eternal Slumber"&&!e.counters.slumberCast)'), file + ' Eternal Slumber applies on entry')
}
{
  let dummy = 0
  for (let seed = 1; seed <= 60; seed++) if (fight(engine, ['Tyrannosaurus rex'], ['Arcane Avian', 'The Dreaming Shepherd', 'NO.2'], seed).winner === 'Enemies') dummy++
  assert.ok(dummy >= 36, `T-rex vs Arcane Avian+Shepherd+NO.2 should mostly go to the dummy, got ${dummy}/60`)
}
// Delayed Impact: the comet still strikes after The Waking Comet is dead. War kills the Comet, then the comet lands
// after War's second turn and kills it (fast6-00 s-war: dummy 3/3, cmpx-01 q0077).
for (const file of ['browser/depths-worker.js', 'browser/tower-worker.js'])
  assert.ok(readFileSync(file, 'utf8').includes('if(e.counters.v26CometTurns===2&&caster){'), file + ' comet strikes after the caster dies')
for (const seed of [1, 2, 3])
  assert.equal(fight(engine, ['War'], ['The Waking Comet', 'Phoenix', 'Kitsune'], seed).winner, 'Enemies', `War vs Waking Comet team should go to the dummy, seed ${seed}`)
// Infectious also lowers the card's normal ATK, so Persistent does not reset it (Michael M. vs
// Vicious+Immortal Cultivator+Hard Claws: dummy 3/3; Michael's hits stay at half ATK in the clips).
for (const seed of [1, 2, 3])
  assert.equal(fight(engine, ['Michael M.'], ['Vicious', 'Immortal Cultivator', 'Hard Claws'], seed).winner, 'Enemies', `Michael M. vs Vicious team should go to the dummy, seed ${seed}`)
// Pandemic poisons "at 50% effectiveness": half of Black Plague's ATK each turn. The Shattered Emperor dies to the
// tick at about a third HP before its second attack (fast6-01 q0297: player).
for (const file of ['browser/depths-worker.js', 'browser/tower-worker.js'])
  assert.ok(readFileSync(file, 'utf8').includes('r.counters.poisonFlat=Math.max(r.counters.poisonFlat||0,e.damage*.5)'), file + ' Pandemic poison is half ATK')
for (const seed of [1, 2, 3])
  assert.equal(fight(engine, ['Black Plague'], ['Anubis', 'Soft Paw', 'The Shattered Emperor'], seed).winner, 'Allies', `Black Plague vs Anubis team should go to the player, seed ${seed}`)
// Witch's Curse steals the ability: the victim loses it (fast7-11/12: Hecate wins both in the game).
for (const file of ['browser/depths-worker.js', 'browser/tower-worker.js'])
  assert.ok(readFileSync(file, 'utf8').includes('e.flags.witchCurseStolen=!0,e.abilityOverride='), file + ' Witch\'s Curse present')
for (const [dum, label] of [[['Megalodon', 'Assassin King'], 'Megalodon'], [['Thor', 'Tornado', 'Sphinx'], 'Thor']])
  for (const seed of [1, 2, 3])
    assert.equal(fight(engine, ['Hecate'], dum, seed).winner, 'Allies', `Hecate vs ${label} team should go to the player, seed ${seed}`)
// Terrorize's +50% applies to the next attack after a Fear, not for the rest of the battle (Nán Fāng Zhū Què
// vs Siegfried+Nightmare Stag+Marrowclaw: player 5/5). Ice Age's slow ends when Admiral Ice dies (Eonus vs Admiral
// Ice+Sekhmet+Immortal Witch: player 3/3). Frozen Solitude also freezes an enemy that moves before Ice King's
// first turn (Eonus vs Ice King+Immortal Cultivator+Hell killer: dummy 5/5).
for (const [att, dum, want] of [
  [['Nán Fāng Zhū Què'], ['Siegfried', 'Nightmare Stag', 'Marrowclaw'], 'Allies'],
  [['Eonus'], ['Admiral Ice', 'Sekhmet', 'Immortal Witch'], 'Allies'],
  [['Eonus'], ['Ice King', 'Immortal Cultivator', 'Hell killer'], 'Enemies'],
]) for (const seed of [1, 2, 3])
  assert.equal(fight(engine, att, dum, seed).winner, want, `${att[0]} vs ${dum.join('+')} should go to ${want}, seed ${seed}`)
// fast8 (v62): a normal-attack kill by The Smasher also shortens Night City Massacre's interval (both Smasher team
// fights went to the player in the game), and All Father boosts Odin's teammates but not Odin (Odin vs Vizier+Yeti: dummy).
assert.ok(readFileSync('browser/depths-worker.js', 'utf8').includes('W(e)==="Night City Massacre"&&e.team!==t.team&&t.hp<=0'), 'Massacre kill rule present')
for (const [att, dum, want] of [
  [['The Smasher'], ['Lucifer', 'Běi Fāng Xuán Wǔ', 'River Dragon'], 'Allies'],
  [['The Smasher'], ['Tsukuyomi', 'Baby Skeleton', 'Cosmic Pop Star'], 'Allies'],
  [['Odin'], ['Vizier', 'Yeti'], 'Enemies'],
]) for (const seed of [1, 2, 3])
  assert.equal(fight(engine, att, dum, seed).winner, want, `${att[0]} vs ${dum.join('+')} should go to ${want}, seed ${seed}`)
// fast9 (v63 -> v64): Chainsaw hits for 25% ATK, Gathering is +25% per card, Odin pays for each multi-hit,
// Frozen Solitude's first-turn freeze counts per Ice King, and Lightning Strike hits back after the hit only if Zeus lives.
for (const [att, dum, want] of [
  [['Jason'], ['The Dreaming Shepherd'], 'Enemies'],
  [['Community'], ['God-Slayer'], 'Enemies'],
  [['Odin'], ['Siegfried', 'Pegasus', 'Engineer'], 'Enemies'],
  [['Dracula'], ['Buddhist Monk', 'Mothman', 'Ice King'], 'Enemies'],
  [['Veyrath the Unyielding'], ['Mummy', 'Hathor', 'Zeus'], 'Allies'],
]) for (const seed of [1, 2, 3])
  assert.equal(fight(engine, att, dum, seed).winner, want, `${att[0]} vs ${dum.join('+')} should go to ${want}, seed ${seed}`)
// fast11 (v67 -> v68): Vault of Blades weapons ignore damage reduction, Marionette swaps places but not stats,
// the player's Tsukuyomi uses Full Moon on its first turn, and Sable keeps Jealousy after a borrowed Divine Ascension.
for (const [att, dum, want] of [
  [['Ragon'], ['Golden Arsenal King'], 'Enemies'],
  [['Marionette'], ['River Dragon', 'Shén Lóng'], 'Enemies'],
  [['Marionette'], ['The Curse', 'Samurai'], 'Enemies'],
  [['Tsukuyomi'], ['Tornado', 'Horus', 'Three-Legged Golden Crow'], 'Allies'],
  [['Sable The Envious'], ['Shuten-dōji', 'Yeti', 'Ultimate Brawler'], 'Allies'],
]) for (const seed of [1, 2, 3])
  assert.equal(fight(engine, att, dum, seed).winner, want, `${att[0]} vs ${dum.join('+')} should go to ${want}, seed ${seed}`)
console.log(`dummylab-campaign-regression: Nüwa vs Loki ${JSON.stringify(tally)}, Zombie Dragon Unholy finish ok`)

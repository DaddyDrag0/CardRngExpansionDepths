import { strict as assert } from 'node:assert'
import cards from '../src/data/cards'
import abilities from '../src/data/abilities'
import auras from '../src/data/auras'
import { applySkillAuraTeamEffects, buildSkillAuraBoosts } from '../src/engine/auras'
import { simulateBattleV2 } from '../src/engine/battle-v2'
import { getAttack, getHealth } from '../src/engine/stats'
import type { CombatCard, DepthsEnemy } from '../src/types'

const cyberCards: Record<string, { ability: string; rarity: number }> = {
  Rowy: { ability: 'Caught On Tape', rarity: 15_000_000 },
  D: { ability: 'Hack', rarity: 80_000_000 },
  Dave: { ability: 'Sandevistan', rarity: 200_000_000 },
  'The Smasher': { ability: 'Night City Massacre', rarity: 500_000_000 },
}
const find = (name: string) => {
  const card = cards.find((candidate) => candidate.name === name)
  assert(card, 'Missing card ' + name)
  return card
}
for (const [name, details] of Object.entries(cyberCards)) {
  const card = find(name)
  assert.equal(card.ability, details.ability)
  assert.equal(card.rarity, details.rarity)
  assert.equal(card.expires, true)
  assert(abilities[details.ability]?.length > 40, 'Missing ability description for ' + name)
}
const cap = auras.find((a) => a.name === 'Capricorn')
assert(cap)
assert.equal(cap.base, 10)
assert.equal(buildSkillAuraBoosts({ auraName: 'Capricorn' }).implemented, true)
const mock = (name: string, index: number): CombatCard => {
  const definition = find(name)
  const damage = getAttack(definition)
  const hp = getHealth(definition)
  return {
    id: name, definition, team: 'Allies', index, borders: [], power: hp,
    hp, maxHp: hp, damage, entered: false, dead: false, boss: false,
    status: { stunned: 0, confused: 0, burn: 0, weakness: false, blind: false, shield: 0 },
    flags: {}, counters: {},
  }
}
const team = [mock('Rowy',0),mock('Dave',1),mock('Shining Armor',2)]
const before = team.map(c => c.damage)
const applied=applySkillAuraTeamEffects(team,{auraName:'Capricorn'})
assert.equal(applied.implemented,true)
assert.equal(team[0].damage,before[0]*1.1)
assert.equal(team[1].damage,before[1]*1.1)
assert.equal(team[2].damage,before[2])
// Source CardStatTiers.IsEligible counts the regular Shining Armor only:
// the two CYBERPUNK event cards are limited and do not count as eligible.
const halloween = [mock('Trick or Treater',0),mock('Shining Armor',1),mock('Rowy',2)]
const beforeHalloween = halloween[0].damage
const spooky=applySkillAuraTeamEffects(halloween,{auraName:"Jack-o'-Lantern"})
assert.equal(spooky.implemented,true)
assert.equal(halloween[0].damage,beforeHalloween*1.2,
 'Two eligible fighters (Halloween + regular) must increase Halloween card by 20%')
const capWithWeather = [mock('Rowy',0),mock('Black Plague',1),mock('Shining Armor',2)]
const beforeCapWeather = capWithWeather[0].damage
applySkillAuraTeamEffects(capWithWeather,{auraName:'Capricorn'})
assert.equal(capWithWeather[0].damage,beforeCapWeather*1.1,
 'Weather card must not count as eligible Capricorn source fighter')
const foe: DepthsEnemy = {card:find('Shining Armor'),power:1e19,health:1e19,attack:0}
for(const [name, {ability}] of Object.entries(cyberCards)){
  const result=simulateBattleV2({cards:[{cardName:name,borders:[]}]},[foe],1289,6,false,true)
  assert(!result.unsupportedAbilities.includes(ability),
    'CYBERPUNK ability is not wired into simulator: '+ability)
  assert(result.state.teams.Allies.length+result.state.fallen.Allies.length>0)
  if(name==='Dave'){
    const actor=[...result.state.teams.Allies,...result.state.fallen.Allies].find(x=>x.definition.name===name)!
    assert((actor.counters.cyberSandevistanAttacks||0)>=2,'Sandevistan never counted second attack')
  }
}
console.log('CYBERPUNK data, skill aura and combat regression passed.')

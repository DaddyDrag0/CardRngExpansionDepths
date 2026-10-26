import assert from 'node:assert/strict'
import cards from '../src/data/cards'
import abilities from '../src/data/abilities'
import { HALLOWEEN_FIXED, halloweenBanReason } from '../src/engine/halloween-tower'
import {
  halloweenInfiniteCycle,halloweenInfiniteEnemyAttack,halloweenInfiniteEnemyHp,
  halloweenInfiniteStage,halloweenInfiniteReward,HALLOWEEN_INFINITE_RANDOM_POOL,
} from '../src/engine/halloween-infinite'
import { WEATHER_MUTATION_STAT_MULTIPLIERS,mutationStatMultiplier } from '../src/engine/stats'
import { readFileSync } from 'node:fs'

assert.equal(halloweenInfiniteCycle(1),1)
assert.equal(halloweenInfiniteCycle(105),105)
assert.equal(halloweenInfiniteCycle(106),1)
assert.equal(halloweenInfiniteCycle(210),105)
assert.equal(halloweenInfiniteEnemyAttack(1),200000)
assert.equal(halloweenInfiniteEnemyHp(1),400000)
assert.equal(halloweenInfiniteEnemyAttack(100),2000000)
assert.equal(halloweenInfiniteEnemyHp(100),4000000)
assert.ok(halloweenInfiniteEnemyAttack(106)>halloweenInfiniteEnemyAttack(105))
assert.deepEqual(halloweenInfiniteStage(105),HALLOWEEN_FIXED[105])
assert.deepEqual(halloweenInfiniteStage(210),HALLOWEEN_FIXED[105])
assert.ok(halloweenInfiniteStage(105).includes('Living Armor'))
assert.ok(!halloweenInfiniteStage(105).includes('Abomination'))
assert.deepEqual(halloweenInfiniteStage(106,81),halloweenInfiniteStage(106,81))
assert.equal(halloweenInfiniteStage(106,81).length,4)
assert.ok(halloweenInfiniteStage(106,81).every(c=>HALLOWEEN_INFINITE_RANDOM_POOL.includes(c)))
assert.ok(HALLOWEEN_INFINITE_RANDOM_POOL.includes('Witch Doctor'))
assert.ok(HALLOWEEN_INFINITE_RANDOM_POOL.includes('Trick or Treater'))
assert.ok(HALLOWEEN_INFINITE_RANDOM_POOL.includes('Pumpkin King'),
  'Infinite enemy pool is independent of regular Tower player bans')
assert.ok(!HALLOWEEN_INFINITE_RANDOM_POOL.some(n=>cards.find(c=>c.name===n)?.boss))
assert.equal(halloweenInfiniteReward(1).pumpkinMoonPotion,0)
assert.equal(halloweenInfiniteReward(105).pumpkinMoonPotion,1)
assert.equal(halloweenInfiniteReward(210).pumpkinMoonPotion,1)
assert.equal(halloweenInfiniteReward(106).pumpkinMoonPotion,0)
for(const floor of [1,5,15,100,105,210,999,1000,1001]){
  assert.ok(Number.isFinite(halloweenInfiniteReward(floor).packs))
  assert.ok(halloweenInfiniteReward(floor).packs>=0)
}
const doctor=cards.find(c=>c.name==='Witch Doctor')
assert(doctor)
assert.equal(doctor.rarity,5000000)
assert.equal(doctor.statMultiplier,6)
assert.equal(doctor.weather,'Virus')
assert.equal(doctor.ability,'Experimental Treatment')
assert.match(abilities['Experimental Treatment'],/Poison, Bleed, Burn, Weakness, or Paralysis/)
assert.equal(halloweenBanReason('Pumpkin King'),'Reported Halloween Tower ban')
const expected={
 Storm:2,Snow:2.1,Aurora:2.3,Shroud:2.5,
 'Meteor Shower':3.5,'Time Storm':4,Eclipse:4.5,Virus:5,
 'Blood Rain':5.5,Armageddon:6,Manga:6.5,'Pumpkin Moon':7.5,
}
assert.deepEqual(WEATHER_MUTATION_STAT_MULTIPLIERS,expected)
assert.equal(mutationStatMultiplier('Pumpkin Moon'),7.5)
const ui=readFileSync('src/halloween-ui.js','utf8')
const worker=readFileSync('src/tower-worker.ts','utf8')
assert.match(ui,/data-hwt-mode="infinite"/)
assert.match(ui,/Infinite player stats and bans are not available/)
assert.match(ui,/View bans/)
assert.match(ui,/Pumpkin King/)
assert.match(worker,/halloweenInfiniteStage/)
assert.match(worker,/only encounter previews are available/)
console.log('Horseman source regression passed: Infinite generator/stats/rewards, roster 105, Pumpkin King ban, Witch Doctor, mutation buffs.')

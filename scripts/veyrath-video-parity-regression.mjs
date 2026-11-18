import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'

/**
 * Ground truth: DummyLab batch video-parity-nov-vey-20261118b,
 * fight 002_vey-front_r01_a01. The first four damaging hits take Veyrath
 * from 100/80/60/40% to 80/60/40/20% max HP respectively.
 * Readable combat text shows counter values 832, 624, 416, 208.
 */
const source=readFileSync('browser/depths-worker.js','utf8')
const exposed=source.replace(/\}\)\(\);\s*$/,
 'self.__veyVideoAudit={adjust:__v26AdjustDamage,Be};})();')
assert.notEqual(source,exposed,'Unable to expose shipped worker damage hook')
const fake={navigator:{hardwareConcurrency:2},location:{href:'mock'},postMessage(){}}
new Function('self','performance',exposed)(fake,performance)
const {adjust,Be}=fake.__veyVideoAudit
const trike={id:'tri',team:'Allies',definition:Be('Triceratops'),hp:5_242_880,
 maxHp:5_242_880,damage:2_752_512,flags:{},counters:{},status:{},dead:false}
const vey={id:'vey',team:'Enemies',definition:Be('Veyrath the Unyielding'),
 hp:2080,maxHp:2080,damage:1039,flags:{},counters:{},status:{},dead:false}
assert.equal(vey.definition.ability,'Unbreakable Balance')
const battle={state:{teams:{Allies:[trike],Enemies:[vey]},
 boosts:{Allies:{},Enemies:{}}},rng:{next:()=>.4},debug:{events:[]},captureDebug:false}
for(const [i,expectedCounter] of [832,624,416,208,0].entries()){
 const previousTrikeHp=trike.hp
 const taken=adjust(battle,trike,vey,2_752_512,false)
 assert.equal(taken,416,'Unbreakable Balance must cap each incoming hit at 20% max HP')
 assert.equal(previousTrikeHp-trike.hp,expectedCounter,
  'Veyrath counter should track game-recorded counter at hit '+(i+1))
 vey.hp=Math.max(0,vey.hp-taken)
}
assert.equal(vey.hp,0)
console.log('Veyrath video parity passed: HP chunks 416, counter progression 832/624/416/208/0')

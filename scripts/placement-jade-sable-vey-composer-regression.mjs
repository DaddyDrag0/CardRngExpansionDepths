import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'

/* Four-card regression from the 2026-11-17 placement report.
 * Test all 24 deck orders against deterministic Depths floors, including
 * Veyrath damage caps, Sable's ability stealing and Composer field effects.
 * This tests the deployed customized worker, not only the TypeScript engine. */
const names = [
  'The Jade Emperor', 'Sable The Envious',
  'Veyrath the Unyielding', 'The Composer',
]
const source = readFileSync('browser/depths-worker.js', 'utf8')
const inspect = source.replace(/\}\)\(\);\s*$/, 'self.__placementAudit={Ee,qe,Pi,Be,Na};})();')
assert.notEqual(inspect, source, 'Cannot inspect deployed Depths worker')
const fake = { navigator:{hardwareConcurrency:2}, location:{href:'mock'}, postMessage(){} }
new Function('self','performance',inspect)(fake,performance)
const { Ee, qe, Pi, Be, Na } = fake.__placementAudit
assert.deepEqual(names.map(name=>Be(name)?.ability), [
  'Absolute Sovereignty', 'Jealousy', 'Unbreakable Balance', 'Nightmare Melody',
], 'Report deck names or abilities changed')
const permutations = (list) => list.length <= 1 ? [list] :
  list.flatMap((name,i)=>permutations(list.filter((_,j)=>j!==i)).map(tail=>[name,...tail]))
const orders = permutations(names)
assert.equal(orders.length,24)
const loadout = (order, border) => ({
  cards: order.map(cardName=>({cardName,borders:border?['Galaxy']:[],mutationWeather:null}))
})
const mixSeed = (runSeed, floor) => {
  let x=(runSeed^Math.imul(floor,0x9e3779b1))>>>0
  x^=x>>>16;x=Math.imul(x,0x85ebca6b)>>>0;x^=x>>>13
  x=Math.imul(x,0xc2b2ae35)>>>0
  return (x^(x>>>16))>>>0
}
const configs = [
  {floor:25, seed:20261117}, {floor:250,seed:983450096},
  {floor:2500, seed:1234567}, {floor:10000,seed:20261030},
]
let battles=0, errors=[], maxTurn=0, caps=0, unsupported=new Set()
const execute=(order,border,floor,seed,enemies)=>{
  const deck=loadout(order,border)
  const floorSeed=mixSeed(seed,floor), actualEnemies=enemies||qe(floor,floorSeed,[],false,1)
  try{
    const result=Ee(deck,actualEnemies,floorSeed^0x51ed270b,10_000,true,false)
    battles++;maxTurn=Math.max(maxTurn,result.turns)
    if(result.unsupportedAbilities.includes('Battle turn cap reached'))caps++
    for(const ability of result.unsupportedAbilities)unsupported.add(ability)
    assert(['Allies','Enemies','Draw'].includes(result.winner),'Bad winner '+result.winner)
  }catch(error){
    errors.push({deck:order.join(' / '),border:border?'Galaxy':'None',floor,seed,
      opponents:actualEnemies.map(x=>x.card.name),error:error.message||String(error)})
  }
}
for(const border of [false,true]){
 for(const order of orders){
  for(const {floor,seed} of configs)execute(order,border,floor,seed)
 }
}
// Adversarial mirror matchup: four reported abilities on opposing slots as well.
for(const order of orders){
 const seed=42,floor=900
 const enemies=qe(floor,mixSeed(seed,floor),[],false,1).map((enemy,i)=>({
  ...enemy,card:Be(names[i]),health:enemy.power*(Be(names[i]).hpMultiplier||1)
 }))
 execute(order,false,floor,seed,enemies)
}
// Running all 24 teams sequentially must not corrupt independent seeds/results.
for(const order of orders){
 const seed=77,floor=75,deck=loadout(order,false)
 try{
  const result=Na(deck,{startFloor:floor,floorCap:floor,seed,battleTurnCap:10_000,lazyDebug:true})
  assert(result.battles===1,'Unexpected battle count on placement replay')
 }catch(error){
  errors.push({deck:order.join(' / '),type:'single-floor Depths run',
    floor,seed,error:error.message||String(error)})
 }
}
console.log('Placement regression:',JSON.stringify({
  deck:names,permutations:orders.length,battles,maxTurn,caps,
  unsupported:[...unsupported].sort(),errors:errors.slice(0,8)
},null,2))
assert.deepEqual(errors,[],'Reported placement deck failed a deterministic simulation')
console.log('All 24 placement permutations completed without a simulator crash.')

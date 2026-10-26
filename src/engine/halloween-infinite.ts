import cards from '../data/cards'
import { SeededRng } from './rng'
import { HALLOWEEN_FIXED, halloweenPackReward } from './halloween-tower'

/**
 * Decompiled client sources, HORSEMAN Card RNG Expansion.rbxl:
 * ReplicatedStorage/Modules/Util.GenHalloweenInfinite and
 * ReplicatedStorage/Modules/BTRewards/HalloweenInfinite.
 *
 * This recreates enemy LINEUP/STATS and BASE REWARDS only.
 * Player stat normalization, ability rules, deck bans and server
 * battle acceptance in Infinite are NOT present in the client place.
 */
export const HALLOWEEN_INFINITE_H3 = [
  'Trick or Treater','Neighbor','Tarantula','Ghost','Crow','Witch Doctor',
  'Grey Pumpkin','The Faceless','Pumpkin King','Freddy Krueger',
  'Living Gargoyle','Eerie Tree','Living Armor',
] as const

const knownCards=new Set(cards.map(c=>c.name))
export const HALLOWEEN_INFINITE_RANDOM_POOL=cards
  .filter(card=>((card.pack==='Halloween'||card.pack==='Halloween2')
    ||(HALLOWEEN_INFINITE_H3 as readonly string[]).includes(card.name))
    &&!card.unobtainable&&!card.boss)
  .map(card=>card.name).sort()

export function halloweenInfiniteCycle(floor:number):number{
  const f=Math.max(1,Math.floor(floor)||1)
  return ((f-1)%105)+1
}
export function halloweenInfiniteEnemyAttack(floor:number):number{
  const f=Math.max(1,Math.floor(floor)||1)
  return Math.floor(200_000+1_800_000*((f-1)/99))
}
export function halloweenInfiniteEnemyHp(floor:number):number{
  return 2*halloweenInfiniteEnemyAttack(floor)
}
export function halloweenInfiniteStage(floor:number,seed=1):string[]{
  const f=Math.max(1,Math.floor(floor)||1)
  const fixed=HALLOWEEN_FIXED[halloweenInfiniteCycle(f)]
  if(fixed){
    if(fixed.some(name=>!knownCards.has(name)&&!['Phantom','Berserker','Vampire Matron','End Times'].includes(name))){
      throw new Error('Halloween Infinite boss encounter contains unknown cards')
    }
    return [...fixed]
  }
  // Roblox Random.new is not exactly SeededRng; these are reproducible SAMPLE
  // enemies only, and the UI lets a user enter the actual encountered cards.
  const mixed=(Math.floor(seed||1)+f*104729)%2147483646+1
  const rng=new SeededRng(mixed)
  return Array.from({length:4},()=>
    HALLOWEEN_INFINITE_RANDOM_POOL[Math.floor(rng.next()*HALLOWEEN_INFINITE_RANDOM_POOL.length)])
}

const MILESTONE_2=new Set([5,10,20,25,35,40,50,55,65,70,80,85,95,100])
const MILESTONE_4=new Set([15,30,45,60,75,90])
function infiniteWeight(floor:number):number{
  const cycle=halloweenInfiniteCycle(floor)
  return cycle===105?6:MILESTONE_4.has(cycle)?4:MILESTONE_2.has(cycle)?2:1
}
const INFINITE_PRECALC=(()=>{
  let totalPacks=0,totalWeights=0
  for(let f=1;f<=1000;f++){
    totalPacks+=Math.floor(halloweenPackReward(halloweenInfiniteCycle(f))/5)
    totalWeights+=f*infiniteWeight(f)
  }
  const average=totalPacks/totalWeights
  const rewards:number[]=[0]
  let accumulated=0,previous=0
  for(let f=1;f<=1000;f++){
    accumulated+=f*infiniteWeight(f)
    const cumulative=f===1000?totalPacks:Math.floor(accumulated*average)
    rewards.push(cumulative-previous)
    previous=cumulative
  }
  return {average,rewards}
})()

export function halloweenInfiniteReward(floor:number){
  const f=Math.max(1,Math.floor(floor)||1)
  // After stage 1000, the Lua module uses a per-stage formula.
  const packs=f<=1000?INFINITE_PRECALC.rewards[f]
    :Math.floor(f*infiniteWeight(f)*INFINITE_PRECALC.average)
  return {packs:Math.max(0,packs),pumpkinMoonPotion:f%105===0?1:0}
}

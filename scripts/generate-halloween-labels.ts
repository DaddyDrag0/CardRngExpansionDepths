/**
 * Generate training labels using the SAME Halloween combat simulator as the
 * live site. Inspired by message (14).txt's native-C label generation.
 *
 * This is not training a neural network: it produces versioned JSONL outcomes
 * that could be used to train one later. Every probability is estimated from
 * seeded simulations, never marked exact.
 *
 * Example:
 * npm run halloween:labels -- --rows 100 --runs 64 --seed 123 --out data/halloween-labels.jsonl
 */
import { createHash } from 'node:crypto'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import cards from '../src/data/cards'
import { SeededRng } from '../src/engine/rng'
import {
  HALLOWEEN_DEFAULT_MIN_RARITY, halloweenBanReason,
  halloweenStage, simulateHalloweenTower,
} from '../src/engine/halloween-tower'
import { HALLOWEEN_RULESET, halloweenBattleLabel } from '../src/engine/halloween-learning'

const arg=(flag:string,defaultValue:string)=>{
  const index=process.argv.indexOf(flag)
  return index<0?defaultValue:String(process.argv[index+1]||defaultValue)
}
const rows=Math.max(1,Math.min(20_000,Math.floor(Number(arg('--rows','20'))||20)))
const runs=Math.max(1,Math.min(2000,Math.floor(Number(arg('--runs','32'))||32)))
const firstSeed=Math.max(1,Math.floor(Number(arg('--seed','20261025'))||20261025))
const output=resolve(arg('--out','data/halloween-training-labels.jsonl'))
const inputPaths=[
  'src/engine/halloween-learning.ts','src/engine/halloween-tower.ts',
  'src/engine/battle-v2.ts','src/engine/auras.ts','src/engine/stats.ts',
  ...Array.from({length:7},(_,i)=>`src/data/cards-${i+1}.json`),
]
const digest=createHash('sha256')
for(const name of inputPaths){
  digest.update(name)
  digest.update(readFileSync(name))
}
const rulesFingerprint=HALLOWEEN_RULESET+':'+digest.digest('hex').slice(0,16)
const eligible=cards.filter(c=>!halloweenBanReason(c.name)).map(c=>c.name)
if(eligible.length<4)throw new Error('Not enough available distinct Halloween player cards')
const rng=new SeededRng(firstSeed)
const roll=()=>Math.floor(rng.next()*0x7fffffff)||1
const labels:string[]=[]
for(let index=0;index<rows;index++){
  const floor=1+Math.floor(rng.next()*105)
  const enemies=halloweenStage(floor,roll()).slice(0,4)
  const shuffled=[...eligible]
  for(let i=shuffled.length-1;i>0;i--){
    const j=Math.floor(rng.next()*(i+1))
    ;[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]]
  }
  const allies=shuffled.slice(0,4)
  const seed=roll()
  const loadout={cards:allies.map(cardName=>({cardName,borders:[]}))}
  const result=simulateHalloweenTower(loadout,enemies,floor,runs,seed,[],undefined,HALLOWEEN_DEFAULT_MIN_RARITY)
  const label=halloweenBattleLabel(result,floor,allies,enemies,seed)
  labels.push(JSON.stringify({index,rulesFingerprint,minimumRarity:HALLOWEEN_DEFAULT_MIN_RARITY,
    ...label,progress:result.progress,averageTurns:result.averageTurns}))
  if((index+1)%25===0||index===rows-1)console.log(`Generated ${index+1}/${rows} battle labels`)
}
mkdirSync(dirname(output),{recursive:true})
writeFileSync(output,labels.join('\n')+'\n')
console.log('Halloween labels:',output,'rows:',rows,'fingerprint:',rulesFingerprint)

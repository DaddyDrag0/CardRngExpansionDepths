import { simulateDepthsBatch } from '../src/engine/simulation'
import { estimateDepthClearSeconds } from '../src/engine/depths-time'
import { auraPacksForDepth, potionDropsForDepth } from '../src/engine/depths-rewards'
import type { TeamLoadout } from '../src/types'

const loadout: TeamLoadout = {
  cards: [
    { cardName: 'Triceratops', borders: ['Platinum','Crystal','Ruby','Galaxy'] },
    { cardName: 'Pterodactylus', borders: ['Platinum','Crystal','Ruby','Galaxy'] },
    { cardName: 'Julius Leader', borders: ['Platinum','Crystal','Ruby'] },
    { cardName: 'Julius Leader', borders: ['Platinum','Crystal','Ruby'] },
  ],
  statAura: { auraName: 'Dinosaur King', border: 'Galaxy' },
  abilityAura: { auraName: 'Jurassic World', border: 'Crystal' },
}

const base = ['Inari','Noveau Riche','Amaterasu','Deus Ex','Domain Master','Gilgamesh','Ultimate Brawler','Piccolo','Fuxi','Marrowclaw','Kuchisake-onna','Jersey Devil','Loki','The Awakened One']
const friend = ['Achlys','Velociraptor','Kira','Kuchisake-onna','Mastermind','Megalodon','Odin','Piccolo','Priest','Shuten-dōji','Surtr','Ultimate Brawler','Tsukuyomi','Amaterasu']
const hybrid = [...friend.filter(x => x !== 'Tsukuyomi'), 'Inari']
const candidates = ['Kira','Achlys','Velociraptor','Mastermind','Megalodon','Odin','Priest','Shuten-dōji','Surtr','Tsukuyomi']

function replaceAmat(name:string){ return [...base.filter(x=>x!=='Amaterasu'), name] }
const variants: Record<string,string[]> = {
  BASE_AMATERASU: base,
  BASE_KIRA: replaceAmat('Kira'),
  FRIEND_EXACT: friend,
  FRIEND_INARI_FOR_TSUKUYOMI: hybrid,
}
for (const c of candidates) variants['BASE_'+c.toUpperCase().replace(/[^A-Z0-9]+/g,'_')] = replaceAmat(c)

function summarize(label:string,bans:string[],runs:number,startFloor:number,seed:number){
  const r = simulateDepthsBatch(loadout,{runs,startFloor,floorCap:300000,seed,bannedCardNames:bans,hardMode:false,chronoShard:true,battleSpeedStructureLevel:7})
  const median=Math.round(r.medianFloor)
  const seconds=estimateDepthClearSeconds(median,r.averageTurnsPerBattle,true,7,4)
  const packs=auraPacksForDepth(median)
  const rw=potionDropsForDepth(median,false).rareWeather.expected
  const rwB=potionDropsForDepth(median,true).rareWeather.expected
  const out={
    label,runs,startFloor,
    median,
    avg:Math.round(r.averageFloor),
    min:r.minFloor,
    max:r.maxFloor,
    avgTurns:+r.averageTurnsPerBattle.toFixed(3),
    hours:+(seconds/3600).toFixed(3),
    runsPerDay:+(86400/seconds).toFixed(3),
    auraPacksPerDay:+(packs*86400/seconds).toFixed(0),
    rareWeatherExpectedPerDay:+(rw*86400/seconds).toFixed(3),
    rareWeatherExpectedPerDayBountiful:+(rwB*86400/seconds).toFixed(3),
    bans
  }
  console.log('RESULT '+JSON.stringify(out))
  return out
}

console.log('PHASE1')
const phase1:any[]=[]
for(const [label,bans] of Object.entries(variants)){
  phase1.push(summarize(label,bans,15,4000,24681357))
}
const top=phase1.slice().sort((a,b)=>b.rareWeatherExpectedPerDay-a.rareWeatherExpectedPerDay).slice(0,4).map(x=>x.label)
const must=['BASE_AMATERASU','BASE_KIRA','FRIEND_EXACT','FRIEND_INARI_FOR_TSUKUYOMI']
const phase2Labels=[...new Set([...must,...top])]
console.log('PHASE2 '+JSON.stringify(phase2Labels))
for(const label of phase2Labels){
  summarize('FINAL_'+label,variants[label],30,1,975318642)
}

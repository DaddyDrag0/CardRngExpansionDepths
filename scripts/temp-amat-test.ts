import { simulateDepthsBatch } from '../src/engine/simulation'
import type { TeamLoadout } from '../src/types'

const loadout: TeamLoadout = {
  cards: [
    { cardName:'Triceratops', borders:['Platinum','Crystal','Ruby','Galaxy'] },
    { cardName:'Pterodactylus', borders:['Platinum','Crystal','Ruby','Galaxy'] },
    { cardName:'Julius Leader', borders:['Platinum','Crystal','Ruby'] },
    { cardName:'Julius Leader', borders:['Platinum','Crystal','Ruby'] },
  ],
  statAura:{auraName:'Dinosaur King',border:'Galaxy'},
  abilityAura:{auraName:'Jurassic World',border:'Crystal'},
}
const base=['Inari','Noveau Riche','Amaterasu','Deus Ex','Domain Master','Gilgamesh','Ultimate Brawler','Piccolo','Fuxi','Marrowclaw','Kuchisake-onna','Jersey Devil','Loki','The Awakened One']
const swap=(x:string)=>[...base.filter(n=>n!=='Amaterasu'),x]
const cases:Record<string,string[]>={
 AMATERASU:base,
 KIRA:swap('Kira'),
 VELOCIRAPTOR:swap('Velociraptor'),
 SURTR:swap('Surtr'),
 SHUTEN:swap('Shuten-dōji'),
 MEGALODON:swap('Megalodon'),
 ODIN:swap('Odin'),
 PRIEST:swap('Priest'),
 MASTER_MIND:swap('Mastermind'),
 ACHLYS:swap('Achlys'),
 TSUKUYOMI:swap('Tsukuyomi'),
}
for(const [label,bans] of Object.entries(cases)){
 const r=simulateDepthsBatch(loadout,{runs:20,startFloor:5000,floorCap:300000,seed:1357911,bannedCardNames:bans,hardMode:false})
 const floors=r.runs.map(x=>x.deathFloor).sort((a,b)=>a-b)
 console.log('RESULT',label,JSON.stringify({median:r.medianFloor,avg:r.averageFloor,min:r.minFloor,max:r.maxFloor,avgTurns:r.averageTurnsPerBattle,floors,bans}))
}

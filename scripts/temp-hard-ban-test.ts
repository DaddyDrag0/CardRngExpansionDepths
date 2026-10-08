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
const friend=['Achlys','Velociraptor','Kira','Kuchisake-onna','Mastermind','Megalodon','Odin','Piccolo','Priest','Shuten-dōji','Surtr','Ultimate Brawler','Tsukuyomi','Amaterasu']
const swap=(x:string)=>[...base.filter(n=>n!=='Amaterasu'),x]
const cases:Record<string,string[]>={
 AMATERASU:base,
 KIRA:swap('Kira'),
 ACHLYS:swap('Achlys'),
 VELOCIRAPTOR:swap('Velociraptor'),
 MASTERMIND:swap('Mastermind'),
 MEGALODON:swap('Megalodon'),
 ODIN:swap('Odin'),
 PRIEST:swap('Priest'),
 SHUTEN:swap('Shuten-dōji'),
 SURTR:swap('Surtr'),
 TSUKUYOMI:swap('Tsukuyomi'),
 FRIEND_EXACT:friend,
 FRIEND_INARI_FOR_TSUKUYOMI:[...friend.filter(x=>x!=='Tsukuyomi'),'Inari'],
}
for(const [label,bans] of Object.entries(cases)){
 const r=simulateDepthsBatch(loadout,{runs:20,startFloor:3000,floorCap:300000,seed:8642097,bannedCardNames:bans,hardMode:true})
 const floors=r.runs.map(x=>x.deathFloor).sort((a,b)=>a-b)
 console.log('RESULT',label,JSON.stringify({median:r.medianFloor,avg:r.averageFloor,min:r.minFloor,max:r.maxFloor,avgTurns:r.averageTurnsPerBattle,floors,bans}))
}

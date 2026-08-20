import cards from '../src/data/cards'
import { simulateDepthsBatch } from '../src/engine/simulation'
import type { TeamLoadout } from '../src/types'

const baseLoadout: TeamLoadout = {
  cards: [
    { cardName: 'Fuxi', borders: [] },
    { cardName: 'Cosmic Pop Star', borders: ['Platinum'] },
    { cardName: 'Meteosaurus', borders: ['Platinum', 'Galaxy'] },
    { cardName: 'Priest', borders: ['Platinum', 'Galaxy'] },
  ],
  statAura: { auraName: 'Yggdrasil', border: 'Galaxy' },
  abilityAura: { auraName: 'Vampire Matron', border: 'Galaxy' },
}
const bannedCardNames = ['Surtr','Yamato no Orochi','Poison Witch','Piccolo','Mastermind','Cosmic Pop Star']
const cps = cards.find(card => card.name === 'Cosmic Pop Star')!
const originalCpsAbility = cps.ability

type Scenario = { name:string; spotlight:boolean; vampire:boolean; ygg:boolean }
const scenarios: Scenario[] = [
  {name:'baseline',spotlight:true,vampire:true,ygg:true},
  {name:'no_stolen_spotlight',spotlight:false,vampire:true,ygg:true},
  {name:'no_vampire_matron',spotlight:true,vampire:false,ygg:true},
  {name:'no_yggdrasil',spotlight:true,vampire:true,ygg:false},
  {name:'no_spotlight_no_vamp',spotlight:false,vampire:false,ygg:true},
]

for (const scenario of scenarios) {
  cps.ability = scenario.spotlight ? originalCpsAbility : null
  const loadout: TeamLoadout = {
    ...baseLoadout,
    statAura: scenario.ygg ? baseLoadout.statAura : null,
    abilityAura: scenario.vampire ? baseLoadout.abilityAura : null,
  }
  const result = simulateDepthsBatch(loadout, {
    runs: 30,
    startFloor: 1,
    floorCap: 9000,
    seed: 0x26082026,
    battleTurnCap: 10000,
    bannedCardNames,
    battleSpeedStructureLevel: 7,
  })
  const floors = result.runs.map(r => r.deathFloor).sort((a,b)=>a-b)
  const q = (p:number) => {
    const x=(floors.length-1)*p, lo=Math.floor(x), hi=Math.ceil(x)
    return lo===hi?floors[lo]:floors[lo]+(floors[hi]-floors[lo])*(x-lo)
  }
  console.log('TEAM2_SCENARIO', JSON.stringify({
    name:scenario.name,
    min:floors[0], p10:q(.1), p25:q(.25), median:q(.5), p75:q(.75), p90:q(.9), max:floors.at(-1), average:result.averageFloor,
    below4900:floors.filter(f=>f<4900).length,
    below5200:floors.filter(f=>f<5200).length,
    below5500:floors.filter(f=>f<5500).length,
    topLowest:result.runs.sort((a,b)=>a.deathFloor-b.deathFloor).slice(0,5).map(r=>({floor:r.deathFloor,enemies:r.endingEnemies})),
  }))
}
cps.ability = originalCpsAbility

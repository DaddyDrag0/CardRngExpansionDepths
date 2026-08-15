import { simulateTowerBatch } from '../src/engine/tower'
import type { TeamLoadout } from '../src/types'

const floor=94
const difficulty='Impossible' as const
const runs=10000

function team(names:string[]):TeamLoadout {
  return {cards:names.map(cardName=>({cardName,borders:[]})),statAura:null,abilityAura:null}
}

const cases=[
  ['tric2_single',['Titan','Triceratops','Titan','Titan'],team(['Judgment Day','Parallax','Judgment Day','Judgment Day'])],
  ['tric2_double',['Titan','Triceratops','Titan','Titan'],team(['Parallax','Parallax','Judgment Day','Judgment Day'])],
  ['tric3_single',['Titan','Titan','Triceratops','Titan'],team(['Judgment Day','Judgment Day','Parallax','Judgment Day'])],
  ['tric3_double',['Titan','Titan','Triceratops','Titan'],team(['Judgment Day','Parallax','Parallax','Judgment Day'])],
  ['tric4_single',['Titan','Titan','Titan','Triceratops'],team(['Judgment Day','Judgment Day','Judgment Day','Parallax'])],
  ['tric4_double',['Titan','Titan','Titan','Triceratops'],team(['Judgment Day','Judgment Day','Parallax','Parallax'])],
] as const

for(let i=0;i<cases.length;i++){
  const [name,enemies,loadout]=cases[i]
  const result=simulateTowerBatch(loadout,[...enemies],floor,difficulty,runs,96000+i)
  console.log(JSON.stringify({name,...result}))
}

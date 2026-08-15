import { simulateTowerBatch } from '../src/engine/tower'
import type { TeamLoadout } from '../src/types'

const enemies=['Titan','Titan','Titan','Triceratops']
const floor=94
const difficulty='Impossible' as const
const runs=10000

function team(names:string[]):TeamLoadout {
  return {cards:names.map(cardName=>({cardName,borders:[]})),statAura:null,abilityAura:null}
}

const cases=[
  ['jd_jd_jd_para',team(['Judgment Day','Judgment Day','Judgment Day','Parallax'])],
  ['jd_jd_para_para',team(['Judgment Day','Judgment Day','Parallax','Parallax'])],
  ['jd_para_jd_para',team(['Judgment Day','Parallax','Judgment Day','Parallax'])],
  ['para_jd_jd_para',team(['Parallax','Judgment Day','Judgment Day','Parallax'])],
  ['jd_para_para_jd',team(['Judgment Day','Parallax','Parallax','Judgment Day'])],
  ['jd_jd_trueprophet_para',team(['Judgment Day','Judgment Day','True Prophet','Parallax'])],
  ['jd_jd_hathor_para',team(['Judgment Day','Judgment Day','Hathor','Parallax'])],
  ['jd_jd_loveland_para',team(['Judgment Day','Judgment Day','Loveland Frog','Parallax'])],
  ['jd_jd_heavens_para',team(['Judgment Day','Judgment Day',"Heaven's Armor",'Parallax'])],
] as const

for(let i=0;i<cases.length;i++){
  const [name,loadout]=cases[i]
  const result=simulateTowerBatch(loadout,enemies,floor,difficulty,runs,95000+i)
  console.log(JSON.stringify({name,...result}))
}

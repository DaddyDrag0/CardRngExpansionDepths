import { simulateTowerBatch } from '../src/engine/tower'
import type { TeamLoadout } from '../src/types'

const enemies=['Savior','Lucifer','Lucifer','Lucifer']
const floor=85
const difficulty='Impossible' as const
const runs=20000

function team(names:string[]):TeamLoadout {
  return {cards:names.map(cardName=>({cardName,borders:[]})),statAura:null,abilityAura:null}
}

const cases=[
  ['current_rule',team(['Parallax','Judgment Day','Judgment Day','Judgment Day'])],
  ['jd_jd_jd_para',team(['Judgment Day','Judgment Day','Judgment Day','Parallax'])],
  ['suggested',team(['Judgment Day','Kuchisake-onna','Judgment Day','Parallax'])],
  ['suggested_para_middle',team(['Judgment Day','Kuchisake-onna','Parallax','Judgment Day'])],
  ['suggested_no_para',team(['Judgment Day','Kuchisake-onna','Judgment Day','Judgment Day'])],
  ['double_kuchisake',team(['Judgment Day','Kuchisake-onna','Kuchisake-onna','Parallax'])],
] as const

for(let i=0;i<cases.length;i++){
  const [name,loadout]=cases[i]
  const result=simulateTowerBatch(loadout,enemies,floor,difficulty,runs,85000+i)
  console.log(JSON.stringify({name,...result}))
}

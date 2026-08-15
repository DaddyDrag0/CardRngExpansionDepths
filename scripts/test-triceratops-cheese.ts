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
  ['jd_jd_jd_jd',team(['Judgment Day','Judgment Day','Judgment Day','Judgment Day'])],
  ['jd_jd_jd_pandora',team(['Judgment Day','Judgment Day','Judgment Day','Pandora'])],
  ['jd_jd_jd_kuchisake',team(['Judgment Day','Judgment Day','Judgment Day','Kuchisake-onna'])],
  ['jd_jd_jd_sleep',team(['Judgment Day','Judgment Day','Judgment Day','Sleep Paralysis'])],
  ['jd_jd_kuchisake_para',team(['Judgment Day','Judgment Day','Kuchisake-onna','Parallax'])],
  ['jd_jd_pandora_para',team(['Judgment Day','Judgment Day','Pandora','Parallax'])],
  ['jd_jd_sleep_para',team(['Judgment Day','Judgment Day','Sleep Paralysis','Parallax'])],
] as const

for(let i=0;i<cases.length;i++){
  const [name,loadout]=cases[i]
  const result=simulateTowerBatch(loadout,enemies,floor,difficulty,runs,94000+i)
  console.log(JSON.stringify({name,...result}))
}

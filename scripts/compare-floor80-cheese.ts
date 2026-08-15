import { simulateTowerBatch } from '../src/engine/tower'
import type { TeamLoadout } from '../src/types'

const enemies=['Mastermind','Domain Master','Kira','Priest']
const floor=80
const difficulty='Impossible' as const
const runs=20000

function team(names:string[], endTimes=false):TeamLoadout {
  return {
    cards:names.map(cardName=>({cardName,borders:[]})),
    statAura:null,
    abilityAura:endTimes?{auraName:'End Times',border:null}:null,
  }
}

const cases=[
  ['current_rule', team(['Judgment Day','Parallax','Judgment Day','Judgment Day'],true)],
  ['current_no_end_times', team(['Judgment Day','Parallax','Judgment Day','Judgment Day'],false)],
  ['suggested', team(['Judgment Day','True Prophet','Judgment Day','Parallax'],false)],
  ['suggested_end_times', team(['Judgment Day','True Prophet','Judgment Day','Parallax'],true)],
] as const

for (let i=0;i<cases.length;i++) {
  const [name,loadout]=cases[i]
  const result=simulateTowerBatch(loadout,enemies,floor,difficulty,runs,80080+i)
  console.log(JSON.stringify({name,...result}))
}

/**
 * Confidence-aware battle labels for Halloween Tower's adaptive search.
 * The shared combat engine is our oracle. Unlike the user's native-C
 * tablebase implementation, this module only estimates outcomes through
 * seeded Monte Carlo; it NEVER marks stochastic estimates as exact.
 */
export const HALLOWEEN_RULESET = 'halloween-2026-10-25-unique-legacy-v1'

export interface HalloweenWinEstimate {
  wins:number
  losses:number
  draws:number
  runs:number
  progress:number
  trusted:boolean
  unsupportedAbilities:string[]
}

export function wilsonBounds(wins:number,runs:number,z=1.96):[number,number]{
  if(runs<=0)return [0,1]
  const p=Math.max(0,Math.min(1,wins/runs)),z2=z*z,denom=1+z2/runs
  const center=(p+z2/(2*runs))/denom
  const margin=z*Math.sqrt(p*(1-p)/runs+z2/(4*runs*runs))/denom
  return [Math.max(0,center-margin),Math.min(1,center+margin)]
}

export function optimisticHalloweenScore(sample:HalloweenWinEstimate):number {
  const [low,high]=wilsonBounds(sample.wins,sample.runs)
  // Encourage uncertain but promising teams; progress breaks zero-win ties
  // on hard floors where meaningful wins are currently rare.
  return high + 0.15*sample.progress + 0.025*(high-low)
}

export interface HalloweenBattleLabel {
  ruleset:string
  floor:number
  allies:string[]
  enemies:string[]
  seed:number
  wins:number
  losses:number
  draws:number
  runs:number
  pWin:number
  pLose:number
  pDraw:number
  unfinished:number
  winInterval:[number,number]
  estimated:true
  trusted:boolean
  unsupportedAbilities:string[]
}

/** Structure mirrors training-label rows without claiming exact probabilities. */
export function halloweenBattleLabel(
  sample:HalloweenWinEstimate, floor:number,allies:string[],enemies:string[],seed:number,
):HalloweenBattleLabel{
  return {ruleset:HALLOWEEN_RULESET,floor,allies:[...allies],enemies:[...enemies],seed,
    wins:sample.wins,losses:sample.losses,draws:sample.draws,runs:sample.runs,
    pWin:sample.wins/sample.runs,pLose:sample.losses/sample.runs,pDraw:sample.draws/sample.runs,
    unfinished:0,winInterval:wilsonBounds(sample.wins,sample.runs),estimated:true,
    trusted:sample.trusted,unsupportedAbilities:[...sample.unsupportedAbilities]}
}

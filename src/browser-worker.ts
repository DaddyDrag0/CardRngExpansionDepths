/// <reference lib="webworker" />
import { simulateDepthsBatch } from './engine/simulation'
import type { TeamLoadout } from './types'
interface SimulationRequest { id:number; loadout:TeamLoadout; runs:number; floorCap:number; seed:number }
self.onmessage=(event:MessageEvent<SimulationRequest>)=>{
  const request=event.data
  const started=performance.now()
  try{
    const result=simulateDepthsBatch(request.loadout,{runs:request.runs,floorCap:request.floorCap,seed:request.seed,battleTurnCap:10000})
    self.postMessage({id:request.id,ok:true,elapsedMs:performance.now()-started,result})
  }catch(error){
    self.postMessage({id:request.id,ok:false,elapsedMs:performance.now()-started,error:error instanceof Error?error.message:String(error)})
  }
}

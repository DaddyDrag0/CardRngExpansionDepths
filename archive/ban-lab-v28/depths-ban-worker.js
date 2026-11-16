/* Hard Depths Ban Lab.
   frequency: EXACT 10 independently seeded full runs per ban slot. No skipping.
   compare: experimental bounded danger-window paired comparison.
   Neither mode claims authority over the live Roblox server. */
(function(self){
"use strict";
const clock=()=>performance.now();
const unique=(items)=>[...new Set((items||[]).map(String))];
const limit=(x,min,max,defaultValue)=>Number.isFinite(Number(x))?Math.max(min,Math.min(max,Number(x))):defaultValue;
class BudgetReached extends Error{constructor(){super("Search time budget reached");this.name="BanSearchBudgetReached"}}
function randomSeeds(seed,round,count){
 let x=((Number(seed)||1)^Math.imul(round+1,0x9e3779b1))>>>0,output=[];
 for(let i=0;i<count;i++){x^=x<<13;x^=x>>>17;x^=x<<5;output.push((x>>>0)||i+1)}
 return output;
}
function progress(req,phase,extra={}){self.postMessage({kind:"ban-progress",id:req.id,method:req.method,phase,...extra})}
function timing(req){return {
 chronoShard:req.chronoShard!==false,
 chronoShardLevel:Number(req.chronoShardLevel)||0,
 battleSpeedStructureLevel:Number(req.battleSpeedStructureLevel)||0,
 skillTreeBattleSpeedLevel:Number(req.skillTreeBattleSpeedLevel)||0,
 floorOverheadSeconds:Number(req.floorOverheadSeconds)||.8,
 baseBattleSpeed:Number(req.baseBattleSpeed)||3,
 blessingMultiplier:Number(req.blessingMultiplier)||1,
 attackAnimationScale:Number(req.attackAnimationScale)||1
}}
function fight(req,api,bans,seed,first,last,stride,settings,deadline){
 if(clock()>=deadline)throw new BudgetReached();
 // Interrupt a long fight *between floors* rather than waiting for a 300K run
 // to return. This callback also runs during turns on difficult floors.
 const check=()=>{if(clock()>=deadline)throw new BudgetReached()};
 const result=api.run(req.loadout,{
  startFloor:first,floorCap:last,seed,hardMode:true,
  floorStride:stride,battleTurnCap:1000,
  bannedCardNames:bans,rebanLegacyDepths:Boolean(req.rebanLegacyDepths),
  lazyDebug:true,timingSettings:settings
 },check);
 check();
 return result;
}
function summarize(req,api,bans,runs,first,last,settings,mode){
 let earned=0,seconds=0,totalFloors=0,untrusted=0,lossCount=0;
 const enemyCounts=new Map(),actualKillers=new Map();
 for(const run of runs){
  if(!run.trusted)untrusted++;
  const death=Math.floor(Number(run.deathFloor)||last+1),cleared=Math.min(last,death-1);
  earned+=3*Math.max(0,api.packs(cleared)-api.packs(first-1));
  seconds+=Math.max(.01,Number(run.playbackSeconds)||Math.max(1,cleared-first+1)*(settings.floorOverheadSeconds||.8));
  totalFloors+=death;
  if(death>last)continue;
  lossCount++;
  // EXACTLY matches the normal Results panel: a card counts once for each
  // losing floor it appears on. This is NOT the final survivor attribution.
  for(const name of unique(run.endingEnemies||[])){
   if(api.eligible(name,bans))enemyCounts.set(name,(enemyCounts.get(name)||0)+1);
  }
  const killer=String(run.losingEnemy||"");
  if(killer&&api.eligible(killer,bans))actualKillers.set(killer,(actualKillers.get(killer)||0)+1);
 }
 const ranked=m=>[...m].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
 return {score:seconds?earned*86400/seconds:0,avgFloor:totalFloors/runs.length,
  winRate:1-lossCount/runs.length,runCount:runs.length,untrusted,
  seen:ranked(enemyCounts),killers:ranked(actualKillers),
  fullRun:mode==="full",startFloor:first,endFloor:last};
}
function getReference(req,bans,first,last){
 if(!Array.isArray(req.referenceRuns)||req.referenceRuns.length<10)return null;
 if(!Array.isArray(req.initialBans)||unique(req.initialBans).join("|")!==bans.join("|"))return null;
 const data=req.referenceRuns.slice(0,10);
 if(data.some(x=>!Number.isFinite(Number(x.deathFloor))||Number(x.deathFloor)<first||
  Number(x.deathFloor)>last+1||!Array.isArray(x.endingEnemies)))return null;
 return data;
}
function runTen(req,api,bans,round,first,last,settings,deadline,reference=null){
 const runs=[];
 if(reference){
  progress(req,"Using ten existing full-run results",{step:bans.length,total:14,completedRuns:10,totalRuns:10});
  return summarize(req,api,bans,reference,first,last,settings,"full");
 }
 const list=randomSeeds(req.seed,round,10);
 for(let i=0;i<10;i++){
  progress(req,"Full runs: no floors skipped",{step:bans.length,total:14,completedRuns:i,totalRuns:10});
  const result=fight(req,api,bans,list[i],first,last,1,settings,deadline);
  runs.push(result);
 }
 progress(req,"Ten full runs completed",{step:bans.length,total:14,completedRuns:10,totalRuns:10});
 return summarize(req,api,bans,runs,first,last,settings,"full");
}
function estimateDanger(req,api,bans,first,last,settings,deadline){
 const saved=Array.isArray(req.referenceRuns)?req.referenceRuns.filter(r=>
  Number.isFinite(Number(r.deathFloor))&&r.deathFloor>=first&&r.deathFloor<=last&&
  Array.isArray(r.endingEnemies)):[];
 if(saved.length>=3){
  const floors=saved.map(r=>Number(r.deathFloor)).sort((a,b)=>a-b);
  const risk=Math.floor(floors[Math.floor(floors.length/2)]);
  return {first:Math.max(first,risk-150),last:Math.min(last,risk+150),
   stride:1,riskFloor:risk,source:"previous full-depth simulations",sampled:false};
 }
 // This is a separate approximation, NEVER used by the exact 10-run method.
 let floor=Math.max(first,Math.min(last,first===1?32:first));
 let risk=null,checked=0;
 for(let i=0;i<18;i++){
  progress(req,"Locating comparison window",{step:0,total:14,scoutFloor:floor});
  for(const seed of randomSeeds(req.seed^0x31ad92a7,i,2)){
   const run=fight(req,api,bans,seed,floor,floor,1,settings,deadline);
   checked++;if(run.deathFloor===floor)risk=floor;
  }
  if(risk!==null||floor>=last)break;
  floor=Math.min(last,Math.max(floor+1,Math.ceil(floor*1.65)));
 }
 if(risk===null)return null; // Never pretend floor 300K is a discovered threat.
 return {first:Math.max(first,risk-150),last:Math.min(last,risk+150),
  stride:1,riskFloor:risk,source:"single-floor scout (approximate)",sampled:true,scoutBattles:checked};
}
function evaluateWindow(req,api,bans,seeds,window,settings,deadline){
 const runs=[];
 for(const seed of seeds)runs.push(fight(req,api,bans,seed,window.first,window.last,window.stride,settings,deadline));
 return summarize(req,api,bans,runs,window.first,window.last,settings,"window");
}
async function exactFrequency(req,api,initial,first,last,settings,deadline,budget){
 const bans=initial.slice(),history=[];let baseline=null,lastObservation=null,reason=null,usedReference=false,partial=false;
 for(let slot=bans.length;slot<14;slot++){
  if(clock()>=deadline){partial=true;reason="Time limit reached before the next set of ten full runs.";break}
  let current;
  try{
   const reference=slot===initial.length?getReference(req,initial,first,last):null;
   if(reference)usedReference=true;
   current=runTen(req,api,bans,slot+1,first,last,settings,deadline,reference);
  }catch(err){
   if(!(err instanceof BudgetReached))throw err;
   partial=true;reason="Time limit reached before ten COMPLETE full runs. No ban was chosen from an incomplete sample.";break;
  }
  if(!baseline)baseline=current;
  lastObservation=current;
  const choice=current.seen.find(([name])=>api.eligible(name,bans));
  if(!choice){reason="Ten full runs found no eligible card on a losing floor.";break}
  const [name,count]=choice;
  bans.push(name);
  history.push({slot:bans.length,ban:name,appearances:count,
   sampleRuns:10,observedKillers:current.seen,actualFinalSurvivors:current.killers,
   referenceScore:current.score,fullRun:true});
  progress(req,"Added ban from 10 losing-floor counts",{step:bans.length,total:14,
   selected:bans.slice(),latest:name,appearances:count,completedRuns:10,totalRuns:10});
  // Yield to avoid starving the worker after each validated set.
  await Promise.resolve();
 }
 const completed=bans.length===14;
 return {method:"frequency",seed:req.seed,bans,startingBans:initial,
  history,completed,partial:partial||!completed,reason:reason||(completed?null:"No further eligible losing-floor cards."),
  budgetSeconds:budget,comparisonWindow:null,referenceUsed:usedReference,
  baseline:baseline?{score:baseline.score,avgFloor:baseline.avgFloor,winRate:baseline.winRate,
   untrusted:baseline.untrusted}:null,
  validated:null,validationRuns:0,improvement:null,sampled:false,fullRuns:true,
  lastObserved: lastObservation?{score:lastObservation.score,avgFloor:lastObservation.avgFloor,seen:lastObservation.seen}:null,
  scoreMeaning:"Ten complete, actual floor-by-floor runs per chosen ban, counting ALL enemies on losing floors; no full-deck improvement claim without matched validation"};
}
async function pairedCompare(req,api,initial,first,last,settings,deadline,budget){
 const bans=initial.slice(),history=[];let partial=false,reason=null,window=null;
 try{
  window=estimateDanger(req,api,initial,first,last,settings,deadline);
  if(!window)return {method:"compare",bans,startingBans:initial,history,completed:false,partial:true,
   budgetSeconds:budget,comparisonWindow:null,baseline:null,validated:null,validationRuns:0,improvement:null,
   sampled:true,reason:"No reliable dangerous floor found. Run a normal Hard Depths test first to calibrate this comparison."};
  for(let slot=bans.length;slot<14;slot++){
   const common=randomSeeds(req.seed,slot+1,10);
   progress(req,"Comparing losing-floor threats",{step:slot,total:14,
    window:[window.first,window.last],sampleEvery:window.stride});
   const base=evaluateWindow(req,api,bans,common,window,settings,deadline);
   const pool=base.seen.map(([name])=>name).filter(name=>api.eligible(name,bans)).slice(0,4);
   if(!pool.length){reason="No eligible losing-floor enemies were observed in this window.";break}
   const candidates=[];
   for(const name of pool){
    const trial=evaluateWindow(req,api,[...bans,name],common.slice(0,4),window,settings,deadline);
    candidates.push({name,score:trial.score,winRate:trial.winRate,avgFloor:trial.avgFloor});
    progress(req,"Testing paired candidates",{step:slot,total:14,candidate:name,
     tested:candidates.length,possible:pool.length});
   }
   candidates.sort((a,b)=>b.score-a.score||b.winRate-a.winRate||b.avgFloor-a.avgFloor);
   const refinements=randomSeeds(req.seed^0x91e10da5,slot+1,6);
   for(const entry of candidates.slice(0,2))
    entry.refined=evaluateWindow(req,api,[...bans,entry.name],refinements,window,settings,deadline).score;
   const chosen=candidates.slice(0,2).sort((a,b)=>(b.refined??-1)-(a.refined??-1))[0]?.name;
   if(!chosen){reason="No eligible candidate emerged from matched comparisons.";break}
   bans.push(chosen);history.push({slot:bans.length,ban:chosen,sampleRuns:10,
    observedKillers:base.seen,candidateResults:candidates,referenceScore:base.score});
   progress(req,"Added comparison ban",{step:bans.length,total:14,selected:bans.slice(),latest:chosen});
   await Promise.resolve();
  }
 }catch(err){
  if(!(err instanceof BudgetReached))throw err;
  partial=true;reason="Time limit reached; kept completed candidate comparisons only.";
 }
 // No unbounded emergency runs after timeout. Never convert 2 runs into "40".
 let baseline=null,validated=null,validationRuns=0;
 if(window&&clock()<deadline){
  for(const count of [10,4,2]){
   try{
    const seeds=randomSeeds(req.seed^0x6bb42f12,77,count);
    const b=evaluateWindow(req,api,initial,seeds,window,settings,deadline);
    const v=evaluateWindow(req,api,bans,seeds,window,settings,deadline);
    baseline=b;validated=v;validationRuns=count;break;
   }catch(err){if(!(err instanceof BudgetReached))throw err}
  }
 }
 return {method:"compare",seed:req.seed,bans,startingBans:initial,history,
  completed:bans.length===14,partial:partial||bans.length<14,reason,
  budgetSeconds:budget,comparisonWindow:window,validationRuns,
  baseline:baseline?{score:baseline.score,avgFloor:baseline.avgFloor,winRate:baseline.winRate,untrusted:baseline.untrusted}:null,
  validated:validated?{score:validated.score,avgFloor:validated.avgFloor,winRate:validated.winRate,untrusted:validated.untrusted}:null,
  improvement:baseline&&validated&&baseline.score>0?validated.score/baseline.score-1:null,
  sampled:true,fullRuns:false,scoreMeaning:"Danger-window comparison only; NOT full-run packs/day"};
}
self.__CRX_DEPTHS_BAN_OPTIMIZER__=async function optimize(req,api){
 if(!api?.run||!api?.packs||!api?.eligible)throw Error("Depths engine unavailable");
 if(req.hardMode===false)throw Error("Ban optimizer is for Hard Depths");
 if(req.loadout?.cards?.filter(c=>c.cardName).length!==4)throw Error("Choose all four cards");
 const first=limit(Math.floor(Number(req.startFloor)||1),1,300000,1);
 const last=limit(Math.floor(Number(req.floorCap)||300000),first,300000,300000);
 const initial=unique(req.initialBans).filter(name=>api.eligible(name,[])).slice(0,14);
 const budget=limit(req.budgetSeconds,10,180,40),deadline=clock()+budget*1000;
 const settings=timing(req);
 return req.method==="compare"
  ?pairedCompare(req,api,initial,first,last,settings,deadline,budget)
  :exactFrequency(req,api,initial,first,last,settings,deadline,budget);
};
})(self);

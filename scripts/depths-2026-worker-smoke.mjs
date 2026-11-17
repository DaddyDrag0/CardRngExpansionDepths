import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";

const source=readFileSync("browser/depths-worker.js","utf8");
for(const name of [
  "__v26Abilities","Siren's Song","Sacred Purity","Crushing Depths",
  "Dream Doppelgänger","Sands of Renewal","Terrorize",
  "startFloor","chronoShard","single-run"
])assert.ok(source.includes(name),"Deployed Depths worker missing "+name);
assert.ok(source.includes("Ma.add('Drowned')"),"Deployed Depths must support summoned Drowned")
assert.ok(source.includes("M(a,s.team)>1-o"),"Deployed Depths must respect Hex on Bigfoot evasion")
const worker={navigator:{hardwareConcurrency:2},location:{href:"mock"},postMessage(){}};
assert.doesNotThrow(()=>new Function("self","performance",source)(worker,performance),"Depths worker did not initialize");
assert.equal(typeof worker.onmessage,"function","Depths worker message handler missing");

assert.ok(source.includes("function __depthsRealPlaybackTime"),"Per-floor timing helper missing");
assert.ok(source.includes("function __depthsRefineBatchTime"),"Batch timing estimate helper missing");
const messages=[];
worker.postMessage=message=>messages.push(message);
const deck={cards:["Robin Hood","Pandora","Noveau Riche","Kuchisake-onna"].map(cardName=>({cardName,borders:[],mutationWeather:null}))};
const baseSettings={chronoShard:true,chronoShardLevel:0,battleSpeedStructureLevel:0,skillTreeBattleSpeedLevel:0,
 floorOverheadSeconds:.8,baseBattleSpeed:3,blessingMultiplier:1,attackAnimationScale:1};
async function test(id,changes={}){
 messages.length=0;
 await worker.onmessage({data:{id,kind:"single-run",startFloor:1,floorCap:5,batchSeed:9,runIndex:0,loadout:deck,
 timingSettings:{...baseSettings,...changes}}});
 const message=messages.find(x=>x.id===id&&typeof x.ok==="boolean");
 assert.equal(message?.ok,true,message?.error||"No result for "+id);
 return message.result;
}
// Check the ACTUAL customized, deployed worker with the four CYBERPUNK cards.
const cyberDeck={cards:["Rowy","D","Dave","The Smasher"].map(cardName=>({cardName,borders:[],mutationWeather:null})),
 abilityAura:{auraName:"Capricorn",border:null}};
messages.length=0;
await worker.onmessage({data:{
 id:109,kind:"single-run",startFloor:1,floorCap:4,batchSeed:9,runIndex:0,
 loadout:cyberDeck,timingSettings:{...baseSettings,skillTreeBattleSpeedLevel:6}
}});
const cyberReply=messages.find(message=>message.id===109&&typeof message.ok==="boolean");
assert.equal(cyberReply?.ok,true,cyberReply?.error||"CYBERPUNK browser worker failed");
assert.equal(cyberReply.result.trusted,true,
 "CYBERPUNK cards and Capricorn must be modeled in the real Depths worker");
assert(!cyberReply.result.unsupportedAbilities?.length,
 "CYBERPUNK worker reported unsupported effects: "+cyberReply.result.unsupportedAbilities);
const basic=await test(100);
const blessing=await test(101,{blessingMultiplier:2});
const slow=await test(102,{baseBattleSpeed:1});
const delay=await test(103,{floorOverheadSeconds:1.8});
assert.ok(basic.playbackSeconds>0&&Number.isFinite(basic.playbackSeconds));
assert.equal(basic.totalTurns,blessing.totalTurns,"Playback settings must not change win/turn results");
assert.ok(blessing.playbackSeconds<basic.playbackSeconds,"2x blessing should reduce actual playback estimate");
assert.ok(slow.playbackSeconds>basic.playbackSeconds,"Lower base speed should increase playback estimate");
assert.ok(Math.abs(delay.playbackSeconds-basic.playbackSeconds-basic.battles)<1e-6,"One second of delay per battle mismatch");
const inspectSource=source.replace(/\}\)\(\);\s*$/, 'self.__testRefine=__depthsRefineBatchTime;self.__testCorrectRewards=__depthsCorrectRewards;self.__testDepthsTeam=qe;self.__testDepthsEligible=ns;})();');
assert.notEqual(inspectSource,source,"Cannot inspect timing throughput helper");
const isolated={navigator:{hardwareConcurrency:2},location:{href:"mock"},postMessage(){}};
new Function("self","performance",inspectSource)(isolated,performance);
const synthetic=isolated.__testRefine({hardMode:false,auraPackMedian:100},[
 {deathFloor:5,playbackSeconds:10},{deathFloor:6,playbackSeconds:15}
],{});
assert.equal(synthetic.totalSimulatedSeconds,25);
assert.ok(synthetic.totalSimulatedPacks>0);
assert.ok(Math.abs(synthetic.auraCardsPerHour-synthetic.totalSimulatedPacks*3600/25)<1e-7,
 "Throughput must use total packs / total time, not a ratio of separate medians");
// The game excludes event-expired cards, not all Halloween3 Collection cards.
assert.equal(isolated.__testDepthsEligible({name:"Pumpkin King",unobtainable:false,expires:false,boss:false,pack:"Halloween3",weather:"Pumpkin Moon"}),true,
  "Permanent Halloween3 card must stay in the Depths pool");
assert.equal(isolated.__testDepthsEligible({name:"Crow",unobtainable:false,expires:true,boss:false,pack:"Halloween3",weather:null}),false,
  "Expired Halloween3 card must be excluded");
// Util.DepthsStage builds Hard Mode roster from floor * 10 too.
const hardStage=isolated.__testDepthsTeam(100,1337,[],false,10);
const normalStage=isolated.__testDepthsTeam(1000,1337,[],false,1);
assert.deepEqual(hardStage.map(x=>x.card.name),normalStage.map(x=>x.card.name),
  "Hard Depths worker must generate floor*10 eligible card pool");
assert.deepEqual(hardStage.map(x=>x.power),normalStage.map(x=>x.power),
  "Hard Depths worker must generate floor*10 power");
const deathFive={medianFloor:5,estimatedFloorLow:5,estimatedFloorHigh:5,hardMode:false};
const clearedFromOne=isolated.__testCorrectRewards({...deathFive},[{deathFloor:5,playbackSeconds:10}],{startFloor:1});
const clearedFromFour=isolated.__testCorrectRewards({...deathFive},[{deathFloor:5,playbackSeconds:10}],{startFloor:4});
const instantLoss=isolated.__testCorrectRewards({...deathFive,medianFloor:4,estimatedFloorLow:4,estimatedFloorHigh:4},[{deathFloor:4,playbackSeconds:10}],{startFloor:4});
const hardClear=isolated.__testCorrectRewards({...deathFive,hardMode:true},[{deathFloor:5,playbackSeconds:10}],{startFloor:4,hardMode:true});
assert.equal(clearedFromOne.totalSimulatedPacks,4,"Defeat on floor 5 only rewards four floors");
assert.equal(clearedFromFour.totalSimulatedPacks,1,"Start on floor 4 must exclude earlier packs");
assert.equal(instantLoss.totalSimulatedPacks,0,"Defeat on starting floor must give zero packs");
assert.equal(hardClear.totalSimulatedPacks,3,"Hard Depths must triple packs for cleared floors");
assert.equal(clearedFromFour.potionRewards.median.depth,4,"Death floor must not count in potion summary");
assert(clearedFromOne.potionRewards.median.rareWeather.expected>clearedFromFour.potionRewards.median.rareWeather.expected,
  "Start-floor skip must reduce expected Rare Weather drops");
console.log("Depths playback worker smoke passed: floor-specific timings, source loot eligibility, and throughput-based speed ranking.");



// Regression: the shipped (customized) browser worker must enforce the trigger guard,
// preserve long valid chains, and report the exact matchup when it fails.
assert.ok(source.includes("Ability trigger limit reached (512 nested events)"),
 "Deployed worker does not have the ability trigger safety guard");
assert.ok(source.includes("function __depthsBattleError"),
 "Deployed worker does not have matchup diagnostics");
const probeSource=source.replace(/\}\)\(\);\s*$/, "self.__depthsGuardProbe=__depthsGuard;self.__depthsBattleErrorProbe=__depthsBattleError;})();");
assert.notEqual(probeSource,source,"Unable to inspect compiled trigger guard");
const probeWorker={navigator:{hardwareConcurrency:2},location:{href:"mock"},postMessage(){}};
new Function("self","performance",probeSource)(probeWorker,performance);
const triggerRuntime={},triggerCard={definition:{name:"Diagnostic Card"}};
const deepTriggers=(n)=>probeWorker.__depthsGuardProbe(triggerRuntime,triggerCard,"Diagnostic Ability",
 ()=>n>0?deepTriggers(n-1):"completed");
assert.equal(deepTriggers(300),"completed","Valid nested ability chain was blocked");
assert.equal(triggerRuntime.__depthsTriggerChain.length,0,"A successful ability chain was not cleared");
assert.throws(()=>deepTriggers(512),error=>
 error.message.includes("512 nested events") &&
 error.message.includes("Diagnostic Card") &&
 error.message.includes("Diagnostic Ability"));
assert.equal(triggerRuntime.__depthsTriggerChain.length,0,"Failed ability chain was not cleared");
const detailed=probeWorker.__depthsBattleErrorProbe(
 new Error("Ability trigger limit reached"),123,456,789,1011,
 {cards:[{cardName:"Robin Hood"}]},
 [{card:{name:"Noveau Riche",ability:"Persistent"}}]);
for(const text of ["Floor: 123","Run seed: 456","Robin Hood","Noveau Riche","Persistent"])
 assert.ok(detailed.message.includes(text),"Detailed error missing "+text);

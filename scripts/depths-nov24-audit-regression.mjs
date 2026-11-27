import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';

for(const prefix of ['', 'test/']){
 const workerSource=readFileSync(prefix+'browser/depths-worker.js','utf8');
 const s=workerSource.replace(/\}\)\(\);\s*$/, 'self.__audit={Be,Te,ea,ws,__crxCardTier,__depthsCorrectRewards,__depthsRealPlaybackTime,Na,Wa};})();');
 const self={navigator:{hardwareConcurrency:2},location:{href:'mock'},postMessage(){}};
 new Function('self','performance',s)(self,performance);
 const a=self.__audit;
 assert(a,'Missing audit hooks');
 for(const [name,expected] of [['Mythic Convergence',[25,50,100,200]],['Herald Of Virtue',[32,64,128,256]],['The Apocalypse',[200,300,400,500]]]){
  assert.deepEqual([null,'Platinum','Crystal','Galaxy'].map(b=>a.ea(a.Te(name),b)),expected,name);
 }
 assert.equal(a.ws(a.Te('The Apocalypse'),{definition:a.Be('War')},'Galaxy'),500);
 assert.equal(a.ws(a.Te('The Apocalypse'),{definition:a.Be('Wizard')},'Galaxy'),0);
 for(const [rarity,tier] of [[49999999,1],[50000000,1.5],[100000000,2],[250000000,2.5]])assert.equal(a.__crxCardTier({rarity}),tier);
 assert.equal(a.__crxCardTier({rarity:250000000,weather:'Storm'}),1);
 assert.equal(a.__crxCardTier({rarity:250000000,expires:true,collection:'Halloween3'}),2.5);
 for(const [start,death,expected,m] of [[1,54196,271609110,2],[1,27783,131831514,2],[1,300001,786204585,1],[100001,100002,2646,1]]){
  const r={hardMode:true,estimatedFloorLow:death,medianFloor:death,estimatedFloorHigh:death};
  a.__depthsCorrectRewards(r,[{deathFloor:death}],{startFloor:start,hardMode:true,packRewardMultiplier:m,bountifulDepths:true,bountifulDepthsLevel:4});
  assert.equal(r.auraPackMedian,expected);
 }
 assert.equal(a.Wa(900000),900000);
 assert.equal(a.Wa(1100000),1000000);
 const loadout={cards:Array.from({length:4},()=>({cardName:'Triceratops',borders:['Platinum','Emerald','Crystal','Ruby','Galaxy'],mutationWeather:'Reality Fracture'}))};
 for(const stride of [10,15,20,25]){
  const r=a.Na(loadout,{startFloor:1,floorCap:50,seed:123,hardMode:true,floorStride:stride,lazyDebug:true,battleTurnCap:500});
  assert.equal(r.floorStride,stride);assert.equal(r.battles,Math.ceil(50/stride));assert.equal(r.floorsCleared,50);assert(r.capReached);
 }
 const settings={baseBattleSpeed:3,skillTreeBattleSpeedLevel:6,chronoShardLevel:4,battleSpeedStructureLevel:7};
 const t=x=>a.__depthsRealPlaybackTime(300000,1,{...settings,floorOverheadSeconds:x},4);
 assert(Math.abs(t(2.76)-t(.36)-2.4)<1e-6);
 // Real Triceratops run: 20,500 floors in 5h, 3x gamepass, max structure, first skill-tree node.
 // Chrono tier and exact per-floor event counts are unknown. This is a speed sanity bound, not an exact fit.
 const ui=readFileSync(prefix+'src/depths-ui.js','utf8');
 assert(ui.includes('floorOverheadSeconds:.36'),'Default overhead must not penalize speedrun decks');
 let speedrunSeconds=0;
 for(let floor=1;floor<=20500;floor++)speedrunSeconds+=a.__depthsRealPlaybackTime(floor,1,{...settings,skillTreeBattleSpeedLevel:1,floorOverheadSeconds:.36},4);
 assert(speedrunSeconds>=18000*.8&&speedrunSeconds<=18000*1.25,'Triceratops timing sanity bound');
 const window={};
 new Function('window',readFileSync(prefix+'src/depths-drops.js','utf8'))(window);
 const d=window.CRXDepthsDrops.compute({runs:[{deathFloor:54196}],hardMode:true,totalSimulatedSeconds:172800,bountifulDepths:true,bountifulDepthsLevel:4,startFloor:1},{hardMode:false,startFloor:500,bountifulDepths:false});
 assert.equal(d.seconds,172800);
 const high=window.CRXDepthsDrops.compute({runs:[{deathFloor:1000001}],hardMode:true,startFloor:999900,totalSimulatedSeconds:1000},{});
 assert.equal(high.maxFloor,1000000);
 assert(Math.abs(d.loot.find(x=>x.name==='Jackpot Potion').expected-4780.833775)<1e-4);
 assert(Math.abs(d.loot.find(x=>x.name==='Gold Structure Coin').expected-189.224586)<1e-4);
 console.log(prefix||'main','audit checks passed');
}

// Witch's Curse replaces stolen abilities with the noncombat Lucky sentinel.
for(const prefix of ['', 'test/']) for(const [name, checker] of [['depths','Ca'],['tower','za']]){
 const source=readFileSync(prefix+'browser/'+name+'-worker.js','utf8');
 const self={navigator:{hardwareConcurrency:2},location:{href:'mock'},postMessage(){}};
 new Function('self','performance',source.replace(/\}\)\(\);\s*$/, 'self.__checkLucky='+checker+';})();'))(self,performance);
 const state={unsupportedAbilities:new Set()};
 self.__checkLucky(state,{abilityOverride:'Lucky',definition:{name:'Triceratops'}});
 assert.equal(state.unsupportedAbilities.size,0,'Witch’s Curse sentinel is a known no-op');
 self.__checkLucky(state,{abilityOverride:'Unknown audit fixture',definition:{name:'Triceratops'}});
 assert(state.unsupportedAbilities.has('Unknown audit fixture'),'Real unsupported abilities must remain visible');
}

 // Nov 26 live report: Sacred Judgment cannot trigger a bench Piccolo interception
 // after an earlier AoE target dies and the next target moves to the front.
 for(const prefix of ['', 'test/']) for(const [name,fightFn,cardFn] of [['depths','Ee','Be'],['tower','me','Xe']]){
  const source=readFileSync(prefix+'browser/'+name+'-worker.js','utf8');
  const self={navigator:{hardwareConcurrency:2},location:{href:'mock'},postMessage(){}};
  new Function('self','performance',source.replace(/\}\)\(\);\s*$/, 'self.__seraphim={fight:'+fightFn+',card:'+cardFn+'};})();'))(self,performance);
  const {fight,card}=self.__seraphim;
  const opponents=names=>names.map(n=>({card:card(n),power:200,attack:100,health:200}));
  const loadout=n=>({cards:[{cardName:n,borders:['Galaxy','Ruby','Crystal','Emerald','Platinum']}]});
  const aoeNames=['Steven','Pandora','Piccolo','The Awakened One'];
  const replay=fight(loadout('Seraphim'),opponents(aoeNames),1,1,true,true);
  assert(!replay.debug.events.some(e=>e.detail?.includes('Aura Farm protected')),'Sacred Judgment cannot be intercepted');
  assert.deepEqual(replay.state.fallen.Enemies.map(c=>c.definition.name),aoeNames);
  const fast=fight(loadout('Seraphim'),opponents(aoeNames),1,1,true,false);
  assert.equal(fast.state.teams.Enemies.length,0,'Non-debug simulation must agree with replay');
  const normal=fight(loadout('Trainee'),opponents(['Trainee','Piccolo']),1,1,true,true);
  assert(normal.debug.events.some(e=>e.detail?.includes('Aura Farm protected')),'Normal lethal attacks still activate Aura Farm');
 }

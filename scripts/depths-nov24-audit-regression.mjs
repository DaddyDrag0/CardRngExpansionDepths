import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';

for(const prefix of ['', 'test/']){
 const workerSource=readFileSync(prefix+'browser/depths-worker.js','utf8');
 const s=workerSource.replace(/\}\)\(\);\s*$/, 'self.__audit={Be,Te,ea,ws,__crxCardTier,__depthsCorrectRewards,__depthsRealPlaybackTime};})();');
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
 const settings={baseBattleSpeed:3,skillTreeBattleSpeedLevel:6,chronoShardLevel:4,battleSpeedStructureLevel:7};
 const t=x=>a.__depthsRealPlaybackTime(300000,1,{...settings,floorOverheadSeconds:x},4);
 assert(Math.abs(t(2.76)-t(.36)-2.4)<1e-6);
 const window={};
 new Function('window',readFileSync(prefix+'src/depths-drops.js','utf8'))(window);
 const d=window.CRXDepthsDrops.compute({runs:[{deathFloor:54196}],hardMode:true,totalSimulatedSeconds:172800,bountifulDepths:true,bountifulDepthsLevel:4,startFloor:1},{hardMode:false,startFloor:500,bountifulDepths:false});
 assert.equal(d.seconds,172800);
 assert(Math.abs(d.loot.find(x=>x.name==='Jackpot Potion').expected-4780.833775)<1e-4);
 assert(Math.abs(d.loot.find(x=>x.name==='Gold Structure Coin').expected-189.224586)<1e-4);
 console.log(prefix||'main','audit checks passed');
}

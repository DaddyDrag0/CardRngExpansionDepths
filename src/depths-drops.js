(function DepthsExpectedDrops(){
"use strict";
const NORMAL=[["Rare Weather Potion",17500000],["Legendary Speed Potion",1100000],["Legendary Luck Potion",1100000],["Elixir",1000000],["Structure Coin",800000],["Jackpot Potion",750000],["Cursed Potion",50000],["Windfall Potion",50000],["Potion III (Luck / Speed)",20000],["Fortune Potion",5000],["Potion II (Luck / Speed)",2000],["Potion I (Luck / Speed)",200],["Potion (Luck / Speed)",20]];
const HARD=[["Gold Structure Coin",116628],["Legendary Luck Potion",7789],["Legendary Speed Potion",7734],["Jackpot Potion",3978]];
const MATERIALS=[["Stone Fragment","Common",.04,1,.14,3],["Iron Ore","Common",.035,1,.12,3],["Ancient Bark","Common",.025,1,.10,3],["Bone Shard","Common",.02,1,.08,3],["Arcane Dust","Common",.015,1,.06,3],["Abyssal Crystal","Rare",.006,1,.05,2],["Soul Ember","Rare",.0025,1,.03,2],["Celestial Fragment","Rare",.001,1,.015,2],["Primordial Essence","Legendary",0,0,.01,1]];
const bountiful=[25,30,35,40,50];
const cache=new WeakMap();
const format=v=>v>=1000?new Intl.NumberFormat("en-US",{notation:"compact",maximumFractionDigits:2}).format(v):v>=1?v.toFixed(2).replace(/\.00$/,""):v>=.01?v.toFixed(3).replace(/0+$/,""):v>=.0001?v.toFixed(5).replace(/0+$/,""):v>0?v.toExponential(2):"0";
const perHour=(v,t)=>t>0?v*3600/t:0;
const percent=v=>`${(v*100).toFixed(v<.001?3:2)}%`;
function compute(result,state){
const hard=!!(result.hardMode??state.hardMode);
const bonus=state.bountifulDepths?bountiful[Math.min(4,Math.max(0,Number(state.bountifulDepthsLevel)||0))]:0;
const key=`${hard}:${bonus}`;
const existing=cache.get(result);if(existing?.key===key)return existing.data;
const floors=(result.runs||[]).map(run=>Math.min(300000,Math.max(0,Math.floor(Number(run.deathFloor)||1)-1)));
const maxFloor=Math.max(0,...floors);
const runs=Math.max(1,floors.length);
const sorted=[...floors].sort((a,b)=>a-b);
const list=hard?HARD:NORMAL,acc=new Map([...list.map(x=>[x[0],0]),...MATERIALS.map(x=>[x[0],0]),["Weather Token",0],["Random unowned gamepass",0],["Rare Gem",0],["Epic Gem",0],["Legendary Blue Gem",0],["Legendary Green Gem",0]]);
let j=0,checkpoints=0;
for(let f=1;f<=maxFloor;f++){
 while(j<sorted.length&&sorted[j]<f)j++;
 const weight=(sorted.length-j)/runs;
 if(weight<=0)break;
 const factor=hard?Math.ceil(f/100)*(1+bonus/100):(1+Math.ceil(Math.sqrt((3000+Math.pow(Math.min(5000,f),2.7)*40)/2))/100)*(1+bonus/100);
 let remain=1;
 for(const [name,denom] of list){const odds=Math.min(1,factor/denom),p=remain*odds;acc.set(name,acc.get(name)+p*weight);remain*=1-odds;}
 if(hard){
 const tok=f<=1000?.0002025:f<=3000?.00027:f<=5000?.000378:f<=7500?.0003996:.000405;
 acc.set("Weather Token",acc.get("Weather Token")+Math.min(1,tok*(1+bonus/100))*weight);
 acc.set("Random unowned gamepass",acc.get("Random unowned gamepass")+.00001*weight);
 }
 if(f%100===0){
  checkpoints+=weight;
  if(hard){
    acc.set('Rare Gem',acc.get('Rare Gem')+.001*weight);
    acc.set('Epic Gem',acc.get('Epic Gem')+.0002*weight);
  }
  const scale=Math.min(1.5,1+.05*Math.floor((f-1)/(hard?200:2000)));
  for(const [name,rarity,normal,qtyNormal,hardRate,qtyHard] of MATERIALS){
   const p=hard?hardRate:normal,qty=hard?qtyHard:qtyNormal;
   if(!p)continue;
   const boost=rarity!=="Common"?1+bonus/100:1;
   acc.set(name,acc.get(name)+Math.min(1,p*scale*boost)*qty*weight);
  }
 }
if(hard&&f%1000===0){
  const legendaryGemChance=Math.min(1,.01*(1+bonus/100));
  acc.set('Legendary Blue Gem',acc.get('Legendary Blue Gem')+legendaryGemChance*weight);
  acc.set('Legendary Green Gem',acc.get('Legendary Green Gem')+legendaryGemChance*weight);
}
}
const data={hard,bonus,checkpoints,floors,maxFloor,gems:hard?['Rare Gem','Epic Gem','Legendary Blue Gem','Legendary Green Gem'].map(name=>({name,expected:acc.get(name)})):[],loot:list.map(x=>({name:x[0],expected:acc.get(x[0])})).concat(hard?[{name:"Weather Token",expected:acc.get("Weather Token")},{name:"Random unowned gamepass",expected:acc.get("Random unowned gamepass")}]:[]),materials:MATERIALS.filter(x=>hard||x[0]!=="Primordial Essence").map(x=>({name:x[0],expected:acc.get(x[0])})),seconds:result.estimatedSecondsMedian||0};
cache.set(result,{key,data});
return data;
}
function render(result,state){
if(!Array.isArray(result?.runs)||!result.runs.length)return "";
const d=compute(result,state),sec=d.seconds;
const dayMult=sec>0?86400/sec:0;
const rows=arr=>arr.map(x=>`<tr><td>${x.name}</td><td>${format(x.expected)}</td><td>${format(perHour(x.expected,sec))}</td><td>${format(x.expected*dayMult)}</td></tr>`).join("");
const section=(name,sub,arr)=>`<section class="crx-drop-section"><div class="crx-drop-section-head"><h5>${name}</h5><span>${sub}</span></div><div class="crx-drop-scroll"><table><thead><tr><th>Item</th><th>Per run</th><th>Per hour</th><th>Per day</th></tr></thead><tbody>${rows(arr)}</tbody></table></div></section>`;
const runsDaily=sec>0?86400/sec:0;
return `<details class="crx-drop-details"><summary><span>Expected drops</span><small>Potions, materials & gems</small></summary>
<div class="crx-drop-inside">
<div class="crx-drop-overview"><span><b>${format(runsDaily)}</b> estimated runs/day</span><span><b>${format(d.checkpoints)}</b> material checkpoints/run</span><span>${d.hard?"Hard":"Normal"} Depths${d.bonus?` · Bountiful +${d.bonus}%`:""}</span></div>
<div class="crx-drop-cols">${section("Other drops","Every cleared floor",d.loot)}${section("Materials","Every 100 floors",d.materials)}</div>
${d.hard?section("Gems","Hard Depths",d.gems):""}
<p class="crx-drop-note">Averages from ${d.floors.length} simulated runs and estimated clear time. Actual drops may vary.</p>
</div></details>`;
}
window.CRXDepthsDrops={render,compute};
})();
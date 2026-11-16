import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {performance} from "node:perf_hooks";

/* Live Depths worker coverage, not source-only TypeScript.
   Registered is not the same as independently verified game-server parity. */
const source=readFileSync("browser/depths-worker.js","utf8");
const cards=Array.from({length:7},(_,i)=>JSON.parse(readFileSync("src/data/cards-"+(i+1)+".json","utf8"))).flat();
const descriptions=Object.assign({},...Array.from({length:4},(_,i)=>JSON.parse(readFileSync("src/data/abilities-"+(i+1)+".json","utf8"))));
const base=source.match(/Ma=new Set\((\[[\s\S]*?\])\),Cs=new Set/);
const v26=source.match(/const __v26Abilities=(\[[\s\S]*?\]);/);
const v34=source.match(/const __v34Modeled=new Set\((\[[\s\S]*?\])\)/);
assert(base&&v26&&v34,"Cannot identify actual deployed worker ability registry and extensions");
const registered=new Set([...JSON.parse(base[1]),...JSON.parse(v26[1]),...JSON.parse(v34[1]),"Drowned","Lucky 🤡"]);
const unique=new Set(cards.map(c=>c.ability).filter(Boolean));
const unavailable=cards.filter(c=>c.unobtainable);
const available=cards.filter(c=>!c.unobtainable);
const uncovered=available.filter(c=>c.ability&&!registered.has(c.ability)).map(c=>({card:c.name,ability:c.ability,description:descriptions[c.ability]||""}));
const legacyUnregistered=unavailable.filter(c=>c.ability&&!registered.has(c.ability)).map(c=>({card:c.name,ability:c.ability}));
const explicitlyUnverifiable=["Goon Detector","Reversal Rite","Nil","Cooked 🎪"];
assert.equal(cards.length,352,"Game card data changed; reassess the entire roster");
assert.deepEqual(uncovered,[],"Obtainable cards must not have unrecognized ability registrations");
assert.deepEqual(legacyUnregistered.map(c=>c.ability).sort(),[...explicitlyUnverifiable].sort(),
 "Archived, unobtainable card data must not be presented as currently available");
const approximations=["Experimental Treatment","Mutate","Shared Power","Three Gifts","Nothing"];
const noncombat=["Lucky 🤡","Anullment"];
const exact=[...unique].filter(a=>registered.has(a)&&!approximations.includes(a)&&!noncombat.includes(a));
console.log("Depths card coverage:",JSON.stringify({
 cards:cards.length,availableCards:available.length,uniqueAbilities:unique.size,
 registeredAbilities:[...unique].filter(a=>registered.has(a)).length,
 archivedUnobtainableMissingAbilities:legacyUnregistered,
 modeledButGameParityUnverified:exact.length,
 approximationCount:approximations.length,approximations,
 noncombatCount:noncombat.length,noncombat,
 unresolvedCount:uncovered.length,unresolved:uncovered
},null,2));

// Test the real bundled hooks in isolation, including genuine seeded RNG.
const augmented=source.replace(/\}\)\(\);\s*$/,'self.__depthsAudit={Ma,__v26PreHit,__v26AfterHit,__v26AfterTurn,__v26BeforeTurn,__v26Enter,__v34Init,Be,Os,Ee,ee,W,f};})();');
assert.notEqual(augmented,source,"Could not export internal hooks from the deployed worker");
const fake={navigator:{hardwareConcurrency:2},location:{href:"mock"},postMessage(){}};
new Function("self","performance",augmented)(fake,performance);
const x=fake.__depthsAudit;
assert(x&&x.Ma.has("Experimental Treatment")&&x.Ma.has("The End"));
for(const ability of explicitlyUnverifiable)assert(!x.Ma.has(ability),"Unverified ability was silently declared supported: "+ability);
function unit(name,team,id,atk=40){
 const definition=x.Be(name);assert(definition,"Missing card "+name);
 return {id:id||team+":"+name,team,definition,index:1,hp:100,maxHp:100,damage:atk,power:200,borders:[],
  entered:false,dead:false,flags:{},counters:{},status:{stunned:0,confused:0,burn:0,weakness:false,blind:false,shield:0}};
}
function fight(allies,enemies,rng=.15){
 const state={teams:{Allies:allies,Enemies:enemies},fallen:{Allies:[],Enemies:[]},
  boosts:{Allies:{},Enemies:{}},turn:2,moving:"Allies",unsupportedAbilities:new Set()};
 const runtime={state,rng:{next:()=>rng},debug:{events:[]},captureDebug:true,counterDepth:0,orchardSeeds:new Map()};
 return runtime;
}
{
 const witch=unit("Witch Doctor","Allies"),victim=unit("Wizard","Enemies");
 const cases=[
  [.05,"poisonTurns"],[.25,"bleed"],[.45,"burn"],[.65,"weakness"],[.85,"stunned"]
 ];
 for(const [roll,key] of cases){
  const a=fight([witch],[victim],roll);
  victim.status={stunned:0,confused:0,burn:0,weakness:false,blind:false,shield:0};victim.counters={};
  x.__v26AfterHit(a,witch,victim,1);
  const effect=key==="burn"||key==="weakness"||key==="stunned"?victim.status[key]:victim.counters[key];
  assert(effect,"Experimental Treatment failed to apply "+key+" at rng "+roll);
  assert(a.debug.events.some(e=>e.detail?.includes("Experimental Treatment applied")),
   "Experimental Treatment missing from the battle replay trace");
 }
}
{
 const cave=unit("Cave Goblin","Allies"),enemy=unit("Wizard","Enemies");
 assert.equal(x.__v26PreHit(fight([cave],[enemy],.01),cave,enemy).mult,2,"Dagger 10% crit missing");
 assert.equal(x.__v26PreHit(fight([cave],[enemy],.9),cave,enemy).mult,1,"Dagger must not always crit");
}
{
 const king=unit("Epitome","Allies"),target=unit("Wizard","Enemies"),next=unit("Archer","Enemies");
 const rt=fight([king],[target,next],.1);target.hp=0;
 x.__v26AfterHit(rt,king,target,20);
 assert.equal(next.hp,0,"The End must defeat the next card after a kill");
}
{
 const giver=unit("Three Wise Men","Allies"),receiver=unit("Wizard","Allies"),op=unit("Archer","Enemies");
 giver.borders=["Galaxy"];receiver.borders=["Platinum"];
 const rt=fight([giver,receiver],[op],.1);
 x.__v26AfterTurn(rt,giver);
 assert.equal(receiver.maxHp,120,"Three Gifts must buff the next lower-border ally by 20%");
 assert.equal(receiver.counters.extraTurns,1,"Three Gifts must queue its extra attack");
}
{
 const ouro=unit("Ouroboros","Allies"),ally=unit("Cave Goblin","Allies"),enemy=unit("Wizard","Enemies");
 const rt=fight([ouro,ally],[enemy]);
 x.__v34Init(rt.state);
 assert(rt.state.boosts.Allies.noAbilities&&rt.state.boosts.Enemies.noAbilities,
  "Nothing must disable both teams' abilities");
 assert.equal(x.f(rt,ally,"Dagger"),false,"Disabled team must not use attack abilities");
}
{
 const reincarnation=unit("True Incarnation","Allies"),goblin=unit("Cave Goblin","Allies"),enemy=unit("Wizard","Enemies");
 const rt=fight([reincarnation,goblin],[enemy]);
 x.__v26Enter(rt,reincarnation);
 assert(reincarnation.bonusAbilities?.includes("Dagger"),"Shared Power must inherit allied abilities");
}
console.log("Depths ability regression passed: all-card registry, 5 status treatments, Dagger, The End, Three Gifts, Nothing and Shared Power.");


/* Execute every card in a real, deterministic, bounded Depths battle. This
   catches runtime exceptions and unexpected unsupported flags in the actual
   browser worker. It does NOT establish Roblox-server combat parity. */
const opponent=x.Be("Wizard");
assert(opponent,"Controlled test enemy missing");
const enemyLineup=Array.from({length:4},(_,i)=>({
 card:opponent,power:100,attack:50,health:200
}));
const failures=[],warnings=[];
for(const [i,card] of cards.entries()){
 const loadout={cards:[
  {cardName:card.name,borders:[],mutationWeather:null},
  {cardName:"Archer",borders:[],mutationWeather:null},
  {cardName:"Archer",borders:[],mutationWeather:null},
  {cardName:"Archer",borders:[],mutationWeather:null}
 ]};
 try{
  const result=x.Ee(loadout,enemyLineup,0x32900+i,18,false,false);
  if(!result||!Array.isArray(result.unsupportedAbilities))throw Error("Invalid combat result");
  for(const warning of result.unsupportedAbilities){
   if(warning==="Battle turn cap reached")continue;
   if(explicitlyUnverifiable.includes(warning))continue;
   warnings.push({card:card.name,warning});
  }
 }catch(error){failures.push({card:card.name,error:String(error)})}
}
assert.deepEqual(failures,[],"Cards with runtime crashes: "+JSON.stringify(failures.slice(0,30)));
assert.deepEqual(warnings,[],"Cards with unexpected unsupported effects: "+JSON.stringify(warnings.slice(0,30)));
console.log("Depths live-worker roster smoke: "+cards.length+" cards initialized and battled (18-turn safety cap, seeded).");

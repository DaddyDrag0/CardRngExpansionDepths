import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {performance} from "node:perf_hooks";

const ui=readFileSync("src/depths-ui.js","utf8");
const ts=readFileSync("src/engine/auras.ts","utf8");
const worker=readFileSync("browser/depths-worker.js","utf8");
const ask=ui.slice(ui.indexOf("  function askWorker("),ui.indexOf("  let banLabRunToken="));
assert(ask.includes("gemPveBonus:state.redGemPveBonus"),
 "Test Team must forward the visible PvE Red Gems setting (was ignored)");
assert(ask.includes("rebanLegacyDepths:state.rebanLegacyDepths"),
 "Test Team must forward the selected legacy-ban option");
assert(ts.includes("const value = isStatAuraBoosted(aura, card) ? base * Number(aura.boostMult || 1) : base"),
 "Keep established boosted-aura replacement behavior; do not overboost");
assert(worker.includes("let l=Ss(a,e)?i*Number(a.boostMult||1):i;"),
 "Deployed worker must agree with the aura source and original regression");
const instrumented=worker.replace(/\}\)\(\);\s*$/,"self.__check={Os,qe,ws,Be,Te,setGem(n){__redGemMultiplier=n}};})();");
assert.notEqual(instrumented,worker,"Could not instrument active worker");
const obj={navigator:{hardwareConcurrency:2},location:{href:"mock"},postMessage(){}};
new Function("self","performance",instrumented)(obj,performance);
const a=obj.__check;
const aura=a.Te("Dinosaur King");
assert.equal(a.ws(aura,{definition:a.Be("Triceratops")},"Galaxy"),414,
 "Dinosaur King total special bonus is 414% in existing mechanics regression");
assert.equal(a.ws(aura,{definition:a.Be("Wizard")},"Galaxy"),256);
const loadout={
 cards:[
 {cardName:"Triceratops",borders:["Platinum","Crystal","Ruby","Galaxy"],mutationWeather:null},
 {cardName:"Triceratops",borders:["Platinum","Emerald","Crystal","Ruby"],mutationWeather:"Blood Rain"},
 {cardName:"Triceratops",borders:["Platinum","Emerald","Ruby","Galaxy"],mutationWeather:null},
 {cardName:"Triceratops",borders:["Platinum","Emerald","Ruby","Galaxy"],mutationWeather:null}
 ],
 statAura:{auraName:"Dinosaur King",border:"Galaxy"},
 abilityAura:{auraName:"Jurassic World",border:"Crystal"}
};
const enemy=a.qe(25000,123,[],false,10);
a.setGem(1);
const unboosted=a.Os(loadout,enemy).teams.Allies.map(c=>c.damage);
a.setGem(1.2);
const boosted=a.Os(loadout,enemy).teams.Allies.map(c=>c.damage);
for(let i=0;i<4;i++)assert(Math.abs(boosted[i]/unboosted[i]-1.2)<1e-10,
 "PvE Red Gem +20 must multiply every Triceratops' actual combat ATK");
console.log("Depths v39: normal Test Team request includes PvE Red Gems and legacy bans; boost and aura parity passed.");

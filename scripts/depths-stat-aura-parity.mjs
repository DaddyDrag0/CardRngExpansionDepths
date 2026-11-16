import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {performance} from "node:perf_hooks";

// Source and deployed worker must both add the stat aura's universal base
// and its separate pack/weather bonus; this was the Triceratops regression.
const source=readFileSync("src/engine/auras.ts","utf8");
const worker=readFileSync("browser/depths-worker.js","utf8");
assert(source.includes("const value = base + bonus"),"Source stat aura must add, not replace, universal bonus");
assert(worker.includes("let l=i+(Ss(a,e)?i*Number(a.boostMult||0):0);"),
 "Deployed worker must match source stat aura stacking");

const instrumented=worker.replace(/\}\)\(\);\s*$/,"self.__audit={Os,Na,ws,Be,Te,Ee,qe,Pi};})();");
assert.notEqual(instrumented,worker,"Could not instrument deployed worker");
const mock={navigator:{hardwareConcurrency:8},location:{href:"mock"},postMessage(){}};
new Function("self","performance",instrumented)(mock,performance);
const a=mock.__audit;
const triceratops=a.Be("Triceratops");
const aura=a.Te("Dinosaur King");
const other=a.Be("Wizard");
const unbuffed={definition:triceratops};
const ordinary={definition:other};
const expectedBase=256;
const expectedExtra=414;
assert.equal(a.ws(aura,unbuffed,"Galaxy"),expectedBase+expectedExtra,
 "Prehistoric card must receive 256% universal + 414% extra = 670%");
assert.equal(a.ws(aura,ordinary,"Galaxy"),expectedBase,
 "Non-Prehistoric card must still receive the universal 256%");

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
const bans=["Zombie Dragon","Pandora","Odin","The Awakened One","Gilgamesh","Amaterasu",
 "Kuchisake-onna","Ultimate Brawler","Megalodon","Piccolo","Nao Presence","Inari",
 "Mastermind","Control Freak"];
const stats=a.Os(loadout,a.qe(25000,3,bans,false,10));
const first=stats.teams.Allies[0];
assert(Math.abs(first.damage-290665267)<30,"Four-Triceratops first card ATK regression: "+first.damage);
assert(Math.abs(first.hp-581330534)<30,"Four-Triceratops first card HP regression: "+first.hp);
// A single fixed full-window sampled run checks the actual interaction of
// the aura, entry attacks and Hard-mode enemies, without claiming 100% success.
const sample=a.Na(loadout,{
 startFloor:18000,floorCap:25000,seed:1401,hardMode:true,floorStride:3,
 bannedCardNames:bans,lazyDebug:true,battleTurnCap:1000
});
assert.equal(sample.deathFloor,25001,
 "Deck should survive the regression's sampled Hard Depths floor 18K–25K window");
assert.deepEqual(sample.unsupportedAbilities,[],"No unrecognized Triceratops/auras");
console.log("Triceratops Hard Depths parity: universal + extra stat aura stacking; sample reached 25K (every-third-floor test only).");

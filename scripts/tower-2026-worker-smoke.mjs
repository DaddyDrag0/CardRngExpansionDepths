import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";

// The new Tower/Boss/Trial handlers currently live in the customized browser
// bundle. This test exercises that exact deployed artifact, not a stale TS copy.
const source = readFileSync("browser/tower-worker.js", "utf8");
for (const token of ["new-tower-cheese", "new-tower-sim", "maxRapture", "mutatedOnly", "noAuras"]) {
  assert.ok(source.includes(token), "Deployed Tower worker missing " + token);
}
const exported2026Abilities = [
 "Behind Reality","Cracked Crown","Crushing Depths","Delayed Impact",
 "Devour the Deep","Dimensional Slip","Divine Flood","Dream Doppelgänger",
 "Eternal Slumber","Forgotten Existence","Lucid Dream","Perfect Reflection",
 "Rewrite Existence","Sands of Renewal","Siren's Song","Sunken Kingdom","Terrorize"
];
for (const name of exported2026Abilities) {
 assert.ok(source.split(name).length >= 4, "2026 worker does not contain a modeled handler for " + name);
}
const messages = [];
const worker = { postMessage: message => messages.push(message) };
new Function("self", "performance", source)(worker, performance);
assert.equal(typeof worker.onmessage, "function");

const baseCards = ["Robin Hood", "Noveau Riche", "Pandora", "Kuchisake-onna"]
  .map(cardName => ({ cardName, borders: [], mutationWeather: null }));
function request(name, overrides = {}) {
  messages.length = 0;
  const payload = {
    kind: "new-tower-sim", id: name, floor: 5,
    enemyNames: ["Baby Skeleton", "Baby Skeleton", "Baby Skeleton", "Wizard"],
    attack: 815, hp: 1630, mode: {}, seed: 3, runs: 2,
    loadout: { cards: baseCards, statAura: null, abilityAura: null },
    ...overrides
  };
  worker.onmessage({ data: payload });
  const response = messages.find(message => message.id === name && typeof message.ok === "boolean");
  assert.ok(response, "No result for " + name);
  return response;
}
const valid = request("valid");
assert.equal(valid.ok, true, valid.error);
assert.equal(valid.result.runs, 2);
assert.ok(valid.result.wins >= 0 && valid.result.wins <= 2);

const banned = request("banned", { banned: ["Robin Hood"] });
assert.equal(banned.ok, false);
assert.match(banned.error, /banned/i);

const mutation = request("mutation", { mode: { mutatedOnly: true } });
assert.equal(mutation.ok, false);
assert.match(mutation.error, /mutated/i);

const rapture = request("rapture", {
  mode: { maxRapture: 1 },
  loadout: { cards: [
    { cardName: "Heaven's Armor", borders: [], mutationWeather: null },
    { cardName: "Hell's Army", borders: [], mutationWeather: null },
    ...baseCards.slice(2)
  ], statAura: null, abilityAura: null }
});
assert.equal(rapture.ok, false);
assert.match(rapture.error, /Rapture/i);

const restrictions = request("special-mode", {
  mode: { noAuras: true, noHealing: true, freezeChance: 0.25, bleed: 0.15, burn: 0.2 }
});
assert.equal(restrictions.ok, true, restrictions.error);
for (const [index,names] of [
 ["Abyssal Siren","Nightmare Stag","The Floodbringer","The Waking Comet"],
 ["The Drowned Monarch","The Mirrorborn","The Sandman","The False Creator"]
].entries()) {
 const newCards=names.map(cardName=>({cardName,borders:[],mutationWeather:null}));
 const result=request("new-abilities-"+index,{loadout:{cards:newCards,statAura:null,abilityAura:null}});
 assert.equal(result.ok,true,result.error);
 assert.deepEqual(result.result.unsupportedAbilities,[]);
 assert.equal(result.result.trusted,true);
}
const eightEnemies=Array.from({length:8},()=> "Baby Skeleton");
const doubleTrouble=request("double-trouble",{enemyNames:eightEnemies});
assert.equal(doubleTrouble.ok,true,doubleTrouble.error);
const hardcore=request("hardcore-double-trouble",{
 enemyNames:eightEnemies,
 mode:{hardcore:true,disabledCards:["Robin Hood"],disabledAuras:["Shared Dream","End Times"]}
});
assert.equal(hardcore.ok,true,hardcore.error);
assert.equal(hardcore.result.trusted,false,"Unverified Hardcore effect parity must not be trusted");
assert.ok(hardcore.result.unsupportedAbilities.some(x=>x.includes("Hardcore")));
const tooMany=request("invalid-nine",{enemyNames:[...eightEnemies,"Baby Skeleton"]});
assert.equal(tooMany.ok,false);
assert.match(tooMany.error,/1–8 enemies/);
assert.ok(source.includes("Emerald:1e3"),"Compiled worker lacks Emerald border");
const bothRaptures = [
 {cardName:"Heaven's Armor",borders:[],mutationWeather:null},
 {cardName:"Hell's Army",borders:[],mutationWeather:null},
 ...baseCards.slice(2)
];
const regularBoss = request("boss-regular-rapture",{
 mode:{maxRapture:1},loadout:{cards:bothRaptures,statAura:null,abilityAura:null}
});
assert.equal(regularBoss.ok,false,"Regular bosses limit Rapture");
assert.match(regularBoss.error,/at most 1 Rapture/);
const hardcoreBoss = request("boss-hardcore-rapture",{
 banned:["Heaven's Armor"],
 mode:{hardcore:true,maxRapture:1,disabledCards:["Robin Hood"],disabledAuras:["End Times"]},
 loadout:{cards:bothRaptures,statAura:null,abilityAura:null}
});
assert.equal(hardcoreBoss.ok,true,hardcoreBoss.error);
assert.equal(hardcoreBoss.result.trusted,false);
const mutatedRaptures = request("boss-regular-mutation-rapture",{
 mode:{maxRapture:1},loadout:{cards:[
 {...baseCards[0],mutationWeather:"Rapture"},
 {...baseCards[1],mutationWeather:"Rapture"},
 ...baseCards.slice(2)
 ],statAura:null,abilityAura:null}
});
assert.equal(mutatedRaptures.ok,false,"Rapture mutations count against regular boss cap");
messages.length=0;
const ownedSearch=["Robin Hood","Pandora","Noveau Riche","Kuchisake-onna","Heaven's Armor","Hell's Army"];
worker.onmessage({data:{
 id:"ai-probe",kind:"new-tower-ai",floor:5,
 enemyNames:["Baby Skeleton","Baby Skeleton","Baby Skeleton","Wizard"],
 attack:800,hp:1600,mode:{maxRapture:1},seed:17,aiEffort:"quick",
 onlyOwned:true,ownedCards:ownedSearch,banned:["Robin Hood"],
 addedCards:["Pandora"],excludedCards:[]
}});
const aiResult=messages.find(m=>m.id==="ai-probe"&&typeof m.ok==="boolean");
assert.equal(aiResult?.ok,true,aiResult?.error||"AI search returned no result");
assert.equal(aiResult.result.ai,true);
assert.equal(aiResult.result.aiKind,"evolutionary");
assert.ok(aiResult.result.eligibleCards>=4&&aiResult.result.eligibleCards<=5);
assert.ok(aiResult.result.evaluatedDecks>0&&aiResult.result.battleSimulations>0);
assert.ok(aiResult.result.recommendations.length>0);
for(const rec of aiResult.result.recommendations){
 const names=rec.loadout.cards.map(c=>c.cardName);
 assert.equal(names.length,4);
 assert.equal(new Set(names).size,4);
 assert.ok(names.every(n=>ownedSearch.includes(n)),"AI recommended an unowned card");
 assert.ok(!names.includes("Robin Hood"),"AI recommended a banned card");
 assert.ok(names.filter(n=>["Heaven's Armor","Hell's Army"].includes(n)).length<=1,
  "AI ignored 1-Rapture restriction");
}

messages.length=0;
const referenceLoadout={
 cards:["Pandora","Kuchisake-onna","Noveau Riche","Heaven's Armor"].map((cardName,i)=>({
  cardName,borders:i===0?["Galaxy"]:i===2?["Emerald"]:[],
  mutationWeather:i===1?"Storm":null
 })),statAura:null,abilityAura:null
};
worker.onmessage({data:{
 id:"ai-parity",kind:"new-tower-ai",floor:5,attack:800,hp:1600,
 enemyNames:["Baby Skeleton","Baby Skeleton","Baby Skeleton","Wizard"],
 mode:{maxRapture:1},seed:12089,aiEffort:"quick",runs:200,onlyOwned:true,
 ownedCards:ownedSearch,
 referenceLoadout,
 searchGear:{borders:["Galaxy","","Emerald",""],mutations:["","Storm","",""],aura:null},
 excludedCards:[],addedCards:[]
}});
const searchReply=messages.find(m=>m.id==="ai-parity"&&typeof m.ok==="boolean");
assert.equal(searchReply?.ok,true,searchReply?.error);
const search=searchReply.result;
assert.equal(search.referenceIncluded,true,"AI must include the manual reference deck");
assert.ok(search.verifyRuns>=200,"AI results must use the same sample size as manual simulation");
const parity=search.recommendations.find(rec=>
 rec.loadout.cards.map(c=>c.cardName).join("|")===referenceLoadout.cards.map(c=>c.cardName).join("|"));
assert.ok(parity,"User's reference deck must reach final verification, even if its scout score is low");
assert.deepEqual(parity.loadout.cards.map(c=>c.borders),referenceLoadout.cards.map(c=>c.borders),"Gear must match manual");
assert.deepEqual(parity.loadout.cards.map(c=>c.mutationWeather),referenceLoadout.cards.map(c=>c.mutationWeather),"Mutations must match manual");
const replay=request("manual-ai-parity",{
 floor:5,attack:800,hp:1600,mode:{maxRapture:1},
 loadout:parity.loadout,runs:search.verifyRuns,seed:search.verificationSeed
});
assert.equal(replay.ok,true,replay.error);
assert.equal(replay.result.wins,parity.wins,
 "The EXACT same card team, gear, enemy and seed MUST have the same AI and manual win rate");
assert.equal(replay.result.averageTurns,parity.averageTurns,
 "AI and manual must use the same battle simulator, including average turns");
console.log("AI/manual parity: "+parity.wins+"/"+parity.runs+" verified seeded battles; Galaxy/Emerald gear matches.");
console.log("2026 Tower worker smoke passed: real seeded battles, source bans and AI/manual parity.");



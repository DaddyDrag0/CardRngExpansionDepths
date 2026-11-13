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
console.log("Tower/Boss/Trial 2026 worker smoke: passed (7 scenarios; 17 handlers scanned).");

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(path, "utf8");
const loader = read("index.html");
const html = read("index-base.html");
const css = read("src/cheese-2026.css");
const files = [
 "src/cheese-card-search.js",
 "src/tower-2026-rewards.js",
 "src/new-tower-cheese.js",
 "src/new-boss-cheese.js",
 "src/new-trial-cheese.js",
 "src/overhaul-hub.js",
 "src/depths-drops.js"
];
for(const path of files)assert.doesNotThrow(()=>new Function(read(path)),path+" is invalid JavaScript");
for(const name of ["cheese-card-search","tower-2026-rewards","new-tower-cheese","new-boss-cheese","new-trial-cheese"]){
 assert.ok(html.includes("./src/"+name+".js"),"Missing "+name+" script");
 assert.ok(loader.includes("'"+name+".js'"),"Missing "+name+" cache buster");
}
assert.ok(html.indexOf("cheese-card-search.js")<html.indexOf("new-tower-cheese.js"),"Autocomplete loads too late");
assert.ok(html.indexOf("tower-2026-rewards.js")<html.indexOf("new-tower-cheese.js"),"Rewards module loads too late");
assert.ok(html.indexOf("cheese-2026.css")<html.indexOf("overhaul-hub.css"),"Layout fallback should be last");
assert.ok(css.includes(".cc-card-search-popup"),"Styled autocomplete missing");
assert.ok(css.includes(".tc-pack-grid"),"Responsive reward inputs missing");
assert.ok(read("src/cheese-card-search.js").includes('input.removeAttribute("list")'),"Native white datalist still active");

const cards=Array.from({length:7},(_,i)=>i+1).flatMap(i=>JSON.parse(read("src/data/cards-"+i+".json")));
assert.equal(cards.length,new Set(cards.map(card=>card.name)).size,"Duplicate card names break exact selection");
assert.equal(cards.find(card=>card.name==="Count Muscula")?.rarity,2000000);
assert.equal(cards.find(card=>card.name==="Count Muscula (Legacy)")?.rarity,2000);
assert.equal(cards.find(card=>card.name==="Skeleton King")?.rarity,3333000);
assert.equal(cards.find(card=>card.name==="Skeleton King (Legacy)")?.rarity,3333);

const towerCode = read("src/tower-2026-data.js");
const tower = JSON.parse(towerCode.replace(/^window\.CRXTowerConfig2026=/,"").replace(/;\s*$/,""));
assert.equal(tower.order.length,11);
assert.equal(new Set(tower.order).size,11);
for(const name of tower.order)assert.ok(tower.towers[name],"Tower data missing "+name);
for(const roster of Object.values(tower.bossTeams))for(const team of Object.values(roster))assert.equal(team.split("|").length,4,"Invalid tower lineup");

const bossCode=read("src/boss-2026-data.js");
const boss=JSON.parse(bossCode.replace(/^window\.CRXBossData2026=/,"").replace(/;\s*$/,""));
assert.equal(boss.bosses.length,16);
assert.equal(boss.maxRaptureCards,1);
for(const entry of boss.bosses)assert.equal(entry.difficulty.length,5,"Missing boss difficulties "+entry.id);
const bossUi=read("src/new-boss-cheese.js");
for(const key of ["activityBans()","bannedByBoss","bannedByDifficulty","maxRaptureCards"]){
 assert.ok(bossUi.includes(key),"Boss restriction hook missing "+key);
}
const trialCode=read("src/trial-2026-data.js");
const trials=JSON.parse(trialCode.replace(/^window\.CRXTrialData2026=/,"").replace(/;\s*$/,""));
assert.deepEqual(Object.keys(trials),["Daily","Weekly","Monthly"]);
assert.equal(trials.Daily.max,45);
assert.equal(trials.Weekly.max,80);
assert.equal(trials.Monthly.max,200);
assert.equal(trials.Monthly.packs,null,"Do not fabricate unknown Monthly Trial packs");
const trialUi=read("src/new-trial-cheese.js");
assert.ok(trialUi.includes("Enter the four actual enemy names"),"Unverified random lineups must require input");
assert.ok(trialUi.includes('s.enemies=["","","",""]'),"Stale enemy roster not reset");

const rewardsSource=read("src/tower-2026-rewards.js");
const win={};
const storage={getItem:()=>null,setItem(){}};
new Function("window","localStorage",rewardsSource)(win,storage);
const planner=win.CRXTowerPackPlanner;
assert.ok(planner,"Reward planner was not initialized");
assert.equal(planner.parseAmount("1.5M"),1500000n);
assert.equal(planner.parseAmount("9,223,372,036,854,775,807"),9223372036854775807n);
assert.equal(planner.parseAmount("unknown"),undefined);
assert.equal(planner.parseAmount(""),null);
assert.match(planner.render(tower.order),/Final total unavailable/);
const allTotals=Object.fromEntries(tower.order.map(name=>[name,"1,000"]));
const withAmounts={};
new Function("window","localStorage",rewardsSource)(withAmounts,{
 getItem:()=>JSON.stringify({totals:allTotals,multiplier:2,open:true}),setItem(){}
});
assert.match(withAmounts.CRXTowerPackPlanner.render(tower.order),/22,000 Instant Packs/);

console.log("2026 overhaul UI/data regression: passed.");

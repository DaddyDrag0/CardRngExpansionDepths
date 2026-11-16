import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(path, "utf8");
const loader = read("index.html");
const html = read("index-base.html");
const css = read("src/cheese-2026.css");
const build=JSON.parse(read("site-version.json")).version;
assert.match(build,/-v\d+$/,"Site version must end in a visible numeric build number");
const header=read("src/overhaul-hub.js");
assert(header.includes("crx-version")&&header.includes("__CRX_SITE_VERSION"),"Test header must display current cache-busted version number");
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
assert.equal(tower.order.length,13);
assert.equal(new Set(tower.order).size,13);
for(const name of tower.order)assert.ok(tower.towers[name],"Tower data missing "+name);
for(const [set,roster] of Object.entries(tower.bossTeams))for(const team of Object.values(roster))assert.equal(team.split("|").length,set==="DoubleTrouble"?8:4,"Invalid "+set+" lineup");
assert.equal(Object.keys(tower.bossTeams.DoubleTrouble).length,21);
assert.equal(Object.keys(tower.bossTeams.WeatherPrognosis).length,21);
assert.equal(tower.towers.DoubleTrouble.teamSize,8);
assert.equal(tower.towers.WeatherPrognosis.packs,77_500_000);
assert.equal(tower.hardcoreMultiplier,1.5);

const activity=JSON.parse(read("src/activity-rules-2026.json"));
assert.deepEqual(Object.keys(activity.activityBans).sort(),["Serenity the Serene","The Dreaming Shepherd"].sort());
assert.equal(activity.hardcore.disabledCardAbilities.length,23);
assert.deepEqual(activity.hardcore.disabledAuras,["Shared Dream","End Times"]);
assert.deepEqual(activity.hardcore.towerExceptions.DoubleTrouble,["Fate Seamstress"]);
assert.equal(activity.normalPortal.lowRankBans.length,3);
assert.equal(activity.normalPortal.highRankBans.length,14);
assert.equal(activity.normalPortal.maxRaptureLow,2);
assert.equal(activity.normalPortal.maxRaptureHigh,1);
assert.equal(activity.boss.regular.maxRaptureCards,1);
assert.equal(activity.boss.hardcore.maxRaptureCards,null);

const bossCode=read("src/boss-2026-data.js");
const boss=JSON.parse(bossCode.replace(/^window\.CRXBossData2026=/,"").replace(/;\s*$/,""));
assert.equal(boss.bosses.length,16);
assert.equal(boss.maxRaptureCards,1);
assert.ok(read("src/new-boss-cheese.js").includes("maxRapture:state.hardcore?null:source.maxRaptureCards"),
 "Hardcore bosses must not carry the regular Rapture cap");
assert.ok(read("src/new-boss-cheese.js").includes("!state.hardcore&&state.team.filter"),
 "Hardcore boss UI must allow multiple Rapture cards");
assert.ok(read("src/new-tower-cheese.js").includes("const banned=()=>s.hardcore?[]"),
 "Hardcore towers must not use regular activity card-entry bans");
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
assert.equal(trials.Monthly.packs,10_000_000,"Monthly Trial packs must be four times Weekly (TrialConfig.lua)");
assert.equal(trials.Daily.endPotions["Mythical Luck Potion"],5);
assert.equal(trials.Weekly.endPotions["Mythical Luck Potion"],25);
assert.equal(trials.Monthly.completionPotions["Mythical Luck Potion"],75);
const trialUi=read("src/new-trial-cheese.js");
assert.ok(trialUi.includes("Enter the four actual enemy names"),"Unverified random lineups must require input");
assert.ok(trialUi.includes('s.enemies=["","","",""]'),"Stale enemy roster not reset");

const rewardsSource=read("src/tower-2026-rewards.js");
const win={CRXTowerConfig2026:tower};
const storage={getItem:()=>null,setItem(){}};
new Function("window","localStorage",rewardsSource)(win,storage);
const planner=win.CRXTowerPackPlanner;
assert.ok(planner,"Reward planner was not initialized");
assert.equal(planner.allocate("Easy").length,105);
assert.equal(planner.getTotals(tower.order,105,false,false).total,363_500_000);
assert.equal(planner.getTotals(tower.order,105,false,true).total,727_000_000);
assert.equal(planner.getTotals(tower.order,105,true,true).total,1_817_499_318);
assert.equal(planner.getTotals(["DoubleTrouble"],105,false,false).total,62_000_000);
assert.equal(planner.getTotals(["WeatherPrognosis"],105,false,false).total,77_500_000);
assert.match(planner.render(tower.order),/1,817,499,318 packs/);
assert.ok(tower.hardcoreDisabledCards.includes("Robin Hood"));
assert.ok(read("src/types.ts").includes("'Emerald'"));
assert.ok(read("src/engine/stats.ts").includes("Emerald: 1_000"));

console.log("2026 overhaul UI/data regression: passed.");

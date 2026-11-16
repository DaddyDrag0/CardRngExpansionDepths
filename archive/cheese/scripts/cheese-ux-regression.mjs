import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=path=>readFileSync(path,"utf8");
const html=read("index-base.html");
const css=read("src/cheese-2026.css");
assert.ok(css.includes(".tc-team")&&css.includes(".cc-manual-grid"),"Familiar Cheese layout missing");
assert.ok(!html.includes("cheese-deck-ux.js"),"Unrequested drag redesign must not replace old layout");
const studio=read("src/overhaul-hub.css");
assert.ok(studio.includes("Cheese Studio / 2026 overhaul"),"New unified page styling missing");
assert.ok(studio.includes(".cc-arena")&&studio.includes(".cc-hero"),"Fight layout and header are missing");
const depths=read("src/depths-ui.js");
const initStart=depths.indexOf("const state="), initEnd=depths.indexOf(";\n  const SNAPSHOT_PARAM",initStart);
assert.ok(initStart>=0&&initEnd>initStart,"Depths startup state initializer missing");
const stateDeclaration=depths.slice(initStart,initEnd+1);
const mockBlank=()=>({cards:[],statAura:"",abilityAura:""});
const initialized=new Function("blankTeam","initialDepthBanLayouts","initialDepthBanNames",stateDeclaration+";return state")(
 mockBlank,[[],[],[],[]],["Ban 1","Ban 2","Ban 3","Ban 4"]);
assert.equal(initialized.floorOverheadSeconds,.8,"Depths must use a shared timing assumption");
assert.equal(initialized.baseBattleSpeed,3,"Depths must initialize without referencing itself");
assert.doesNotMatch(stateDeclaration,/floorOverheadSeconds:state\./,"Self-referential Depths initializer would crash the whole page");
assert.ok(!depths.includes('id="depthFloorOverhead"'),"Timing calibration should not require manual input");

const pages=[
 ["src/new-tower-cheese.js","tc","Robin Hood"],
 ["src/new-boss-cheese.js","bc","Pandora"],
 ["src/new-trial-cheese.js","tr","Noveau Riche"]
];
for(const [path,prefix,sample] of pages){
 const page=read(path);
 assert.doesNotThrow(()=>new Function(page),path+" should parse");
 assert.ok(page.includes('team:["","","",""]'),path+" starter must be blank");
 assert.ok(page.includes(prefix+"-clear-deck"),path+" clear control is missing");
 assert.ok(page.includes('empty-starter-v2'),path+" legacy sample migration missing");
 assert.ok(page.includes("Your deck"),path+" familiar team section missing");
 assert.ok(page.includes("cc-rework")&&page.includes("cc-arena")&&page.includes("cc-hero"),"Unified studio missing on "+path);
 assert.ok(page.indexOf("cc-actions")>=0||page.indexOf("tc-actions")>=0,"Studio action bar missing");
 assert.ok(page.includes("searchGear=")||page.includes("searchGear={"),"AI gear context missing on "+path);
 assert.ok(page.includes("referenceLoadout="),"Manual reference deck must be included for AI search on "+path);
 assert.ok(page.includes("simSeed=1+Math.floor(Math.random()"),"Manual simulation should not reuse a fixed seed on "+path);
 assert.ok(page.includes("Load &amp; verify"),"AI results need one-click verification on "+path);
 assert.ok(!page.includes('id="'+prefix+'-ai"'),path+" deprecated AI combo button must be removed");
 assert.ok(!page.includes('id="'+prefix+'-ai-effort"'),path+" deprecated AI effort control must be removed");
}
const worker=read("browser/tower-worker.js");
assert.ok(worker.includes("function __evolutionCheeseSearch"),"Adaptive Cheese engine missing");
assert.ok(worker.includes('e.kind==="new-tower-ai"'),"AI worker message path missing");
console.log("Depths boot and legacy cheese UI regression passed: AI combo controls removed, seeded manual fights available.");

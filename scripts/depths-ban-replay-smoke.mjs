import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";

const code=readFileSync("browser/depths-worker.js","utf8");
const replayCode=readFileSync("src/depths-battle-replay-v42.js","utf8");
const ui=readFileSync("src/depths-ui.js","utf8");
const css=readFileSync("src/depths-ui.css","utf8");
const versionLabel=readFileSync("src/overhaul-hub.js","utf8");
const deployedVersion=JSON.parse(readFileSync("site-version.json","utf8")).version;
const requestedReplayVersion=ui.match(/depths-battle-replay-(v\d+)\.js/)?.[1];
const exportedReplayVersion=replayCode.match(/version:'(v\d+)'\s*,\s*openBattleReplay/)?.[1];
assert.equal(requestedReplayVersion,exportedReplayVersion,"Replay loader filename must match exported player version");
assert(ui.includes("CRXDepthsReplay?.version==='"+requestedReplayVersion+"'"),"Replay loader checks must match the loaded player version");
assert.equal((ui.match(/CRXDepthsReplay\?\.version==='v42'/g)||[]).length,2,
  "Replay loader must check v42 both before loading and when script finishes");
const headerVersionRegexp=versionLabel.match(/const version=build\.match\((\/.+?\/i)\)/)?.[1];
assert(headerVersionRegexp,"Header must define a build-number parser");
const parseBuildVersion=Function("build","return build.match("+headerVersionRegexp+")?.[1]||'?';");
assert.equal(parseBuildVersion(deployedVersion),"42","Test header must display v42 for suffixed deployments");
assert.equal(parseBuildVersion("20261116-anything-v42-hotfix"),"42","Test header must accept revision suffixes");
new Function("document","window",replayCode);
new Function("document","window",ui);
assert(replayCode.includes("if(!event || typeof event!==\'object\')return null;"),"Replay must tolerate an absent event on frame zero");
assert(!replayCode.includes("import.meta.url"),"Replay must be classic-script compatible");
assert(ui.includes("data-preview-battle"),"Replay preview must be accessible");
assert(ui.includes("data-ban-lab-samples"),"Ban Lab must support 10/15/30 runs");
assert(ui.includes("banLabSampleCount:15"),"Default must be 15 runs per ban");
assert(ui.includes("result.result?.runs||[]"),"Ban Lab must use actual parallel batch results");
assert(ui.includes("parallelWorkers:8"),"Ban Lab should request up to eight parallel workers");
assert(ui.includes("hardMode:true,floorStride:2"),"Ban Lab must always simulate Hard Depths at two-floor intervals");
assert(!ui.includes('data-ban-optimize="compare"'),"Old comparison optimizer must be removed from UI");
assert(!code.includes('kind==="ban-optimize"'),"Legacy optimizer must not be in deployed worker");
assert(!ui.includes('depth-launch-bar'),"Large floating toolbar must be removed");
assert(css.includes("max-height:720px"),"Simulator sidebar must have bounded height");
assert(css.includes("grid-column:1/-1;grid-row:2"),"Results must have their own full-width row");
const messages=[];
const worker={navigator:{hardwareConcurrency:2},location:{href:"https://example.invalid/browser/depths-worker.js"},postMessage(x){messages.push(x)}};
new Function("self","performance","importScripts",code)(worker,performance,()=>{throw Error("Unexpected legacy optimizer import")});
const deck={cards:["The Waking Comet","Rowy","D","Dave"].map(cardName=>({cardName,borders:[],mutationWeather:null}))};
const settings={chronoShard:true,chronoShardLevel:0,battleSpeedStructureLevel:0,skillTreeBattleSpeedLevel:0,baseBattleSpeed:3,blessingMultiplier:1,floorOverheadSeconds:.8,attackAnimationScale:1};
async function run(id,req){
 messages.length=0;
 await worker.onmessage({data:{id,...req}});
 const reply=messages.find(x=>x.id===id&&typeof x.ok==="boolean");
 assert(reply,"Missing worker reply");
 assert.equal(reply.ok,true,reply.error||"Worker failed");
 return reply.result;
}
const normal=await run(700,{kind:"single-run",loadout:deck,startFloor:1,floorCap:25,batchSeed:912,runIndex:0,hardMode:false,floorStride:10,lazyDebug:true,timingSettings:settings});
assert.equal(normal.floorStride,10);
assert.equal(normal.battles,3);
const hard=await run(701,{kind:"single-run",loadout:deck,startFloor:1,floorCap:6,batchSeed:912,runIndex:0,hardMode:true,floorStride:2,lazyDebug:true,timingSettings:settings});
assert.equal(hard.floorStride,2);
assert.equal(hard.sampled,true);
assert.equal(hard.battles,3,"Hard Depths must fight floors 2, 4 and 6");
const replay=await run(702,{kind:"battle-replay",loadout:deck,floor:10,runSeed:normal.runSeed,bannedCardNames:[],hardMode:false,gemPveBonus:0});
assert(replay.debug?.events?.length>0,"Replay must include combat trace events");
assert(replay.debug.events.some(e=>e.type==="attack"),"Replay must record attacks");
const targetSource=replayCode.match(/function targetOf\(state,event\)\s*\{[\s\S]*?\n\}/)?.[0];
assert(targetSource,"Target resolver missing");
const target=new Function(targetSource+";return targetOf")();
assert.equal(target({Allies:[],Enemies:[]},null),null,"First replay frame must not crash when no event exists");

const nodes=new Map();
const emptyElement=()=>({
 innerHTML:"",textContent:"",value:"",dataset:{},
 classList:{add(){},remove(){},toggle(){}},
 addEventListener(){},
});
const dialog={
 innerHTML:"",className:"",shown:false,events:new Map(),
 querySelector(sel){if(!nodes.has(sel))nodes.set(sel,emptyElement());return nodes.get(sel)},
 querySelectorAll(){return []},
 addEventListener(name,fn){this.events.set(name,fn)},
 showModal(){this.shown=true},
 close(){this.shown=false},
 remove(){this.removed=true}
};
const pageDocument={
 currentScript:{src:"https://daddydrag0.github.io/CardRngExpansionDepths/test/src/depths-battle-replay-v42.js"},
 baseURI:"https://daddydrag0.github.io/CardRngExpansionDepths/test/",
 querySelector(){return null},
 createElement(tag){return tag==="dialog"?dialog:emptyElement()},
 head:{appendChild(){}},body:{appendChild(){}}
};
const mockWindow={};
new Function("document","window",replayCode)(pageDocument,mockWindow);
assert.equal(mockWindow.CRXDepthsReplay.version,"v42");
const opened=mockWindow.CRXDepthsReplay.openBattleReplay({debug:replay.debug,floor:10,teamIndex:0,runIndex:0});
assert(dialog.shown,"Opening replay should show modal without exceptions");
assert(nodes.get("[data-rpl-stage]")?.innerHTML?.includes("YOUR DECK"),"First empty-event frame must paint normally");
opened.seek(0);
opened.seek(replay.debug.events.findIndex(e=>e.type==="attack"));
opened.close();

console.log("Depths v42 smoke passed: real replay modal opens at frame zero and advances, Hard Depths worker, and compact controls.");

assert(ui.includes("depth-control-dock")&&ui.includes("data-run-ready"),"Test team/run/interval/mode controls must be in the deck-side dock");
assert(ui.includes('depth-setup-shell')&&ui.includes('depth-right-shell'),"Setup needs independent nested columns instead of a row-spanning loadout");
assert(ui.includes('</article></div></div><section class="results-panel"'),"Results must sit after the setup wrapper");
assert(css.includes('.workspace.depths-workspace{\n display:flex;'),"Setup and results must flow vertically without grid row stretching");
assert(css.includes('.depth-right-shell>.depth-control-dock{'),"Test controls must live beneath the two right-hand panels");
assert(css.includes('grid-template-rows:auto max-content;'),"Test controls need a natural-height second row");
assert(css.includes('.workspace.depths-workspace>.results-panel{\n grid-row:auto;'),"Results must not be pinned to an oversized implicit grid row");
assert(ui.includes("depths-battle-replay-v42.js"),"Replay player must load from unique v42 URL");
assert(replayCode.includes("version:\'v42\'"),"Replay player must export correct version");

assert(css.includes('container:depths-controls / inline-size'),"Control panel must size against its own width");
assert(css.includes('@container depths-controls (max-width:860px)'),"Narrow panel must reorganize into two columns");
assert(css.includes('@container depths-controls (max-width:510px)'),"Tiny panel must stack the controls");
assert(css.includes('grid-template-columns:repeat(6,minmax(0,1fr))'),"All six run options must stay in a single row");
assert(css.includes('grid-template-columns:repeat(4,minmax(0,1fr))'),"All four floor intervals must stay in a single row");


// v37 regression: The dock is nested INSIDE depth-right-shell. The old
// workspace > dock selector never matched, causing all controls to touch the
// panel border. Verify the actual selector carries horizontal padding.
const dockSelector=".depth-right-shell>.depth-control-dock{";
const dockAt=css.indexOf(dockSelector);
assert(dockAt>=0,"Control dock must be targeted at its real nested DOM location");
const dockStyle=css.slice(dockAt,css.indexOf("}",dockAt)+1);
const padding=dockStyle.match(/padding:\s*([\d.]+)px\s+([\d.]+)px\s+([\d.]+)px/);
assert(padding,"The nested control panel must have explicit internal padding");
assert(Number(padding[2])>=14,"Controls need at least 14px horizontal inset from the border");
assert(dockStyle.includes("box-sizing:border-box"),"Panel padding must be included in width");
assert(!css.includes(".workspace.depths-workspace>.depth-control-dock{\n min-width:0;box-sizing:border-box;padding"),
 "Do not put dock padding on the obsolete direct-child selector again");
const rightShellAt=ui.indexOf('<div class="depth-right-shell">');
const controlsAt=ui.indexOf('<section class="panel depth-control-dock"');
const rightShellEnd=ui.indexOf('</div></div><section class="results-panel"',rightShellAt);
assert(rightShellAt>=0&&controlsAt>rightShellAt&&rightShellEnd>controlsAt,
 "Test controls must remain nested under the right-hand panels");
assert(css.includes(".run-options:has(>button:nth-child(3):last-child)"),
 "Hard Depths' three floor intervals should evenly fill their row");
console.log("Depths v37 layout passed: dock padding matches actual nested DOM, inside border, with responsive run/Hard controls.");

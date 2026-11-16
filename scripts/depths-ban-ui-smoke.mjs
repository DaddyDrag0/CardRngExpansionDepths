import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const ui=readFileSync("src/depths-ui.js","utf8");
const css=readFileSync("src/depths-ui.css","utf8");
const first=ui.indexOf("  function banLabHtml(){");
const next=ui.indexOf("  function render(){",first);
assert(first>=0&&next>first,"Ban Lab renderer not found");
const renderer=ui.slice(first,next);
const state={
  banLabResults:{frequency:null},banLabSampleCount:15,
  banLabUseExisting:false,depthBans:[],banLabRunning:false,
  banLabProgress:"",running:false
};
const getRenderer=new Function("state","esc","loadoutFor","current","complete",renderer+"\nreturn banLabHtml;");
const render=getRenderer(state,s=>String(s).replaceAll("&","&amp;").replaceAll("<","&lt;"),()=>({cards:[]}),()=>({}),()=>true);
const fresh=render();
assert(fresh.includes('<section class="ban-lab"'),"Ban Lab must always be shown");
assert(!fresh.includes("<details")&&!fresh.includes("<summary"),"Ban Lab must never collapse");
assert(!fresh.includes("rounds saved")&&!fresh.includes("completed rounds"),"No saved-search messages");
assert(!fresh.includes("Last round")&&!fresh.includes("most-common losing-enemy"),"Ban Lab must avoid instruction clutter");
assert(!fresh.includes("Results appear"),"New users should see only the controls");
assert(!fresh.includes("Apply bans"),"Apply button should only appear after search");
for(const n of [10,15,30])assert(fresh.includes('value="'+n+'"'),"Missing run count "+n);
assert(fresh.includes("Use current bans")&&fresh.includes('data-ban-optimize="frequency"'),"Essential Ban Lab controls missing");
const result={schema:"frequency-parallel-v29",teamSignature:JSON.stringify({cards:[]}),
  bans:["Achlys","Loki"],completed:true,history:[{slot:1},{slot:2}]};
state.banLabResults.frequency=result;
const after=render();
assert(after.includes("2/14 bans")&&after.includes("Achlys")&&after.includes("Loki"),"Chosen ban list is hidden");
assert(after.includes('data-ban-apply="frequency"'),"Apply button missing from results");
assert(!after.includes("rounds saved")&&!after.includes("last round"),"Saved-history noise returned");
state.banLabRunning=true;state.banLabProgress="Ban 3/14";
const running=render();
assert(running.includes("Ban 3/14")&&running.includes('data-ban-lab-stop'),"Progress and cancel must remain available");

const persist=ui.slice(ui.indexOf("  function persist(){"),ui.indexOf("  function restore(){"));
const restore=ui.slice(ui.indexOf("  function restore(){"),ui.indexOf("  function speedComparisonHtml(){"));
const report=ui.slice(ui.indexOf("  function buildReportSnapshot(){"),ui.indexOf("  function hydrateSnapshotTeam("));
assert(persist.includes("depthBanLayouts:state.depthBanLayouts"),"Manual named ban loadouts must still persist");
for(const [name,code] of [["localStorage persist",persist],["report snapshot",report]]){
  assert(!code.includes("banLabResults")&&!code.includes("banLabExpanded")&&!code.includes("banLabUseExisting"),name+" must not save Ban Lab state");
}
assert(!restore.includes("s.banLabResults")&&!restore.includes("s.banLabExpanded"),"Refreshing cannot restore old optimizer results or collapsed state");
assert(restore.includes("state.banLabResults={frequency:null}"),"Old persisted history must be ignored on refresh");
assert(!ui.includes("banLabExpanded"),"Ban Lab must not have a hidden open/closed toggle");
assert(!ui.includes("addEventListener('toggle'"),"Ban Lab toggle listener must be removed");
assert(ui.includes("hardMode:true,floorStride:2")&&ui.includes("parallelWorkers:8"),"Hard Depths parallel ban optimizer must remain intact");
assert(css.includes(".ban-lab .ban-lab-found"),"New compact result style missing");
console.log("Ban Lab v36 smoke passed: compact always-open controls, in-memory results, persistent manual loadouts, usable Apply and Cancel.");

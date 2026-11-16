import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const player=readFileSync("src/depths-battle-replay-v41.js","utf8");
const ui=readFileSync("src/depths-ui.js","utf8");
const worker=readFileSync("browser/depths-worker.js","utf8");
const css=readFileSync("src/depths-battle-replay.css","utf8");
const rules=Object.assign({},...Array.from({length:4},(_,i)=>
 JSON.parse(readFileSync("src/data/abilities-"+(i+1)+".json","utf8"))));
assert.equal(rules.Cerberus,"Lower enemy's damage by 30% on entry.");
assert.equal(rules["Horned Attack"],"Attacks on entry. Excess damage from kills carries over to the next card.");
assert(ui.includes("depths-battle-replay-v41.js"),"Both replay entry points must use the new player");
assert.equal((ui.match(/abilityDescriptions:state\.abilities/g)||[]).length,2,
 "Both preview and saved-run replay must receive source ability rules");
assert(worker.includes("ability:W(e),actorId:e.id,detail:s"),
 "Combat trace needs source ability name and actor id for accurate tooltip mapping");
assert(css.includes(".rpl-event-ability .rpl-event-detail{max-height:none"),
 "Full recorded details cannot be truncated to two lines");
function element(){
 return {innerHTML:"",textContent:"",value:"",dataset:{},style:{},hidden:false,offsetHeight:170,
  classList:{add(){},remove(){},toggle(){}},addEventListener(){}};
}
const nodes=new Map();
const dialog={
 shown:false,events:new Map(),innerHTML:"",className:"",
 querySelector(sel){if(!nodes.has(sel))nodes.set(sel,element());return nodes.get(sel)},
 querySelectorAll(){return []},
 addEventListener(name,callback){this.events.set(name,callback)},
 showModal(){this.shown=true},close(){this.shown=false},remove(){this.removed=true}
};
const doc={
 currentScript:{src:"https://example.com/test/src/depths-battle-replay-v41.js"},
 baseURI:"https://example.com/test/",querySelector(){return null},
 createElement(tag){return tag==="dialog"?dialog:element()},
 head:{appendChild(){}},body:{appendChild(){}}
};
const wnd={innerWidth:1440,innerHeight:900};
new Function("document","window",player)(doc,wnd);
const debug={
 initialAllies:[{id:"A1",name:"Triceratops",ability:"Horned Attack",hp:5e7,maxHp:5e7,damage:2.67e7}],
 initialEnemies:[{id:"B1",name:"Bad Boys",ability:"Cerberus",hp:3.78e7,maxHp:3.78e7,damage:1e5}],
 events:[
  {type:"entry",team:"Enemies",card:"Bad Boys",actorId:"B1",turn:1,hp:3.78e7,maxHp:3.78e7},
  {type:"ability",team:"Enemies",card:"Bad Boys",actorId:"B1",ability:"Cerberus",
   detail:"Cerberus: Triceratops ATK 26.7m → 18.7m",turn:1,hp:3.78e7,maxHp:3.78e7},
  {type:"ability",team:"Allies",card:"Triceratops",actorId:"A1",ability:"Horned Attack",
   detail:"Horned Attack: Bad Boys HP 37.8m → 11.1m",turn:1,hp:5e7,maxHp:5e7}
 ]
};
const opened=wnd.CRXDepthsReplay.openBattleReplay({debug,abilityDescriptions:rules});
assert(dialog.shown,"Replay modal should open at frame zero");
opened.seek(1);
const list=nodes.get("[data-rpl-events]").innerHTML;
const inspector=nodes.get("[data-rpl-ability-inspector]").innerHTML;
assert(list.includes("Triceratops ATK 26.7m → 18.7m"),"Exact recorded before/after values must be visible in timeline");
assert(list.includes("Lower enemy&#39;s damage by 30% on entry."),"Hover title must include the full source description");
assert(inspector.includes("Bad Boys · Cerberus"),"Selected event should identify the exact ability");
assert(inspector.includes("Triceratops ATK 26.7m → 18.7m"),"Selected event needs the observed change");
assert(inspector.includes("Lower enemy&#39;s damage by 30% on entry."),"Selected event needs full ability rule");
const fakeButton={
 dataset:{rplEvent:"1"},matches:()=>true,
 getBoundingClientRect:()=>({left:1100,right:1300,top:240})
};
dialog.events.get("pointerover")({target:{closest:()=>fakeButton}});
const tooltip=nodes.get("[data-rpl-tooltip]");
assert.equal(tooltip.hidden,false,"Hover should reveal a tooltip");
assert(tooltip.innerHTML.includes("Lower enemy&#39;s damage by 30% on entry."),"Tooltip must show ability description");
assert(tooltip.innerHTML.includes("Triceratops ATK 26.7m → 18.7m"),"Tooltip should show recorded effect");
dialog.events.get("pointerout")({relatedTarget:null});
assert.equal(tooltip.hidden,true,"Tooltip should disappear on pointer exit");
opened.seek(2);
assert(nodes.get("[data-rpl-ability-inspector]").innerHTML.includes("Excess damage from kills carries over"),
 "Hover and inspector must support other abilities without hardcoding");
opened.close();
console.log("Depths v41 replay passed: full observed effect, imported ability rule, hover/focus tooltip, close, and no clipped event details.");

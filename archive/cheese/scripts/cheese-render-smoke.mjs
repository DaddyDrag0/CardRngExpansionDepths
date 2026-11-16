import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(path,"utf8");
const cfg=(path,label)=>JSON.parse(read(path).replace(new RegExp("^window\\."+label+"="),"").replace(/;\s*$/,""));
const fakeStorage={getItem(){return null},setItem(){}};
const window={CRXTowerConfig2026:cfg("src/tower-2026-data.js","CRXTowerConfig2026"),
 CRXBossData2026:cfg("src/boss-2026-data.js","CRXBossData2026"),
 CRXTrialData2026:cfg("src/trial-2026-data.js","CRXTrialData2026"),
 __CRX_SITE_VERSION:"render-smoke",
 dispatchEvent(){}};
const fakeFetch=()=>new Promise(()=>{});
const Event=function CustomEvent(){};
const cases=[
 ["src/new-tower-cheese.js","CRXNewTowerCheese","tc-actions","tc-extra"],
 ["src/new-boss-cheese.js","CRXBossCheese","cc-actions","cc-options"],
 ["src/new-trial-cheese.js","CRXTrialCheese","cc-actions","cc-options"],
];
for(const [file,exportName,actions,advanced] of cases){
 assert.doesNotThrow(()=>new Function("window","localStorage","fetch","CustomEvent",read(file))(window,fakeStorage,fakeFetch,Event));
 const view=window[exportName];
 assert.ok(view?.render,"Missing Cheese render export "+exportName);
 const html=view.render();
 assert.match(html,/cc-rework/);
 assert.match(html,/cc-hero/);
 assert.match(html,/cc-arena/);
 assert.match(html,/cc-opponents/);
 assert.match(html,/cc-players/);
 assert.match(html,/Load &amp; verify|Find Cheese/);
 assert.ok(html.indexOf(actions)<html.indexOf(advanced),"Actions must appear before optional filters: "+file);
 assert.equal((html.match(/<section\b/g)||[]).length,(html.match(/<\/section>/g)||[]).length,
 "Unbalanced fight sections: "+file);
 assert.match(html,/Clear deck/);
}
console.log("Cheese page render smoke passed: all three page templates render, controls precede filters, 2-sided arena is balanced.");

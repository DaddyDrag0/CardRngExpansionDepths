import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";

const source=readFileSync("browser/depths-worker.js","utf8");
for(const name of [
  "__v26Abilities","Siren's Song","Sacred Purity","Crushing Depths",
  "Dream Doppelgänger","Sands of Renewal","Terrorize",
  "startFloor","chronoShard","single-run"
])assert.ok(source.includes(name),"Deployed Depths worker missing "+name);
const worker={navigator:{hardwareConcurrency:2},location:{href:"mock"},postMessage(){}};
assert.doesNotThrow(()=>new Function("self","performance",source)(worker,performance),"Depths worker did not initialize");
assert.equal(typeof worker.onmessage,"function","Depths worker message handler missing");
console.log("2026 customized Depths worker smoke: passed; old TypeScript does not replace this bundle.");

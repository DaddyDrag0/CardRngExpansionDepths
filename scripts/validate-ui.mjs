import fs from 'node:fs'

const loaderHtml = fs.readFileSync('index.html', 'utf8')
const liveHtml = fs.readFileSync('index-base.html', 'utf8')
const scripts = [...loaderHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1])
if (!scripts.length) throw new Error('No inline loader script found')
for (const script of scripts) new Function(script)

// index.html is intentionally a small cache-busting loader. The actual calculator
// markup and worker hooks live in index-base.html, so validate the composed live page.
const html = loaderHtml + '\n' + liveHtml
const requiredUiHooks = [
  "./browser/depths-worker.js",
  "./browser/tower-worker.js",
  'CRE1-',
  'Most common losing-floor enemies',
  'crypto.getRandomValues',
]
for (const hook of requiredUiHooks) {
  if (!html.includes(hook)) throw new Error(`Missing live-page hook: ${hook}`)
}
if (!liveHtml.includes('id="towerFloor" type="number" min="1" max="105"')) throw new Error('Tower floor input must remain capped at 105')
if (!liveHtml.includes('state.towerFloor=Math.min(105,Math.max(1,Number(e.target.value)||1))')) throw new Error('Tower floor runtime clamp must remain 105')
if (!liveHtml.includes("const searchKey=(v='')=>String(v).normalize('NFD')")) throw new Error('Accent-insensitive card search helper missing')
if (!liveHtml.includes('searchKey(c.name).includes(q)')) throw new Error('Card search is not using normalized names')
if (!liveHtml.includes('searchKey(c.name).includes(banQ)')) throw new Error('Depth ban search is not using normalized names')
for (const hook of ['depthBanLayouts','data-depth-ban-layout','data-depth-bans-export','data-depth-bans-import','CRB1-']) {
  if (!liveHtml.includes(hook)) throw new Error(`Ban layout/share hook missing: ${hook}`)
}
if (!liveHtml.includes('runs:15,cap:100000,seed:1000')) throw new Error('Depths fixed floor cap is not initialized to 100,000')
if (!liveHtml.includes('chronoShard:true')) throw new Error('Chrono Shard timing toggle must default on')
if (!liveHtml.includes('data-chrono-shard')) throw new Error('Chrono Shard timing toggle is missing from the UI')
if (!liveHtml.includes('chronoShard:state.chronoShard')) throw new Error('Chrono Shard timing setting is not sent to the worker')
if (!liveHtml.includes('id="capInput" type="number" min="100000" max="100000" value="100000" readonly')) throw new Error('Depths floor cap is not rendered as a locked 100,000 value')
if (!liveHtml.includes('state.cap=100000;')) throw new Error('Depths restore path does not force the cap to 100,000')
if (liveHtml.includes('cap:state.cap')) throw new Error('Depths floor cap is still being persisted as a user setting')
if (liveHtml.includes("root.querySelector('#capInput')?.addEventListener('change'")) throw new Error('Depths floor cap is still user-editable')
const simulationSource = fs.readFileSync('src/engine/simulation.ts', 'utf8')
if (!simulationSource.includes('options.floorCap ?? 100_000')) throw new Error('Depths engine default floor cap is not 100,000')
for (const removedHook of ['data-library-mode="bans"', 'data-library-mode="pool"', 'id="seedInput"', 'src/main.tsx']) {
  if (html.includes(removedHook)) throw new Error(`Removed/dead UI hook returned: ${removedHook}`)
}

const workerSource = fs.readFileSync('src/browser-worker.ts', 'utf8')
if (!workerSource.includes('chronoShard?: boolean')) throw new Error('Browser worker Chrono Shard request field is missing')
if (!workerSource.includes('request.chronoShard !== false')) throw new Error('Browser worker does not apply the Chrono Shard timing toggle')
for (const removedField of ['excludedCardNames', 'selectedCardNames']) {
  if (workerSource.includes(removedField)) throw new Error(`Removed calculator-only field returned: ${removedField}`)
}

const battle = fs.readFileSync('src/engine/battle-v2.ts', 'utf8')
for (const required of [
  'let turnsWithoutDeaths = 0',
  'runtime.deathEpoch !== lastDeathEpoch',
  'runtime.deathEpoch += 1',
  'turnsWithoutDeaths >= 150',
  'beyondGraveRevived',
]) {
  if (!battle.includes(required)) throw new Error(`Battle safety hook missing: ${required}`)
}
if (battle.includes('pairTurns[')) throw new Error('Incorrect per-attacker timeout counter returned')

const styles = fs.readFileSync('src/styles.css', 'utf8')
if (styles.includes('.aura-exact b{display:none!important}')) throw new Error('Resolved aura values are hidden')

console.log(`Static UI validation passed (${scripts.length} loader script).`)

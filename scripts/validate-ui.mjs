import fs from 'node:fs'

const loaderHtml = fs.readFileSync('index.html', 'utf8')
const liveHtml = fs.readFileSync('index-base.html', 'utf8')
const depthsUi = fs.readFileSync('src/depths-ui.js', 'utf8')
const feedbackUi = fs.readFileSync('src/feedback.js', 'utf8')
const themeController = fs.readFileSync('src/theme-controller.js', 'utf8')
const versionWatcher = fs.readFileSync('src/site-version-watch.js', 'utf8')
const scripts = [...loaderHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1])
if (!scripts.length) throw new Error('No inline loader script found')
for (const script of scripts) new Function(script)
for (const script of [depthsUi, feedbackUi, themeController, versionWatcher]) new Function(script)

// index.html is intentionally a small cache-busting loader. The actual calculator
// markup and worker hooks live in index-base.html, so validate the composed live page.
const html = loaderHtml + '\n' + liveHtml + '\n' + depthsUi
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
if (!depthsUi.includes('id="towerFloor" type="number" min="1" max="105"')) throw new Error('Tower floor input must remain capped at 105')
if (!depthsUi.includes('state.towerFloor=Math.min(105,Math.max(1,Number(e.target.value)||1))')) throw new Error('Tower floor runtime clamp must remain 105')
if (!depthsUi.includes("const searchKey=(v='')=>String(v).normalize('NFD')")) throw new Error('Accent-insensitive card search helper missing')
if (!depthsUi.includes('searchKey(c.name).includes(q)')) throw new Error('Card search is not using normalized names')
if (!depthsUi.includes('searchKey(c.name).includes(banQ)')) throw new Error('Depth ban search is not using normalized names')
for (const hook of ['depthBanLayouts','data-depth-ban-layout','data-depth-bans-export','data-depth-bans-import','CRB1-']) {
  if (!html.includes(hook)) throw new Error(`Ban layout/share hook missing: ${hook}`)
}
if (!depthsUi.includes("payload={v:2,bans:sanitizeBanList(state.depthBans)}")) throw new Error('Ban export must contain only the active layout')
if (!depthsUi.includes('setActiveDepthBans(decodeBanLayouts(code))')) throw new Error('Ban import must target the currently viewed layout')
if (!depthsUi.includes('runs:15,startFloor:1,cap:150000,seed:1000')) throw new Error('Depths start floor/default floor cap state is not initialized correctly')
if (!depthsUi.includes('id="startFloorInput" type="number" min="1" max="80000"')) throw new Error('Depths Start Floor input must be limited to 1-80,000')
if (!depthsUi.includes('state.startFloor=Math.min(80000,Math.max(1,Math.floor(Number(s.startFloor)||1)))')) throw new Error('Depths Start Floor restore path must clamp to 1-80,000')
if (!depthsUi.includes('startFloor:state.startFloor')) throw new Error('Depths Start Floor is not sent to the simulation worker')
if (!depthsUi.includes('chronoShard:true')) throw new Error('Chrono Shard timing toggle must default on')
if (!depthsUi.includes('data-chrono-shard')) throw new Error('Chrono Shard timing toggle is missing from the UI')
if (!depthsUi.includes('chronoShard:state.chronoShard')) throw new Error('Chrono Shard timing setting is not sent to the worker')
if (!depthsUi.includes('id="capInput" type="number" min="150000" max="150000" value="150000" readonly')) throw new Error('Depths floor cap is not rendered as a locked 150,000 value')
if (!depthsUi.includes('state.cap=150000;')) throw new Error('Depths restore path does not force the cap to 150,000')
if (depthsUi.includes('cap:state.cap')) throw new Error('Depths floor cap is still being persisted as a user setting')
if (depthsUi.includes("root.querySelector('#capInput')?.addEventListener('change'")) throw new Error('Depths floor cap is still user-editable')

if (!liveHtml.includes('./src/depths-ui.js')) throw new Error('Extracted Depths UI script is not loaded')
if (!liveHtml.includes('./src/depths-ui.css')) throw new Error('Extracted Depths UI styles are not loaded')
if (liveHtml.includes("const root=document.getElementById('root')")) throw new Error('Depths application code returned to inline HTML')
if (!depthsUi.includes('function sortPrefixMatches(')) throw new Error('Shared autocomplete sorter is missing')
if (!depthsUi.includes("visibleUrl.searchParams.get('view')==='tower'")) throw new Error('Direct Tower view URL is not handled on load')
if (!depthsUi.includes("url.searchParams.set('view','tower')")) throw new Error('Tower tab does not update the direct-link URL')
if (!depthsUi.includes("url.searchParams.delete('view')")) throw new Error('Depths tab does not restore the base URL')

if (!depthsUi.includes("towerExcludedCards:['Robin Hood','Pandora']")) throw new Error('Robin Hood and Pandora must default OFF in Tower cheese search')
if (!depthsUi.includes("towerHasEndTimes:false")) throw new Error('End Times must default OFF in Tower cheese search')
for (const removed of ['Ice King','Surtr','Control Freak']) {
  if (depthsUi.includes(`TOWER_DEFAULT_CHEESE_CARDS=[${String.fromCharCode(39)}${removed}`)) throw new Error(`${removed} returned to the default Tower cheese pool`)
}

if ((depthsUi.match(/matches\.sort\(\(a,b\)=>/g) || []).length !== 1) throw new Error('Autocomplete sorting must use one shared implementation')

const feedbackWorker = fs.readFileSync('server/feedback-worker.mjs', 'utf8')
if (!liveHtml.includes('./src/feedback.js') || !liveHtml.includes('./src/feedback.css')) throw new Error('Feedback UI assets are not loaded')
if (!feedbackUi.includes('Report issue / Feedback')) throw new Error('Feedback button is missing')
if (!feedbackUi.includes('window.__CRX_FEEDBACK_ENDPOINT__')) throw new Error('Feedback relay endpoint hook is missing')
if (!feedbackWorker.includes('env.DISCORD_WEBHOOK_URL')) throw new Error('Feedback worker must read the Discord webhook from an environment secret')
if (!feedbackUi.includes('__CRX_CREATE_REPORT_SNAPSHOT__')) throw new Error('Feedback submission is not capturing a calculator snapshot')
if (!depthsUi.includes('window.__CRX_CREATE_REPORT_SNAPSHOT__=buildReportSnapshot')) throw new Error('Calculator snapshot capture hook is missing')
if (!depthsUi.includes('restoreReportSnapshot()')) throw new Error('Calculator snapshot restore path is missing')
if (!depthsUi.includes('if(reportSnapshotMode)return')) throw new Error('Report snapshots must not overwrite local calculator settings')
for (const hook of ["'/snapshot/'", "CompressionStream('gzip')", "snapshot-", "/messages/"]) {
  if (!feedbackWorker.includes(hook)) throw new Error(`Feedback snapshot worker hook missing: ${hook}`)
}

for (const publicFile of [loaderHtml, liveHtml, depthsUi, feedbackUi, themeController, versionWatcher]) {
  if (/discord\.com\/api\/webhooks\//i.test(publicFile)) throw new Error('Discord webhook secret leaked into public site code')
}

const simulationSource = fs.readFileSync('src/engine/simulation.ts', 'utf8')
if (!simulationSource.includes('options.floorCap ?? 150_000')) throw new Error('Depths engine default floor cap is not 150,000')
for (const removedHook of ['data-library-mode="bans"', 'data-library-mode="pool"', 'id="seedInput"', 'src/main.tsx']) {
  if (html.includes(removedHook)) throw new Error(`Removed/dead UI hook returned: ${removedHook}`)
}

const workerSource = fs.readFileSync('src/browser-worker.ts', 'utf8')
if (!workerSource.includes('chronoShard?: boolean')) throw new Error('Browser worker Chrono Shard request field is missing')
if (!workerSource.includes('startFloor?: number')) throw new Error('Browser worker Start Floor request field is missing')
if (!workerSource.includes('Math.min(80_000, Math.max(1')) throw new Error('Browser worker Start Floor must clamp to 1-40,000')
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

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
if (!liveHtml.includes('id="towerFloor" type="number" min="1" max="100000"')) throw new Error('Tower floor input is not capped at 100,000')
if (!liveHtml.includes('state.towerFloor=Math.min(100000,Math.max(1,Number(e.target.value)||1))')) throw new Error('Tower floor runtime clamp is not 100,000')
if (liveHtml.includes('id="towerFloor" type="number" min="1" max="105"')) throw new Error('Old Tower 105-floor input cap returned')
if (liveHtml.includes('state.towerFloor=Math.min(105,Math.max(1,Number(e.target.value)||1))')) throw new Error('Old Tower 105-floor runtime clamp returned')
for (const removedHook of ['data-library-mode="bans"', 'data-library-mode="pool"', 'id="seedInput"', 'src/main.tsx']) {
  if (html.includes(removedHook)) throw new Error(`Removed/dead UI hook returned: ${removedHook}`)
}

const workerSource = fs.readFileSync('src/browser-worker.ts', 'utf8')
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

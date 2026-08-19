import fs from 'node:fs'

const html = fs.readFileSync('index.html', 'utf8')
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1])
if (!scripts.length) throw new Error('No inline live-page script found')
for (const script of scripts) new Function(script)

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

console.log(`Static UI validation passed (${scripts.length} inline script).`)

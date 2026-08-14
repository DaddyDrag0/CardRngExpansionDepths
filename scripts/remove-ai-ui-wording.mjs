import fs from 'node:fs'

const path = 'index.html'
let text = fs.readFileSync(path, 'utf8')

const replacements = [
  ['<span class="status-chip">ENGINE VERIFIED · 267 ABILITIES</span>', '<span class="status-chip">267 Abilities</span>'],
  ['<div class="sim-note"><b>Source-aligned combat engine</b><p>Depths enemies, all selectable player abilities, card borders, Stat auras, and Ability auras are simulated in a background worker.</p></div>', '<div class="sim-note"><b>Combat settings</b><p>Includes enemies, abilities, borders, and auras.</p></div>'],
  ['<div class="sim-field"><span>Enemy rolls</span><small>Fresh random enemies every test</small></div>', '<div class="sim-field"><span>Enemy rolls</span><small>Random enemies every test</small></div>'],
  ["`Use 1 run for a quick diagnostic. Larger tests run in parallel across available CPU cores.`", "`1 run is fastest. More runs give a better estimate.`"],
  ["<h4>${r.trusted?'Verified simulation':'Simulation warning'}</h4></div><span class=\"trust ${r.trusted?'ok':'warn'}\">${r.trusted?'TRUSTED':'CHECK'}</span>", "<h4>${r.trusted?'Simulation':'Simulation warning'}</h4></div>"],
  ['<small>Median: ${one(r.medianFloor)} · ±15%</small>', '<small>Median: ${one(r.medianFloor)}</small>'],
  ['<span>Great · Mighty · Almighty intentionally excluded</span>', '<span>Great / Mighty / Almighty excluded</span>'],
]

for (const [before, after] of replacements) {
  const count = text.split(before).length - 1
  if (count !== 1) throw new Error(`Expected 1 match, found ${count}: ${before}`)
  text = text.replace(before, after)
}

fs.writeFileSync(path, text)
console.log('Removed AI-style and overly technical UI wording.')

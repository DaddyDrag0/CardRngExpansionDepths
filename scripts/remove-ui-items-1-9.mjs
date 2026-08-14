import fs from 'node:fs'

function replaceOnce(path,before,after,label){
  let text=fs.readFileSync(path,'utf8')
  const count=text.split(before).length-1
  if(count!==1) throw new Error(`${label}: expected 1 match, found ${count}`)
  text=text.replace(before,after)
  fs.writeFileSync(path,text)
}

// Remove 1: top engine/status chip entirely.
replaceOnce(
  'index.html',
  `<header class="topbar"><div><p class="kicker">CARD RNG EXPANSION</p><h1>Depths Calculator</h1></div><span class="status-chip">267 Abilities</span></header>`,
  `<header class="topbar"><div><p class="kicker">CARD RNG EXPANSION</p><h1>Depths Calculator</h1></div></header>`,
  'top status chip',
)

// Remove 2+3: whole combat-settings/source explanation box.
replaceOnce(
  'index.html',
  `<div class="simulation-body"><div class="sim-note"><b>Combat settings</b><p>Includes enemies, abilities, borders, and auras.</p></div><div class="sim-field"><span>Runs per team</span>`,
  `<div class="simulation-body"><div class="sim-field"><span>Runs per team</span>`,
  'combat info box',
)

// Remove 4: whole enemy-roll explanation row.
replaceOnce(
  'index.html',
  `<div class="sim-field"><span>Enemy rolls</span><small>Random enemies every test</small></div>`,
  ``,
  'enemy roll helper',
)

// Remove 5: normal-state run helper entirely.
replaceOnce(
  'index.html',
  `<p class="sim-footnote">${'${'}state.running?\`Runs execute in parallel. Long battles show the exact enemy lineup; 150-turn no-progress matchups resolve using the previous behavior; any battle that reaches 10,000 total turns ends as a loss instead of hanging.\`:\`1 run is fastest. More runs give a better estimate.\`}</p>`,
  `${'${'}state.running?\`<p class="sim-footnote">Runs execute in parallel. Long battles show the exact enemy lineup; 150-turn no-progress matchups resolve using the previous behavior; any battle that reaches 10,000 total turns ends as a loss instead of hanging.</p>\`:''}`,
  'run helper line',
)

// Remove 6+7: result verification heading and trust badge text.
replaceOnce(
  'index.html',
  `<div class="result-head"><div><span class="kicker">TEAM ${'${'}index+1}</span><h4>${'${'}r.trusted?'Simulation':'Simulation warning'}</h4></div></div>`,
  `<div class="result-head"><div><span class="kicker">TEAM ${'${'}index+1}</span></div></div>`,
  'result verification heading',
)

// Remove 8 from the range card, while keeping median as its own requested result.
replaceOnce(
  'index.html',
  `<div class="result-metrics"><div><span>Estimated Depth range</span><b>${'${'}full(r.estimatedFloorLow)} – ${'${'}full(r.estimatedFloorHigh)}</b><small>Median: ${'${'}one(r.medianFloor)}</small></div><div title="${'${'}full(r.auraPackLow)} – ${'${'}full(r.auraPackHigh)} Aura Packs">`,
  `<div class="result-metrics"><div><span>Estimated Depth range</span><b>${'${'}full(r.estimatedFloorLow)} – ${'${'}full(r.estimatedFloorHigh)}</b></div><div><span>Median Depth</span><b>${'${'}one(r.medianFloor)}</b></div><div title="${'${'}full(r.auraPackLow)} – ${'${'}full(r.auraPackHigh)} Aura Packs">`,
  'range helper to standalone median',
)

// Remove 9 entirely.
replaceOnce(
  'index.html',
  `<footer><span>Card RNG Expansion Depths Calculator</span><span>Great / Mighty / Almighty excluded</span></footer>`,
  `<footer><span>Card RNG Expansion Depths Calculator</span></footer>`,
  'excluded borders footer text',
)

let html=fs.readFileSync('index.html','utf8')
html=html.replace(/\.status-chip\{[^}]*\}/g,'')
html=html.replace(/\.sim-note\{[^}]*\}/g,'')
html=html.replace(/\.sim-note b\{[^}]*\}/g,'')
html=html.replace(/\.trust\{[^}]*\}\.trust\.ok\{[^}]*\}\.trust\.warn\{[^}]*\}/g,'')
fs.writeFileSync('index.html',html)

console.log('Removed UI items 1-9 completely; kept #10 and standalone Median Depth result.')

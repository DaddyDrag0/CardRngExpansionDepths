import fs from 'node:fs'

function replaceExact(text, label, before, after, expected = 1) {
  const count = text.split(before).length - 1
  if (count !== expected) throw new Error(`${label}: expected ${expected} match(es), found ${count}`)
  return text.split(before).join(after)
}

// Correct the UI target: Tower stays at 105; Depths moves to 100,000.
const htmlPath = 'index-base.html'
let html = fs.readFileSync(htmlPath, 'utf8')
html = replaceExact(html, 'Tower input cap rollback', 'id="towerFloor" type="number" min="1" max="100000"', 'id="towerFloor" type="number" min="1" max="105"')
html = replaceExact(html, 'Tower runtime cap rollback', 'state.towerFloor=Math.min(100000,Math.max(1,Number(e.target.value)||1))', 'state.towerFloor=Math.min(105,Math.max(1,Number(e.target.value)||1))')
html = replaceExact(html, 'Depths default cap', 'runs:15,cap:50000,seed:1000', 'runs:15,cap:100000,seed:1000')
html = replaceExact(html, 'Depths restored cap', 'state.cap=Math.min(50000,Math.max(1,Number(s.cap)||50000))', 'state.cap=Math.min(100000,Math.max(1,Number(s.cap)||100000))')
html = replaceExact(html, 'Depths input cap', 'id="capInput" type="number" min="1" max="50000"', 'id="capInput" type="number" min="1" max="100000"')
html = replaceExact(html, 'Depths input handler cap', 'state.cap=Math.min(50000,Math.max(1,Number(e.target.value)||50000))', 'state.cap=Math.min(100000,Math.max(1,Number(e.target.value)||100000))')
fs.writeFileSync(htmlPath, html)

// Keep the engine's default consistent with the UI for non-browser callers/tests.
const simulationPath = 'src/engine/simulation.ts'
let simulation = fs.readFileSync(simulationPath, 'utf8')
simulation = replaceExact(simulation, 'Depths engine default cap', 'options.floorCap ?? 50_000', 'options.floorCap ?? 100_000')
fs.writeFileSync(simulationPath, simulation)

// Current game-file source: Wendigo remains 1/25M, Snow/Cryptid/Insatiable, but StatMultiplier is 1.7.
const cardsPath = 'src/data/cards-6.json'
const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'))
const wendigo = cards.find((card) => card.name === 'Wendigo')
if (!wendigo) throw new Error('Wendigo not found in cards-6.json')
if (wendigo.rarity !== 25_000_000) throw new Error(`Unexpected Wendigo rarity before patch: ${wendigo.rarity}`)
wendigo.statMultiplier = 1.7
fs.writeFileSync(cardsPath, JSON.stringify(cards))

// Lock the source-aligned Wendigo value in the permanent data-integrity suite.
const integrityPath = 'scripts/data-integrity.ts'
let integrity = fs.readFileSync(integrityPath, 'utf8')
const integrityAnchor = "assert.equal(cards.filter((card) => card.name === 'Conqueror').length, 1, 'Conqueror must exist exactly once')\n"
const integrityInsert = integrityAnchor + "const wendigo = cards.find((card) => card.name === 'Wendigo')\nassert(wendigo, 'Wendigo must exist')\nassert.equal(wendigo.rarity, 25_000_000, 'Wendigo rarity must match current game source')\nassert.equal(wendigo.statMultiplier, 1.7, 'Wendigo StatMultiplier must match current game source')\n"
if (!integrity.includes("Wendigo StatMultiplier must match current game source")) {
  integrity = replaceExact(integrity, 'Wendigo data-integrity insertion', integrityAnchor, integrityInsert)
}
fs.writeFileSync(integrityPath, integrity)

// Replace the accidental Tower-100k static checks with the intended Tower/Depths checks.
const validatePath = 'scripts/validate-ui.mjs'
let validate = fs.readFileSync(validatePath, 'utf8')
const wrongChecks = `if (!liveHtml.includes('id="towerFloor" type="number" min="1" max="100000"')) throw new Error('Tower floor input is not capped at 100,000')\nif (!liveHtml.includes('state.towerFloor=Math.min(100000,Math.max(1,Number(e.target.value)||1))')) throw new Error('Tower floor runtime clamp is not 100,000')\nif (liveHtml.includes('id="towerFloor" type="number" min="1" max="105"')) throw new Error('Old Tower 105-floor input cap returned')\nif (liveHtml.includes('state.towerFloor=Math.min(105,Math.max(1,Number(e.target.value)||1))')) throw new Error('Old Tower 105-floor runtime clamp returned')\n`
const correctChecks = `if (!liveHtml.includes('id="towerFloor" type="number" min="1" max="105"')) throw new Error('Tower floor input must remain capped at 105')\nif (!liveHtml.includes('state.towerFloor=Math.min(105,Math.max(1,Number(e.target.value)||1))')) throw new Error('Tower floor runtime clamp must remain 105')\nif (!liveHtml.includes('runs:15,cap:100000,seed:1000')) throw new Error('Depths default floor cap is not 100,000')\nif (!liveHtml.includes('id="capInput" type="number" min="1" max="100000"')) throw new Error('Depths floor-cap input is not capped at 100,000')\nif (!liveHtml.includes('state.cap=Math.min(100000,Math.max(1,Number(s.cap)||100000))')) throw new Error('Depths restored floor cap is not capped at 100,000')\nif (!liveHtml.includes('state.cap=Math.min(100000,Math.max(1,Number(e.target.value)||100000))')) throw new Error('Depths floor-cap handler is not capped at 100,000')\nconst simulationSource = fs.readFileSync('src/engine/simulation.ts', 'utf8')\nif (!simulationSource.includes('options.floorCap ?? 100_000')) throw new Error('Depths engine default floor cap is not 100,000')\n`
validate = replaceExact(validate, 'Tower/Depths validation correction', wrongChecks, correctChecks)
fs.writeFileSync(validatePath, validate)

console.log('Corrected Tower to 105, raised Depths to 100,000, and aligned Wendigo StatMultiplier to 1.7.')

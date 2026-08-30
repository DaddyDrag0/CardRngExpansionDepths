import fs from 'node:fs'

const htmlPath = 'index-base.html'
const validatePath = 'scripts/validate-ui.mjs'
let html = fs.readFileSync(htmlPath, 'utf8')

function replaceOnce(label, before, after) {
  const first = html.indexOf(before)
  if (first < 0) throw new Error(`Could not find ${label}`)
  if (html.indexOf(before, first + before.length) >= 0) throw new Error(`Found multiple ${label} matches`)
  html = html.slice(0, first) + after + html.slice(first + before.length)
}

replaceOnce(
  'Tower floor input maximum',
  'id="towerFloor" type="number" min="1" max="105"',
  'id="towerFloor" type="number" min="1" max="100000"',
)
replaceOnce(
  'Tower floor clamp',
  "state.towerFloor=Math.min(105,Math.max(1,Number(e.target.value)||1))",
  "state.towerFloor=Math.min(100000,Math.max(1,Number(e.target.value)||1))",
)

fs.writeFileSync(htmlPath, html)

let validate = fs.readFileSync(validatePath, 'utf8')
const marker = "for (const removedHook of ['data-library-mode=\"bans\"', 'data-library-mode=\"pool\"', 'id=\"seedInput\"', 'src/main.tsx']) {\n"
if (!validate.includes(marker)) throw new Error('Could not find UI validation insertion point')
const checks = `if (!liveHtml.includes('id="towerFloor" type="number" min="1" max="100000"')) throw new Error('Tower floor input is not capped at 100,000')\nif (!liveHtml.includes('state.towerFloor=Math.min(100000,Math.max(1,Number(e.target.value)||1))')) throw new Error('Tower floor runtime clamp is not 100,000')\nif (liveHtml.includes('id="towerFloor" type="number" min="1" max="105"')) throw new Error('Old Tower 105-floor input cap returned')\nif (liveHtml.includes('state.towerFloor=Math.min(105,Math.max(1,Number(e.target.value)||1))')) throw new Error('Old Tower 105-floor runtime clamp returned')\n`
validate = validate.replace(marker, checks + marker)
fs.writeFileSync(validatePath, validate)

console.log('Raised Tower floor limit from 105 to 100,000 and added UI regression checks.')

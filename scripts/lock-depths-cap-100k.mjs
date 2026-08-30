import fs from 'node:fs'

const indexPath = 'index-base.html'
const validatePath = 'scripts/validate-ui.mjs'
let html = fs.readFileSync(indexPath, 'utf8')

function replaceOnce(label, before, after) {
  const first = html.indexOf(before)
  if (first < 0) throw new Error(`Missing ${label} anchor`)
  if (html.indexOf(before, first + before.length) >= 0) throw new Error(`Multiple ${label} anchors found`)
  html = html.slice(0, first) + after + html.slice(first + before.length)
}

replaceOnce(
  'saved cap field',
  'runs:state.runs,cap:state.cap,seed:state.seed',
  'runs:state.runs,seed:state.seed',
)

replaceOnce(
  'restored cap clamp',
  'state.cap=Math.min(100000,Math.max(1,Number(s.cap)||100000));',
  'state.cap=100000;',
)

replaceOnce(
  'editable cap input',
  '<input id="capInput" type="number" min="1" max="100000" value="${state.cap}">',
  '<input id="capInput" type="number" min="100000" max="100000" value="100000" readonly aria-readonly="true" tabindex="-1" title="Depths is fixed at a 100,000 floor cap">',
)

replaceOnce(
  'cap change handler',
  "root.querySelector('#capInput')?.addEventListener('change',e=>{state.cap=Math.min(100000,Math.max(1,Number(e.target.value)||100000));persist();render()});",
  '',
)

fs.writeFileSync(indexPath, html)

let validate = fs.readFileSync(validatePath, 'utf8')
const oldChecks = `if (!liveHtml.includes('runs:15,cap:100000,seed:1000')) throw new Error('Depths default floor cap is not 100,000')
if (!liveHtml.includes('id="capInput" type="number" min="1" max="100000"')) throw new Error('Depths floor-cap input is not capped at 100,000')
if (!liveHtml.includes('state.cap=Math.min(100000,Math.max(1,Number(s.cap)||100000))')) throw new Error('Depths restored floor cap is not capped at 100,000')
if (!liveHtml.includes('state.cap=Math.min(100000,Math.max(1,Number(e.target.value)||100000))')) throw new Error('Depths floor-cap handler is not capped at 100,000')`
const newChecks = `if (!liveHtml.includes('runs:15,cap:100000,seed:1000')) throw new Error('Depths fixed floor cap is not initialized to 100,000')
if (!liveHtml.includes('id="capInput" type="number" min="100000" max="100000" value="100000" readonly')) throw new Error('Depths floor cap is not rendered as a locked 100,000 value')
if (!liveHtml.includes('state.cap=100000;')) throw new Error('Depths restore path does not force the cap to 100,000')
if (liveHtml.includes('cap:state.cap')) throw new Error('Depths floor cap is still being persisted as a user setting')
if (liveHtml.includes("root.querySelector('#capInput')?.addEventListener('change'")) throw new Error('Depths floor cap is still user-editable')`
if (!validate.includes(oldChecks)) throw new Error('Validation cap-check block not found')
validate = validate.replace(oldChecks, newChecks)
fs.writeFileSync(validatePath, validate)

console.log('Locked Depths simulator floor cap at 100,000 and removed user editing/persistence.')

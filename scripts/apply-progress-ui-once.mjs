import fs from 'node:fs'

const html = fs.readFileSync('index.html', 'utf8')
const alreadyApplied = html.includes('data-cancel-run') && html.includes("e.data.kind==='progress'") && html.includes('[1,3,8,15,30,50]')

if (alreadyApplied) {
  console.log('Progress UI already applied.')
} else {
  await import('./add-progress-ui.mjs')
  console.log('Applied progress UI.')
}

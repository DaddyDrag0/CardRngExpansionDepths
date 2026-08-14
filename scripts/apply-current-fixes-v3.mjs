import './apply-current-fixes-v2.mjs'
import fs from 'node:fs'

const path = 'scripts/engine-smoke.ts'
let text = fs.readFileSync(path, 'utf8')
const oldBlock = `assert(timeoutBattle.turns >= 145 && timeoutBattle.turns <= 155, \`Source-aligned timeout should resolve at about 150 total turns, got \${timeoutBattle.turns}\`)
console.log('Source-aligned 150-turn timeout regression passed:', timeoutBattle.turns, 'turns')`
const newBlock = `assert(timeoutBattle.turns >= 100 && timeoutBattle.turns <= 105, \`Source-aligned timeout should resolve at about 100 no-progress turns, got \${timeoutBattle.turns}\`)
console.log('Source-aligned 100-turn no-progress regression passed:', timeoutBattle.turns, 'turns')`
const matches = text.split(oldBlock).length - 1
if (matches !== 1) throw new Error(\`engine-smoke timeout assertion: expected 1 match, found \${matches}\`)
text = text.replace(oldBlock, newBlock)
fs.writeFileSync(path, text)
console.log('Updated stale 150-turn regression to the OG server 100-turn rule.')

import './apply-current-fixes-v2.mjs'
import fs from 'node:fs'

const path = 'scripts/engine-smoke.ts'
let text = fs.readFileSync(path, 'utf8')
const oldAssert = "assert(timeoutBattle.turns >= 145 && timeoutBattle.turns <= 155, `Source-aligned timeout should resolve at about 150 total turns, got ${timeoutBattle.turns}`)"
const newAssert = "assert(timeoutBattle.turns >= 100 && timeoutBattle.turns <= 105, `Source-aligned timeout should resolve at about 100 no-progress turns, got ${timeoutBattle.turns}`)"
const oldLog = "console.log('Source-aligned 150-turn timeout regression passed:', timeoutBattle.turns, 'turns')"
const newLog = "console.log('Source-aligned 100-turn no-progress regression passed:', timeoutBattle.turns, 'turns')"

if (!text.includes(oldAssert)) throw new Error('Old 150-turn assertion was not found')
if (!text.includes(oldLog)) throw new Error('Old 150-turn regression log was not found')
text = text.replace(oldAssert, newAssert).replace(oldLog, newLog)
fs.writeFileSync(path, text)
console.log('Updated stale timeout regression to the OG server 100-turn rule.')

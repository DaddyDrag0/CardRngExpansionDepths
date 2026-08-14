import fs from 'node:fs'

const path = 'src/engine/battle-v2.ts'
let s = fs.readFileSync(path, 'utf8')
const before = `    case 'Decapitate': {\n      const unholySurvives = hasAbility(runtime, target, 'Unholy Creature')\n        && (!target.flags.unholyActive || (target.counters.unholyTurns || 0) > 0)\n      if (target.hp <= 0 && !unholySurvives) {\n        boostStats(attacker, 1.2)\n        attacker.flags.extraTurn = true\n      }\n      break\n    }`
const after = `    case 'Decapitate': {\n      const unholySurvives = hasAbility(runtime, target, 'Unholy Creature')\n        && (!target.flags.unholyActive || (target.counters.unholyTurns || 0) > 0)\n      if (target.hp <= 0 && !unholySurvives) attacker.flags.extraTurn = true\n      break\n    }`
const count = s.split(before).length - 1
if (count !== 1) throw new Error('Expected exactly one current Decapitate kill-reward block, found ' + count)
s = s.replace(before, after)
fs.writeFileSync(path, s)
console.log('Removed Shuten confirmed-kill stat gain; kept 2x damage and extra turn.')

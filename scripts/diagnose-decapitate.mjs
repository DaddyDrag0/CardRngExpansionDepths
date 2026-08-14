import fs from 'node:fs'
const path='src/engine/battle-v2.ts'
let s=fs.readFileSync(path,'utf8')
const before=`    case 'Decapitate': {\n      // \"When defeating an enemy\" means the target must actually be allowed to die.\n      // Unholy Creature reaching 0 HP starts its two-turn survival window instead,\n      // so it must not grant Shuten-dōji a fake kill, +20% stats, or another turn.\n      const unholySurvives = hasAbility(runtime, target, 'Unholy Creature')\n        && (!target.flags.unholyActive || (target.counters.unholyTurns || 0) > 0)\n      if (target.hp <= 0 && !unholySurvives) {\n        boostStats(attacker, 1.2)\n        attacker.flags.extraTurn = true\n      }\n      break\n    }`
const after=`    case 'Decapitate': {\n      // diagnostic: leave the 2x offensive hit intact but remove kill snowball\n      break\n    }`
if(!s.includes(before)) throw new Error('Decapitate block not found')
s=s.replace(before,after)
fs.writeFileSync(path,s)
console.log('Disabled Decapitate kill reward for diagnostic only')

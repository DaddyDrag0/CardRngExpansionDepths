import fs from 'node:fs'

const path = 'src/engine/battle-v2.ts'
let s = fs.readFileSync(path, 'utf8')

function replaceOnce(before, after, label) {
  const count = s.split(before).length - 1
  if (count !== 1) throw new Error(`${label}: expected 1 match, found ${count}`)
  s = s.replace(before, after)
}

replaceOnce(
  "case 'Decapitate': damage *= 1.5; break",
  "case 'Decapitate': damage *= 1.15; break",
  'final Shuten attack calibration',
)

replaceOnce(
  "if (target.hp <= 0 && !unholySurvives) boostStats(attacker, 1.1)",
  "if (target.hp <= 0 && !unholySurvives) boostStats(attacker, 1.05)",
  'final Shuten kill calibration',
)

fs.writeFileSync(path, s)
console.log('Locked Shuten Decapitate at 1.15x damage, +5% confirmed-kill stats, no extra turn.')

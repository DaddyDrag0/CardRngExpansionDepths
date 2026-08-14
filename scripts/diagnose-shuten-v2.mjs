import fs from 'node:fs'
import { spawnSync } from 'node:child_process'

const path = 'src/engine/battle-v2.ts'
const original = fs.readFileSync(path, 'utf8')
const variants = [
  { label: '1.15x +5% kill', damage: '1.15', reward: '1.05' },
]

for (const variant of variants) {
  let s = original
  s = s.replace("case 'Decapitate': damage *= 1.5; break", `case 'Decapitate': damage *= ${variant.damage}; break`)
  s = s.replace("if (target.hp <= 0 && !unholySurvives) boostStats(attacker, 1.1)", `if (target.hp <= 0 && !unholySurvives) boostStats(attacker, ${variant.reward})`)
  fs.writeFileSync(path, s)
  console.log('VARIANT', variant.label)
  const run = spawnSync('npx', ['--no-install', 'tsx', 'scripts/diagnose-shuten-v2.ts'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  process.stdout.write(run.stdout)
  process.stderr.write(run.stderr)
  if (run.status !== 0) process.exit(run.status || 1)
}

fs.writeFileSync(path, original)

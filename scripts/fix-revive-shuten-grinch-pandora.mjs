import fs from 'node:fs'

const path = 'src/engine/battle-v2.ts'
let s = fs.readFileSync(path, 'utf8')

function replaceOnce(before, after, label) {
  const count = s.split(before).length - 1
  if (count !== 1) throw new Error(`${label}: expected 1 match, found ${count}`)
  s = s.replace(before, after)
}

replaceOnce(
`// Pandora can only roll abilities from non-limited cards. In the extracted card
// data, limited/time-limited cards are the entries marked expires=true.
const PANDORA_ABILITY_POOL = [...new Set(
  cards.filter((card) => !card.expires).map((card) => card.ability).filter((name): name is string => Boolean(name)),
)].filter((name) =>`,
`// Pandora can gain abilities from the full card pool, including limited cards.
const PANDORA_ABILITY_POOL = [...new Set(
  cards.map((card) => card.ability).filter((name): name is string => Boolean(name)),
)].filter((name) =>`,
'Pandora full ability pool',
)

replaceOnce(
`    // Balance correction for Expansion results: keep Decapitate as a strong
    // normal attack modifier without letting Shuten snowball thousands of floors.
    case 'Decapitate': damage *= 1.15; break`,
`    case 'Decapitate': damage *= 2; break`,
'Restore Decapitate 2x damage',
)

replaceOnce(
`    case 'Decapitate': {
      // Expansion-calibrated version: a confirmed kill gives a smaller permanent
      // stat reward and does not chain an immediate extra turn. This also avoids
      // revive cards multiplying Shuten's snowball far beyond observed Depths runs.
      const unholySurvives = hasAbility(runtime, target, 'Unholy Creature')
        && (!target.flags.unholyActive || (target.counters.unholyTurns || 0) > 0)
      if (target.hp <= 0 && !unholySurvives) boostStats(attacker, 1.05)
      break
    }`,
`    case 'Decapitate': {
      const unholySurvives = hasAbility(runtime, target, 'Unholy Creature')
        && (!target.flags.unholyActive || (target.counters.unholyTurns || 0) > 0)
      if (target.hp <= 0 && !unholySurvives) {
        boostStats(attacker, 1.2)
        attacker.flags.extraTurn = true
      }
      break
    }`,
'Restore Decapitate kill reward',
)

replaceOnce(
`    case 'Steal Christmas':
      if (damage > 0 && attacker !== target) {
        // OG server Retroactive.Target module: steal 20% of CURRENT HP and ATK only.
        // Max HP is never transferred, so do not use the generic stealStats helper here.
        const stolenHp = Math.max(0, attacker.hp * 0.2)
        const stolenDamage = Math.max(0, attacker.damage * 0.2)
        target.damage += stolenDamage
        target.hp += stolenHp
        attacker.hp = Math.max(0, attacker.hp - stolenHp)
        attacker.damage = Math.max(0, attacker.damage - stolenDamage)
      }
      break`,
`    case 'Steal Christmas':
      if (damage > 0 && attacker !== target && !target.flags.stealChristmasUsed) {
        // Steal Christmas activates only once per Grinch.
        target.flags.stealChristmasUsed = true
        const stolenHp = Math.max(0, attacker.hp * 0.2)
        const stolenDamage = Math.max(0, attacker.damage * 0.2)
        target.damage += stolenDamage
        target.hp += stolenHp
        attacker.hp = Math.max(0, attacker.hp - stolenHp)
        attacker.damage = Math.max(0, attacker.damage - stolenDamage)
      }
      break`,
'Limit Steal Christmas to one activation',
)

replaceOnce(
`function doLotusSutra(runtime: Runtime, attacker: CombatCard) {
  const fallen = runtime.state.fallen[attacker.team]
  const deadAlly = [...fallen].reverse().find((card) => card !== attacker)
  if (deadAlly) {
    const index = fallen.indexOf(deadAlly)
    if (index >= 0) fallen.splice(index, 1)
    deadAlly.dead = false
    deadAlly.hp = deadAlly.maxHp * 0.5
    deadAlly.entered = false
    runtime.state.teams[attacker.team].push(deadAlly)
    return
  }
`,
`function doLotusSutra(runtime: Runtime, attacker: CombatCard) {
  const fallen = runtime.state.fallen[attacker.team]
  // A Lotus Sutra user can perform its revive once per battle. This prevents
  // Buddha and Hades (after copying Lotus Sutra) from reviving each other forever.
  const deadAlly = attacker.flags.lotusReviveUsed
    ? undefined
    : [...fallen].reverse().find((card) => card !== attacker)
  if (deadAlly) {
    attacker.flags.lotusReviveUsed = true
    const index = fallen.indexOf(deadAlly)
    if (index >= 0) fallen.splice(index, 1)
    deadAlly.dead = false
    deadAlly.hp = deadAlly.maxHp * 0.5
    deadAlly.entered = false
    runtime.state.teams[attacker.team].push(deadAlly)
    return
  }
`,
'Finite Lotus Sutra revive',
)

fs.writeFileSync(path, s)
console.log('Restored Shuten and Pandora; limited Grinch and Lotus Sutra revives.')
// rerun with regression file present

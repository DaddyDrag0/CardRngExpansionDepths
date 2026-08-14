import fs from 'node:fs'

const path = 'src/engine/battle-v2.ts'
let s = fs.readFileSync(path, 'utf8')

function replaceOnce(before, after, label) {
  const count = s.split(before).length - 1
  if (count !== 1) throw new Error(`${label}: expected 1 match, found ${count}`)
  s = s.replace(before, after)
}

replaceOnce(
`const PANDORA_ABILITY_POOL = [...new Set(
  cards.map((card) => card.ability).filter((name): name is string => Boolean(name)),
)].filter((name) =>`,
`// Pandora can only roll abilities from non-limited cards. In the extracted card
// data, limited/time-limited cards are the entries marked expires=true.
const PANDORA_ABILITY_POOL = [...new Set(
  cards.filter((card) => !card.expires).map((card) => card.ability).filter((name): name is string => Boolean(name)),
)].filter((name) =>`,
'Pandora limited-card filter',
)

replaceOnce(
`    case 'Decapitate': damage *= 2; break`,
`    // Balance correction for Expansion results: keep Decapitate as a strong
    // normal attack modifier without letting Shuten snowball thousands of floors.
    case 'Decapitate': damage *= 1.5; break`,
'Shuten Decapitate attack multiplier',
)

replaceOnce(
`    case 'Decapitate': {
      // "When defeating an enemy" means the target must actually be allowed to die.
      // Unholy Creature reaching 0 HP starts its two-turn survival window instead,
      // so it must not grant Shuten-dōji a fake kill, +20% stats, or another turn.
      const unholySurvives = hasAbility(runtime, target, 'Unholy Creature')
        && (!target.flags.unholyActive || (target.counters.unholyTurns || 0) > 0)
      if (target.hp <= 0 && !unholySurvives) {
        boostStats(attacker, 1.2)
        attacker.flags.extraTurn = true
      }
      break
    }`,
`    case 'Decapitate': {
      // Expansion-calibrated version: a confirmed kill gives a smaller permanent
      // stat reward and does not chain an immediate extra turn. This also avoids
      // revive cards multiplying Shuten's snowball far beyond observed Depths runs.
      const unholySurvives = hasAbility(runtime, target, 'Unholy Creature')
        && (!target.flags.unholyActive || (target.counters.unholyTurns || 0) > 0)
      if (target.hp <= 0 && !unholySurvives) boostStats(attacker, 1.1)
      break
    }`,
'Shuten Decapitate kill reward',
)

replaceOnce(
`          card.counters.unholyTurns = 2
          card.hp = 1`,
`          card.counters.unholyTurns = 2
          card.counters.unholyActivatedTurn = runtime.state.turn
          card.counters.unholyLastTick = runtime.state.turn
          card.hp = 1`,
'Unholy Creature activation timestamp',
)

const unholyStatusBlock = `    if (attacker.flags.unholyActive) {
      attacker.counters.unholyTurns = Math.max(0, (attacker.counters.unholyTurns || 0) - 1)
      if ((attacker.counters.unholyTurns || 0) <= 0) attacker.hp = 0
    }
`
let unholyCount = s.split(unholyStatusBlock).length - 1
if (unholyCount !== 1) throw new Error(`protected Unholy status block: expected 1 match, found ${unholyCount}`)
s = s.replace(unholyStatusBlock, '')

const unholyStatusBlock2 = `  if (attacker.flags.unholyActive) {
    attacker.counters.unholyTurns = Math.max(0, (attacker.counters.unholyTurns || 0) - 1)
    if ((attacker.counters.unholyTurns || 0) <= 0) attacker.hp = 0
  }
`
unholyCount = s.split(unholyStatusBlock2).length - 1
if (unholyCount !== 1) throw new Error(`normal Unholy status block: expected 1 match, found ${unholyCount}`)
s = s.replace(unholyStatusBlock2, '')

replaceOnce(
`function statusEnd(runtime: Runtime, attacker: CombatCard) {`,
`function tickGlobalUnholyCreature(runtime: Runtime) {
  // "Survives for two turns" is a battle-turn lifespan, not two turns taken by
  // Zombie Dragon itself. Extra-turn chains must therefore not freeze it at 1 HP.
  for (const team of ['Allies', 'Enemies'] as BattleTeam[]) {
    for (const card of runtime.state.teams[team]) {
      if (!card.flags.unholyActive) continue
      const activated = card.counters.unholyActivatedTurn || 0
      const lastTick = card.counters.unholyLastTick || activated
      if (runtime.state.turn <= activated || lastTick >= runtime.state.turn) continue
      card.counters.unholyLastTick = runtime.state.turn
      card.counters.unholyTurns = Math.max(0, (card.counters.unholyTurns || 0) - 1)
      if ((card.counters.unholyTurns || 0) <= 0) card.hp = 0
    }
  }
}

function statusEnd(runtime: Runtime, attacker: CombatCard) {`,
'global Unholy helper',
)

replaceOnce(
`    if (state.turn % 5 === 0) onProgress?.(state.turn)
    let attacker = active(runtime, state.moving)`,
`    if (state.turn % 5 === 0) onProgress?.(state.turn)
    tickGlobalUnholyCreature(runtime)
    resolveDeaths(runtime)
    let attacker = active(runtime, state.moving)`,
'global Unholy tick call',
)

replaceOnce(
`  if (hasAbility(runtime, target, 'Erosion') && off.special && damage >= target.hp) damage = Math.max(0, target.hp - 1)
`,
`  // Erosion blocks explicit/direct kill effects (Doom, Eat The Moon, Death Embrace,
  // etc.) in their own handlers. It must not make normal attacks nonlethal just
  // because the attacker's passive modifies normal attack damage.
`,
'Erosion normal-attack lethal clamp',
)

fs.writeFileSync(path, s)
console.log('Applied Pandora limited filter, Erosion fix, global Zombie Dragon timer, and calibrated Shuten nerf.')

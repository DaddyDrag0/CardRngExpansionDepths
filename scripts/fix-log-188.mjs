import fs from 'node:fs'

const path = 'src/engine/battle-v2.ts'
let text = fs.readFileSync(path, 'utf8')

function replaceOnce(oldText, newText, label) {
  const count = text.split(oldText).length - 1
  if (count !== 1) throw new Error(`${label}: expected 1 match, found ${count}`)
  text = text.replace(oldText, newText)
}

replaceOnce(
`function randomCreatableCard(runtime: Runtime) {
  const pool = cards.filter((card) => !card.unobtainable && !card.boss && card.rarity > 0)
  return pool[Math.floor(runtime.rng.next() * pool.length)] || cards[0]
}`,
`function randomCreatableCard(runtime: Runtime) {
  // OG server source: Nüwa can create any non-expired, obtainable card except Nüwa itself.
  // Pack and Boss are not separate exclusions here; Unobtainable/Expires are the source gates.
  const pool = cards.filter((card) => !card.expires && !card.unobtainable && card.name !== 'Nüwa')
  return pool[Math.floor(runtime.rng.next() * pool.length)] || cards[0]
}`,
'Nüwa spawn pool',
)

replaceOnce(
`        definition: createdDefinition,
        index: runtime.state.teams[card.team].length + 1,
        hp: card.hp,
        maxHp: card.maxHp,
        damage: card.damage,
        power: card.power,`,
`        definition: createdDefinition,
        index: runtime.state.teams[card.team].length + 1,
        borders: [],
        // OG server source rebuilds the spawned card from Nüwa's raw Power, not Nüwa's
        // current aura/battle-modified HP/ATK and not the spawned card's HP multiplier.
        hp: Math.ceil(card.power),
        maxHp: Math.ceil(card.power),
        damage: Math.ceil(card.power / 2),
        power: card.power,`,
'Nüwa spawned stats',
)

replaceOnce(
`    case 'Steal Christmas':
      if (damage > 0 && attacker !== target) stealStats(attacker, target, 0.2)
      break`,
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
'Steal Christmas source behavior',
)

fs.writeFileSync(path, text)
console.log('Applied source-aligned Nüwa and Steal Christmas fixes from the supplied OG Card RNG server source.')

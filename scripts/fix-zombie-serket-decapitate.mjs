import fs from 'node:fs'

function replaceOnce(path,before,after,label){
  let text=fs.readFileSync(path,'utf8')
  const count=text.split(before).length-1
  if(count!==1)throw new Error(`${label}: expected 1 match, found ${count}`)
  text=text.replace(before,after)
  fs.writeFileSync(path,text)
}

replaceOnce(
  'src/engine/battle-v2.ts',
  `function statusEnd(runtime: Runtime, attacker: CombatCard) {\n  if (statusProtected(runtime, attacker.team)) {\n    clearStatuses(attacker)\n    return\n  }`,
  `function statusEnd(runtime: Runtime, attacker: CombatCard) {\n  if (statusProtected(runtime, attacker.team)) {\n    clearStatuses(attacker)\n    // Protection of Gods grants immunity to Status Effects; it must not freeze\n    // the card's own ability lifespans. Final Tail, Unholy Creature and Undying\n    // still consume their turns while Serket is alive.\n    if (hasAbility(runtime, attacker, 'Final Tail')) {\n      attacker.counters.finalTail = (attacker.counters.finalTail || 0) + 1\n      if (attacker.counters.finalTail >= 3) attacker.hp = 0\n    }\n    if (attacker.flags.unholyActive) {\n      attacker.counters.unholyTurns = Math.max(0, (attacker.counters.unholyTurns || 0) - 1)\n      if ((attacker.counters.unholyTurns || 0) <= 0) attacker.hp = 0\n    }\n    if (attacker.flags.undyingActive) {\n      attacker.counters.undyingTurns = Math.max(0, (attacker.counters.undyingTurns || 0) - 1)\n      if ((attacker.counters.undyingTurns || 0) <= 0) attacker.hp = 0\n    }\n    return\n  }`,
  'Protection of Gods self-timer handling',
)

replaceOnce(
  'src/engine/battle-v2.ts',
  `    case 'Decapitate': if (target.hp <= 0) { boostStats(attacker, 1.2); attacker.flags.extraTurn = true }; break`,
  `    case 'Decapitate': {\n      // "When defeating an enemy" means the target must actually be allowed to die.\n      // Unholy Creature reaching 0 HP starts its two-turn survival window instead,\n      // so it must not grant Shuten-dōji a fake kill, +20% stats, or another turn.\n      const unholySurvives = hasAbility(runtime, target, 'Unholy Creature')\n        && (!target.flags.unholyActive || (target.counters.unholyTurns || 0) > 0)\n      if (target.hp <= 0 && !unholySurvives) {\n        boostStats(attacker, 1.2)\n        attacker.flags.extraTurn = true\n      }\n      break\n    }`,
  'Decapitate confirmed Unholy kill handling',
)

const smoke='scripts/engine-smoke.ts'
let text=fs.readFileSync(smoke,'utf8')
const marker=`console.log('Expansion 150-turn no-progress regression passed:', timeoutBattle.turns, 'turns')\n`
if(!text.includes(marker))throw new Error('engine smoke marker missing')
const regression=`\n// Regression for the floor-388 failure: Serket must not make Zombie Dragon's\n// Unholy Creature lifespan permanent, and Decapitate must not chain fake kills\n// while Zombie Dragon is surviving at 1 HP.\nconst zombieDragon = cards.find((card) => card.name === 'Zombie Dragon')\nconst serket = cards.find((card) => card.name === 'Serket')\nassert(zombieDragon && serket, 'Zombie Dragon/Serket regression cards missing')\nconst zombieSerketEnemies: DepthsEnemy[] = [\n  { card: zombieDragon, power: 100, attack: 50, health: 100 },\n  { card: serket, power: 100, attack: 50, health: 100 },\n]\nconst zombieSerketBattle = simulateBattleV2(\n  { cards: [{ cardName: 'Shuten-dōji', borders: ['Galaxy'] }] },\n  zombieSerketEnemies,\n  388388,\n  10_000,\n  true,\n)\nassert(zombieSerketBattle.winner === 'Allies', \`Shuten should beat low-stat Zombie Dragon + Serket, got \${zombieSerketBattle.winner}\`)\nassert(zombieSerketBattle.turns < 50, \`Zombie Dragon + Serket interaction took too long: \${zombieSerketBattle.turns} turns\`)\nconsole.log('Zombie Dragon + Serket + Decapitate regression passed:', zombieSerketBattle.turns, 'turns')\n`
text=text.replace(marker,marker+regression)
fs.writeFileSync(smoke,text)

console.log('Fixed Zombie Dragon + Serket lifespan and Decapitate fake-kill chaining.')

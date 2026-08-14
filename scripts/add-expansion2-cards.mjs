import fs from 'node:fs'

function replaceOnce(path, before, after, label) {
  let text = fs.readFileSync(path, 'utf8')
  const count = text.split(before).length - 1
  if (count !== 1) throw new Error(`${label}: expected 1 match, found ${count}`)
  text = text.replace(before, after)
  fs.writeFileSync(path, text)
}

replaceOnce(
  'src/engine/battle-v2.ts',
  `  'Jealousy', 'Nightmare Melody', 'Sap',\n])`,
  `  'Jealousy', 'Nightmare Melody', 'Sap',\n  'Bind Fate', 'Luminescent Veil', 'Ouroboros',\n])`,
  'new supported ability names',
)

replaceOnce(
  'src/engine/battle-v2.ts',
  `function statusProtected(runtime: Runtime, team: BattleTeam): boolean {\n  return runtime.state.teams[team].some((card) => hasAbility(runtime, card, 'Protection of Gods'))\n}\n`,
  `function statusProtected(runtime: Runtime, team: BattleTeam): boolean {\n  return runtime.state.teams[team].some((card) => hasAbility(runtime, card, 'Protection of Gods'))\n}\n\nfunction luminescentVeilHolder(runtime: Runtime, team: BattleTeam): CombatCard | undefined {\n  return runtime.state.teams[team].find((card) => alive(card) && hasAbility(runtime, card, 'Luminescent Veil'))\n}\n`,
  'Luminescent Veil holder helper',
)

replaceOnce(
  'src/engine/battle-v2.ts',
  `  switch (name) {\n    case 'Perseverance':`,
  `  switch (name) {\n    case 'Bind Fate': {\n      const firstTwo = runtime.state.teams[enemyTeam].filter(alive).slice(0, 2)\n      if (firstTwo.length === 2) {\n        const pair = runtime.state.turn * 1000 + Math.max(1, card.index)\n        firstTwo[0].counters.bindFatePair = pair\n        firstTwo[1].counters.bindFatePair = pair\n      }\n      break\n    }\n    case 'Ouroboros': {\n      if (!card.flags.ouroborosActive) {\n        let stolenDamage = 0\n        let stolenMaxHp = 0\n        let stolenHp = 0\n        for (const teamName of ['Allies', 'Enemies'] as BattleTeam[]) {\n          for (const other of runtime.state.teams[teamName]) {\n            if (other === card || !alive(other)) continue\n            const oldDamage = other.damage\n            const oldMaxHp = other.maxHp\n            const oldHp = other.hp\n            other.damage = Math.max(0, oldDamage * 0.95)\n            other.maxHp = Math.max(1, oldMaxHp * 0.95)\n            other.hp = Math.max(0, Math.min(other.maxHp, oldHp * 0.95))\n            stolenDamage += oldDamage - other.damage\n            stolenMaxHp += oldMaxHp - other.maxHp\n            stolenHp += oldHp - other.hp\n          }\n        }\n        card.damage += stolenDamage\n        card.maxHp += stolenMaxHp\n        card.hp += stolenHp\n        card.counters.ouroborosBonusDamage = stolenDamage\n        card.counters.ouroborosBonusMaxHp = stolenMaxHp\n        card.counters.ouroborosBonusHp = stolenHp\n        card.counters.ouroborosTurns = 3\n        card.flags.ouroborosActive = true\n      }\n      break\n    }\n    case 'Perseverance':`,
  'new on-entry abilities',
)

replaceOnce(
  'src/engine/battle-v2.ts',
  `  target.flags.evadedThisHit = false\n  const beforeDefense = damage\n  if (!bypass && target.flags.eternalDevotion) { target.flags.eternalDevotion = false; damage = 0 }\n  else if (!bypass && target.flags.dodgeLethal) { target.flags.dodgeLethal = false; damage = 0 }\n  else if (!bypass) damage = defensive(runtime, attacker, target, damage)\n  if (!bypass && target.flags.evadedThisHit && hasAbility(runtime, attacker, 'ConstellarSagittarius')) damage = beforeDefense * 2`,
  `  target.flags.evadedThisHit = false\n  const beforeDefense = damage\n  if (!bypass && target.flags.eternalDevotion) { target.flags.eternalDevotion = false; damage = 0 }\n  else if (!bypass && target.flags.dodgeLethal) { target.flags.dodgeLethal = false; damage = 0 }\n  else if (!bypass) {\n    const veilHolder = luminescentVeilHolder(runtime, target.team)\n    const successfulEvades = target.counters.luminescentEvades || 0\n    if (veilHolder && successfulEvades < 2) {\n      const chance = Math.max(0.2, 0.4 - successfulEvades * 0.1)\n      if (rand(runtime, target.team) < chance) {\n        target.counters.luminescentEvades = successfulEvades + 1\n        target.flags.evadedThisHit = true\n        const baseDamage = veilHolder.counters.normalDamage || veilHolder.damage\n        const currentGain = veilHolder.counters.luminescentVeilGain || 0\n        const room = Math.max(0, baseDamage * 2 - currentGain)\n        const gain = Math.min(room, Math.max(0, beforeDefense) * 0.1)\n        if (gain > 0) {\n          veilHolder.damage += gain\n          veilHolder.counters.luminescentVeilGain = currentGain + gain\n        }\n        damage = 0\n      } else damage = defensive(runtime, attacker, target, damage)\n    } else damage = defensive(runtime, attacker, target, damage)\n  }\n  if (!bypass && target.flags.evadedThisHit && hasAbility(runtime, attacker, 'ConstellarSagittarius')) damage = beforeDefense * 2`,
  'Luminescent Veil defense',
)

replaceOnce(
  'src/engine/battle-v2.ts',
  `  const hpTarget = longReachTarget || target\n  hpTarget.hp -= Math.min(hpTarget.hp, damage)`,
  `  const hpTarget = longReachTarget || target\n  const appliedHpDamage = Math.min(hpTarget.hp, damage)\n  hpTarget.hp -= appliedHpDamage\n  if (appliedHpDamage > 0 && (hpTarget.counters.bindFatePair || 0) > 0) {\n    const pair = hpTarget.counters.bindFatePair\n    const partner = runtime.state.teams[hpTarget.team].find((candidate) =>\n      candidate !== hpTarget && alive(candidate) && candidate.counters.bindFatePair === pair\n    )\n    if (partner) partner.hp -= Math.min(partner.hp, appliedHpDamage)\n  }`,
  'Bind Fate shared HP damage',
)

replaceOnce(
  'src/engine/battle-v2.ts',
  `function statusEnd(runtime: Runtime, attacker: CombatCard) {`,
  `function tickOuroborosDecay(attacker: CombatCard) {\n  if (!attacker.flags.ouroborosActive) return\n  attacker.counters.ouroborosTurns = Math.max(0, (attacker.counters.ouroborosTurns || 0) - 1)\n  if ((attacker.counters.ouroborosTurns || 0) > 0) return\n  const damageBonus = attacker.counters.ouroborosBonusDamage || 0\n  const maxHpBonus = attacker.counters.ouroborosBonusMaxHp || 0\n  const hpBonus = attacker.counters.ouroborosBonusHp || 0\n  attacker.damage = Math.max(0, attacker.damage - damageBonus)\n  attacker.maxHp = Math.max(1, attacker.maxHp - maxHpBonus)\n  attacker.hp = Math.max(0, Math.min(attacker.maxHp, attacker.hp - hpBonus))\n  attacker.counters.ouroborosBonusDamage = 0\n  attacker.counters.ouroborosBonusMaxHp = 0\n  attacker.counters.ouroborosBonusHp = 0\n  attacker.flags.ouroborosActive = false\n}\n\nfunction statusEnd(runtime: Runtime, attacker: CombatCard) {\n  tickOuroborosDecay(attacker)`,
  'Ouroboros decay timer',
)

const smokePath = 'scripts/engine-smoke.ts'
let smoke = fs.readFileSync(smokePath, 'utf8')
const endMarker = `console.log('Zombie Dragon + Serket + Decapitate regression passed:', zombieSerketBattle.turns, 'turns')\n\n`
if (!smoke.includes(endMarker)) throw new Error('engine-smoke insertion marker missing')
const regressions = `// Expansion 2 event cards from the latest uploaded game file.\nfor (const name of ['Fate Seamstress', 'Eclipseborn Luminant', 'Eonus']) {\n  assert(cards.some((card) => card.name === name), \`New Expansion card missing: \${name}\`)\n}\nassert(cards.length >= 288, \`Expected at least 288 cards after Expansion 2 update, got \${cards.length}\`)\n\n// Bind Fate permanently links the first two enemies; a hit to one mirrors the same\n// HP loss to its linked partner.\nconst bindEnemies: DepthsEnemy[] = [\n  { card: { ...dummy, name: '__Bind A__' }, power: 1e9, attack: 0, health: 1e9 },\n  { card: { ...dummy, name: '__Bind B__' }, power: 1e9, attack: 0, health: 1e9 },\n]\nconst bindBattle = simulateBattleV2({ cards: [{ cardName: 'Fate Seamstress', borders: [] }] }, bindEnemies, 9911, 1)\nconst bindA = bindBattle.state.teams.Enemies.find((card) => card.definition.name === '__Bind A__')\nconst bindB = bindBattle.state.teams.Enemies.find((card) => card.definition.name === '__Bind B__')\nassert(bindA && bindB, 'Bind Fate test enemies missing')\nconst bindLossA = 1e9 - bindA.hp\nconst bindLossB = 1e9 - bindB.hp\nassert(bindLossA > 0 && Math.abs(bindLossA - bindLossB) < 1e-6, \`Bind Fate did not share damage equally: \${bindLossA} vs \${bindLossB}\`)\n\n// Ouroboros steals 5% from all other living cards on entry, then its stolen bonus\n// decays after three turns taken by the holder.\nconst ouroEnemy: DepthsEnemy[] = [{ card: { ...dummy, name: '__Ouroboros Enemy__' }, power: 1e12, attack: 0, health: 1e12 }]\nconst ouroEntry = simulateBattleV2({ cards: [{ cardName: 'Eonus', borders: [] }, { cardName: 'Mastermind', borders: [] }] }, ouroEnemy, 9922, 1)\nconst ouroEntryCard = ouroEntry.state.teams.Allies.find((card) => card.definition.name === 'Eonus')\nconst ouroAlly = ouroEntry.state.teams.Allies.find((card) => card.definition.name === 'Mastermind')\nassert(ouroEntryCard && ouroAlly, 'Ouroboros entry test cards missing')\nassert((ouroEntryCard.counters.ouroborosBonusDamage || 0) > 0, 'Ouroboros did not gain stolen ATK')\nassert(ouroAlly.damage < (ouroAlly.counters.normalDamage || ouroAlly.damage), 'Ouroboros did not steal allied ATK')\nconst ouroDecay = simulateBattleV2({ cards: [{ cardName: 'Eonus', borders: [] }, { cardName: 'Mastermind', borders: [] }] }, ouroEnemy, 9922, 5)\nconst ouroDecayCard = ouroDecay.state.teams.Allies.find((card) => card.definition.name === 'Eonus')\nassert(ouroDecayCard, 'Ouroboros decay holder missing')\nassert(!ouroDecayCard.flags.ouroborosActive, 'Ouroboros stolen stats did not decay after three holder turns')\nclose(ouroDecayCard.damage, ouroDecayCard.counters.normalDamage || ouroDecayCard.damage, 1e-6)\n\n// Luminescent Veil must be able to evade an incoming hit and feed 10% of the\n// prevented damage into its holder's ATK. Search a small deterministic seed set.\nlet veilWorked = false\nfor (let seed = 1; seed <= 100 && !veilWorked; seed++) {\n  const veilBattle = simulateBattleV2(\n    { cards: [{ cardName: 'Eclipseborn Luminant', borders: [] }] },\n    [{ card: { ...dummy, name: '__Veil Enemy__' }, power: 1e12, attack: 100, health: 1e12 }],\n    seed, 2,\n  )\n  const luminant = veilBattle.state.teams.Allies.find((card) => card.definition.name === 'Eclipseborn Luminant')\n  if (luminant && (luminant.counters.luminescentEvades || 0) > 0) {\n    assert(luminant.damage > (luminant.counters.normalDamage || 0), 'Luminescent Veil evade did not increase holder ATK')\n    veilWorked = true\n  }\n}\nassert(veilWorked, 'Luminescent Veil never evaded in deterministic seed search')\n\n// The Discord-reported Zombie Dragon -> Hades sequence is explicitly guarded:\n// The Underworld does copy Unholy Creature and Hades receives its survival state.\nconst hadesCopyBattle = simulateBattleV2(\n  { cards: [{ cardName: 'Zombie Dragon', borders: [] }, { cardName: 'Hades', borders: [] }] },\n  [{ card: { ...dummy, name: '__Hades Copy Enemy__' }, power: 1e12, attack: 1_000_000, health: 1e12 }],\n  9933, 20, true, true,\n)\nconst fallenHades = hadesCopyBattle.state.fallen.Allies.find((card) => card.definition.name === 'Hades')\nassert(fallenHades, 'Hades copy regression did not reach Hades')\nassert(fallenHades.abilityOverride === 'Unholy Creature', \`Hades copied the wrong ability: \${fallenHades.abilityOverride}\`)\nassert(Boolean(fallenHades.flags.unholyActive), 'Copied Unholy Creature never activated on Hades')\nconsole.log('Expansion 2 card regressions passed: Bind Fate, Luminescent Veil, Ouroboros, Zombie Dragon -> Hades copy.')\n\n`
smoke = smoke.replace(endMarker, endMarker + regressions)
fs.writeFileSync(smokePath, smoke)

console.log('Implemented Fate Seamstress, Eclipseborn Luminant, and Eonus mechanics.')

import cards from '../data/cards'
import type {
  BattleBoosts,
  BattleResult,
  BattleState,
  BattleTeam,
  CombatCard,
  DepthsEnemy,
  TeamLoadout,
} from '../types'
import { applyStatAura, buildSkillAuraBoosts } from './auras'
import { SeededRng } from './rng'
import { getAttack, getHealth, getPower } from './stats'

const OTHER_TEAM: Record<BattleTeam, BattleTeam> = {
  Allies: 'Enemies',
  Enemies: 'Allies',
}

const OFFENSIVE_SUPPORTED = new Set([
  'True Strike', 'Maelstrom', 'Judgment', 'Armageddon', 'Draconic Heart', 'Explosion',
  'Telekinesis', 'Favorable Odds', 'Vainglory', 'Decapitate', 'Martial Will', 'Dominate',
  'Decimate', 'Prehistoric Wrath', 'Big and Large', 'Blade', 'Defraud', 'Assassinate',
  'Sky Drop', 'Shadow Predator', 'Apex Predator', 'Infinite Dagger Works', 'Extinction',
  'God of Thunder', 'Fire World',
])

const DEFENSIVE_SUPPORTED = new Set([
  'Evasion', 'Finesse', 'Last Stand', 'Armor', 'Brittle', 'Mana Shield', 'Vainglory',
  'Solid', 'Modesty', 'Scale Armor', 'Stalwart', 'Divine Barrier', 'Untouchable',
  'The Loser', 'Invisibility', 'Limitless', 'Heavenly Ruler', 'Absolute Sovereignty',
  'Draconic Heart', 'Invincibility', 'Hidden Curse', 'Transcend Time', 'Snowbound',
  'Shelter Obsession', 'Big and Large', 'Frail', 'Reflective Shell', 'Sky Drop',
  'Spikes', 'Shadow Predator', 'Apex Predator', 'Persistent',
])

const TARGET_RETRO_SUPPORTED = new Set([
  'Restoration', 'Rage', 'Undead', 'Passion', 'Eight Heads', 'Wail',
  'Fury of the White Tiger', 'The Fall', 'Self-Destruct', 'Undead Practitioner',
  'Into The Sun', 'Frigid Touch', 'Blinding Flash',
])

const ATTACKER_RETRO_SUPPORTED = new Set([
  'Regenerate', 'Plunder', 'Voracity', 'Blood Drinker', 'Lifesteal', 'Drain Vitality',
  'Unholy Creature', 'Doom', 'Decapitate', 'Fury of the White Tiger', 'Feeder',
  'Defraud', 'Fight Dirty',
])

const ENTRY_SUPPORTED = new Set([
  'Mind Rift', 'Am I Beautiful?', 'Sudden Demise',
])

const SPECIAL_SUPPORTED = new Set([
  'Aura Farm', 'Mr. Piccolo',
])

export const SUPPORTED_ABILITIES = new Set([
  ...OFFENSIVE_SUPPORTED,
  ...DEFENSIVE_SUPPORTED,
  ...TARGET_RETRO_SUPPORTED,
  ...ATTACKER_RETRO_SUPPORTED,
  ...ENTRY_SUPPORTED,
  ...SPECIAL_SUPPORTED,
])

interface BattleRuntime {
  state: BattleState
  rng: SeededRng
}

function cardDefinition(name: string) {
  return cards.find((card) => card.name === name)
}

function primaryBorder(card: CombatCard): '' | 'Platinum' | 'Crystal' | 'Galaxy' {
  if (card.borders.includes('Galaxy')) return 'Galaxy'
  if (card.borders.includes('Crystal')) return 'Crystal'
  if (card.borders.includes('Platinum')) return 'Platinum'
  return ''
}

function borderTier(card: CombatCard): number {
  const border = primaryBorder(card)
  return border === 'Galaxy' ? 3 : border === 'Crystal' ? 2 : border === 'Platinum' ? 1 : 0
}

function createPlayerCard(name: string, borders: CombatCard['borders'], index: number): CombatCard | null {
  const definition = cardDefinition(name)
  if (!definition) return null
  const power = getPower(definition, borders)
  return {
    id: `Allies:${index}:${name}`,
    definition,
    team: 'Allies',
    index,
    borders: [...borders],
    power,
    hp: getHealth(definition, borders),
    maxHp: getHealth(definition, borders),
    damage: getAttack(definition, borders),
    entered: false,
    dead: false,
    boss: Boolean(definition.boss),
    status: { stunned: 0, confused: 0, burn: 0, weakness: false, blind: false, shield: 0 },
    flags: {},
    counters: {},
  }
}

function createEnemyCard(enemy: DepthsEnemy, index: number): CombatCard {
  return {
    id: `Enemies:${index}:${enemy.card.name}`,
    definition: enemy.card,
    team: 'Enemies',
    index,
    borders: [],
    power: enemy.power,
    hp: enemy.health,
    maxHp: enemy.health,
    damage: enemy.attack,
    entered: false,
    dead: false,
    boss: Boolean(enemy.card.boss),
    status: { stunned: 0, confused: 0, burn: 0, weakness: false, blind: false, shield: 0 },
    flags: {},
    counters: {},
  }
}

function isAlive(card: CombatCard | undefined): card is CombatCard {
  return Boolean(card && card.hp > 0 && !card.dead)
}

function abilityName(card: CombatCard | undefined): string | null {
  return card?.definition.ability || null
}

function noteUnsupported(state: BattleState, card: CombatCard | undefined) {
  const ability = abilityName(card)
  if (ability && !SUPPORTED_ABILITIES.has(ability)) state.unsupportedAbilities.add(ability)
}

function hasAbility(runtime: BattleRuntime, card: CombatCard | undefined, name: string): boolean {
  if (!card || card.dead || abilityName(card) !== name) return false
  const enemyBoosts = runtime.state.boosts[OTHER_TEAM[card.team]]
  if (enemyBoosts.endTimes && runtime.rng.next() < enemyBoosts.endTimes / 100) return false
  return true
}

function battleRandom(runtime: BattleRuntime, team: BattleTeam): number {
  const activeAllies = runtime.state.teams.Allies[0]
  const activeEnemies = runtime.state.teams.Enemies[0]
  if (abilityName(activeAllies) === 'Unlucky' || abilityName(activeEnemies) === 'Unlucky') return 0

  let roll = runtime.rng.next()
  const fate = runtime.state.boosts[team].fate
  if (fate && runtime.rng.next() < fate / 100) roll = Math.max(roll, runtime.rng.next())
  return roll
}

function moveDead(runtime: BattleRuntime, team: BattleTeam) {
  const deck = runtime.state.teams[team]
  while (deck[0] && deck[0].hp <= 0) {
    const dead = deck.shift()!
    dead.hp = 0
    dead.dead = true
    runtime.state.fallen[team].push(dead)
  }
}

function applyPersistentReset(card: CombatCard) {
  if (abilityName(card) !== 'Persistent') return
  const normalDamage = card.counters.normalDamage || card.damage
  if (card.damage < normalDamage) card.damage = normalDamage
}

function onEntry(runtime: BattleRuntime, card: CombatCard) {
  if (card.entered) return
  card.entered = true
  noteUnsupported(runtime.state, card)
  const enemyTeam = OTHER_TEAM[card.team]
  const enemy = runtime.state.teams[enemyTeam][0]
  if (!enemy) return

  if (hasAbility(runtime, card, 'Mind Rift') && card.damage > enemy.damage / 4) {
    enemy.status.confused = 3
  }

  if (hasAbility(runtime, card, 'Am I Beautiful?')) enemy.status.confused = 2

  if (hasAbility(runtime, card, 'Sudden Demise')) {
    const hits = 1 + Math.floor(runtime.rng.next() * 8)
    const perHit = card.damage * 0.1
    for (let hit = 0; hit < hits; hit++) {
      for (const target of runtime.state.teams[enemyTeam]) {
        if (target.hp > 0) target.hp = Math.max(0, target.hp - perHit)
      }
    }
    const survivors: CombatCard[] = []
    for (const target of runtime.state.teams[enemyTeam]) {
      if (target.hp <= 0) {
        target.dead = true
        runtime.state.fallen[enemyTeam].push(target)
      } else survivors.push(target)
    }
    runtime.state.teams[enemyTeam] = survivors
  }
}

function applyOffensive(runtime: BattleRuntime, attacker: CombatCard, target: CombatCard, initial: number): number {
  const ability = abilityName(attacker)
  if (!ability || !hasAbility(runtime, attacker, ability) || !OFFENSIVE_SUPPORTED.has(ability)) return initial
  let dmg = initial

  switch (ability) {
    case 'True Strike':
      if (battleRandom(runtime, attacker.team) > 0.5) dmg *= 2
      break
    case 'Maelstrom':
      attacker.counters.maelstrom = (attacker.counters.maelstrom || 0) % 2 + 1
      if (attacker.counters.maelstrom === 1) dmg *= 2
      break
    case 'Judgment':
      dmg += (attacker.maxHp - attacker.hp) * 0.7
      break
    case 'Armageddon':
      if (battleRandom(runtime, attacker.team) > 0.5) dmg = Number.POSITIVE_INFINITY
      break
    case 'Draconic Heart':
      dmg *= 3
      attacker.damage *= 0.9
      attacker.hp *= 0.9
      attacker.maxHp *= 0.9
      break
    case 'Explosion':
      dmg *= 3
      attacker.status.stunned = Math.max(attacker.status.stunned, 1)
      break
    case 'Telekinesis':
      attacker.counters.telekinesis = (attacker.counters.telekinesis || 0) % 2 + 1
      dmg *= attacker.counters.telekinesis === 1 ? 2 : 4
      break
    case 'Favorable Odds':
      dmg *= Math.max(1, Math.ceil(battleRandom(runtime, attacker.team) * 5))
      break
    case 'Vainglory':
      if (attacker.hp / attacker.maxHp > 0.5) dmg *= 1.5
      break
    case 'Decapitate':
      dmg *= 2
      break
    case 'Martial Will': {
      const attackerHits = attacker.counters.martialHits || 0
      const targetHits = target.counters.martialHits || 0
      if (attackerHits > 0 && targetHits > 0) dmg *= Math.pow(1.5, attackerHits)
      else if (attackerHits === 0 && targetHits > 0) target.counters.martialHits = 0
      attacker.counters.martialHits = (attacker.counters.martialHits || 0) + 1
      target.counters.martialHits = (target.counters.martialHits || 0) + 1
      break
    }
    case 'Dominate':
      if (borderTier(attacker) > borderTier(target)) dmg *= 2
      break
    case 'Decimate':
      dmg *= 3
      attacker.damage *= 0.7
      break
    case 'Prehistoric Wrath':
      if (target.hp / target.maxHp <= 0.5) dmg *= 2
      break
    case 'Big and Large':
      if (attacker.hp / attacker.maxHp > 0.25) dmg *= 3
      break
    case 'Blade':
      dmg += attacker.maxHp * 0.15
      attacker.maxHp *= 0.85
      attacker.hp = Math.min(attacker.hp, attacker.maxHp)
      break
    case 'Defraud':
      dmg = target.hp * 0.5
      break
    case 'Assassinate':
      if (target.hp / target.maxHp <= 0.25) dmg = target.maxHp
      break
    case 'Sky Drop':
      dmg *= 1.5
      break
    case 'Shadow Predator':
      if (attacker.flags.double) {
        dmg *= 2
        attacker.flags.double = false
      }
      break
    case 'Apex Predator':
      dmg *= 1.5
      break
    case 'Infinite Dagger Works':
      dmg *= 2
      break
    case 'Extinction':
      dmg *= 10
      attacker.hp = 0
      break
    case 'God of Thunder':
      attacker.counters.thunder = (attacker.counters.thunder || 0) % 2 + 1
      if (attacker.counters.thunder === 1) dmg *= 2.5
      break
    case 'Fire World':
      attacker.counters.fireWorld = (attacker.counters.fireWorld || 0) % 2 + 1
      if (attacker.counters.fireWorld === 1) dmg *= 4
      break
  }
  return dmg
}

function applyDefensive(runtime: BattleRuntime, attacker: CombatCard, target: CombatCard, initial: number): number {
  const ability = abilityName(target)
  if (!ability || !hasAbility(runtime, target, ability) || !DEFENSIVE_SUPPORTED.has(ability)) return initial
  let dmg = initial

  switch (ability) {
    case 'Evasion':
      if (battleRandom(runtime, target.team) > 0.9) dmg = 0
      break
    case 'Finesse':
      if (dmg < target.maxHp * 0.3) dmg = 0
      break
    case 'Last Stand':
      if (dmg >= target.hp && !target.flags.lastStand) {
        dmg = target.hp - 1
        target.flags.lastStand = true
      }
      break
    case 'Armor':
      dmg = Math.max(0, dmg - target.maxHp * 0.1)
      break
    case 'Brittle':
      dmg *= 2
      break
    case 'Mana Shield':
      if (!target.flags.manaShield && dmg < target.hp) {
        dmg = 0
        target.flags.manaShield = true
      }
      break
    case 'Vainglory':
      if (target.hp / target.maxHp > 0.5) dmg *= 0.7
      break
    case 'Solid':
      dmg *= 0.6
      break
    case 'Modesty':
      dmg *= 1.3
      break
    case 'Scale Armor':
      dmg = Math.max(0, dmg - target.maxHp * 0.15) / 2
      break
    case 'Stalwart':
      if (dmg > target.maxHp / 3 && target.hp > target.maxHp / 3) dmg = target.maxHp / 3
      break
    case 'Divine Barrier':
      if (!target.flags.manaShield) {
        dmg = 0
        target.flags.manaShield = true
      }
      break
    case 'Untouchable':
      if (battleRandom(runtime, target.team) > Math.pow(dmg / target.maxHp, 2)) dmg = 0
      break
    case 'The Loser':
      if (!target.flags.loser && dmg > target.hp) {
        dmg = 0
        target.flags.loser = true
        target.damage *= 2
      }
      break
    case 'Invisibility':
      if (battleRandom(runtime, target.team) > 0.4) dmg = 0
      break
    case 'Limitless':
      if (!target.flags.dodgeFirst) {
        target.flags.dodgeFirst = true
        dmg = 0
      }
      break
    case 'Heavenly Ruler':
      target.counters.heavenlyRuler = ((target.counters.heavenlyRuler || 0) + 1) % 2
      if (target.counters.heavenlyRuler === 0) dmg *= -0.8
      break
    case 'Absolute Sovereignty':
      dmg *= 0.65
      break
    case 'Draconic Heart':
      dmg /= 3
      break
    case 'Invincibility':
      dmg *= 0.25
      break
    case 'Hidden Curse': {
      const maxes = target.counters.hiddenCurse || 0
      const attackerHasStatus = attacker.status.weakness || attacker.status.burn > 0 || attacker.status.confused > 0 || attacker.status.stunned > 0 || attacker.status.blind
      if (maxes <= 5 && attackerHasStatus) {
        dmg = 0
        target.counters.hiddenCurse = maxes + 1
      }
      break
    }
    case 'Transcend Time':
      target.counters.transcendTime = ((target.counters.transcendTime || 0) + 1) % 2
      if (target.counters.transcendTime === 1) dmg = 0
      break
    case 'Snowbound':
      if (target.status.stunned > 0 || target.flags.dodge) {
        dmg = 0
        target.flags.dodge = false
      }
      break
    case 'Shelter Obsession': {
      const awakened = target.flags.awakened
      const cap = awakened ? target.maxHp / 4 : target.maxHp / 2
      if (dmg > cap && target.hp > cap) dmg = cap
      break
    }
    case 'Big and Large':
      if (target.hp / target.maxHp > 0.25) dmg *= 0.5
      break
    case 'Frail':
      dmg *= 2
      break
    case 'Reflective Shell': {
      const abilityDamage = dmg - attacker.damage
      if (abilityDamage > 0) {
        const reflected = Math.min(target.damage * 8, abilityDamage * 0.25)
        dmg -= reflected
        attacker.hp -= reflected
      }
      break
    }
    case 'Sky Drop':
      if (!target.counters.drop || target.counters.drop % 2 !== 0) dmg = 0
      break
    case 'Spikes':
      dmg *= 0.75
      attacker.counters.bleed = 2
      break
    case 'Shadow Predator':
      if (battleRandom(runtime, target.team) > 0.6) {
        dmg = 0
        target.flags.double = true
      }
      break
    case 'Apex Predator':
      dmg *= 0.5
      break
    case 'Persistent': {
      const persistence = target.counters.persistence || 0
      if (dmg >= target.hp && persistence < 2) {
        dmg = target.hp - 1
        target.counters.persistence = persistence + 1
      }
      break
    }
  }
  return dmg
}

function applyTargetRetro(runtime: BattleRuntime, attacker: CombatCard, target: CombatCard, dmg: number) {
  const ability = abilityName(target)
  if (!ability || !hasAbility(runtime, target, ability) || !TARGET_RETRO_SUPPORTED.has(ability)) return

  switch (ability) {
    case 'Restoration':
      if (target.hp > 0) target.hp = Math.min(target.maxHp, target.hp + dmg * 0.7)
      break
    case 'Rage':
      if (target.hp > 0) target.damage *= 1.25
      break
    case 'Undead':
      if (target.hp > 0) target.hp = Math.min(target.maxHp, target.hp + target.maxHp * 0.25)
      break
    case 'Passion':
      attacker.counters.passion = (attacker.counters.passion || 0) + 1
      if (attacker.counters.passion <= 3) attacker.damage *= 0.65
      break
    case 'Eight Heads':
      target.damage *= 0.875
      target.hp *= 0.875
      break
    case 'Wail':
      if (target.hp < target.maxHp / 2 && !target.flags.wail) {
        target.flags.wail = true
        attacker.status.stunned = Math.max(attacker.status.stunned, 1)
      }
      break
    case 'Fury of the White Tiger':
      target.damage = Math.max(target.damage - dmg, 0)
      break
    case 'The Fall':
      attacker.hp -= dmg
      break
    case 'Self-Destruct':
      if (target.hp <= 0 && battleRandom(runtime, target.team) > 0.5) attacker.hp -= target.maxHp
      break
    case 'Undead Practitioner':
      if (target.hp > 0 && !target.flags.undeadPractitioner && target.hp <= target.maxHp / 2) {
        target.hp += target.maxHp * 0.5
        target.flags.undeadPractitioner = true
      }
      break
    case 'Into The Sun':
      if (target.hp / target.maxHp < 0.33) {
        target.hp = 0
        attacker.hp = 0
      }
      break
    case 'Frigid Touch':
      if (dmg > 0 && battleRandom(runtime, attacker.team) >= 0.5) target.status.stunned = Math.max(target.status.stunned, 1)
      break
    case 'Blinding Flash':
      if (battleRandom(runtime, attacker.team) > 0.7) attacker.flags.extraTurn = true
      break
  }
}

function lifeStealMultiplier(runtime: BattleRuntime, attacker: CombatCard): number {
  const aura = runtime.state.boosts[attacker.team].vampireMatron
  return aura ? (100 + aura * 5) / 100 : 1
}

function applyAttackerRetro(runtime: BattleRuntime, attacker: CombatCard, target: CombatCard, dmg: number) {
  const ability = abilityName(attacker)
  if (!ability || !hasAbility(runtime, attacker, ability) || !ATTACKER_RETRO_SUPPORTED.has(ability)) return

  switch (ability) {
    case 'Regenerate':
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.2)
      break
    case 'Plunder':
      if (target.hp <= 0 && target !== attacker) {
        attacker.damage += target.damage * 0.3
        attacker.maxHp += target.maxHp * 0.3
        attacker.hp += target.maxHp * 0.3
      }
      break
    case 'Voracity':
      if (target.hp <= 0) {
        attacker.damage *= 1.2
        attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.2)
      }
      break
    case 'Blood Drinker':
    case 'Lifesteal': {
      const fraction = ability === 'Blood Drinker' ? 0.5 : 0.5
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + dmg * fraction * lifeStealMultiplier(runtime, attacker))
      break
    }
    case 'Drain Vitality': {
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + dmg * lifeStealMultiplier(runtime, attacker))
      const stolen = Math.min(target.damage, dmg)
      attacker.damage += stolen
      target.damage -= stolen
      break
    }
    case 'Unholy Creature':
      if (dmg > 0) target.counters.poisonPercent = -0.15
      break
    case 'Doom':
      if (target.hp > 0 && battleRandom(runtime, attacker.team) > 1 - dmg / target.hp) target.hp = 0
      break
    case 'Decapitate':
      if (target.hp <= 0) {
        attacker.damage *= 1.2
        attacker.maxHp *= 1.2
        attacker.hp *= 1.2
        attacker.flags.extraTurn = true
      }
      break
    case 'Fury of the White Tiger':
      if (target.hp <= 0) {
        attacker.damage *= 1.35
        attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.35)
      }
      break
    case 'Feeder':
      if (target.hp <= 0) attacker.hp = attacker.maxHp
      break
    case 'Defraud':
      attacker.hp -= attacker.maxHp / 4
      break
    case 'Fight Dirty':
      target.damage = Math.floor(target.damage * 0.7)
      break
  }
}

function resolveAuraFarm(runtime: BattleRuntime, target: CombatCard, incoming: number): { target: CombatCard; damage: number } {
  if (incoming < target.hp) return { target, damage: incoming }
  const deck = runtime.state.teams[target.team]
  const piccolo = deck[1]
  if (!piccolo || piccolo.definition.name !== 'Piccolo' || piccolo.flags.farmed) return { target, damage: incoming }

  piccolo.flags.farmed = true
  deck[0] = piccolo
  deck[1] = target
  piccolo.damage *= 2
  piccolo.hp *= 2
  piccolo.maxHp *= 2
  if (target.definition.name === 'Kid Gohan') {
    piccolo.damage *= 1.5
    piccolo.hp *= 1.5
    piccolo.maxHp *= 1.5
  }
  return { target: piccolo, damage: 0 }
}

function dealDamage(runtime: BattleRuntime, attacker: CombatCard, originalTarget: CombatCard, mult = 1): number {
  let target = originalTarget

  // Original confusion path: 50% chance an attacker hits itself instead.
  if (attacker.status.confused > 0 && runtime.rng.next() < 0.5) target = attacker
  if (attacker.status.confused > 0) attacker.status.confused -= 1

  let dmg = attacker.damage * mult
  if (attacker.status.burn > 0) dmg *= 0.85
  dmg = applyOffensive(runtime, attacker, target, dmg)
  if (target.status.weakness) dmg *= 1.3
  dmg = applyDefensive(runtime, attacker, target, dmg)

  const shielder = runtime.state.boosts[target.team].shielder
  if (shielder) dmg *= (100 - shielder) / 100

  const synthHuman = runtime.state.boosts[target.team].synthHuman
  if (synthHuman && dmg < target.maxHp * synthHuman / 100) dmg = 0

  if (target.status.shield > 0 && dmg > 0) {
    target.status.shield -= 1
    dmg = 0
  }

  if (dmg < 0) {
    const missingHp = target.maxHp - target.hp
    dmg = Math.max(-missingHp, dmg)
  }
  dmg = Number.isFinite(dmg) ? Math.ceil(dmg) : target.hp

  const farm = resolveAuraFarm(runtime, target, dmg)
  target = farm.target
  dmg = farm.damage
  target.hp -= Math.min(target.hp, dmg)

  const enemyActive = runtime.state.teams[OTHER_TEAM[attacker.team]][0]
  if (hasAbility(runtime, enemyActive, 'Am I Beautiful?')) {
    if (target.team === attacker.team) target.damage *= 0.8
    else target.status.confused += 1
  }

  const flameWizard = runtime.state.boosts[attacker.team].flameWizard
  if (flameWizard && dmg > 0 && runtime.rng.next() * 100 < flameWizard) target.status.burn = 2

  applyTargetRetro(runtime, attacker, target, dmg)
  applyAttackerRetro(runtime, attacker, target, dmg)
  return dmg
}

function doTurn(runtime: BattleRuntime, attacker: CombatCard) {
  const enemyTeam = OTHER_TEAM[attacker.team]
  const target = runtime.state.teams[enemyTeam][0]
  if (!target) return

  if (attacker.status.stunned > 0) {
    attacker.status.stunned -= 1
    return
  }

  dealDamage(runtime, attacker, target)

  const berserker = runtime.state.boosts[target.team].berserker
  if (target.hp > 0 && berserker && runtime.rng.next() * 100 < berserker) dealDamage(runtime, target, attacker)

  applyPersistentReset(attacker)
  if (attacker.status.burn > 0) attacker.status.burn -= 1
}

function buildBoosts(loadout: TeamLoadout, state: BattleState): Record<BattleTeam, BattleBoosts> {
  const boosts: Record<BattleTeam, BattleBoosts> = { Allies: {}, Enemies: {} }
  const skill = buildSkillAuraBoosts(loadout.abilityAura)
  boosts.Allies = { ...skill.boosts }
  if (skill.aura && !skill.implemented) state.unsupportedAbilities.add(`Aura: ${skill.aura.name}`)
  return boosts
}

export function createBattleState(loadout: TeamLoadout, enemies: DepthsEnemy[]): BattleState {
  const allies = loadout.cards
    .map((slot, index) => createPlayerCard(slot.cardName, slot.borders, index + 1))
    .filter((card): card is CombatCard => Boolean(card))
  const enemyCards = enemies.map((enemy, index) => createEnemyCard(enemy, index + 1))

  const state: BattleState = {
    teams: { Allies: allies, Enemies: enemyCards },
    fallen: { Allies: [], Enemies: [] },
    boosts: { Allies: {}, Enemies: {} },
    turn: 0,
    moving: 'Allies',
    unsupportedAbilities: new Set<string>(),
  }

  const stat = applyStatAura(allies, loadout.statAura)
  if (stat.aura) {
    state.boosts.Allies.statAuraName = stat.aura.name
    state.boosts.Allies.statAuraValue = stat.value
  }
  state.boosts = buildBoosts(loadout, state)
  if (stat.aura) {
    state.boosts.Allies.statAuraName = stat.aura.name
    state.boosts.Allies.statAuraValue = stat.value
  }

  for (const card of [...allies, ...enemyCards]) {
    card.counters.normalDamage = card.damage
    noteUnsupported(state, card)
  }
  return state
}

export function simulateBattle(loadout: TeamLoadout, enemies: DepthsEnemy[], seed = 1): BattleResult {
  const state = createBattleState(loadout, enemies)
  const runtime: BattleRuntime = { state, rng: new SeededRng(seed) }
  let lastPair = ''
  let samePairTurns = 0

  while (state.teams.Allies.length && state.teams.Enemies.length && state.turn < 1_000) {
    state.turn += 1
    const attacker = state.teams[state.moving][0]
    const defender = state.teams[OTHER_TEAM[state.moving]][0]
    if (!attacker || !defender) break

    const pair = `${attacker.id}|${defender.id}`
    if (pair === lastPair) samePairTurns += 1
    else {
      samePairTurns = 0
      lastPair = pair
    }
    if (samePairTurns >= 100) {
      attacker.hp = 0
      defender.hp = 0
      moveDead(runtime, attacker.team)
      moveDead(runtime, defender.team)
      continue
    }

    onEntry(runtime, attacker)
    if (state.teams[OTHER_TEAM[state.moving]][0]) onEntry(runtime, state.teams[OTHER_TEAM[state.moving]][0])
    if (!state.teams.Allies.length || !state.teams.Enemies.length) break

    const currentAttacker = state.teams[state.moving][0]
    if (currentAttacker) doTurn(runtime, currentAttacker)
    moveDead(runtime, 'Allies')
    moveDead(runtime, 'Enemies')

    if (!state.teams.Allies.length || !state.teams.Enemies.length) break
    const extraTurn = currentAttacker?.flags.extraTurn
    if (currentAttacker) currentAttacker.flags.extraTurn = false
    if (!extraTurn) state.moving = OTHER_TEAM[state.moving]
  }

  const winner: BattleResult['winner'] = state.teams.Allies.length
    ? state.teams.Enemies.length ? 'Draw' : 'Allies'
    : state.teams.Enemies.length ? 'Enemies' : 'Draw'
  const unsupportedAbilities = [...state.unsupportedAbilities].sort()
  return {
    winner,
    turns: state.turn,
    state,
    unsupportedAbilities,
    trusted: unsupportedAbilities.length === 0,
  }
}

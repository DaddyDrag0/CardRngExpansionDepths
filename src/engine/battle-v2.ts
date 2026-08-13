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
import { getAttack, getHealth, getPower, rarityWithBorders } from './stats'
import { DEMON_CARDS, DRAGON_CARDS, IMP_BOOSTED_CARDS, RNG_ABILITIES, UNDEAD_CARDS } from './combat-data'

const OTHER_TEAM: Record<BattleTeam, BattleTeam> = { Allies: 'Enemies', Enemies: 'Allies' }

const FULLY_SUPPORTED = new Set([
  'Gathering', 'Remembrance', 'Am I Beautiful?', 'Persistent', 'Chimeric',
  'First Progenitor', 'Undead Practitioner', 'Big and Large', 'Patience', 'Blade',
  'Clawless', 'Catastrophe', 'Frail', 'Fight Dirty', 'Assassinate', 'Humanity\'s Spirit',
  'Infinite Dagger Works', 'Heart Legacy', 'Heavenly Might', 'Wail', 'Doom',
  'Favorable Odds', 'Combatant', 'Disarm', 'Explosion', 'Mind Rift', 'Evasion',
  'Armor', 'Puppy Eyes', 'Brittle', 'Mana Shield', 'Regenerate', 'Finesse',
  'Last Stand', 'Rage', 'Blinding Flash', 'Lifesteal', 'Undead', 'First Blood',
  'Berserk', 'Plunder', 'True Strike', 'Frigid Touch', 'Revive', 'Maelstrom',
  'Judgment', 'Self-Destruct', 'Super Strength', 'Eternity', 'Frozen Ashes',
  'Greater Might', 'Transcend Time', 'Cerberus', 'Sacrifice', 'Untouchable',
  'The Fall', 'Invincibility', 'Armageddon', 'Stardust Driver', 'Invisibility',
  'Divine Barrier', 'Quick Strike', 'Rapid Blows', 'Restoration', 'The Loser',
  'Eight Heads', 'Heavenly Ruler', 'Decapitate', 'Martial Will', 'Moonlight Beam',
  'Feeder', 'Absolute Sovereignty', 'Stalwart', 'Passion', 'Voracity', 'Vainglory',
  'Modesty', 'Decimate', 'Scale Armor', 'Draconic Heart', 'Prehistoric Wrath',
  'Hidden Curse', 'Perforating Mist', 'Turtle Shell', 'Snowbound', 'Shelter Obsession',
  'Fluffy Aggression', 'Speedy Progression', 'Behavioral Therapy', 'Red-Nosed Reindeer',
  'Sky Drop', 'Spikes', 'Shadow Predator', 'Apex Predator', 'Extinction', 'Aura Farm',
  'Mr. Piccolo', 'Sudden Demise', 'Hidden in the Depths',
  'Terror From Above', 'God of Thunder', 'All Father', 'Fire World', 'Into The Sun',
  'Eat The Moon', 'Dirty Claw', 'Death Embrace',
  'Blood Drinker', 'Drain Vitality', 'Fury of the White Tiger', 'Defraud',
  'Unforgiving', 'Grape Juice', 'Perfect Sacrifice', 'Guilt', 'Melt', 'Boiling Blood',
  'Run As Fast As You Can', 'Bind', 'Guerilla Warfare', 'Avalon', 'Reflective Shell',
  'Moonlight Beam', 'Firepower', 'Chainsaw',
  'Third Eye', 'Influence', 'Art of War', 'Dominate', 'Lightning Slash', 'True Fang',
  'Book of Death', 'Holy Wrath', 'Telekinesis', 'Unlucky', 'Dragon Slayer', 'Outrank',
  'Golden Bell Shield', 'Frozen Wrath', 'Immortal', 'Haste', 'Tonic', 'Destiny Sight',
  'Eternal Devotion', "Unpaid 'Interns'", 'Infectious',
  "Hell's Curse", 'Final Tail', "Reaper's Luck", 'Decay', 'Purifying Fire',
  'Sacrificial Tides', 'Rejuvenate', 'Twilight Sparkle', 'Viral Breath', 'Herbal Alchemy',
  'Revenge', 'Northern Winds', 'Azure Dragon Wrath', 'Stampede', 'Ice Age',
  'Jaws', 'Lightning Strike', 'Danger Sense', 'Defensive Maneuver', 'First Tail',
  'Grind', 'World Creation', 'Melancholy', 'The World', 'Accelerate', 'Black Flash',
  'Limitless', "Monkey King's Rage",
  'A Pair of Two', 'Final Stand', 'Heard but not Seen', 'Lights Way', 'Eclipse',
  'Friendship', 'Fusion... HA!', 'Divine Mist', 'Dark Qi Manipulation',
  'Immortal Ascension', 'Hard Boiled', 'Tyrannospirit', 'Absolute Apex', 'Last Meal',
  'Stolen Spotlight', 'Horned Attack', 'Creep', 'Protection of Gods', 'Upheaval',
  'Deadly Ambush',
])

const BENCH_AFFECTING_UNSUPPORTED = new Set([
  'Nightmare Melody', 'Water Shield of Xuanwu', 'Draconian', 'Mirror Image',
  'Beyond The Grave', 'Better Days', 'Playing God',
])

interface Runtime {
  state: BattleState
  rng: SeededRng
}

function definition(name: string) {
  return cards.find((card) => card.name === name)
}

function ability(card: CombatCard | undefined): string | null {
  return card?.definition.ability || null
}

function primaryBorder(card: CombatCard): '' | 'Platinum' | 'Crystal' | 'Ruby' | 'Galaxy' {
  if (card.borders.includes('Galaxy')) return 'Galaxy'
  if (card.borders.includes('Ruby')) return 'Ruby'
  if (card.borders.includes('Crystal')) return 'Crystal'
  if (card.borders.includes('Platinum')) return 'Platinum'
  return ''
}

function borderTier(card: CombatCard): number {
  const border = primaryBorder(card)
  return border === 'Galaxy' ? 30 : border === 'Ruby' ? 25 : border === 'Crystal' ? 20 : border === 'Platinum' ? 10 : 0
}

function alive(card: CombatCard | undefined): card is CombatCard {
  return Boolean(card && card.hp > 0 && !card.dead)
}

function boostStats(card: CombatCard, mult: number) {
  card.damage *= mult
  card.maxHp *= mult
  card.hp *= mult
}

function statusProtected(runtime: Runtime, team: BattleTeam): boolean {
  return runtime.state.teams[team].some((card) =>
    !card.dead && !card.flags.sealed && ability(card) === 'Protection of Gods'
  )
}

function clearStatuses(card: CombatCard) {
  card.status.stunned = 0
  card.status.confused = 0
  card.status.burn = 0
  card.status.weakness = false
  card.status.blind = false
  card.counters.bleed = 0
  card.counters.frostbite = 0
  card.counters.poisonFlat = 0
  card.counters.poisonPercent = 0
  card.counters.weaknessTurns = 0
}

function makePlayerCard(name: string, borders: CombatCard['borders'], index: number): CombatCard | null {
  const card = definition(name)
  if (!card) return null
  const power = getPower(card, borders)
  const hp = getHealth(card, borders)
  return {
    id: `Allies:${index}:${name}`,
    definition: card,
    team: 'Allies',
    index,
    borders: [...borders],
    power,
    hp,
    maxHp: hp,
    damage: getAttack(card, borders),
    entered: false,
    dead: false,
    boss: Boolean(card.boss),
    status: { stunned: 0, confused: 0, burn: 0, weakness: false, blind: false, shield: 0 },
    flags: {},
    counters: {},
  }
}

function makeEnemyCard(enemy: DepthsEnemy, index: number): CombatCard {
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

function cloneAtFraction(source: CombatCard, fraction: number, serial: number): CombatCard {
  return {
    ...source,
    id: `${source.team}:copy:${serial}:${source.definition.name}`,
    hp: source.hp * fraction,
    maxHp: source.maxHp * fraction,
    damage: source.damage * fraction,
    power: source.power * fraction,
    entered: false,
    dead: false,
    status: { stunned: 0, confused: 0, burn: 0, weakness: false, blind: false, shield: 0 },
    flags: {},
    counters: { normalDamage: source.damage * fraction },
  }
}

function noteUnsupported(state: BattleState, card: CombatCard | undefined) {
  const name = ability(card)
  if (name && !FULLY_SUPPORTED.has(name)) state.unsupportedAbilities.add(name)
}

function hasAbility(runtime: Runtime, card: CombatCard | undefined, name: string): boolean {
  if (!card || card.dead || card.flags.sealed || ability(card) !== name) return false
  const enemy = runtime.state.boosts[OTHER_TEAM[card.team]]
  if (enemy.endTimes && runtime.rng.next() < enemy.endTimes / 100) return false
  return true
}

function rand(runtime: Runtime, team: BattleTeam): number {
  const activeA = runtime.state.teams.Allies[0]
  const activeE = runtime.state.teams.Enemies[0]
  if (ability(activeA) === 'Unlucky' || ability(activeE) === 'Unlucky') return 0
  if (runtime.state.teams[team][0]?.flags.noRng) return 0
  let roll = runtime.rng.next()
  const fate = runtime.state.boosts[team].fate
  if (fate && runtime.rng.next() < fate / 100) roll = Math.max(roll, runtime.rng.next())
  return Math.min(1, roll)
}

function buildBoosts(loadout: TeamLoadout, state: BattleState): Record<BattleTeam, BattleBoosts> {
  const boosts: Record<BattleTeam, BattleBoosts> = { Allies: { fossils: 0 }, Enemies: { fossils: 0 } }
  const skill = buildSkillAuraBoosts(loadout.abilityAura)
  boosts.Allies = { fossils: 0, ...skill.boosts }
  if (skill.aura && !skill.implemented) state.unsupportedAbilities.add(`Aura: ${skill.aura.name}`)
  return boosts
}

function applyDeckPassives(team: CombatCard[]) {
  const moonZoo = team.filter((card) => card.definition.name === 'General Moon Zoo').length
  const julius = team.filter((card) => card.definition.name === 'Julius Leader').length
  const damageMult = (1 + moonZoo * 0.1) * (1 + julius * 0.2)
  if (damageMult !== 1) for (const card of team) card.damage *= damageMult
}

export function createBattleStateV2(loadout: TeamLoadout, enemies: DepthsEnemy[]): BattleState {
  const allies = loadout.cards
    .map((slot, index) => makePlayerCard(slot.cardName, slot.borders, index + 1))
    .filter((card): card is CombatCard => Boolean(card))
  const enemyCards = enemies.map((enemy, index) => makeEnemyCard(enemy, index + 1))

  const state: BattleState = {
    teams: { Allies: allies, Enemies: enemyCards },
    fallen: { Allies: [], Enemies: [] },
    boosts: { Allies: {}, Enemies: {} },
    turn: 0,
    moving: 'Allies',
    unsupportedAbilities: new Set<string>(),
  }

  applyDeckPassives(allies)
  applyDeckPassives(enemyCards)
  const stat = applyStatAura(allies, loadout.statAura)
  state.boosts = buildBoosts(loadout, state)
  if (stat.aura) {
    state.boosts.Allies.statAuraName = stat.aura.name
    state.boosts.Allies.statAuraValue = stat.value
  }

  for (const card of [...allies, ...enemyCards]) {
    card.counters.normalDamage = card.damage
    if (BENCH_AFFECTING_UNSUPPORTED.has(ability(card) || '')) noteUnsupported(state, card)
  }
  return state
}

function active(runtime: Runtime, team: BattleTeam) {
  return runtime.state.teams[team][0]
}

function performEntryAttack(runtime: Runtime, card: CombatCard, mult = 1, allEnemies = false) {
  const enemyTeam = OTHER_TEAM[card.team]
  const first = active(runtime, enemyTeam)
  if (!first || !alive(card)) return
  const dealt = dealDamage(runtime, card, first, mult)
  if (allEnemies && dealt > 0) {
    for (const target of runtime.state.teams[enemyTeam].slice(1)) target.hp -= Math.min(target.hp, dealt)
  }
  resolveDeaths(runtime)
}

function onEntry(runtime: Runtime, card: CombatCard) {
  if (card.entered || !alive(card)) return
  card.entered = true
  noteUnsupported(runtime.state, card)
  const enemyTeam = OTHER_TEAM[card.team]
  const enemy = active(runtime, enemyTeam)
  if (!enemy) return

  const name = ability(card)
  if (!name) return

  switch (name) {
    case 'Gathering': {
      const count = runtime.state.teams[card.team].length + runtime.state.fallen[card.team].length
      card.damage *= Math.pow(1.5, count)
      break
    }
    case 'Remembrance': {
      const count = runtime.state.fallen[card.team].length
      if (count) boostStats(card, Math.pow(1.5, count))
      break
    }
    case 'Friendship': {
      const unique = new Set(
        [...runtime.state.teams[card.team], ...runtime.state.fallen[card.team]]
          .filter((ally) => ability(ally) === 'Friendship')
          .map((ally) => ally.definition.name),
      ).size
      if (unique > 0) boostStats(card, 1 + unique * 0.4)
      break
    }
    case "Humanity's Spirit": {
      const count = runtime.state.fallen[card.team].length
      if (count) boostStats(card, Math.pow(1.5, count))
      break
    }
    case 'Perforating Mist': {
      const fallenDamage = runtime.state.fallen[card.team].reduce((sum, fallen) => sum + fallen.damage, 0)
      if (fallenDamage > 0) card.damage += fallenDamage
      break
    }
    case 'Mind Rift':
      if (card.damage > enemy.damage / 4) enemy.status.confused = 3
      break
    case 'Am I Beautiful?':
      enemy.status.confused = 2
      break
    case 'Fire World':
      for (const target of runtime.state.teams[enemyTeam]) target.status.burn = 100
      break
    case 'Book of Death':
      enemy.counters.death = 2
      break
    case 'Divine Mist':
      if (rand(runtime, card.team) < 0.7) {
        const hp = getHealth(enemy.definition, [])
        enemy.power = getPower(enemy.definition, [])
        enemy.damage = getAttack(enemy.definition, [])
        enemy.maxHp = hp
        enemy.hp = hp
      }
      break
    case 'Chimeric':
      boostStats(card, 4)
      break
    case 'Puppy Eyes':
      enemy.damage *= 0.85
      break
    case 'Catastrophe':
      enemy.damage *= 0.6
      break
    case 'Clawless':
      enemy.hp -= enemy.maxHp * 0.15
      break
    case 'Cerberus':
      enemy.damage *= 0.7
      break
    case 'Infectious':
      enemy.damage *= enemy.boss ? 0.85 : 0.5
      enemy.hp *= enemy.boss ? 0.85 : 0.5
      break
    case 'Dragon Slayer':
      card.damage *= 1.75
      break
    case 'Greater Might':
      boostStats(card, 1.4)
      break
    case 'Heavenly Might':
      boostStats(card, 1.65)
      break
    case 'Combatant':
      boostStats(card, 1.2)
      break
    case 'Sacrifice':
      card.damage *= 2
      card.hp /= 2
      break
    case 'Super Strength':
      card.damage *= 1.25
      card.maxHp *= 1.25
      card.hp = card.maxHp
      break
    case 'Immortal':
      card.maxHp *= 3.5
      card.hp *= 3.5
      break
    case 'Fury of the White Tiger':
      card.damage *= 3
      break
    case 'Tyrannospirit': {
      const fossils = runtime.state.boosts[card.team].fossils || 0
      if (fossils > 0) card.damage *= Math.pow(1.5, fossils)
      break
    }
    case 'Turtle Shell':
      card.maxHp = 30_000
      card.hp = 30_000
      break
    case 'Fluffy Aggression':
      card.damage *= 2
      break
    case 'Speedy Progression':
      card.counters.attacks = (card.counters.attacks || 0) + 3
      break
    case 'Red-Nosed Reindeer':
      if (!statusProtected(runtime, enemy.team)) enemy.status.blind = true
      break
    case 'Behavioral Therapy':
      enemy.flags.slowed = true
      enemy.counters.slowed = 0
      break
    case 'Stampede':
      card.counters.attacks = (card.counters.attacks || 0) + 1
      enemy.status.stunned = Math.max(1, enemy.status.stunned)
      break
    case 'Ice Age':
      enemy.flags.slowed = true
      enemy.counters.slowed = 0
      break
    case "Hell's Curse":
      enemy.flags.sealed = true
      enemy.hp /= 2
      break
    case 'Northern Winds': {
      dealDamage(runtime, card, enemy)
      card.damage += enemy.damage * 0.25
      enemy.damage *= 0.75
      resolveDeaths(runtime)
      if (alive(enemy) && hasAbility(runtime, enemy, 'Hatred') && alive(card)) {
        dealDamage(runtime, enemy, card, 0.5)
        resolveDeaths(runtime)
      }
      break
    }
    case 'Azure Dragon Wrath':
      dealDamage(runtime, card, enemy, 1.5, true)
      resolveDeaths(runtime)
      if (alive(enemy) && hasAbility(runtime, enemy, 'Hatred') && alive(card)) {
        dealDamage(runtime, enemy, card, 0.5)
        resolveDeaths(runtime)
      }
      break
    case 'Revenge':
      if (runtime.state.fallen[card.team].length > 0) {
        dealDamage(runtime, card, enemy, 2)
        resolveDeaths(runtime)
      }
      break
    case 'Stolen Spotlight': {
      const deck = runtime.state.teams[card.team]
      const behind = deck[1]
      if (behind && behind !== card) {
        card.damage += behind.damage
        card.maxHp += behind.maxHp
        card.hp += Math.max(0, behind.hp)
        deck.splice(1, 1)
        behind.dead = true
      }
      break
    }
    case 'A Pair of Two':
      if (!card.flags.paired) {
        card.flags.paired = true
        const deck = runtime.state.teams[card.team]
        deck.push(cloneAtFraction(card, 0.35, deck.length + 1))
        deck.push(cloneAtFraction(card, 0.35, deck.length + 1))
      }
      break
    case 'Terror From Above': {
      const deck = runtime.state.teams[enemyTeam]
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(runtime.rng.next() * (i + 1))
        ;[deck[i], deck[j]] = [deck[j], deck[i]]
      }
      break
    }
    case 'Sudden Demise': {
      const hits = 1 + Math.floor(runtime.rng.next() * 8)
      const hitDamage = card.damage * 0.1
      for (let hit = 0; hit < hits; hit++) {
        for (const target of runtime.state.teams[enemyTeam]) target.hp -= Math.min(target.hp, hitDamage)
      }
      resolveDeaths(runtime)
      break
    }
    case 'First Blood':
      performEntryAttack(runtime, card, 0.5)
      break
    case 'Deadly Ambush': {
      const first = active(runtime, enemyTeam)
      if (first) {
        dealDamage(runtime, card, first)
        const current = active(runtime, enemyTeam)
        if (current && !statusProtected(runtime, current.team)) current.counters.poisonPercent = -0.15
        resolveDeaths(runtime)
      }
      break
    }
    case 'Horned Attack': {
      const first = active(runtime, enemyTeam)
      if (first) {
        const hpBefore = first.hp
        const dealt = dealDamage(runtime, card, first)
        resolveDeaths(runtime)
        if (dealt > hpBefore && first.hp <= 0) {
          const next = active(runtime, enemyTeam)
          if (next) next.hp -= Math.min(next.hp, dealt - hpBefore)
          resolveDeaths(runtime)
        }
      }
      break
    }
    case 'Fight Dirty':
    case 'Quick Strike':
    case 'Heart Hunter':
      performEntryAttack(runtime, card, 1)
      if (name === 'Heart Hunter' && active(runtime, enemyTeam)) active(runtime, enemyTeam)!.counters.bleed = 100
      break
    case 'Stardust Driver':
      performEntryAttack(runtime, card, 2.5)
      break
  }
}

function offensive(runtime: Runtime, attacker: CombatCard, target: CombatCard, initial: number): { damage: number; bypass: boolean; special: boolean } {
  const name = ability(attacker)
  let damage = initial
  let bypass = false
  if (!name || !hasAbility(runtime, attacker, name)) return { damage, bypass, special: false }
  let special = false

  if ([
    'True Strike','Maelstrom','Judgment','Armageddon','Draconic Heart','Explosion','Telekinesis',
    'Favorable Odds','Vainglory','Modesty','Decapitate','Martial Will','Dominate','Decimate',
    'Prehistoric Wrath','Big and Large','Blade','Defraud','Assassinate','Sky Drop','Shadow Predator',
    'Apex Predator','Infinite Dagger Works','Extinction','God of Thunder','Fire World','Moonlight Beam',
    'Dirty Claw','Heart Hunter','Chainsaw','Firepower','Rapid Blows','Behavioral Therapy',
    'Holy Wrath','Unlucky','Dragon Slayer','Frozen Wrath','Absolute Apex',
    'Dark Qi Manipulation',
  ].includes(name)) special = true

  switch (name) {
    case 'True Strike': if (rand(runtime, attacker.team) > 0.5) damage *= 2; break
    case 'Absolute Apex': damage *= 1.5; break
    case 'Dark Qi Manipulation': if (attacker.flags.awakened) damage *= 2; break
    case "Monkey King's Rage":
      if (attacker.hp / attacker.maxHp <= 0.5 && !attacker.flags.transformed) {
        attacker.flags.transformed = true
        attacker.maxHp *= 2
        attacker.hp *= 2
        damage *= 2
      }
      break
    case "Reaper's Luck": {
      const changes = [-0.1, 0.15, 0.3]
      const roll = rand(runtime, attacker.team)
      const change = changes[Math.max(0, Math.min(2, Math.ceil(roll * 3) - 1))]
      const ratio = attacker.maxHp > 0 ? attacker.hp / attacker.maxHp : 0
      attacker.maxHp *= 1 + change
      attacker.hp = ratio * attacker.maxHp
      attacker.damage *= 1 + change
      break
    }
    case 'Holy Wrath': if (UNDEAD_CARDS.has(target.definition.name)) damage *= 2; break
    case 'Unlucky': if (target.definition.ability && RNG_ABILITIES.has(target.definition.ability)) damage *= 2; break
    case 'Maelstrom':
      attacker.counters.maelstrom = (attacker.counters.maelstrom || 0) % 2 + 1
      if (attacker.counters.maelstrom === 1) damage *= 2
      break
    case 'Judgment': damage += (attacker.maxHp - attacker.hp) * 0.7; break
    case 'Armageddon': if (rand(runtime, attacker.team) > 0.5) damage = Number.POSITIVE_INFINITY; break
    case 'Draconic Heart':
      damage *= 3
      attacker.damage *= 0.9
      attacker.hp *= 0.9
      attacker.maxHp *= 0.9
      break
    case 'Explosion': damage *= 3; attacker.status.stunned = Math.max(1, attacker.status.stunned); break
    case 'Telekinesis':
      attacker.counters.telekinesis = (attacker.counters.telekinesis || 0) % 2 + 1
      damage *= attacker.counters.telekinesis === 1 ? 2 : 4
      break
    case 'Dragon Slayer': if (DRAGON_CARDS.has(target.definition.name)) damage *= 2; break
    case 'Frozen Wrath': target.counters.frostbite = 1; break
    case 'Favorable Odds': damage *= Math.max(1, Math.ceil(rand(runtime, attacker.team) * 5)); break
    case 'Vainglory': if (attacker.hp / attacker.maxHp > 0.5) damage *= 1.5; break
    case 'Modesty': damage *= 0.7; break
    case 'Decapitate': damage *= 2; break
    case 'Martial Will': {
      const ah = attacker.counters.martialHits || 0
      const th = target.counters.martialHits || 0
      if (ah > 0 && th > 0) damage *= Math.pow(1.5, ah)
      else if (ah === 0 && th > 0) target.counters.martialHits = 0
      attacker.counters.martialHits = ah + 1
      target.counters.martialHits = (target.counters.martialHits || 0) + 1
      break
    }
    case 'Decimate': damage *= 3; attacker.damage *= 0.7; break
    case 'Prehistoric Wrath': if (target.hp / target.maxHp <= 0.5) damage *= 2; break
    case 'Big and Large': if (attacker.hp / attacker.maxHp > 0.25) damage *= 3; break
    case 'Blade':
      damage += attacker.maxHp * 0.15
      attacker.maxHp *= 0.85
      attacker.hp = Math.min(attacker.hp, attacker.maxHp)
      break
    case 'Defraud': damage = target.hp * 0.5; break
    case 'Assassinate': if (target.hp / target.maxHp <= 0.25) damage = target.maxHp; break
    case 'Sky Drop': damage *= 1.5; break
    case 'Shadow Predator':
      if (attacker.flags.double) { damage *= 2; attacker.flags.double = false }
      break
    case 'Apex Predator': damage *= 1.5; break
    case 'Infinite Dagger Works': damage *= 2; break
    case 'Extinction': damage *= 10; attacker.hp = 0; break
    case 'God of Thunder':
      attacker.counters.thunder = (attacker.counters.thunder || 0) % 2 + 1
      if (attacker.counters.thunder === 1) damage *= 2.5
      bypass = true
      break
    case 'Fire World':
      attacker.counters.fireWorld = (attacker.counters.fireWorld || 0) % 2 + 1
      if (attacker.counters.fireWorld === 1) damage *= 4
      break
    case 'Moonlight Beam':
      if (!attacker.flags.moonlightUsed) { attacker.flags.moonlightUsed = true; damage *= 5 }
      break
    case 'Dirty Claw':
      target.counters.poisonPercent = -0.15
      target.status.weakness = true
      target.counters.weaknessTurns = 100
      break
    case 'Undead Practitioner': target.counters.bleed = 100; break
    case 'Heart Hunter': if ((target.counters.bleed || 0) > 0) damage *= 3; break
    case 'Chainsaw': damage *= 0.5; break
    case 'Firepower': damage *= 0.25; break
    case 'Rapid Blows': damage *= 0.5; break
    case 'Speedy Progression': damage /= 3; break
    case 'Behavioral Therapy': target.counters.bleed = (target.counters.bleed || 0) + 1; break
  }

  if (name === 'Dominate' && borderTier(attacker) > borderTier(target)) damage *= 2
  if (name === 'Lightning Slash') { damage *= 1.5; bypass = true }
  if (name === 'Limitless' || name === 'True Fang') bypass = true
  return { damage, bypass, special }
}

function defensive(runtime: Runtime, attacker: CombatCard, target: CombatCard, initial: number): number {
  const name = ability(target)
  let damage = initial
  if (!name || !hasAbility(runtime, target, name)) return damage

  switch (name) {
    case 'Danger Sense':
    case 'Deadly Ambush':
      if (!target.flags.dangerSense && damage > target.hp) {
        target.flags.dangerSense = true
        damage = 0
        const deck = runtime.state.teams[target.team]
        const index = deck.indexOf(target)
        if (index >= 0 && deck[index + 1]) {
          deck[index] = deck[index + 1]
          deck[index + 1] = target
        }
      }
      break
    case 'Evasion': if (rand(runtime, target.team) > 0.9) damage = 0; break
    case 'Finesse': if (damage < target.maxHp * 0.3) damage = 0; break
    case 'Last Stand':
      if (damage >= target.hp && !target.flags.lastStand) { damage = target.hp - 1; target.flags.lastStand = true }
      break
    case 'Armor': damage = Math.max(0, damage - target.maxHp * 0.1); break
    case 'Dragon Slayer': if (DRAGON_CARDS.has(attacker.definition.name)) damage *= 0.5; break
    case 'Outrank':
      if (rarityWithBorders(attacker.definition, attacker.borders) < rarityWithBorders(target.definition, target.borders)) damage *= 0.5
      break
    case 'Golden Bell Shield': if (DEMON_CARDS.has(attacker.definition.name) || IMP_BOOSTED_CARDS.has(attacker.definition.name)) damage /= 3; break
    case 'Frozen Wrath': if ((attacker.counters.frostbite || 0) > 0) damage *= 0.5; break
    case 'Brittle': damage *= 2; break
    case 'Mana Shield':
      if (!target.flags.manaShield && damage < target.hp) { damage = 0; target.flags.manaShield = true }
      break
    case 'Vainglory': if (target.hp / target.maxHp > 0.5) damage *= 0.7; break
    case 'Modesty': damage *= 1.3; break
    case 'Scale Armor': damage = Math.max(0, damage - target.maxHp * 0.15) / 2; break
    case 'Stalwart': if (damage > target.maxHp / 3 && target.hp > target.maxHp / 3) damage = target.maxHp / 3; break
    case 'Divine Barrier':
      if (!target.flags.divineBarrier) { damage = 0; target.flags.divineBarrier = true }
      break
    case 'Untouchable': if (rand(runtime, target.team) > Math.pow(damage / target.maxHp, 2)) damage = 0; break
    case 'Guerilla Warfare':
      if (rand(runtime, target.team) > 0.6) { damage = 0; target.damage *= 1.2 }
      break
    case 'The Loser':
      if (!target.flags.loser && damage > target.hp) { damage = 0; target.flags.loser = true; target.damage *= 2 }
      break
    case 'Invisibility': if (rand(runtime, target.team) > 0.4) damage = 0; break
    case 'Limitless':
      if (!target.flags.limitless) { damage = 0; target.flags.limitless = true }
      break
    case 'Heavenly Ruler':
      target.counters.heavenly = ((target.counters.heavenly || 0) + 1) % 2
      if (target.counters.heavenly === 0) damage *= -0.8
      break
    case 'Absolute Sovereignty': damage *= 0.65; break
    case 'Draconic Heart': damage /= 3; break
    case 'Invincibility': damage *= 0.25; break
    case 'Hidden Curse': {
      const maxes = target.counters.hiddenCurse || 0
      const afflicted = attacker.status.weakness || attacker.status.burn > 0 || attacker.status.confused > 0 || attacker.status.stunned > 0 || attacker.status.blind || (attacker.counters.bleed || 0) > 0 || Boolean(attacker.counters.poisonFlat || attacker.counters.poisonPercent)
      if (maxes <= 5 && afflicted) { damage = 0; target.counters.hiddenCurse = maxes + 1 }
      break
    }
    case 'Transcend Time':
      target.counters.transcend = ((target.counters.transcend || 0) + 1) % 2
      if (target.counters.transcend === 1) damage = 0
      break
    case 'Snowbound': if (target.status.stunned > 0 || target.flags.dodge) { damage = 0; target.flags.dodge = false }; break
    case 'Shelter Obsession': {
      const cap = target.flags.awakened ? target.maxHp / 4 : target.maxHp / 2
      if (damage > cap && target.hp > cap) damage = cap
      break
    }
    case 'Big and Large': if (target.hp / target.maxHp > 0.25) damage *= 0.5; break
    case 'Frail': damage *= 2; break
    case "Humanity's Spirit": if (target.hp / target.maxHp < 0.25) damage *= 0.5; break
    case 'Perforating Mist': damage *= 1.5; break
    case 'Reflective Shell': {
      const abilityDamage = damage - attacker.damage
      if (abilityDamage > 0) {
        const reflected = Math.min(target.damage * 8, abilityDamage * 0.25)
        damage -= reflected
        attacker.hp -= reflected
      }
      break
    }
    case 'Sky Drop':
      if (!target.counters.drop || target.counters.drop % 2 !== 0) damage = 0
      break
    case 'Spikes': damage *= 0.75; attacker.counters.bleed = 2; break
    case 'Shadow Predator':
      if (rand(runtime, target.team) > 0.6) { damage = 0; target.flags.double = true }
      break
    case 'Apex Predator': damage *= 0.5; break
    case 'Absolute Apex': damage *= 0.5; break
    case 'Immortal Ascension': if (target.flags.awakened) damage *= 0.5; break
    case 'Final Tail': damage = 0; break
    case 'Persistent': {
      const persistence = target.counters.persistence || 0
      if (damage >= target.hp && persistence < 2) {
        damage = target.hp - 1
        target.counters.persistence = persistence + 1
      }
      break
    }
    case 'Run As Fast As You Can':
      target.counters.runFast = ((target.counters.runFast || 0) + 1) % 2
      if (target.counters.runFast === 0) {
        damage = 0
        target.counters.attacks = (target.counters.attacks || 0) + 1
      }
      break
    case 'Bind': attacker.damage *= 0.9; break
    case 'Avalon': if (damage < target.damage * 0.75) damage = 0; break
    case 'Heard but not Seen': {
      const dodge = Math.min(0.5, 0.2 + (target.counters.heardHits || 0) * 0.1)
      if (rand(runtime, target.team) < dodge) damage = 0
      else target.counters.heardHits = (target.counters.heardHits || 0) + 1
      break
    }
    case 'Lights Way':
      if (!target.flags.lightsWay && damage >= target.hp) {
        target.flags.lightsWay = true
        damage = 0
        target.hp = Math.min(target.maxHp, target.hp + target.maxHp * 0.5)
      }
      break
  }

  if (name === 'Dominate' && borderTier(target) > borderTier(attacker)) damage /= 2
  return damage
}

function tryRevive(runtime: Runtime, attacker: CombatCard, target: CombatCard): boolean {
  if (target.hp > 0) return false
  const name = ability(target)
  if (!name) return false
  if (name === 'Revive' && !target.flags.revived && rand(runtime, target.team) > 0.5) {
    target.flags.revived = true; target.hp = target.maxHp * 0.5; return true
  }
  if (name === 'Eternity' && !target.flags.revived && rand(runtime, target.team) > 0.5) {
    target.flags.revived = true; target.hp = target.maxHp; return true
  }
  if (name === 'Frozen Ashes' && !target.flags.revived && rand(runtime, target.team) > 0.5) {
    target.flags.revived = true; target.hp = target.maxHp; attacker.status.stunned = Math.max(1, attacker.status.stunned); return true
  }
  if (name === "Unpaid 'Interns'" && (target.counters.interns || 0) < 2) {
    target.counters.interns = (target.counters.interns || 0) + 1; target.hp = target.maxHp; return true
  }
  if (name === 'Flames of Rebirth' && !target.flags.revived) {
    target.flags.revived = true; target.hp = target.maxHp * 0.5; target.damage *= 2; attacker.status.burn = 2; return true
  }
  return false
}

function targetRetro(runtime: Runtime, attacker: CombatCard, target: CombatCard, damage: number) {
  const name = ability(target)
  if (!name || !hasAbility(runtime, target, name)) return
  switch (name) {
    case 'Restoration': if (target.hp > 0) target.hp += damage * 0.7; break
    case 'Rage': if (target.hp > 0) target.damage *= 1.25; break
    case 'Undead': if (target.hp > 0) target.hp = Math.min(target.maxHp, target.hp + target.maxHp * 0.25); break
    case 'Passion':
      attacker.counters.passion = (attacker.counters.passion || 0) + 1
      if (attacker.counters.passion <= 3) attacker.damage *= 0.65
      break
    case 'Eight Heads': target.damage *= 0.875; target.hp *= 0.875; break
    case 'Wail':
      if (target.hp < target.maxHp / 2 && !target.flags.wail) { target.flags.wail = true; attacker.status.stunned = Math.max(1, attacker.status.stunned) }
      break
    case 'Fury of the White Tiger': target.damage = Math.max(0, target.damage - damage); break
    case 'The Fall': {
      const reflected = attacker.definition.name === 'Marrowclaw' ? Math.min(Math.max(0, attacker.hp - 1), damage) : Math.min(attacker.hp, damage)
      attacker.hp -= reflected
      break
    }
    case 'Self-Destruct':
    case 'Death Embrace':
      if (target.hp <= 0 && rand(runtime, target.team) > 0.5) {
        const reflected = attacker.definition.name === 'Marrowclaw' ? Math.min(Math.max(0, attacker.hp - 1), target.maxHp) : Math.min(attacker.hp, target.maxHp)
        attacker.hp -= reflected
      }
      break
    case 'Undead Practitioner':
      if (target.hp > 0 && !target.flags.undeadPractitioner && target.hp <= target.maxHp / 2) {
        target.hp += target.maxHp * 0.5; target.flags.undeadPractitioner = true
      }
      break
    case 'Guilt': if (target.hp <= 0) attacker.flags.hanged = true; break
    case 'Into The Sun': if (target.hp / target.maxHp < 0.33) { target.hp = 0; attacker.hp = 0 }; break
    case 'Frigid Touch': if (damage > 0 && rand(runtime, attacker.team) >= 0.5) target.status.stunned = Math.max(1, target.status.stunned); break
    case 'Blinding Flash': if (rand(runtime, attacker.team) > 0.7) attacker.flags.extraTurn = true; break
    case 'Grape Juice': {
      const reflected = attacker.definition.name === 'Marrowclaw' ? Math.min(Math.max(0, attacker.hp - 1), target.damage / 2) : Math.min(attacker.hp, target.damage / 2)
      attacker.hp -= reflected
      break
    }
    case 'Perfect Sacrifice':
      if (target.hp <= 0) {
        const reflected = attacker.definition.name === 'Marrowclaw' ? Math.min(Math.max(0, attacker.hp - 1), target.maxHp) : Math.min(attacker.hp, target.maxHp)
        attacker.hp -= reflected
        for (const ally of runtime.state.teams[target.team]) boostStats(ally, 1.2)
      }
      break
    case 'Last Meal':
      if (damage > 0) {
        const fossils = runtime.state.boosts[target.team].fossils || 0
        attacker.counters.death = Math.max(2, 5 - fossils)
      }
      break
    case 'Boiling Blood': if (!statusProtected(runtime, attacker.team)) attacker.status.burn = 3; break
    case 'Melt': if (!statusProtected(runtime, attacker.team)) attacker.status.burn += 5; break
  }
}

function lifestealFraction(runtime: Runtime, attacker: CombatCard, base: number): number {
  const vamp = runtime.state.boosts[attacker.team].vampireMatron
  return vamp ? base * (100 + vamp * 5) / 100 : base
}

function attackerRetro(runtime: Runtime, attacker: CombatCard, target: CombatCard, damage: number): boolean {
  const name = ability(attacker)
  let didRegen = false
  if (!name || !hasAbility(runtime, attacker, name)) return didRegen
  switch (name) {
    case 'Regenerate': attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.2); didRegen = true; break
    case 'Plunder':
      if (target.hp <= 0 && target !== attacker) {
        attacker.damage += target.damage * 0.3; attacker.maxHp += target.maxHp * 0.3; attacker.hp += target.maxHp * 0.3
      }
      break
    case 'Voracity': if (target.hp <= 0) { attacker.damage *= 1.2; attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.2) }; break
    case 'Blood Drinker':
    case 'Lifesteal': {
      const heal = damage * lifestealFraction(runtime, attacker, 0.5)
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal); didRegen = true; break
    }
    case 'Drain Vitality': {
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + damage * lifestealFraction(runtime, attacker, 1)); didRegen = true
      const stolen = Math.min(target.damage, damage); attacker.damage += stolen; target.damage -= stolen; break
    }
    case 'Unholy Creature': if (!statusProtected(runtime, target.team)) target.counters.poisonPercent = -0.15; break
    case 'Eclipse': if (damage > 0) target.flags.sealed = true; break
    case 'Dark Qi Manipulation':
      if (attacker.flags.awakened) {
        attacker.hp = Math.min(attacker.maxHp, attacker.hp + damage * 0.3)
        didRegen = true
        if (target.hp <= 0) boostStats(attacker, 1.5)
      }
      break
    case 'Immortal Ascension':
      if (attacker.flags.awakened && target.hp <= 0) boostStats(attacker, 1.5)
      break
    case 'Doom': if (target.hp > 0 && rand(runtime, attacker.team) > 1 - damage / target.hp) { target.hp = 0; target.flags.sealed = true }; break
    case 'Decapitate':
      if (target.hp <= 0) { boostStats(attacker, 1.2); attacker.flags.extraTurn = true }
      break
    case 'Fury of the White Tiger': if (target.hp <= 0) { attacker.damage *= 1.35; attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.35) }; break
    case 'Feeder': if (target.hp <= 0) attacker.hp = attacker.maxHp; break
    case 'Defraud': attacker.hp -= attacker.maxHp / 4; break
    case 'Fight Dirty': target.damage = Math.floor(target.damage * 0.7); break
    case 'Unforgiving': target.maxHp = Math.max(1, target.maxHp - damage); target.hp = Math.min(target.hp, target.maxHp); break
    case 'Eat The Moon': if (target.hp / target.maxHp < 0.33) target.hp = 0; break
    case 'Death Embrace': if (target.hp > 0 && rand(runtime, attacker.team) > 1 - damage / target.hp) target.hp = 0; break
    case 'Prehistoric Wrath': if (target.hp <= 0) attacker.damage *= 2; break
  }
  return didRegen
}

function resolveAuraFarm(runtime: Runtime, target: CombatCard, incoming: number): { target: CombatCard; damage: number } {
  if (incoming < target.hp) return { target, damage: incoming }
  const deck = runtime.state.teams[target.team]
  const piccolo = deck[1]
  if (!piccolo || piccolo.definition.name !== 'Piccolo' || piccolo.flags.farmed) return { target, damage: incoming }
  piccolo.flags.farmed = true
  deck[0] = piccolo
  deck[1] = target
  boostStats(piccolo, 2)
  if (target.definition.name === 'Kid Gohan') boostStats(piccolo, 1.5)
  return { target: piccolo, damage: 0 }
}

function dealDamage(runtime: Runtime, attacker: CombatCard, originalTarget: CombatCard, mult = 1, bypass = false): number {
  let target = originalTarget
  if (attacker.status.confused > 0 && runtime.rng.next() < 0.5) target = attacker
  if (attacker.status.confused > 0) attacker.status.confused -= 1

  let damage = attacker.damage * mult
  if (hasAbility(runtime, attacker, 'Jaws')) damage += target.damage
  if (attacker.status.burn > 0) damage *= 0.85
  const off = offensive(runtime, attacker, target, damage)
  damage = off.damage
  bypass = bypass || off.bypass

  if (attacker.status.blind && rand(runtime, attacker.team) > 0.4) damage = 0

  if (!off.special && hasAbility(runtime, target, 'All Father') && damage > 0) {
    damage = 0
    target.hp -= target.maxHp / 5
  }

  if (statusProtected(runtime, target.team)) clearStatuses(target)
  if (target.status.weakness) damage *= 1.3

  if (!bypass && target.flags.eternalDevotion) { target.flags.eternalDevotion = false; damage = 0 }
  else if (!bypass && target.flags.dodgeLethal) { target.flags.dodgeLethal = false; damage = 0 }
  else if (!bypass) damage = defensive(runtime, attacker, target, damage)

  const shielder = runtime.state.boosts[target.team].shielder
  if (shielder) damage *= (100 - shielder) / 100

  let threshold = runtime.state.boosts[target.team].synthHuman
  if (threshold && target.definition.weather === 'Time Storm') threshold *= 1.5
  if (threshold && damage < target.maxHp * threshold / 100) damage = 0

  if (target.status.shield > 0 && damage > 0) { target.status.shield -= 1; damage = 0 }
  if (damage < 0) damage = Math.max(-(target.maxHp - target.hp), damage)
  damage = Number.isFinite(damage) ? Math.ceil(damage) : target.hp

  const farm = resolveAuraFarm(runtime, target, damage)
  target = farm.target
  damage = farm.damage
  target.hp -= Math.min(target.hp, damage)

  if (hasAbility(runtime, active(runtime, OTHER_TEAM[attacker.team]), 'Am I Beautiful?')) {
    if (target.team === attacker.team) target.damage *= 0.8
    else target.status.confused += 1
  }

  if ((hasAbility(runtime, target, 'Meow') || hasAbility(runtime, target, 'Never Forgotten')) && damage > 0) {
    target.counters.damageTaken = Math.min(target.maxHp, (target.counters.damageTaken || 0) + damage)
  }

  if (hasAbility(runtime, attacker, 'Disarm') && damage > 0) target.damage = Math.max(0, target.damage - damage * 0.4)

  const flame = runtime.state.boosts[attacker.team].flameWizard
  if (!statusProtected(runtime, target.team) && flame && damage > 0 && runtime.rng.next() * 100 < flame) target.status.burn = 2
  const phantom = runtime.state.boosts[attacker.team].phantom
  if (!statusProtected(runtime, target.team) && phantom && damage > 0 && runtime.rng.next() * 100 < phantom) target.status.stunned = Math.max(1, target.status.stunned)

  if (hasAbility(runtime, target, 'Chimeric') && target.hp > 0 && target.hp <= target.maxHp / 2 && !target.flags.chimericFaded) {
    target.flags.chimericFaded = true
    target.maxHp /= 4; target.hp /= 4; target.damage /= 4
  }

  targetRetro(runtime, attacker, target, damage)
  const didRegen = attackerRetro(runtime, attacker, target, damage)

  const vamp = runtime.state.boosts[attacker.team].vampireMatron
  if (damage > 0 && vamp && !didRegen && alive(attacker)) {
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + damage * vamp / 100)
  }

  if (target.hp <= 0) tryRevive(runtime, attacker, target)

  if (hasAbility(runtime, attacker, 'Infinite Dagger Works') && rand(runtime, attacker.team) > 0.5) attacker.flags.extraTurn = true
  return damage
}

function applyOnDeath(runtime: Runtime, dead: CombatCard, opponent: CombatCard | undefined) {
  const team = dead.team
  const deck = runtime.state.teams[team]
  const next = deck[0]
  const name = ability(dead)

  if (name === 'Hard Boiled') runtime.state.boosts[team].fossils = (runtime.state.boosts[team].fossils || 0) + 3
  if (name === 'Extinction') runtime.state.boosts[team].fossils = (runtime.state.boosts[team].fossils || 0) + 2

  if (opponent && alive(opponent) && hasAbility(runtime, opponent, 'Prehistoric Wrath')) opponent.damage *= 2
  if (opponent && alive(opponent) && hasAbility(runtime, opponent, 'All Father')) for (const card of runtime.state.teams[opponent.team]) boostStats(card, 1.25)

  if (!next || !name) return
  if (name === 'Blessing') { next.damage += dead.damage / 2; next.maxHp += dead.maxHp / 2; next.hp += dead.maxHp / 2 }
  if (name === 'Heart Legacy') { next.maxHp += dead.maxHp; next.hp += dead.maxHp }
  if (name === 'Tonic') boostStats(next, 1.2)
  if (name === 'Fusion... HA!' && rand(runtime, team) > 0.5) {
    next.damage += dead.damage * 0.5
    next.maxHp += dead.maxHp * 0.5
    next.hp += dead.maxHp * 0.5
  }
  if (name === 'Destiny Sight') next.flags.dodgeLethal = true
  if (name === 'Housewife\'s Blessing') { boostStats(next, 2); next.status.stunned = 2 }
  if (name === 'Eternal Devotion') next.flags.eternalDevotion = true
  if (name === 'Final Stand') {
    next.damage += dead.damage * 0.25
    next.maxHp += dead.maxHp * 0.25
    next.hp += dead.maxHp * 0.25
    next.status.shield += 1
  }
}

function resolveDeaths(runtime: Runtime) {
  let changed = true
  while (changed) {
    changed = false
    for (const team of ['Allies', 'Enemies'] as BattleTeam[]) {
      const deck = runtime.state.teams[team]
      const card = deck[0]
      if (!card || card.hp > 0) continue

      if (hasAbility(runtime, card, 'Paradox') && !card.flags.paradox) {
        card.flags.paradox = true
        card.hp = 1
        const opp = active(runtime, OTHER_TEAM[team])
        if (opp) opp.hp = 0
        changed = true
        continue
      }

      deck.shift()
      card.hp = 0
      card.dead = true
      runtime.state.fallen[team].push(card)
      const opponent = active(runtime, OTHER_TEAM[team])
      applyOnDeath(runtime, card, opponent)
      changed = true
    }
  }
}

function statusStart(runtime: Runtime, attacker: CombatCard, target: CombatCard) {
  if (statusProtected(runtime, attacker.team)) clearStatuses(attacker)
  if (hasAbility(runtime, target, 'Lightning Strike') && alive(target) && alive(attacker)) {
    dealDamage(runtime, target, attacker, 0.75)
  }
  const poisonPercent = attacker.counters.poisonPercent || 0
  const poisonFlat = attacker.counters.poisonFlat || 0
  if (poisonPercent) attacker.hp = Math.max(0, attacker.hp + poisonPercent * attacker.maxHp)
  else if (poisonFlat) attacker.hp = Math.max(0, attacker.hp - poisonFlat)

  if (attacker.flags.hanged) attacker.hp -= attacker.maxHp * 0.25

  if (hasAbility(runtime, target, 'Decay')) attacker.damage *= 0.75
  if (hasAbility(runtime, target, 'Starvation')) boostStats(attacker, 0.75)
  if (hasAbility(runtime, target, 'Purifying Fire')) attacker.hp *= 0.7
  if (hasAbility(runtime, attacker, 'Sacrificial Tides')) target.hp -= target.maxHp * 0.2
}

function statusEnd(runtime: Runtime, attacker: CombatCard) {
  if (statusProtected(runtime, attacker.team)) {
    clearStatuses(attacker)
    return
  }
  if (attacker.status.burn > 0) {
    attacker.hp -= attacker.maxHp * 0.1
    attacker.status.burn -= 1
  }
  if ((attacker.counters.bleed || 0) > 0) {
    attacker.hp -= attacker.maxHp * 0.15
    attacker.counters.bleed -= 1
  }
  if ((attacker.counters.frostbite || 0) > 0) {
    attacker.counters.frostbite -= 1
    if (runtime.rng.next() <= 0.5) {
      attacker.status.stunned = Math.max(1, attacker.status.stunned)
      attacker.hp -= attacker.maxHp * 0.2
    }
  }
  if ((attacker.counters.death || 0) > 0 && ability(attacker) !== 'Erosion') {
    attacker.counters.death -= 1
    if (attacker.counters.death <= 0) attacker.hp = 0
  }
  if (ability(attacker) === 'Final Tail') {
    attacker.counters.finalTail = (attacker.counters.finalTail || 0) + 1
    if (attacker.counters.finalTail >= 3) attacker.hp = 0
  }
  if (attacker.status.weakness && (attacker.counters.weaknessTurns || 0) > 0) {
    attacker.counters.weaknessTurns -= 1
    if (attacker.counters.weaknessTurns <= 0) attacker.status.weakness = false
  }
}

function prepareTurn(runtime: Runtime, attacker: CombatCard) {
  if (hasAbility(runtime, attacker, 'Dark Qi Manipulation') && !attacker.flags.awakened) {
    attacker.counters.ascension = (attacker.counters.ascension || 0) + 1
    if (attacker.counters.ascension <= 2) boostStats(attacker, 1.3)
    else attacker.flags.awakened = true
  }
  if (hasAbility(runtime, attacker, 'Immortal Ascension') && !attacker.flags.awakened) {
    attacker.counters.ascension = (attacker.counters.ascension || 0) + 1
    if (attacker.counters.ascension <= 2) boostStats(attacker, 1.3)
    else attacker.flags.awakened = true
  }
  if (hasAbility(runtime, attacker, 'Upheaval')) {
    attacker.counters.upheaval = (attacker.counters.upheaval || 0) + 1
    if (attacker.counters.upheaval % 3 == 0) {
      attacker.damage *= 2
      const target = active(runtime, OTHER_TEAM[attacker.team])
      if (target && !statusProtected(runtime, target.team)) target.status.stunned = Math.max(1, target.status.stunned)
    }
  }
  if (hasAbility(runtime, attacker, 'First Tail') && (attacker.counters.tail || 0) < 9) {
    attacker.counters.tail = (attacker.counters.tail || 0) + 1
    boostStats(attacker, 1.2)
  }
  if (hasAbility(runtime, attacker, 'Grind')) {
    attacker.counters.grind = (attacker.counters.grind || 0) + 1
    if (attacker.counters.grind <= 5) boostStats(attacker, 1.1)
  }
  if (hasAbility(runtime, attacker, 'Patience')) boostStats(attacker, 1.3)
  if (hasAbility(runtime, attacker, 'Absolute Sovereignty')) for (const card of runtime.state.teams[attacker.team]) boostStats(card, 1.1)
  if (hasAbility(runtime, attacker, 'World Creation')) {
    attacker.counters.worldCreation = (attacker.counters.worldCreation || 0) + 1
    if (attacker.counters.worldCreation % 3 === 0) boostStats(attacker, 2)
  }
  if (hasAbility(runtime, attacker, 'Persistent')) {
    const normal = attacker.counters.normalDamage || attacker.damage
    if (attacker.damage < normal) attacker.damage = normal
  }
  if (hasAbility(runtime, attacker, 'Sky Drop')) attacker.counters.drop = (attacker.counters.drop || 0) + 1
  if (hasAbility(runtime, attacker, 'Snowbound')) {
    attacker.counters.snowbound = (attacker.counters.snowbound || 0) + 1
    if (attacker.counters.snowbound % 2 === 0) attacker.status.stunned = Math.max(1, attacker.status.stunned)
  }
  if (hasAbility(runtime, attacker, 'Defensive Maneuver')) {
    attacker.counters.defensiveManeuver = (attacker.counters.defensiveManeuver || 0) + 1
    if (attacker.counters.defensiveManeuver % 2 === 0) attacker.status.shield += 1
  }
}

function beforeAttack(runtime: Runtime, attacker: CombatCard) {
  const target = active(runtime, OTHER_TEAM[attacker.team])
  if (hasAbility(runtime, attacker, 'Rejuvenate')) attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.35)
  if (hasAbility(runtime, attacker, 'First Progenitor')) attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.1)
  if (hasAbility(runtime, attacker, 'Twilight Sparkle') && rand(runtime, attacker.team) > 0.6) attacker.hp = attacker.maxHp
  if (target && hasAbility(runtime, attacker, 'Viral Breath')) target.hp -= target.maxHp * 0.25
  if (hasAbility(runtime, attacker, 'Herbal Alchemy')) {
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.2)
    if (rand(runtime, attacker.team) > 0.5) attacker.damage *= 1.3
  }
  if (hasAbility(runtime, attacker, 'Combatant')) attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.1)
}

function attackCount(attacker: CombatCard): { count: number; mult: number } {
  const name = ability(attacker)
  const bonus = attacker.counters.attacks || 0
  if (name === 'Rapid Blows') return { count: 3 + bonus, mult: 1 }
  if (name === 'Chainsaw') return { count: 8 + bonus, mult: 1 }
  if (name === 'Firepower') return { count: 5 + bonus, mult: 1 }
  if (name === 'Behavioral Therapy') return { count: 2 + bonus, mult: 1 }
  return { count: 1 + bonus, mult: 1 }
}

function canNormalAttack(attacker: CombatCard): boolean {
  const name = ability(attacker)
  if (name === 'Meow' || name === 'Never Forgotten') return false
  if (name === 'Sky Drop') return Boolean(attacker.counters.drop && attacker.counters.drop % 2 === 0)
  return true
}

function doTurn(runtime: Runtime, attacker: CombatCard) {
  const enemyTeam = OTHER_TEAM[attacker.team]
  let target = active(runtime, enemyTeam)
  if (!target || !alive(attacker)) return

  prepareTurn(runtime, attacker)
  statusStart(runtime, attacker, target)
  resolveDeaths(runtime)
  if (!alive(attacker)) return
  target = active(runtime, enemyTeam)
  if (!target) return

  beforeAttack(runtime, attacker)

  if (canNormalAttack(attacker)) {
    const { count } = attackCount(attacker)
    for (let i = 0; i < count; i++) {
      target = active(runtime, enemyTeam)
      if (!target || !alive(attacker)) break
      dealDamage(runtime, attacker, target)
      if (hasAbility(runtime, attacker, 'Black Flash') && alive(attacker) && target.hp > 0) {
        dealDamage(runtime, attacker, target, 0.5, true)
      }
      resolveDeaths(runtime)
    }
  }

  const creepTarget = active(runtime, enemyTeam)
  if (creepTarget && alive(attacker)) {
    for (const creep of runtime.state.teams[attacker.team].slice(1)) {
      if (hasAbility(runtime, creep, 'Creep') && alive(creep) && active(runtime, enemyTeam)) {
        dealDamage(runtime, creep, active(runtime, enemyTeam)!, 0.25)
        resolveDeaths(runtime)
      }
    }
  }

  const currentTarget = active(runtime, enemyTeam)
  if (currentTarget && alive(currentTarget) && alive(attacker)) {
    const berserker = runtime.state.boosts[currentTarget.team].berserker
    const shouldCounter = (berserker && runtime.rng.next() * 100 < berserker)
      || hasAbility(runtime, currentTarget, 'Hatred')
      || hasAbility(runtime, currentTarget, 'Perseverance')
      || hasAbility(runtime, currentTarget, 'Spikes')
      || hasAbility(runtime, currentTarget, 'Blood Drinker')
      || hasAbility(runtime, currentTarget, 'Stolen Spotlight')
      || (hasAbility(runtime, currentTarget, 'Absolute Apex') && (runtime.state.boosts[currentTarget.team].fossils || 0) > 2)
    if (shouldCounter) dealDamage(runtime, currentTarget, attacker, hasAbility(runtime, currentTarget, 'Perseverance') ? 0.1 : 1)
  }

  if (hasAbility(runtime, attacker, 'Martial Will') && alive(attacker)) attacker.damage *= 1.3

  statusEnd(runtime, attacker)
  resolveDeaths(runtime)
}

function growHiddenInDepths(runtime: Runtime, moving: BattleTeam) {
  if (moving !== 'Allies') return
  const deck = runtime.state.teams.Allies
  for (let index = 1; index < deck.length; index++) {
    const card = deck[index]
    if (hasAbility(runtime, card, 'Hidden in the Depths')) {
      card.damage *= 1.1
      card.maxHp *= 1.1
      card.hp *= 1.1
    }
  }
}

function scheduleExtraTurns(runtime: Runtime, attacker: CombatCard): boolean {
  let extra = attacker.flags.extraTurn
  attacker.flags.extraTurn = false

  if (!attacker.flags.onBonusTurn) {
    let count = 0
    if (hasAbility(runtime, attacker, 'Berserk') && attacker.hp / attacker.maxHp < 0.5) count += 1
    if (hasAbility(runtime, attacker, 'Melancholy') && attacker.hp / attacker.maxHp > 0.5) count += 2
    if (hasAbility(runtime, attacker, 'Haste')) count += 1
    if (hasAbility(runtime, attacker, 'First Progenitor')) count += 1
    if (hasAbility(runtime, attacker, 'The World')) {
      if (attacker.flags.worldCooldown) attacker.flags.worldCooldown = false
      else { count += 2; attacker.flags.worldCooldown = true }
    }
    if (hasAbility(runtime, attacker, 'Accelerate')) {
      attacker.counters.turnsPerTurn = (attacker.counters.turnsPerTurn || 0) + 1
      count += attacker.counters.turnsPerTurn
    }
    if (count > 0) attacker.counters.extraTurns = count
  }

  if ((attacker.counters.extraTurns || 0) > 0) {
    attacker.counters.extraTurns -= 1
    attacker.flags.onBonusTurn = true
    extra = true
  } else attacker.flags.onBonusTurn = false
  return extra
}

export function simulateBattleV2(loadout: TeamLoadout, enemies: DepthsEnemy[], seed = 1): BattleResult {
  const state = createBattleStateV2(loadout, enemies)
  const runtime: Runtime = { state, rng: new SeededRng(seed) }
  let lastPair = ''
  let samePairTurns = 0

  while (state.teams.Allies.length && state.teams.Enemies.length && state.turn < 2_000) {
    state.turn += 1
    let attacker = active(runtime, state.moving)
    let defender = active(runtime, OTHER_TEAM[state.moving])
    if (!attacker || !defender) break

    onEntry(runtime, attacker)
    defender = active(runtime, OTHER_TEAM[state.moving])
    if (defender) onEntry(runtime, defender)
    resolveDeaths(runtime)
    attacker = active(runtime, state.moving)
    defender = active(runtime, OTHER_TEAM[state.moving])
    if (!attacker || !defender) break

    const pair = `${attacker.id}|${defender.id}`
    if (pair === lastPair) samePairTurns += 1
    else { lastPair = pair; samePairTurns = 0 }
    if (samePairTurns >= 150) {
      attacker.hp = 0
      defender.hp = 0
      resolveDeaths(runtime)
      continue
    }

    doTurn(runtime, attacker)
    growHiddenInDepths(runtime, state.moving)
    resolveDeaths(runtime)
    if (!state.teams.Allies.length || !state.teams.Enemies.length) break

    const stillActive = active(runtime, state.moving)
    const extra = stillActive === attacker && alive(attacker) ? scheduleExtraTurns(runtime, attacker) : false
    if (!extra) {
      const nextTeam = OTHER_TEAM[state.moving]
      const next = active(runtime, nextTeam)
      if (next && statusProtected(runtime, nextTeam)) clearStatuses(next)
      if (next && next.status.stunned > 0) {
        next.status.stunned -= 1
      } else if (next && next.flags.slowed) {
        next.counters.slowed = (next.counters.slowed || 0) + 1
        if (next.counters.slowed % 2 === 0) state.moving = nextTeam
      } else {
        state.moving = nextTeam
      }
    }
  }

  const winner: BattleResult['winner'] = state.teams.Allies.length
    ? state.teams.Enemies.length ? 'Draw' : 'Allies'
    : state.teams.Enemies.length ? 'Enemies' : 'Draw'
  const unsupportedAbilities = [...state.unsupportedAbilities].sort()
  return { winner, turns: state.turn, state, unsupportedAbilities, trusted: unsupportedAbilities.length === 0 }
}

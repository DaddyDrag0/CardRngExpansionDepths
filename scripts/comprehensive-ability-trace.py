from pathlib import Path

path = Path('src/engine/battle-v2.ts')
source = path.read_text(encoding='utf-8')

def replace(old: str, new: str, label: str):
    global source
    if old not in source:
        raise RuntimeError(f'Could not find {label}')
    source = source.replace(old, new, 1)

def insert_before(anchor: str, text: str, label: str):
    global source
    if anchor not in source:
        raise RuntimeError(f'Could not find {label}')
    source = source.replace(anchor, text + anchor, 1)

replace(
    "  if (runtime.debug.events.length >= 1200) runtime.debug.events.shift()",
    "  if (runtime.debug.events.length >= 5000) runtime.debug.events.shift()",
    'debug event cap',
)

insert_before(
    "function definition(name: string) {",
    r'''type AbilityTraceCardState = {
  id: string
  name: string
  ability: string | null
  team: BattleTeam
  slot: number
  hp: number
  maxHp: number
  damage: number
  stunned: number
  confused: number
  burn: number
  weakness: boolean
  blind: boolean
  shield: number
  attacks: number
  extraTurns: number
  death: number
  bleed: number
  frostbite: number
  poisonPercent: number
  poisonFlat: number
  sealed: boolean
  slowed: boolean
}

type AbilityTraceSnapshot = Map<string, AbilityTraceCardState>

function compactDebugNumber(value: number): string {
  if (!Number.isFinite(value)) return 'lethal'
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  const trim = (n: number) => n.toFixed(n >= 100 ? 0 : n >= 10 ? 1 : 2).replace(/\.?0+$/, '')
  if (abs >= 1e12) return sign + trim(abs / 1e12) + 't'
  if (abs >= 1e9) return sign + trim(abs / 1e9) + 'b'
  if (abs >= 1e6) return sign + trim(abs / 1e6) + 'm'
  if (abs >= 1e3) return sign + trim(abs / 1e3) + 'k'
  return sign + trim(abs)
}

function captureAbilityTrace(runtime: Runtime): AbilityTraceSnapshot {
  const snapshot: AbilityTraceSnapshot = new Map()
  for (const team of ['Allies', 'Enemies'] as BattleTeam[]) {
    runtime.state.teams[team].forEach((card, slot) => {
      snapshot.set(card.id, {
        id: card.id,
        name: effectiveCardName(card) || card.definition.name,
        ability: ability(card),
        team,
        slot,
        hp: card.hp,
        maxHp: card.maxHp,
        damage: card.damage,
        stunned: card.status.stunned,
        confused: card.status.confused,
        burn: card.status.burn,
        weakness: card.status.weakness,
        blind: card.status.blind,
        shield: card.status.shield,
        attacks: card.counters.attacks || 0,
        extraTurns: card.counters.extraTurns || 0,
        death: card.counters.death || 0,
        bleed: card.counters.bleed || 0,
        frostbite: card.counters.frostbite || 0,
        poisonPercent: card.counters.poisonPercent || 0,
        poisonFlat: card.counters.poisonFlat || 0,
        sealed: Boolean(card.flags.sealed),
        slowed: Boolean(card.flags.slowed),
      })
    })
  }
  return snapshot
}

function describeAbilityTrace(runtime: Runtime, before: AbilityTraceSnapshot, sourceCard: CombatCard): string[] {
  const after = captureAbilityTrace(runtime)
  const changes: string[] = []
  const changed = (a: number, b: number) => Math.abs(a - b) > Math.max(0.001, Math.abs(a) * 1e-9)
  const ids = new Set([...before.keys(), ...after.keys()])
  for (const id of ids) {
    const oldState = before.get(id)
    const newState = after.get(id)
    if (!oldState && newState) {
      changes.push(newState.name + ' entered slot ' + (newState.slot + 1))
      continue
    }
    if (oldState && !newState) {
      const isFallen = runtime.state.fallen[oldState.team].some((card) => card.id === id)
      if (!isFallen) changes.push(oldState.name + ' left the lineup')
      continue
    }
    if (!oldState || !newState) continue
    const label = id === sourceCard.id ? 'self' : newState.name
    if (oldState.slot !== newState.slot) changes.push(label + ' moved slot ' + (oldState.slot + 1) + ' → ' + (newState.slot + 1))
    if (oldState.name !== newState.name) changes.push(label + ' became ' + newState.name)
    if (oldState.ability !== newState.ability) changes.push(label + ' ability ' + (oldState.ability || 'none') + ' → ' + (newState.ability || 'none'))
    if (changed(oldState.damage, newState.damage)) changes.push(label + ' ATK ' + compactDebugNumber(oldState.damage) + ' → ' + compactDebugNumber(newState.damage))
    if (changed(oldState.maxHp, newState.maxHp)) changes.push(label + ' Max HP ' + compactDebugNumber(oldState.maxHp) + ' → ' + compactDebugNumber(newState.maxHp))
    if (changed(oldState.hp, newState.hp)) changes.push(label + ' HP ' + compactDebugNumber(oldState.hp) + ' → ' + compactDebugNumber(newState.hp))
    if (oldState.stunned !== newState.stunned) changes.push(label + ' stun ' + oldState.stunned + ' → ' + newState.stunned)
    if (oldState.confused !== newState.confused) changes.push(label + ' confusion ' + oldState.confused + ' → ' + newState.confused)
    if (oldState.burn !== newState.burn) changes.push(label + ' burn ' + oldState.burn + ' → ' + newState.burn)
    if (oldState.weakness !== newState.weakness) changes.push(label + (newState.weakness ? ' gained weakness' : ' lost weakness'))
    if (oldState.blind !== newState.blind) changes.push(label + (newState.blind ? ' was blinded' : ' blind ended'))
    if (oldState.shield !== newState.shield) changes.push(label + ' shields ' + oldState.shield + ' → ' + newState.shield)
    if (oldState.attacks !== newState.attacks) changes.push(label + ' bonus attacks ' + oldState.attacks + ' → ' + newState.attacks)
    if (oldState.extraTurns !== newState.extraTurns) changes.push(label + ' queued extra turns ' + oldState.extraTurns + ' → ' + newState.extraTurns)
    if (oldState.death !== newState.death) changes.push(label + ' death timer ' + oldState.death + ' → ' + newState.death)
    if (oldState.bleed !== newState.bleed) changes.push(label + ' bleed ' + oldState.bleed + ' → ' + newState.bleed)
    if (oldState.frostbite !== newState.frostbite) changes.push(label + ' frostbite ' + oldState.frostbite + ' → ' + newState.frostbite)
    if (oldState.poisonPercent !== newState.poisonPercent || oldState.poisonFlat !== newState.poisonFlat) changes.push(label + ' poison changed')
    if (oldState.sealed !== newState.sealed) changes.push(label + (newState.sealed ? ' ability sealed' : ' ability unsealed'))
    if (oldState.slowed !== newState.slowed) changes.push(label + (newState.slowed ? ' was slowed' : ' slow ended'))
  }
  return changes.length > 14 ? [...changes.slice(0, 14), '+' + (changes.length - 14) + ' more changes'] : changes
}

function runAbilityTrace<T>(runtime: Runtime, card: CombatCard, abilityName: string | null, fn: () => T): T {
  if (!runtime.captureDebug || !abilityName) return fn()
  const before = captureAbilityTrace(runtime)
  const eventStart = runtime.debug.events.length
  const result = fn()
  const cardName = effectiveCardName(card) || card.definition.name
  const alreadyLogged = runtime.debug.events.slice(eventStart).some((event) => event.type === 'ability' && event.card === cardName)
  if (!alreadyLogged) {
    const changes = describeAbilityTrace(runtime, before, card)
    if (changes.length) pushAbilityDebug(runtime, card, abilityName + ': ' + changes.join('; ') + '.')
  }
  return result
}

''',
    'trace helpers',
)

replace(
'''  if (!off.special && hasAbility(runtime, target, 'All Father') && damage > 0) {
    damage = 0
    target.hp -= target.maxHp / 5
  }''',
'''  if (!off.special && hasAbility(runtime, target, 'All Father') && damage > 0) {
    const cost = target.maxHp / 5
    damage = 0
    target.hp -= cost
    pushAbilityDebug(runtime, target, 'All Father dodged ' + (effectiveCardName(attacker) || attacker.definition.name) + "'s normal attack and paid 20% Max HP (" + compactDebugNumber(cost) + ').')
  }''',
    'All Father dodge',
)

replace("function targetRetro(runtime: Runtime, attacker: CombatCard, target: CombatCard, damage: number) {", "function targetRetroCore(runtime: Runtime, attacker: CombatCard, target: CombatCard, damage: number) {", 'targetRetro rename')
insert_before(
    "function lifestealFraction(runtime: Runtime, attacker: CombatCard, base: number): number {",
'''function targetRetro(runtime: Runtime, attacker: CombatCard, target: CombatCard, damage: number) {
  const name = resolvedAbility(runtime, target)
  if (activeBonusAbilities(target).length) return targetRetroCore(runtime, attacker, target, damage)
  return runAbilityTrace(runtime, target, name, () => targetRetroCore(runtime, attacker, target, damage))
}

''',
    'targetRetro wrapper',
)

replace("function attackerRetro(runtime: Runtime, attacker: CombatCard, target: CombatCard, damage: number): boolean {", "function attackerRetroCore(runtime: Runtime, attacker: CombatCard, target: CombatCard, damage: number): boolean {", 'attackerRetro rename')
insert_before(
    "function resolveAuraFarm(runtime: Runtime, target: CombatCard, incoming: number): { target: CombatCard; damage: number } {",
'''function attackerRetro(runtime: Runtime, attacker: CombatCard, target: CombatCard, damage: number): boolean {
  const name = resolvedAbility(runtime, attacker)
  if (activeBonusAbilities(attacker).length) return attackerRetroCore(runtime, attacker, target, damage)
  return runAbilityTrace(runtime, attacker, name, () => attackerRetroCore(runtime, attacker, target, damage))
}

''',
    'attackerRetro wrapper',
)

replace("function applyOnDeath(runtime: Runtime, dead: CombatCard, opponent: CombatCard | undefined, skipOpponentPassives = false) {", "function applyOnDeathCore(runtime: Runtime, dead: CombatCard, opponent: CombatCard | undefined, skipOpponentPassives = false) {", 'applyOnDeath rename')
replace(
'''    if (opponent && alive(opponent) && hasAbility(runtime, opponent, 'Prehistoric Wrath')) opponent.damage *= 2
    if (opponent && alive(opponent) && hasAbility(runtime, opponent, 'All Father')) for (const card of runtime.state.teams[opponent.team]) boostStats(card, 1.25)''',
'''    if (opponent && alive(opponent) && hasAbility(runtime, opponent, 'Prehistoric Wrath')) {
      opponent.damage *= 2
      pushAbilityDebug(runtime, opponent, 'Prehistoric Wrath: enemy defeated; ATK doubled to ' + compactDebugNumber(opponent.damage) + '.')
    }
    if (opponent && alive(opponent) && hasAbility(runtime, opponent, 'All Father')) {
      for (const card of runtime.state.teams[opponent.team]) boostStats(card, 1.25)
      pushAbilityDebug(runtime, opponent, 'All Father: enemy defeated; all living allies gained 25% stats.')
    }''',
    'kill passives',
)
insert_before(
    "function resolveDeaths(runtime: Runtime) {",
'''function applyOnDeath(runtime: Runtime, dead: CombatCard, opponent: CombatCard | undefined, skipOpponentPassives = false) {
  const name = resolvedAbility(runtime, dead)
  if (activeBonusAbilities(dead).length) return applyOnDeathCore(runtime, dead, opponent, skipOpponentPassives)
  return runAbilityTrace(runtime, dead, name, () => applyOnDeathCore(runtime, dead, opponent, skipOpponentPassives))
}

''',
    'applyOnDeath wrapper',
)

replace(
'''          card.flags.undyingActive = true
          card.counters.undyingTurns = 1
          card.hp = 1
          changed = true''',
'''          card.flags.undyingActive = true
          card.counters.undyingTurns = 1
          card.hp = 1
          pushAbilityDebug(runtime, card, 'Undying activated — lethal damage was prevented and the card survives at 1 HP for one turn.')
          changed = true''',
    'Undying activation',
)
replace(
'''          card.counters.unholyLastTick = runtime.state.turn
          card.hp = 1
          changed = true''',
'''          card.counters.unholyLastTick = runtime.state.turn
          card.hp = 1
          pushAbilityDebug(runtime, card, 'Unholy Creature activated — lethal damage was prevented and the card survives at 1 HP for two battle turns.')
          changed = true''',
    'Unholy activation',
)
replace(
"      if ((card.counters.unholyTurns || 0) <= 0) card.hp = 0",
"      if ((card.counters.unholyTurns || 0) <= 0) { card.hp = 0; pushAbilityDebug(runtime, card, 'Unholy Creature expired — its two-turn survival ended.') }",
    'Unholy expiry',
)

replace(
'''  if (hasAbility(runtime, target, 'Lightning Strike') && alive(target) && alive(attacker)) {
    dealDamage(runtime, target, attacker, 0.75)
  }''',
'''  if (hasAbility(runtime, target, 'Lightning Strike') && alive(target) && alive(attacker)) {
    runAbilityTrace(runtime, target, 'Lightning Strike', () => dealDamage(runtime, target, attacker, 0.75))
  }''',
    'Lightning Strike trace',
)
replace("  if (hasAbility(runtime, target, 'Decay')) attacker.damage *= 0.75", "  if (hasAbility(runtime, target, 'Decay')) runAbilityTrace(runtime, target, 'Decay', () => { attacker.damage *= 0.75 })", 'Decay trace')
replace("  if (hasAbility(runtime, target, 'Starvation')) boostStats(attacker, 0.75)", "  if (hasAbility(runtime, target, 'Starvation')) runAbilityTrace(runtime, target, 'Starvation', () => boostStats(attacker, 0.75))", 'Starvation trace')
replace("  if (hasAbility(runtime, target, 'Purifying Fire')) attacker.hp *= 0.7", "  if (hasAbility(runtime, target, 'Purifying Fire')) runAbilityTrace(runtime, target, 'Purifying Fire', () => { attacker.hp *= 0.7 })", 'Purifying Fire trace')
replace("  if (hasAbility(runtime, attacker, 'Sacrificial Tides')) target.hp -= target.maxHp * 0.2", "  if (hasAbility(runtime, attacker, 'Sacrificial Tides')) runAbilityTrace(runtime, attacker, 'Sacrificial Tides', () => { target.hp -= target.maxHp * 0.2 })", 'Sacrificial Tides trace')

replace(
'''  if (hasAbility(runtime, attacker, 'World Creation')) {
    attacker.counters.worldCreation = (attacker.counters.worldCreation || 0) + 1
    if (attacker.counters.worldCreation % 3 === 0) boostStats(attacker, 2)
  }''',
'''  if (hasAbility(runtime, attacker, 'World Creation')) {
    attacker.counters.worldCreation = (attacker.counters.worldCreation || 0) + 1
    if (attacker.counters.worldCreation % 3 === 0) {
      runAbilityTrace(runtime, attacker, 'World Creation', () => boostStats(attacker, 2))
    }
  }''',
    'World Creation trace',
)
replace("  if (hasAbility(runtime, attacker, 'Patience')) boostStats(attacker, 1.3)", "  if (hasAbility(runtime, attacker, 'Patience')) runAbilityTrace(runtime, attacker, 'Patience', () => boostStats(attacker, 1.3))", 'Patience trace')
replace("  if (hasAbility(runtime, attacker, 'Absolute Sovereignty')) for (const card of runtime.state.teams[attacker.team]) boostStats(card, 1.1)", "  if (hasAbility(runtime, attacker, 'Absolute Sovereignty')) runAbilityTrace(runtime, attacker, 'Absolute Sovereignty', () => { for (const card of runtime.state.teams[attacker.team]) boostStats(card, 1.1) })", 'Absolute Sovereignty trace')
replace(
'''  if (hasAbility(runtime, attacker, 'Upheaval')) {
    attacker.counters.upheaval = (attacker.counters.upheaval || 0) + 1
    if (attacker.counters.upheaval % 3 == 0) {
      attacker.damage *= 2
      const target = active(runtime, OTHER_TEAM[attacker.team])
      if (target && !statusProtected(runtime, target.team)) target.status.stunned = Math.max(1, target.status.stunned)
    }
  }''',
'''  if (hasAbility(runtime, attacker, 'Upheaval')) {
    attacker.counters.upheaval = (attacker.counters.upheaval || 0) + 1
    if (attacker.counters.upheaval % 3 == 0) {
      runAbilityTrace(runtime, attacker, 'Upheaval', () => {
        attacker.damage *= 2
        const target = active(runtime, OTHER_TEAM[attacker.team])
        if (target && !statusProtected(runtime, target.team)) target.status.stunned = Math.max(1, target.status.stunned)
      })
    }
  }''',
    'Upheaval trace',
)
replace(
'''  if (hasAbility(runtime, attacker, 'Defensive Maneuver')) {
    attacker.counters.defensiveManeuver = (attacker.counters.defensiveManeuver || 0) + 1
    if (attacker.counters.defensiveManeuver % 2 === 0) attacker.status.shield += 1
  }''',
'''  if (hasAbility(runtime, attacker, 'Defensive Maneuver')) {
    attacker.counters.defensiveManeuver = (attacker.counters.defensiveManeuver || 0) + 1
    if (attacker.counters.defensiveManeuver % 2 === 0) runAbilityTrace(runtime, attacker, 'Defensive Maneuver', () => { attacker.status.shield += 1 })
  }''',
    'Defensive Maneuver trace',
)

replace("  if (target && hasAbility(runtime, attacker, 'Blood Bath')) {\n    const stolen = Math.max(0, target.hp * 0.25)\n    target.hp -= stolen\n    attacker.hp = Math.min(attacker.maxHp, attacker.hp + stolen)\n  }", "  if (target && hasAbility(runtime, attacker, 'Blood Bath')) runAbilityTrace(runtime, attacker, 'Blood Bath', () => {\n    const stolen = Math.max(0, target.hp * 0.25)\n    target.hp -= stolen\n    attacker.hp = Math.min(attacker.maxHp, attacker.hp + stolen)\n  })", 'Blood Bath trace')
replace("  if (target && hasAbility(runtime, attacker, 'Forbidden Banquet')) stealStats(target, attacker, 0.15)", "  if (target && hasAbility(runtime, attacker, 'Forbidden Banquet')) runAbilityTrace(runtime, attacker, 'Forbidden Banquet', () => stealStats(target, attacker, 0.15))", 'Forbidden Banquet trace')
replace("  if (hasAbility(runtime, attacker, 'Rejuvenate')) attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.35)", "  if (hasAbility(runtime, attacker, 'Rejuvenate')) runAbilityTrace(runtime, attacker, 'Rejuvenate', () => { attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.35) })", 'Rejuvenate trace')
replace("  if (hasAbility(runtime, attacker, 'First Progenitor')) attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.1)", "  if (hasAbility(runtime, attacker, 'First Progenitor')) runAbilityTrace(runtime, attacker, 'First Progenitor', () => { attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.1) })", 'First Progenitor trace')
replace("  if (target && hasAbility(runtime, attacker, 'Viral Breath')) target.hp -= target.maxHp * 0.25", "  if (target && hasAbility(runtime, attacker, 'Viral Breath')) runAbilityTrace(runtime, attacker, 'Viral Breath', () => { target.hp -= target.maxHp * 0.25 })", 'Viral Breath trace')
replace("  if (hasAbility(runtime, attacker, 'Combatant')) attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.1)", "  if (hasAbility(runtime, attacker, 'Combatant')) runAbilityTrace(runtime, attacker, 'Combatant', () => { attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.1) })", 'Combatant trace')

replace(
'''  if (hasAbility(runtime, attacker, 'Lotus Sutra')) doLotusSutra(runtime, attacker)
  else if (hasAbility(runtime, attacker, 'Origin')) doOrigin(runtime, attacker)
  else if (hasAbility(runtime, attacker, 'Laser Gun')) doLaserGun(runtime, attacker)
  else if (hasAbility(runtime, attacker, 'Dagger Storm')) doDaggerStorm(runtime, attacker)
  else if (hasAbility(runtime, attacker, 'Naughty or Nice?')) doNaughtyOrNice(runtime, attacker)''',
'''  if (hasAbility(runtime, attacker, 'Lotus Sutra')) runAbilityTrace(runtime, attacker, 'Lotus Sutra', () => doLotusSutra(runtime, attacker))
  else if (hasAbility(runtime, attacker, 'Origin')) runAbilityTrace(runtime, attacker, 'Origin', () => doOrigin(runtime, attacker))
  else if (hasAbility(runtime, attacker, 'Laser Gun')) runAbilityTrace(runtime, attacker, 'Laser Gun', () => doLaserGun(runtime, attacker))
  else if (hasAbility(runtime, attacker, 'Dagger Storm')) runAbilityTrace(runtime, attacker, 'Dagger Storm', () => doDaggerStorm(runtime, attacker))
  else if (hasAbility(runtime, attacker, 'Naughty or Nice?')) runAbilityTrace(runtime, attacker, 'Naughty or Nice?', () => doNaughtyOrNice(runtime, attacker))''',
    'special action traces',
)

replace(
'''      if (hasAbility(runtime, creep, 'Creep') && alive(creep) && active(runtime, enemyTeam)) {
        dealDamage(runtime, creep, active(runtime, enemyTeam)!, 0.25)
        resolveDeaths(runtime)
      }''',
'''      if (hasAbility(runtime, creep, 'Creep') && alive(creep) && active(runtime, enemyTeam)) {
        runAbilityTrace(runtime, creep, 'Creep', () => {
          dealDamage(runtime, creep, active(runtime, enemyTeam)!, 0.25)
          resolveDeaths(runtime)
        })
      }''',
    'Creep trace',
)
replace(
"    if (shouldCounter) dealDamage(runtime, currentTarget, attacker, hasAbility(runtime, currentTarget, 'Perseverance') ? 0.1 : 1)",
'''    if (shouldCounter) {
      const counterName = hasAbility(runtime, currentTarget, 'Hatred') ? 'Hatred'
        : hasAbility(runtime, currentTarget, 'Perseverance') ? 'Perseverance'
        : hasAbility(runtime, currentTarget, 'Spikes') ? 'Spikes'
        : hasAbility(runtime, currentTarget, 'Blood Drinker') ? 'Blood Drinker'
        : hasAbility(runtime, currentTarget, 'Stolen Spotlight') ? 'Stolen Spotlight'
        : hasAbility(runtime, currentTarget, 'Poke the Beast') ? 'Poke the Beast'
        : hasAbility(runtime, currentTarget, 'Absolute Apex') ? 'Absolute Apex'
        : 'Berserker aura'
      pushAbilityDebug(runtime, currentTarget, counterName + ' triggered a counterattack against ' + (effectiveCardName(attacker) || attacker.definition.name) + '.')
      dealDamage(runtime, currentTarget, attacker, hasAbility(runtime, currentTarget, 'Perseverance') ? 0.1 : 1)
    }''',
    'counterattack trace',
)
replace("  if (hasAbility(runtime, attacker, 'Martial Will') && alive(attacker)) attacker.damage *= 1.3", "  if (hasAbility(runtime, attacker, 'Martial Will') && alive(attacker)) runAbilityTrace(runtime, attacker, 'Martial Will', () => { attacker.damage *= 1.3 })", 'Martial Will trace')

replace(
'''  if (dispel && alive(dispel) && hasAbility(runtime, dispel, 'Dispel') && alive(movedCard)) {
    const drained = movedCard.damage * 0.2
    movedCard.damage = Math.max(0, movedCard.damage - drained)
    dispel.hp = Math.min(dispel.maxHp, dispel.hp + drained)
  }''',
'''  if (dispel && alive(dispel) && hasAbility(runtime, dispel, 'Dispel') && alive(movedCard)) {
    runAbilityTrace(runtime, dispel, 'Dispel', () => {
      const drained = movedCard.damage * 0.2
      movedCard.damage = Math.max(0, movedCard.damage - drained)
      dispel.hp = Math.min(dispel.maxHp, dispel.hp + drained)
    })
  }''',
    'Dispel trace',
)
replace(
'''    if (healer.counters.healingMiracle >= 3) {
      healer.counters.healingMiracle = 0
      healer.hp = Math.min(healer.maxHp, healer.hp + healer.maxHp)
    }''',
'''    if (healer.counters.healingMiracle >= 3) {
      runAbilityTrace(runtime, healer, 'Healing Miracle', () => {
        healer.counters.healingMiracle = 0
        healer.hp = Math.min(healer.maxHp, healer.hp + healer.maxHp)
      })
    }''',
    'Healing Miracle trace',
)

replace(
'''      if (target) {
        dealDamage(runtime, card, target, 3, true)
        resolveDeaths(runtime)
      }''',
'''      if (target) {
        runAbilityTrace(runtime, card, 'Divination', () => {
          dealDamage(runtime, card, target, 3, true)
          resolveDeaths(runtime)
        })
      }''',
    'Divination trace',
)
replace(
'''    if (hasAbility(runtime, card, 'Hidden in the Depths')) {
      card.damage *= 1.1
      card.maxHp *= 1.1
      card.hp *= 1.1
    }''',
'''    if (hasAbility(runtime, card, 'Hidden in the Depths')) {
      runAbilityTrace(runtime, card, 'Hidden in the Depths', () => {
        card.damage *= 1.1
        card.maxHp *= 1.1
        card.hp *= 1.1
      })
    }''',
    'Hidden in the Depths trace',
)
replace(
"    if (count > 0) attacker.counters.extraTurns = count",
'''    if (count > 0) {
      attacker.counters.extraTurns = count
      const sources = [
        hasAbility(runtime, attacker, 'Berserk') && attacker.hp / attacker.maxHp < 0.5 ? 'Berserk' : '',
        hasAbility(runtime, attacker, 'Melancholy') && attacker.hp / attacker.maxHp > 0.5 ? 'Melancholy' : '',
        hasAbility(runtime, attacker, 'Haste') ? 'Haste' : '',
        hasAbility(runtime, attacker, 'First Progenitor') ? 'First Progenitor' : '',
        hasAbility(runtime, attacker, 'The World') ? 'The World' : '',
        hasAbility(runtime, attacker, 'Accelerate') ? 'Accelerate' : '',
      ].filter(Boolean)
      pushAbilityDebug(runtime, attacker, sources.join(' + ') + ': queued ' + count + ' extra turn' + (count === 1 ? '' : 's') + '.')
    }''',
    'extra turn trace',
)

path.write_text(source, encoding='utf-8')
print('Applied comprehensive ability interaction tracing.')

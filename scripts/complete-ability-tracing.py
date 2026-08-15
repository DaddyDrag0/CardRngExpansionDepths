from pathlib import Path

path = Path('src/engine/battle-v2.ts')
source = path.read_text(encoding='utf-8')

def replace(old: str, new: str, label: str):
    global source
    if old not in source:
        raise RuntimeError(f'Could not find {label}')
    source = source.replace(old, new, 1)

# Track the less-visible flags/counters that explain many abilities.
replace(
'''  poisonPercent: number
  poisonFlat: number
  sealed: boolean
  slowed: boolean''',
'''  poisonPercent: number
  poisonFlat: number
  hpShield: number
  bindFatePair: number
  perishTurns: number
  divinationMoves: number
  extraTurnFlag: boolean
  awakened: boolean
  noRng: boolean
  eternalConfusion: boolean
  bonusAbilities: string
  sealed: boolean
  slowed: boolean''',
    'trace state type fields',
)
replace(
'''        poisonPercent: card.counters.poisonPercent || 0,
        poisonFlat: card.counters.poisonFlat || 0,
        sealed: Boolean(card.flags.sealed),
        slowed: Boolean(card.flags.slowed),''',
'''        poisonPercent: card.counters.poisonPercent || 0,
        poisonFlat: card.counters.poisonFlat || 0,
        hpShield: card.counters.hpShield || 0,
        bindFatePair: card.counters.bindFatePair || 0,
        perishTurns: card.counters.perishTurns || 0,
        divinationMoves: card.counters.divinationMoves || 0,
        extraTurnFlag: Boolean(card.flags.extraTurn),
        awakened: Boolean(card.flags.awakened),
        noRng: Boolean(card.flags.noRng),
        eternalConfusion: Boolean(card.flags.eternalConfusion),
        bonusAbilities: (card.bonusAbilities || []).join(' + '),
        sealed: Boolean(card.flags.sealed),
        slowed: Boolean(card.flags.slowed),''',
    'trace state capture fields',
)
replace(
'''    if (oldState.poisonPercent !== newState.poisonPercent || oldState.poisonFlat !== newState.poisonFlat) changes.push(label + ' poison changed')
    if (oldState.sealed !== newState.sealed) changes.push(label + (newState.sealed ? ' ability sealed' : ' ability unsealed'))''',
'''    if (oldState.poisonPercent !== newState.poisonPercent || oldState.poisonFlat !== newState.poisonFlat) changes.push(label + ' poison changed')
    if (oldState.hpShield !== newState.hpShield) changes.push(label + ' HP shield ' + compactDebugNumber(oldState.hpShield) + ' → ' + compactDebugNumber(newState.hpShield))
    if (oldState.bindFatePair !== newState.bindFatePair) changes.push(label + (newState.bindFatePair ? ' was bound by Bind Fate' : ' Bind Fate ended'))
    if (oldState.perishTurns !== newState.perishTurns) changes.push(label + ' Perish timer ' + oldState.perishTurns + ' → ' + newState.perishTurns)
    if (oldState.divinationMoves !== newState.divinationMoves) changes.push(label + ' Divination timer ' + oldState.divinationMoves + ' → ' + newState.divinationMoves)
    if (oldState.extraTurnFlag !== newState.extraTurnFlag) changes.push(label + (newState.extraTurnFlag ? ' gained an extra-turn trigger' : ' extra-turn trigger consumed'))
    if (oldState.awakened !== newState.awakened) changes.push(label + (newState.awakened ? ' awakened' : ' awakening ended'))
    if (oldState.noRng !== newState.noRng) changes.push(label + (newState.noRng ? ' RNG disabled' : ' RNG restored'))
    if (oldState.eternalConfusion !== newState.eternalConfusion) changes.push(label + (newState.eternalConfusion ? ' gained eternal confusion' : ' eternal confusion ended'))
    if (oldState.bonusAbilities !== newState.bonusAbilities) changes.push(label + ' bonus abilities ' + (oldState.bonusAbilities || 'none') + ' → ' + (newState.bonusAbilities || 'none'))
    if (oldState.sealed !== newState.sealed) changes.push(label + (newState.sealed ? ' ability sealed' : ' ability unsealed'))''',
    'trace state descriptions',
)

# Passive on-entry reactions belong to the card causing them, not the card entering.
replace("  if (enemy !== card && hasAbility(runtime, enemy, 'Desire')) stealStats(card, enemy, 0.1)", "  if (enemy !== card && hasAbility(runtime, enemy, 'Desire')) runAbilityTrace(runtime, enemy, 'Desire', () => stealStats(card, enemy, 0.1))", 'Desire passive trace')
replace("  if (enemy !== card && hasAbility(runtime, enemy, 'Cosmic Maw')) stealStats(card, enemy, 0.2)", "  if (enemy !== card && hasAbility(runtime, enemy, 'Cosmic Maw')) runAbilityTrace(runtime, enemy, 'Cosmic Maw', () => stealStats(card, enemy, 0.2))", 'Cosmic Maw passive trace')
replace(
'''  if (enemy !== card && enemy.flags.awakened && hasAbility(runtime, enemy, 'Pop-Up Impression') && !statusProtected(runtime, card.team)) {
    card.status.confused = Math.max(card.status.confused, enemy.counters.toyCount || 1)
  }''',
'''  if (enemy !== card && enemy.flags.awakened && hasAbility(runtime, enemy, 'Pop-Up Impression') && !statusProtected(runtime, card.team)) {
    runAbilityTrace(runtime, enemy, 'Pop-Up Impression', () => {
      card.status.confused = Math.max(card.status.confused, enemy.counters.toyCount || 1)
    })
  }''',
    'awakened Pop-Up passive trace',
)

# Replace the narrow on-entry logger with a full-lineup snapshot. This catches team-wide buffs,
# shuffles, summons, poison, timers, Bind Fate, Hex, and similar effects without per-ability hacks.
replace(
'''  const entryDebugBefore = runtime.captureDebug ? {
    cardHp: card.hp, cardMaxHp: card.maxHp, cardDamage: card.damage,
    enemyHp: enemy.hp, enemyMaxHp: enemy.maxHp, enemyDamage: enemy.damage,
    enemyStunned: enemy.status.stunned, enemyConfused: enemy.status.confused, enemyBurn: enemy.status.burn,
    enemyBlind: enemy.status.blind, enemyWeakness: enemy.status.weakness, enemySealed: Boolean(enemy.flags.sealed),
  } : null''',
'''  const entryTraceBefore = runtime.captureDebug ? captureAbilityTrace(runtime) : null
  const entryTraceEventStart = runtime.debug.events.length''',
    'old on-entry snapshot',
)
replace(
'''  if (entryDebugBefore) {
    const changes: string[] = []
    const n = (value: number) => Number.isFinite(value) ? String(Math.round(value)) : 'lethal'
    const changed = (before: number, after: number) => Math.abs(before - after) > Math.max(0.001, Math.abs(before) * 1e-9)
    if (changed(entryDebugBefore.cardDamage, card.damage)) changes.push('own ATK ' + n(entryDebugBefore.cardDamage) + ' → ' + n(card.damage))
    if (changed(entryDebugBefore.cardMaxHp, card.maxHp)) changes.push('own max HP ' + n(entryDebugBefore.cardMaxHp) + ' → ' + n(card.maxHp))
    if (changed(entryDebugBefore.cardHp, card.hp)) changes.push('own HP ' + n(entryDebugBefore.cardHp) + ' → ' + n(card.hp))
    if (changed(entryDebugBefore.enemyDamage, enemy.damage)) changes.push('enemy ATK ' + n(entryDebugBefore.enemyDamage) + ' → ' + n(enemy.damage))
    if (changed(entryDebugBefore.enemyMaxHp, enemy.maxHp)) changes.push('enemy max HP ' + n(entryDebugBefore.enemyMaxHp) + ' → ' + n(enemy.maxHp))
    if (changed(entryDebugBefore.enemyHp, enemy.hp)) changes.push('enemy HP ' + n(entryDebugBefore.enemyHp) + ' → ' + n(enemy.hp))
    if (entryDebugBefore.enemyStunned !== enemy.status.stunned) changes.push('enemy stun ' + entryDebugBefore.enemyStunned + ' → ' + enemy.status.stunned + ' turns')
    if (entryDebugBefore.enemyConfused !== enemy.status.confused) changes.push('enemy confusion ' + entryDebugBefore.enemyConfused + ' → ' + enemy.status.confused + ' turns')
    if (entryDebugBefore.enemyBurn !== enemy.status.burn) changes.push('enemy burn ' + entryDebugBefore.enemyBurn + ' → ' + enemy.status.burn + ' turns')
    if (entryDebugBefore.enemyBlind !== enemy.status.blind) changes.push(enemy.status.blind ? 'enemy blinded' : 'enemy blind removed')
    if (entryDebugBefore.enemyWeakness !== enemy.status.weakness) changes.push(enemy.status.weakness ? 'enemy weakened' : 'enemy weakness removed')
    if (entryDebugBefore.enemySealed !== Boolean(enemy.flags.sealed)) changes.push(enemy.flags.sealed ? 'enemy ability sealed' : 'enemy ability unsealed')
    if (changes.length && name !== "Hell's Curse" && name !== 'Order of the Cosmos') pushAbilityDebug(runtime, card, name + ': ' + changes.join('; ') + '.')
  }''',
'''  if (entryTraceBefore && name !== "Hell's Curse" && name !== 'Order of the Cosmos') {
    const cardName = effectiveCardName(card) || card.definition.name
    const alreadyLogged = runtime.debug.events.slice(entryTraceEventStart).some((event) => event.type === 'ability' && event.card === cardName)
    if (!alreadyLogged) {
      const changes = describeAbilityTrace(runtime, entryTraceBefore, card)
      if (changes.length) pushAbilityDebug(runtime, card, name + ': ' + changes.join('; ') + '.')
    }
  }''',
    'old on-entry diff output',
)

replace(
'''    case 'Erosion':
      if (rand(runtime, card.team) < 0.5) clearSkillAura(runtime, enemyTeam)
      break''',
'''    case 'Erosion': {
      const auraName = runtime.state.boosts[enemyTeam].skillAuraName
      if (rand(runtime, card.team) < 0.5) {
        clearSkillAura(runtime, enemyTeam)
        pushAbilityDebug(runtime, card, 'Erosion succeeded' + (auraName ? ' — disabled ' + auraName + '.' : ', but there was no enemy ability aura to disable.'))
      } else if (auraName) pushAbilityDebug(runtime, card, 'Erosion failed — ' + auraName + ' stayed active.')
      break
    }''',
    'Erosion trace',
)

# Start-of-turn / persistent ability effects that were still silent.
replace("  if (attacker.flags.naughtyListDrain) boostStats(attacker, 0.9)", "  if (attacker.flags.naughtyListDrain) runAbilityTrace(runtime, attacker, 'Naughty List', () => boostStats(attacker, 0.9))", 'Naughty List drain trace')
replace("  if (hasAbility(runtime, attacker, 'Toil')) boostStats(attacker, 0.85)", "  if (hasAbility(runtime, attacker, 'Toil')) runAbilityTrace(runtime, attacker, 'Toil', () => boostStats(attacker, 0.85))", 'Toil drain trace')
replace(
'''  if (hasAbility(runtime, attacker, 'Bloodlust')) {
    if (attacker.flags.bloodlustFirstTurn) attacker.flags.bloodlustFirstTurn = false
    else attacker.damage += attacker.counters.bloodlustBase || 0
  }''',
'''  if (hasAbility(runtime, attacker, 'Bloodlust')) {
    if (attacker.flags.bloodlustFirstTurn) attacker.flags.bloodlustFirstTurn = false
    else runAbilityTrace(runtime, attacker, 'Bloodlust', () => { attacker.damage += attacker.counters.bloodlustBase || 0 })
  }''',
    'Bloodlust turn trace',
)
replace(
'''  if (hasAbility(runtime, attacker, 'ConstellarAquarius')) {
    if (attacker.hp < attacker.maxHp / 2) attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.3)
    else attacker.maxHp *= 1.25
  }''',
'''  if (hasAbility(runtime, attacker, 'ConstellarAquarius')) {
    runAbilityTrace(runtime, attacker, 'ConstellarAquarius', () => {
      if (attacker.hp < attacker.maxHp / 2) attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.3)
      else attacker.maxHp *= 1.25
    })
  }''',
    'Aquarius trace',
)
replace(
'''  if (hasAbility(runtime, attacker, 'Full Moon')) {
    attacker.counters.fullMoon = (attacker.counters.fullMoon || 0) + 1
    if (attacker.counters.fullMoon % 2 === 0) {
      const target = active(runtime, OTHER_TEAM[attacker.team])
      if (target && alive(target)) dealDamage(runtime, target, target)
    }
  }''',
'''  if (hasAbility(runtime, attacker, 'Full Moon')) {
    attacker.counters.fullMoon = (attacker.counters.fullMoon || 0) + 1
    if (attacker.counters.fullMoon % 2 === 0) {
      const target = active(runtime, OTHER_TEAM[attacker.team])
      if (target && alive(target)) runAbilityTrace(runtime, attacker, 'Full Moon', () => dealDamage(runtime, target, target))
    }
  }''',
    'Full Moon trace',
)
replace(
'''  if (hasAbility(runtime, attacker, 'Dark Qi Manipulation') && !attacker.flags.awakened) {
    attacker.counters.ascension = (attacker.counters.ascension || 0) + 1
    if (attacker.counters.ascension <= 2) boostStats(attacker, 1.3)
    else attacker.flags.awakened = true
  }''',
'''  if (hasAbility(runtime, attacker, 'Dark Qi Manipulation') && !attacker.flags.awakened) {
    runAbilityTrace(runtime, attacker, 'Dark Qi Manipulation', () => {
      attacker.counters.ascension = (attacker.counters.ascension || 0) + 1
      if (attacker.counters.ascension <= 2) boostStats(attacker, 1.3)
      else attacker.flags.awakened = true
    })
  }''',
    'Dark Qi trace',
)
replace(
'''  if (hasAbility(runtime, attacker, 'Immortal Ascension') && !attacker.flags.awakened) {
    attacker.counters.ascension = (attacker.counters.ascension || 0) + 1
    if (attacker.counters.ascension <= 2) boostStats(attacker, 1.3)
    else attacker.flags.awakened = true
  }''',
'''  if (hasAbility(runtime, attacker, 'Immortal Ascension') && !attacker.flags.awakened) {
    runAbilityTrace(runtime, attacker, 'Immortal Ascension', () => {
      attacker.counters.ascension = (attacker.counters.ascension || 0) + 1
      if (attacker.counters.ascension <= 2) boostStats(attacker, 1.3)
      else attacker.flags.awakened = true
    })
  }''',
    'Immortal Ascension trace',
)
replace(
'''  if (hasAbility(runtime, attacker, 'First Tail') && (attacker.counters.tail || 0) < 9) {
    attacker.counters.tail = (attacker.counters.tail || 0) + 1
    boostStats(attacker, 1.2)
  }''',
'''  if (hasAbility(runtime, attacker, 'First Tail') && (attacker.counters.tail || 0) < 9) {
    runAbilityTrace(runtime, attacker, 'First Tail', () => {
      attacker.counters.tail = (attacker.counters.tail || 0) + 1
      boostStats(attacker, 1.2)
    })
  }''',
    'First Tail trace',
)
replace(
'''  if (hasAbility(runtime, attacker, 'Shapeshifter') || attacker.flags.shapeshifterActive) {
    attacker.flags.shapeshifterActive = true
    const shape = randomBattleCard(runtime)
    attacker.identityOverride = shape.name
    attacker.abilityOverride = undefined
    attacker.entered = false
  }''',
'''  if (hasAbility(runtime, attacker, 'Shapeshifter') || attacker.flags.shapeshifterActive) {
    runAbilityTrace(runtime, attacker, 'Shapeshifter', () => {
      attacker.flags.shapeshifterActive = true
      const shape = randomBattleCard(runtime)
      attacker.identityOverride = shape.name
      attacker.abilityOverride = undefined
      attacker.entered = false
    })
  }''',
    'Shapeshifter trace',
)
replace(
'''  if (hasAbility(runtime, attacker, 'Grind')) {
    attacker.counters.grind = (attacker.counters.grind || 0) + 1
    if (attacker.counters.grind <= 5) boostStats(attacker, 1.1)
  }''',
'''  if (hasAbility(runtime, attacker, 'Grind')) {
    attacker.counters.grind = (attacker.counters.grind || 0) + 1
    if (attacker.counters.grind <= 5) runAbilityTrace(runtime, attacker, 'Grind', () => boostStats(attacker, 1.1))
  }''',
    'Grind trace',
)
replace(
'''  if (hasAbility(runtime, attacker, 'Safeguarding')) {
    for (const dragon of runtime.state.teams[attacker.team].slice(1)) {
      if (!DRAGON_CARDS.has(dragon.definition.name)) continue
      dragon.damage *= 1.2
      dragon.maxHp *= 1.2
      dragon.hp = dragon.maxHp
    }
  }''',
'''  if (hasAbility(runtime, attacker, 'Safeguarding')) {
    runAbilityTrace(runtime, attacker, 'Safeguarding', () => {
      for (const dragon of runtime.state.teams[attacker.team].slice(1)) {
        if (!DRAGON_CARDS.has(dragon.definition.name)) continue
        dragon.damage *= 1.2
        dragon.maxHp *= 1.2
        dragon.hp = dragon.maxHp
      }
    })
  }''',
    'Safeguarding trace',
)
replace(
'''  if (hasAbility(runtime, attacker, 'Persistent')) {
    const normal = attacker.counters.normalDamage || attacker.damage
    if (attacker.damage < normal) attacker.damage = normal
  }''',
'''  if (hasAbility(runtime, attacker, 'Persistent')) {
    const normal = attacker.counters.normalDamage || attacker.damage
    if (attacker.damage < normal) runAbilityTrace(runtime, attacker, 'Persistent', () => { attacker.damage = normal })
  }''',
    'Persistent reset trace',
)
replace(
'''  if (hasAbility(runtime, attacker, 'Snowbound')) {
    attacker.counters.snowbound = (attacker.counters.snowbound || 0) + 1
    if (attacker.counters.snowbound % 2 === 0) attacker.status.stunned = Math.max(1, attacker.status.stunned)
  }''',
'''  if (hasAbility(runtime, attacker, 'Snowbound')) {
    attacker.counters.snowbound = (attacker.counters.snowbound || 0) + 1
    if (attacker.counters.snowbound % 2 === 0) runAbilityTrace(runtime, attacker, 'Snowbound', () => { attacker.status.stunned = Math.max(1, attacker.status.stunned) })
  }''',
    'Snowbound trace',
)

# Remaining pre-attack effects.
replace(
'''  if (hasAbility(runtime, attacker, 'Lazy')) {
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.damage * 2)
    attacker.damage *= 0.9
  }''',
'''  if (hasAbility(runtime, attacker, 'Lazy')) {
    runAbilityTrace(runtime, attacker, 'Lazy', () => {
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.damage * 2)
      attacker.damage *= 0.9
    })
  }''',
    'Lazy trace',
)
replace("  if (hasAbility(runtime, attacker, 'Twilight Sparkle') && rand(runtime, attacker.team) > 0.6) attacker.hp = attacker.maxHp", "  if (hasAbility(runtime, attacker, 'Twilight Sparkle') && rand(runtime, attacker.team) > 0.6) runAbilityTrace(runtime, attacker, 'Twilight Sparkle', () => { attacker.hp = attacker.maxHp })", 'Twilight Sparkle trace')
replace(
'''  if (hasAbility(runtime, attacker, 'Herbal Alchemy')) {
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.2)
    if (rand(runtime, attacker.team) > 0.5) attacker.damage *= 1.3
  }''',
'''  if (hasAbility(runtime, attacker, 'Herbal Alchemy')) {
    runAbilityTrace(runtime, attacker, 'Herbal Alchemy', () => {
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + attacker.maxHp * 0.2)
      if (rand(runtime, attacker.team) > 0.5) attacker.damage *= 1.3
    })
  }''',
    'Herbal Alchemy trace',
)

# Mechanics in dealDamage that live outside offensive()/defensive()/retro hooks.
replace(
'''  if (confusionSelfHit) {
    const observer = active(runtime, OTHER_TEAM[attacker.team])
    if (observer && hasAbility(runtime, observer, 'Beyond Comprehension')) boostStats(observer, 1.5)
  }''',
'''  if (confusionSelfHit) {
    pushAbilityDebug(runtime, attacker, 'Confusion caused this attack to hit itself.')
    const observer = active(runtime, OTHER_TEAM[attacker.team])
    if (observer && hasAbility(runtime, observer, 'Beyond Comprehension')) runAbilityTrace(runtime, observer, 'Beyond Comprehension', () => boostStats(observer, 1.5))
  }''',
    'confusion self-hit trace',
)
replace("  if (attacker.status.blind && rand(runtime, attacker.team) > 0.4) damage = 0", "  if (attacker.status.blind && rand(runtime, attacker.team) > 0.4) { damage = 0; pushAbilityDebug(runtime, attacker, 'Blind caused the attack to miss.') }", 'blind miss trace')
replace(
'''        damage = 0
      } else damage = defensive(runtime, attacker, target, damage)''',
'''        damage = 0
        pushAbilityDebug(runtime, veilHolder, 'Luminescent Veil evaded an attack on ' + (effectiveCardName(target) || target.definition.name) + '; evade ' + target.counters.luminescentEvades + '/2 used.')
      } else damage = defensive(runtime, attacker, target, damage)''',
    'Luminescent Veil trace',
)
replace(
"  if (target.status.shield > 0 && damage > 0) { target.status.shield -= 1; damage = 0 }",
"  if (target.status.shield > 0 && damage > 0) { const beforeShield = target.status.shield; target.status.shield -= 1; damage = 0; pushAbilityDebug(runtime, target, 'Shield blocked the attack; shields ' + beforeShield + ' → ' + target.status.shield + '.') }",
    'generic shield trace',
)
replace(
'''  if ((target.counters.hpShield || 0) > 0 && damage > 0) {
    const absorbed = Math.min(target.counters.hpShield, damage)
    target.counters.hpShield -= absorbed
    damage -= absorbed
  }''',
'''  if ((target.counters.hpShield || 0) > 0 && damage > 0) {
    const absorbed = Math.min(target.counters.hpShield, damage)
    target.counters.hpShield -= absorbed
    damage -= absorbed
    pushAbilityDebug(runtime, target, 'ConstellarVirgo HP shield absorbed ' + compactDebugNumber(absorbed) + ' damage; ' + compactDebugNumber(target.counters.hpShield) + ' shield remains.')
  }''',
    'HP shield trace',
)
replace(
'''  if (xuanwu) {
    const redirected = Math.ceil(damage * 0.5)
    damage -= redirected
    xuanwu.hp -= Math.min(xuanwu.hp, redirected)
  }''',
'''  if (xuanwu) {
    const redirected = Math.ceil(damage * 0.5)
    damage -= redirected
    xuanwu.hp -= Math.min(xuanwu.hp, redirected)
    pushAbilityDebug(runtime, xuanwu, 'Water Shield of Xuanwu redirected ' + compactDebugNumber(redirected) + ' damage away from ' + (effectiveCardName(target) || target.definition.name) + '.')
  }''',
    'Xuanwu trace',
)
replace(
'''  const longReachTarget = hasAbility(runtime, attacker, 'Long Reach') && targetDeck[0] === target ? targetDeck[1] : undefined
  const hpTarget = longReachTarget || target''',
'''  const longReachTarget = hasAbility(runtime, attacker, 'Long Reach') && targetDeck[0] === target ? targetDeck[1] : undefined
  if (longReachTarget) pushAbilityDebug(runtime, attacker, 'Long Reach bypassed ' + (effectiveCardName(target) || target.definition.name) + ' and attacked ' + (effectiveCardName(longReachTarget) || longReachTarget.definition.name) + ' in the deck.')
  const hpTarget = longReachTarget || target''',
    'Long Reach trace',
)
replace(
'''    if (partner) partner.hp -= Math.min(partner.hp, appliedHpDamage)''',
'''    if (partner) {
      const mirrored = Math.min(partner.hp, appliedHpDamage)
      partner.hp -= mirrored
      pushAbilityDebug(runtime, hpTarget, 'Bind Fate mirrored ' + compactDebugNumber(mirrored) + ' damage onto ' + (effectiveCardName(partner) || partner.definition.name) + '.')
    }''',
    'Bind Fate mirrored damage trace',
)
replace(
'''  if (frostbiteActiveOnAttack && target.hp > 0 && runtime.rng.next() < 0.5) {
    target.hp -= Math.min(target.hp, target.maxHp * 0.2)
  }''',
'''  if (frostbiteActiveOnAttack && target.hp > 0 && runtime.rng.next() < 0.5) {
    const frostDamage = Math.min(target.hp, target.maxHp * 0.2)
    target.hp -= frostDamage
    pushAbilityDebug(runtime, target, 'Frostbite triggered for ' + compactDebugNumber(frostDamage) + ' extra damage.')
  }''',
    'Frostbite proc trace',
)
replace(
'''  if (hasAbility(runtime, active(runtime, OTHER_TEAM[attacker.team]), 'Am I Beautiful?')) {
    if (target.team === attacker.team) target.damage *= 0.8
    else target.status.confused += 1
  }''',
'''  const beautifulObserver = active(runtime, OTHER_TEAM[attacker.team])
  if (hasAbility(runtime, beautifulObserver, 'Am I Beautiful?')) {
    runAbilityTrace(runtime, beautifulObserver!, 'Am I Beautiful?', () => {
      if (target.team === attacker.team) target.damage *= 0.8
      else target.status.confused += 1
    })
  }''',
    'Am I Beautiful post-hit trace',
)
replace("  if (hasAbility(runtime, attacker, 'Disarm') && damage > 0) target.damage = Math.max(0, target.damage - damage * 0.4)", "  if (hasAbility(runtime, attacker, 'Disarm') && damage > 0) runAbilityTrace(runtime, attacker, 'Disarm', () => { target.damage = Math.max(0, target.damage - damage * 0.4) })", 'Disarm trace')
replace(
'''  if (hasAbility(runtime, attacker, 'Shiny Steal') && damage > 0 && target !== attacker) {
    const stolenDamage = target.damage * 0.1
    const stolenHp = target.maxHp * 0.1
    target.damage = Math.max(0, target.damage - stolenDamage)
    target.maxHp = Math.max(1, target.maxHp - stolenHp)
    target.hp = Math.min(target.hp, target.maxHp)
    attacker.damage += stolenDamage
    attacker.maxHp += stolenHp
    attacker.hp += stolenHp
  }''',
'''  if (hasAbility(runtime, attacker, 'Shiny Steal') && damage > 0 && target !== attacker) {
    runAbilityTrace(runtime, attacker, 'Shiny Steal', () => {
      const stolenDamage = target.damage * 0.1
      const stolenHp = target.maxHp * 0.1
      target.damage = Math.max(0, target.damage - stolenDamage)
      target.maxHp = Math.max(1, target.maxHp - stolenHp)
      target.hp = Math.min(target.hp, target.maxHp)
      attacker.damage += stolenDamage
      attacker.maxHp += stolenHp
      attacker.hp += stolenHp
    })
  }''',
    'Shiny Steal trace',
)
replace(
'''  if (hasAbility(runtime, target, 'Chimeric') && target.hp > 0 && target.hp <= target.maxHp / 2 && !target.flags.chimericFaded) {
    target.flags.chimericFaded = true
    target.maxHp /= 4; target.hp /= 4; target.damage /= 4
  }''',
'''  if (hasAbility(runtime, target, 'Chimeric') && target.hp > 0 && target.hp <= target.maxHp / 2 && !target.flags.chimericFaded) {
    runAbilityTrace(runtime, target, 'Chimeric', () => {
      target.flags.chimericFaded = true
      target.maxHp /= 4; target.hp /= 4; target.damage /= 4
    })
  }''',
    'Chimeric fade trace',
)
replace(
'''  if (hasAbility(runtime, target, 'Reveal') && !target.flags.revealed && target.hp > 0 && target.hp / target.maxHp < 0.65) {
    target.flags.revealed = true
    target.hp = target.maxHp
  }''',
'''  if (hasAbility(runtime, target, 'Reveal') && !target.flags.revealed && target.hp > 0 && target.hp / target.maxHp < 0.65) {
    runAbilityTrace(runtime, target, 'Reveal', () => {
      target.flags.revealed = true
      target.hp = target.maxHp
    })
  }''',
    'Reveal trace',
)
replace(
'''  if (damage > 0 && vamp && !didRegen && alive(attacker)) {
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + damage * vamp / 100)
  }''',
'''  if (damage > 0 && vamp && !didRegen && alive(attacker)) {
    const beforeHp = attacker.hp
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + damage * vamp / 100)
    if (attacker.hp > beforeHp) pushAbilityDebug(runtime, attacker, 'Vampire Matron aura healed ' + compactDebugNumber(attacker.hp - beforeHp) + ' HP from this hit.')
  }''',
    'Vampire Matron trace',
)
replace("  if (hasAbility(runtime, attacker, 'Infinite Dagger Works') && rand(runtime, attacker.team) > 0.5) attacker.flags.extraTurn = true", "  if (hasAbility(runtime, attacker, 'Infinite Dagger Works') && rand(runtime, attacker.team) > 0.5) { attacker.flags.extraTurn = true; pushAbilityDebug(runtime, attacker, 'Infinite Dagger Works triggered — the opponent turn will be skipped.') }", 'Infinite Dagger Works trace')

# Collateral/background attack abilities.
replace(
'''  if (hasAbility(runtime, attacker, 'Railgun')) {
    const splash = Math.ceil(dealt * 0.3)
    for (const enemy of runtime.state.teams[enemyTeam]) {
      if (enemy.hp > 0) enemy.hp -= Math.min(enemy.hp, splash)
    }
  }''',
'''  if (hasAbility(runtime, attacker, 'Railgun')) {
    runAbilityTrace(runtime, attacker, 'Railgun', () => {
      const splash = Math.ceil(dealt * 0.3)
      for (const enemy of runtime.state.teams[enemyTeam]) {
        if (enemy.hp > 0) enemy.hp -= Math.min(enemy.hp, splash)
      }
    })
  }''',
    'Railgun trace',
)
replace(
'''  if (hasAbility(runtime, attacker, 'Outshine')) {
    const deck = runtime.state.teams[enemyTeam]
    const index = deck.indexOf(target)
    const next = index >= 0 ? deck[index + 1] : deck[1]
    if (next && next.hp > 0) {
      const before = next.hp
      next.hp -= Math.min(next.hp, dealt)
      if (before > 0 && next.hp <= 0) next.flags.suppressOnDeath = true
    }
  }''',
'''  if (hasAbility(runtime, attacker, 'Outshine')) {
    runAbilityTrace(runtime, attacker, 'Outshine', () => {
      const deck = runtime.state.teams[enemyTeam]
      const index = deck.indexOf(target)
      const next = index >= 0 ? deck[index + 1] : deck[1]
      if (next && next.hp > 0) {
        const before = next.hp
        next.hp -= Math.min(next.hp, dealt)
        if (before > 0 && next.hp <= 0) next.flags.suppressOnDeath = true
      }
    })
  }''',
    'Outshine trace',
)

# Laser charge, swaps, forced sacrifice.
replace(
'''  if (!attacker.flags.laserCharged) {
    attacker.flags.laserCharged = true
    return
  }''',
'''  if (!attacker.flags.laserCharged) {
    attacker.flags.laserCharged = true
    pushAbilityDebug(runtime, attacker, 'Laser Gun is charging; it will fire on the next turn.')
    return
  }''',
    'Laser Gun charge trace',
)
replace(
'''  if (hasAbility(runtime, attacker, 'Eternal Voyage') && alive(attacker)) {
    const deck = runtime.state.teams[attacker.team]
    const selfIndex = deck.indexOf(attacker)
    const choices = deck.map((_, index) => index).filter((index) => index !== selfIndex)
    if (selfIndex >= 0 && choices.length) {
      const swapIndex = choices[Math.floor(runtime.rng.next() * choices.length)]
      ;[deck[selfIndex], deck[swapIndex]] = [deck[swapIndex], deck[selfIndex]]
    }
  }''',
'''  if (hasAbility(runtime, attacker, 'Eternal Voyage') && alive(attacker)) {
    runAbilityTrace(runtime, attacker, 'Eternal Voyage', () => {
      const deck = runtime.state.teams[attacker.team]
      const selfIndex = deck.indexOf(attacker)
      const choices = deck.map((_, index) => index).filter((index) => index !== selfIndex)
      if (selfIndex >= 0 && choices.length) {
        const swapIndex = choices[Math.floor(runtime.rng.next() * choices.length)]
        ;[deck[selfIndex], deck[swapIndex]] = [deck[swapIndex], deck[selfIndex]]
      }
    })
  }''',
    'Eternal Voyage trace',
)
replace("  if (attacker.flags.diesAfterAttack && alive(attacker)) attacker.hp = 0", "  if (attacker.flags.diesAfterAttack && alive(attacker)) { attacker.hp = 0; pushAbilityDebug(runtime, attacker, 'We Want YOU expired — the boosted card was sacrificed after its attack.') }", 'We Want YOU sacrifice trace')

# On-death resource/passive changes and Mirror Image return.
replace("  if (name === 'Nightmare Melody' && runtime.state.boosts[team].composerCount) {\n    runtime.state.boosts[team].composerCount = Math.max(0, (runtime.state.boosts[team].composerCount || 0) - 1)\n  }", "  if (name === 'Nightmare Melody' && runtime.state.boosts[team].composerCount) {\n    runtime.state.boosts[team].composerCount = Math.max(0, (runtime.state.boosts[team].composerCount || 0) - 1)\n    pushAbilityDebug(runtime, dead, 'Nightmare Melody field effect ended for this Composer.')\n  }", 'Nightmare Melody death trace')
replace("  if (name === 'Hard Boiled') runtime.state.boosts[team].fossils = (runtime.state.boosts[team].fossils || 0) + 3", "  if (name === 'Hard Boiled') { runtime.state.boosts[team].fossils = (runtime.state.boosts[team].fossils || 0) + 3; pushAbilityDebug(runtime, dead, 'Hard Boiled added 3 Fossils; total ' + runtime.state.boosts[team].fossils + '.') }", 'Hard Boiled death trace')
replace("  if (name === 'Extinction') runtime.state.boosts[team].fossils = (runtime.state.boosts[team].fossils || 0) + 2", "  if (name === 'Extinction') { runtime.state.boosts[team].fossils = (runtime.state.boosts[team].fossils || 0) + 2; pushAbilityDebug(runtime, dead, 'Extinction added 2 Fossils; total ' + runtime.state.boosts[team].fossils + '.') }", 'Extinction death trace')
replace(
'''          runtime.state.fallen[team].splice(index, 1)
          deck.unshift(mirror)''',
'''          runtime.state.fallen[team].splice(index, 1)
          deck.unshift(mirror)
          pushAbilityDebug(runtime, mirror, 'Mirror Image triggered — returned to the front at full HP after an ally died.')''',
    'Mirror Image return trace',
)

# Explicitly explain ability-driven expiry deaths.
replace("      if (attacker.counters.finalTail >= 3) attacker.hp = 0", "      if (attacker.counters.finalTail >= 3) { attacker.hp = 0; pushAbilityDebug(runtime, attacker, 'Final Tail expired after 3 turns — the card is defeated.') }", 'protected Final Tail expiry trace')
# Replace the second occurrence as well.
replace("    if (attacker.counters.finalTail >= 3) attacker.hp = 0", "    if (attacker.counters.finalTail >= 3) { attacker.hp = 0; pushAbilityDebug(runtime, attacker, 'Final Tail expired after 3 turns — the card is defeated.') }", 'Final Tail expiry trace')
replace("      if ((attacker.counters.undyingTurns || 0) <= 0) attacker.hp = 0", "      if ((attacker.counters.undyingTurns || 0) <= 0) { attacker.hp = 0; pushAbilityDebug(runtime, attacker, 'Undying expired — its survival turn ended.') }", 'protected Undying expiry trace')
replace("    if ((attacker.counters.undyingTurns || 0) <= 0) attacker.hp = 0", "    if ((attacker.counters.undyingTurns || 0) <= 0) { attacker.hp = 0; pushAbilityDebug(runtime, attacker, 'Undying expired — its survival turn ended.') }", 'Undying expiry trace')

path.write_text(source, encoding='utf-8')
print('Completed ability interaction tracing coverage.')

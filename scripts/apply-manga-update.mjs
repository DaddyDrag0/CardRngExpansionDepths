import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')
const write = (path, text) => fs.writeFileSync(path, text)
function replaceOnce(text, from, to, label) {
  const count = text.split(from).length - 1
  if (count !== 1) throw new Error(`${label}: expected one anchor, found ${count}`)
  return text.replace(from, to)
}
function upsertByName(items, value) {
  const i = items.findIndex((item) => item.name === value.name)
  if (i >= 0) items[i] = value
  else items.push(value)
}

// --- Cards ---
const cardsPath = 'src/data/cards-7.json'
const cards = JSON.parse(read(cardsPath))
for (const card of [
  { name:'Limitless Rivals', imageAssetId:110002833266451, rarity:3500000, statMultiplier:9, hpMultiplier:1, ability:'Cosmic Rivalry', weather:'Manga', pack:null, boss:false, unobtainable:false, expires:false },
  { name:'The Awakened One', imageAssetId:79559745346915, rarity:17000000, statMultiplier:9, hpMultiplier:1, ability:'Six Realms Staff', weather:'Manga', pack:'Immortal', boss:false, unobtainable:false, expires:false },
  { name:'Ultimate Brawler', imageAssetId:123755387112417, rarity:9000000, statMultiplier:9, hpMultiplier:1, ability:'Divine Ascension', weather:'Manga', pack:'Anime', boss:false, unobtainable:false, expires:false },
  { name:'The Curse', imageAssetId:109272849583933, rarity:6660666, statMultiplier:9, hpMultiplier:1, ability:'Kitchen', weather:'Manga', pack:null, boss:false, unobtainable:false, expires:false },
]) upsertByName(cards, card)
write(cardsPath, JSON.stringify(cards))

// --- Ability descriptions ---
const abilities4Path = 'src/data/abilities-4.json'
const abilities4 = JSON.parse(read(abilities4Path))
Object.assign(abilities4, {
  'Divine Ascension': "Enemy's hit chance is squared ratio of damage to your Max HP. On first Death Awaken instead.",
  'Mastered Ascension': 'Gain 1.5X Stats, dodge every other attack.',
  'Cosmic Rivalry': 'On entry, attack with 3X damage. +10% stats and Damage Reduction each turn.',
  Kitchen: 'On entry open a Domain and disable all enemy defense abilities, Slashes opponent 2-5 times dealing 35% damage each.',
  'Six Realms Staff': 'On entry, manifest 1 of 6 weapons, gaining its unique ability.',
  'Twelve Devas Axe': 'Deals 150% increased damage.',
  'Vajra Short Sword': '40% chance to parry an attack, taking no damage and reflecting 75% of its damage, capped at 75% of current HP.',
  'Staff of Perfect Enlightenment': 'Deals 25% increased damage with a 25% chance to stun. Ignores defensive abilities.',
  'Shield of Ahimsa': 'Gain a shield every other turn and take 35% less damage.',
  'War Scythe': 'On entry, attack the first 2 enemies, bypassing defensive and on-death abilities.',
  'Great Nirvana Sword - Zero': 'On entry, gain the effects of 2 random Six Realms weapons.',
})
write(abilities4Path, JSON.stringify(abilities4))

const abilities3Path = 'src/data/abilities-3.json'
const abilities3 = JSON.parse(read(abilities3Path))
abilities3['Hidden in the Depths'] = 'While not the active card, gain 10% Damage and Max HP after each allied turn. Max of 300% base'
abilities3['Fire World'] = 'Deals 4x damage, 1 turn to recharge. On entry, burn all enemies for 3 turns.'
write(abilities3Path, JSON.stringify(abilities3))

// --- Auras: mirror the exact new source multipliers, not generic caps ---
const auras1Path = 'src/data/auras-1.json'
const auras1 = JSON.parse(read(auras1Path))
function aura1(name) {
  const aura = auras1.find((item) => item.name === name)
  if (!aura) throw new Error(`Missing aura ${name}`)
  return aura
}
Object.assign(aura1('Desmond Of Despair'), {
  description: '+STAT% Stats. + 1.6171875STAT% for Seven Sins cards.',
  boostMult: 1.6171875,
  boostedCards: ['Chronus The Hoarder','Gideon The Insatiable','Lilith The Enchantress','Malik The Sovereign','Morpheus The Slumberer','Raze The Destroyer','Sable The Envious','Mother Of Beasts'],
})
Object.assign(aura1('Dinosaur King'), {
  description: '+STAT% Stats. + 1.6171875STAT% for Prehistoric Pack cards.',
  boostMult: 1.6171875,
})
Object.assign(aura1('Disease'), {
  description: '+STAT% Stats. +1.401869159STAT% for Virus cards.',
  boostMult: 1.4018691588785046,
})
Object.assign(aura1('Elohim'), {
  description: '+STAT% Stats. +1.450275362STAT% for Rapture cards.',
  boostMult: 1.4492753623188406,
})
write(auras1Path, JSON.stringify(auras1))

const auras2Path = 'src/data/auras-2.json'
const auras2 = JSON.parse(read(auras2Path))
const myths = auras2.find((item) => item.name === 'Myhts' || item.name === 'Myths')
if (!myths) throw new Error('Missing Myths aura')
myths.name = 'Myths'
const ygg = auras2.find((item) => item.name === 'Yggdrasil')
if (!ygg) throw new Error('Missing Yggdrasil aura')
Object.assign(ygg, {
  description: '+STAT% Stats. +1.312043668STAT% for Armageddon cards.',
  boostMult: 1.3100436681222707,
})
upsertByName(auras2, {
  name:'Mangeka', imageAssetId:76213153271303, rarity:500000, type:'Stat', skillName:'Drawn',
  description:'+STAT% Stats. +1.450275362STAT% for Manga cards.', base:0, perLevel:0,
  boostMult:1.4492753623188406, boostedCards:[], unobtainable:false,
})
upsertByName(auras2, {
  name:'The One Ring', imageAssetId:106592946070445, rarity:2000000, type:'Stat', skillName:'To Rule Them All',
  description:'+STAT% Stats to all non-Weather cards / Boss cards.', base:0, perLevel:0,
  boostMult:null, boostedCards:[], unobtainable:false,
})
write(auras2Path, JSON.stringify(auras2))

// --- Age data ---
let ages = read('src/data/ages.ts')
if (!ages.includes("'Nao Presence': 4")) {
  ages = replaceOnce(ages, "  Parallax: 16,\n  \"Hell's Army\": -5000,", "  Parallax: 16,\n  'Nao Presence': 4,\n  \"Hell's Army\": -5000,", 'Nao Presence age')
}
write('src/data/ages.ts', ages)

// --- Aura engine ---
let auraEngine = read('src/engine/auras.ts')
auraEngine = auraEngine.replace("  Myhts: 'Cryptid',", "  Myths: 'Cryptid',")
if (!auraEngine.includes("  Mangeka: 'Manga',")) {
  auraEngine = replaceOnce(auraEngine, "const BOOSTED_WEATHERS: Record<string, string> = {\n  Elohim: 'Rapture',", "const BOOSTED_WEATHERS: Record<string, string> = {\n  Mangeka: 'Manga',\n  Elohim: 'Rapture',", 'Mangeka weather aura')
}
auraEngine = auraEngine.replace(/\n\/\/ Aug\. 24, 2026 balance pass:[\s\S]*?const CARD_GROUP_STAT_CAPS: Record<string, number> = \{[\s\S]*?\}\n/, '\n')
auraEngine = replaceOnce(
  auraEngine,
  `  const base = getStatAuraValue(aura, border)\n  if (aura.name === 'General Sun Tzu') return base\n  if (!isStatAuraBoosted(aura, card)) return base\n\n  const boosted = base * Number(aura.boostMult || 1)\n  if (BOOSTED_WEATHERS[aura.name]) return Math.min(boosted, WEATHER_GROUP_STAT_CAP)\n\n  const cardGroupCap = CARD_GROUP_STAT_CAPS[aura.name]\n  return cardGroupCap == null ? boosted : Math.min(boosted, cardGroupCap)`,
  `  const base = getStatAuraValue(aura, border)\n  if (aura.name === 'General Sun Tzu') return base\n  if (aura.name === 'The One Ring') {\n    return !card.definition.weather && !card.definition.boss ? base : 0\n  }\n  return isStatAuraBoosted(aura, card) ? base * Number(aura.boostMult || 1) : base`,
  'stat aura source multipliers',
)
write('src/engine/auras.ts', auraEngine)

// --- RNG metadata ---
let combatData = read('src/engine/combat-data.ts')
if (!combatData.includes("'Divine Ascension'")) {
  combatData = replaceOnce(
    combatData,
    `  'Origin', "Pandora's Box", 'Naughty or Nice?', 'Snowscape',`,
    `  'Origin', "Pandora's Box", 'Naughty or Nice?', 'Snowscape', 'Divine Ascension',\n  'Six Realms Staff', 'Kitchen', 'Vajra Short Sword', 'Staff of Perfect Enlightenment',\n  'Great Nirvana Sword - Zero',`,
    'Manga RNG abilities',
  )
}
write('src/engine/combat-data.ts', combatData)

// --- Battle engine ---
let battle = read('src/engine/battle-v2.ts')
const supportedAnchor = "  'Bind Fate', 'Luminescent Veil', 'Ouroboros',\n])"
if (!battle.includes("'Cosmic Rivalry', 'Divine Ascension'")) {
  battle = replaceOnce(battle, supportedAnchor,
`  'Bind Fate', 'Luminescent Veil', 'Ouroboros',\n  'Cosmic Rivalry', 'Divine Ascension', 'Mastered Ascension', 'Kitchen', 'Six Realms Staff',\n  'Twelve Devas Axe', 'Vajra Short Sword', 'Staff of Perfect Enlightenment', 'Shield of Ahimsa',\n  'War Scythe', 'Great Nirvana Sword - Zero',\n])`, 'Manga supported abilities')
}
battle = replaceOnce(battle, "  'Lights Way',\n])", "  'Lights Way', 'Mastered Ascension',\n])", 'Mastered dodge metadata')

battle = replaceOnce(
  battle,
  `function activeBonusAbilities(card: CombatCard): string[] {\n  const root = card.definition.ability\n  if ((root === "Pandora's Box" || root === 'Heroes') && ability(card) === root) {\n    return card.bonusAbilities || []\n  }\n  return []\n}`,
  `function activeBonusAbilities(card: CombatCard): string[] {\n  const root = card.definition.ability\n  if ((root === "Pandora's Box" || root === 'Heroes') && ability(card) === root) {\n    return card.bonusAbilities || []\n  }\n  if (root === 'Six Realms Staff' && ability(card) === 'Great Nirvana Sword - Zero') {\n    return card.bonusAbilities || []\n  }\n  return []\n}`,
  'Six Realms bonus abilities',
)

// Six Realms weapon roll happens immediately on entry.
const underworldAnchor = `  if (name === 'The Underworld') {\n    const copied = [...runtime.state.fallen[card.team]].reverse()\n      .map((fallen) => ability(fallen))\n      .find((candidate) => candidate && candidate !== 'The Underworld')\n    if (copied) {\n      card.abilityOverride = copied\n      card.entered = false\n      onEntry(runtime, card)\n      return\n    }\n  }\n\n  const entryTraceBefore`
const sixRealmsBlock = `  if (name === 'The Underworld') {\n    const copied = [...runtime.state.fallen[card.team]].reverse()\n      .map((fallen) => ability(fallen))\n      .find((candidate) => candidate && candidate !== 'The Underworld')\n    if (copied) {\n      card.abilityOverride = copied\n      card.entered = false\n      onEntry(runtime, card)\n      return\n    }\n  }\n\n  if (name === 'Six Realms Staff' && !card.flags.sixRealmsRolled) {\n    card.flags.sixRealmsRolled = true\n    const weapons = [\n      'Twelve Devas Axe', 'Vajra Short Sword', 'Staff of Perfect Enlightenment',\n      'Shield of Ahimsa', 'War Scythe', 'Great Nirvana Sword - Zero',\n    ]\n    card.abilityOverride = weapons[Math.floor(runtime.rng.next() * weapons.length)]\n    card.entered = false\n    onEntry(runtime, card)\n    return\n  }\n\n  if (name === 'Great Nirvana Sword - Zero' && !card.flags.zeroWeaponsRolled) {\n    card.flags.zeroWeaponsRolled = true\n    const pool = ['Twelve Devas Axe', 'Vajra Short Sword', 'Staff of Perfect Enlightenment', 'Shield of Ahimsa', 'War Scythe']\n    const firstIndex = Math.floor(runtime.rng.next() * pool.length)\n    const first = pool[firstIndex]\n    const remaining = pool.filter((_, index) => index !== firstIndex)\n    const second = remaining[Math.floor(runtime.rng.next() * remaining.length)]\n    card.bonusAbilities = [first, second]\n    for (const gained of card.bonusAbilities) {\n      withAbility(card, gained, () => {\n        card.entered = false\n        onEntry(runtime, card)\n      })\n    }\n    card.entered = true\n    return\n  }\n\n  const entryTraceBefore`
battle = replaceOnce(battle, underworldAnchor, sixRealmsBlock, 'Six Realms entry roll')

battle = battle.replace("    case 'Fire World':\n      for (const target of runtime.state.teams[enemyTeam]) target.status.burn = 100", "    case 'Fire World':\n      for (const target of runtime.state.teams[enemyTeam]) target.status.burn = 3")

// New entry abilities.
const firstBloodAnchor = `    case 'First Blood':\n      performEntryAttack(runtime, card, 0.5)\n      break`
const mangaEntry = `    case 'Cosmic Rivalry':\n      performEntryAttack(runtime, card, 3)\n      break\n    case 'Kitchen': {\n      card.flags.kitchenDomain = true\n      const hits = 2 + Math.floor(runtime.rng.next() * 4)\n      for (let hit = 0; hit < hits; hit++) {\n        const target = active(runtime, enemyTeam)\n        if (!target || !alive(card)) break\n        dealDamage(runtime, card, target, 0.35, true)\n        resolveDeaths(runtime)\n      }\n      break\n    }\n    case 'War Scythe': {\n      if (card.flags.warScytheEntryUsed) break\n      card.flags.warScytheEntryUsed = true\n      const targets = runtime.state.teams[enemyTeam].filter(alive).slice(0, 2)\n      card.flags.warScytheEntry = true\n      for (const target of targets) {\n        if (!alive(card) || !alive(target)) continue\n        target.flags.suppressOnDeath = true\n        dealDamage(runtime, card, target, 1, true)\n        if (target.hp > 0) target.flags.suppressOnDeath = false\n        const deck = runtime.state.teams[target.team]\n        const index = deck.indexOf(target)\n        if (target.hp <= 0 && index > 0) {\n          deck.splice(index, 1)\n          target.dead = true\n          target.hp = 0\n          runtime.state.fallen[target.team].push(target)\n        }\n        resolveDeaths(runtime)\n      }\n      card.flags.warScytheEntry = false\n      break\n    }\n    case 'First Blood':\n      performEntryAttack(runtime, card, 0.5)\n      break`
battle = replaceOnce(battle, firstBloodAnchor, mangaEntry, 'Manga entry abilities')

// Offensive weapon effects + Kitchen domain attacks.
battle = replaceOnce(battle,
  "    'Dark Qi Manipulation','Chaos Destruction','ConstellarTaurus','ConstellarSagittarius','Whooping',\n  ].includes(name)) special = true",
  "    'Dark Qi Manipulation','Chaos Destruction','ConstellarTaurus','ConstellarSagittarius','Whooping',\n    'Twelve Devas Axe','Staff of Perfect Enlightenment','Kitchen','War Scythe',\n  ].includes(name)) special = true",
  'Manga offensive special list')
battle = replaceOnce(battle,
  `  switch (name) {\n    case 'True Strike': if (rand(runtime, attacker.team) > 0.5) damage *= 2; break`,
  `  switch (name) {\n    case 'Twelve Devas Axe': damage *= 2.5; break\n    case 'Staff of Perfect Enlightenment':\n      damage *= 1.25\n      bypass = true\n      if (!statusProtected(runtime, target.team) && rand(runtime, attacker.team) < 0.25) target.status.stunned = Math.max(1, target.status.stunned)\n      break\n    case 'Kitchen': bypass = true; break\n    case 'War Scythe': if (attacker.flags.warScytheEntry) bypass = true; break\n    case 'True Strike': if (rand(runtime, attacker.team) > 0.5) damage *= 2; break`,
  'Manga offensive switch')

// Defensive weapon/awakening effects.
battle = replaceOnce(battle,
  `    case 'Evasion': if (rand(runtime, target.team) > 0.9) damage = 0; break\n    case 'Finesse':`,
  `    case 'Evasion': if (rand(runtime, target.team) > 0.9) damage = 0; break\n    case 'Divine Ascension': if (rand(runtime, target.team) > Math.pow(damage / target.maxHp, 2)) damage = 0; break\n    case 'Mastered Ascension':\n      target.counters.masteredAscension = ((target.counters.masteredAscension || 0) + 1) % 2\n      if (target.counters.masteredAscension === 1) damage = 0\n      break\n    case 'Vajra Short Sword':\n      if (rand(runtime, target.team) < 0.4) {\n        const reflected = Math.min(Math.max(0, attacker.hp * 0.75), Math.max(0, damage * 0.75))\n        damage = 0\n        attacker.hp -= reflected\n      }\n      break\n    case 'Shield of Ahimsa': damage *= 0.65; break\n    case 'Cosmic Rivalry': damage *= Math.max(0, 1 - Math.min(1, target.counters.cosmicRivalryDR || 0)); break\n    case 'Finesse':`,
  'Manga defensive switch')

// War Scythe entry bypasses revive/on-death style saves.
battle = replaceOnce(battle,
  `function tryRevive(runtime: Runtime, attacker: CombatCard, target: CombatCard): boolean {\n  if (target.hp > 0) return false`,
  `function tryRevive(runtime: Runtime, attacker: CombatCard, target: CombatCard): boolean {\n  if (target.hp > 0 || attacker.flags.warScytheEntry) return false`,
  'War Scythe revive bypass')

// Ultimate Brawler awakens instead of its first death.
battle = replaceOnce(battle,
  `      if (hasAbility(runtime, card, 'Undying')) {`,
  `      if (hasAbility(runtime, card, 'Divine Ascension') && !card.flags.awakened) {\n        card.flags.awakened = true\n        card.abilityOverride = 'Mastered Ascension'\n        card.maxHp *= 1.5\n        card.damage *= 1.5\n        card.hp = card.maxHp\n        card.counters.normalDamage = (card.counters.normalDamage || card.damage / 1.5) * 1.5\n        card.counters.normalMaxHp = (card.counters.normalMaxHp || card.maxHp / 1.5) * 1.5\n        pushAbilityDebug(runtime, card, 'Divine Ascension awakened — became Mastered Ascension at 1.5× stats and full HP.')\n        changed = true\n        continue\n      }\n\n      if (hasAbility(runtime, card, 'Undying')) {`,
  'Divine Ascension awakening')

// Flat turn growth for Cosmic Rivalry + Shield of Ahimsa shield cadence.
battle = replaceOnce(battle,
  `function prepareTurn(runtime: Runtime, attacker: CombatCard) {\n  const composer = runtime.state.boosts[attacker.team]`,
  `function prepareTurn(runtime: Runtime, attacker: CombatCard) {\n  const composer = runtime.state.boosts[attacker.team]\n\n  if (hasAbility(runtime, attacker, 'Cosmic Rivalry')) {\n    runAbilityTrace(runtime, attacker, 'Cosmic Rivalry', () => {\n      const baseDamage = attacker.counters.normalDamage || attacker.damage\n      const baseMaxHp = attacker.counters.normalMaxHp || attacker.maxHp\n      attacker.damage += baseDamage * 0.1\n      attacker.maxHp += baseMaxHp * 0.1\n      attacker.hp += baseMaxHp * 0.1\n      attacker.counters.cosmicRivalryDR = Math.min(1, (attacker.counters.cosmicRivalryDR || 0) + 0.1)\n    })\n  }\n  if (hasAbility(runtime, attacker, 'Shield of Ahimsa')) {\n    attacker.counters.ahimsaTurns = (attacker.counters.ahimsaTurns || 0) + 1\n    if (attacker.counters.ahimsaTurns % 2 === 0) attacker.status.shield += 1\n  }`,
  'Manga prepare-turn effects')

// Hidden in the Depths now adds flat base-stat increments and stops at 300% base.
battle = replaceOnce(battle,
  `      runAbilityTrace(runtime, card, 'Hidden in the Depths', () => {\n        card.damage *= 1.1\n        card.maxHp *= 1.1\n        card.hp *= 1.1\n      })`,
  `      runAbilityTrace(runtime, card, 'Hidden in the Depths', () => {\n        const baseDamage = card.counters.normalDamage || card.damage\n        const baseMaxHp = card.counters.normalMaxHp || card.maxHp\n        const damageBonus = card.counters.hiddenDepthsBonusDamage || 0\n        const hpBonus = card.counters.hiddenDepthsBonusHp || 0\n        const addDamage = Math.min(baseDamage * 0.1, Math.max(0, baseDamage * 2 - damageBonus))\n        const addHp = Math.min(baseMaxHp * 0.1, Math.max(0, baseMaxHp * 2 - hpBonus))\n        card.damage += addDamage\n        card.maxHp += addHp\n        card.hp += addHp\n        card.counters.hiddenDepthsBonusDamage = damageBonus + addDamage\n        card.counters.hiddenDepthsBonusHp = hpBonus + addHp\n      })`,
  'Hidden in the Depths flat cap')

write('src/engine/battle-v2.ts', battle)

// --- Regression coverage ---
write('scripts/manga-update-regression.ts', `import { strict as assert } from 'node:assert'\nimport cards from '../src/data/cards'\nimport auras from '../src/data/auras'\nimport { createBattleStateV2, simulateBattleV2 } from '../src/engine/battle-v2'\nimport { getAttack, getHealth } from '../src/engine/stats'\nimport { getStatAuraValue, statAuraPercentForCard } from '../src/engine/auras'\nimport type { DepthsEnemy } from '../src/types'\n\nfunction card(name: string) { const c = cards.find(x => x.name === name); assert(c, 'Missing card '+name); return c }\nfunction aura(name: string) { const a = auras.find(x => x.name === name); assert(a, 'Missing aura '+name); return a }\nfunction enemy(name: string, health: number, attack: number): DepthsEnemy { return { card: card(name), power: health, health, attack } }\nfunction close(actual:number, expected:number, label:string) { assert(Math.abs(actual-expected) <= Math.max(1e-6, Math.abs(expected)*1e-9), label+': expected '+expected+', got '+actual) }\n\nfor (const [name, rarity, image, ability, pack] of [\n  ['Limitless Rivals',3500000,110002833266451,'Cosmic Rivalry',null],\n  ['The Awakened One',17000000,79559745346915,'Six Realms Staff','Immortal'],\n  ['Ultimate Brawler',9000000,123755387112417,'Divine Ascension','Anime'],\n  ['The Curse',6660666,109272849583933,'Kitchen',null],\n] as const) { const c=card(name); assert.equal(c.rarity,rarity); assert.equal(c.imageAssetId,image); assert.equal(c.statMultiplier,9); assert.equal(c.weather,'Manga'); assert.equal(c.ability,ability); assert.equal(c.pack,pack) }\n\nconst mangaAura = aura('Mangeka')\nassert.equal(getStatAuraValue(mangaAura,'Galaxy'),207)\nclose(statAuraPercentForCard(mangaAura, { definition:card('Limitless Rivals') } as any, 'Galaxy'), 300, 'Mangeka Galaxy Manga boost')\nconst oneRing = aura('The One Ring')\nassert.equal(getStatAuraValue(oneRing,'Galaxy'),315)\nclose(statAuraPercentForCard(oneRing, { definition:card('Arthur') } as any, 'Galaxy'),315,'One Ring normal card')\nclose(statAuraPercentForCard(oneRing, { definition:card('Limitless Rivals') } as any, 'Galaxy'),0,'One Ring excludes weather')\nclose(statAuraPercentForCard(aura('Dinosaur King'), { definition:card('Ankylosaurus') } as any, 'Galaxy'),414,'Dino exact group multiplier')\nclose(statAuraPercentForCard(aura('Elohim'), { definition:cards.find(c=>c.weather==='Rapture')! } as any, 'Galaxy'),300,'Elohim exact group multiplier')\nconst satan=aura('Satan'); const blood=cards.find(c=>c.weather==='Blood Rain'); assert(blood); assert(statAuraPercentForCard(satan,{definition:blood} as any,'Galaxy') > 300,'Satan must not inherit the new 300% cap')\n\nconst brawler=card('Ultimate Brawler')\nconst brawl=simulateBattleV2({cards:[{cardName:'Ultimate Brawler',borders:[]}]},[enemy('Shining Armor',1e30,1e30)],81123,2,false,true)\nconst ub=[...brawl.state.teams.Allies,...brawl.state.fallen.Allies].find(c=>c.definition.name==='Ultimate Brawler'); assert(ub); assert.equal(ub.abilityOverride,'Mastered Ascension'); close(ub.maxHp,getHealth(brawler)*1.5,'Brawler awakened HP'); close(ub.damage,getAttack(brawler)*1.5,'Brawler awakened ATK')\n\nfor (let seed=1; seed<=12; seed++) { const result=simulateBattleV2({cards:[{cardName:'The Awakened One',borders:[]}]},[enemy('Shining Armor',1e30,0)],90000+seed,1); assert.equal(result.trusted,true,'Six Realms seed '+seed+' must be supported') }\n\nconst baseArthur=getHealth(card('Arthur'))\nconst ringState=createBattleStateV2({cards:[{cardName:'Arthur',borders:[]}],statAura:{auraName:'The One Ring',border:'Galaxy'}},[])\nclose(ringState.teams.Allies[0].maxHp,baseArthur*4.15,'One Ring 315% stat application')\nconsole.log('Manga weather regression passed.')\n`)

const packagePath = 'package.json'
const pkg = JSON.parse(read(packagePath))
if (!pkg.scripts['test:engine'].includes('manga-update-regression.ts')) pkg.scripts['test:engine'] += ' && tsx scripts/manga-update-regression.ts'
write(packagePath, JSON.stringify(pkg, null, 2) + '\n')

console.log('Applied Manga weather data + engine update.')

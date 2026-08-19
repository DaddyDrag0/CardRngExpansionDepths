from pathlib import Path
import json


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 anchor, found {count}")
    return text.replace(old, new, 1)


# Aura data from the uploaded NEW Roblox place.
aura_paths = [Path('src/data/auras-1.json'), Path('src/data/auras-2.json')]
aura_sets = [json.loads(path.read_text()) for path in aura_paths]
all_auras = [aura for group in aura_sets for aura in group]
by_name = {aura['name']: aura for aura in all_auras}

rarity_updates = {
    'Cedric Of Charity': 1_000_000_000,
    'Armin Of Humility': 2_000_000_000,
    'Krug Of Temperance': 3_000_000_000,
    'Lena Of Purity': 4_000_000_000,
    'Bruno Of Diligence': 5_000_000_000,
    'Skye Of Patience': 6_000_000_000,
    'Celeste Of Kindness': 10_000,
}
for name, rarity in rarity_updates.items():
    if name not in by_name:
        raise SystemExit(f'Missing existing aura: {name}')
    by_name[name]['rarity'] = rarity

new_auras = [
    {
        'name': 'Storm Spirit',
        'imageAssetId': 122395418589527,
        'rarity': 750000,
        'type': 'Skill',
        'skillName': 'Overcharge',
        'description': 'STAT% chance after attacking to immediately attack again at 50% damage.',
        'base': 0,
        'perLevel': 0,
        'boostMult': None,
        'boostedCards': [],
        'unobtainable': False,
    },
    {
        'name': 'Guardian Angel',
        'imageAssetId': 82142499843490,
        'rarity': 15000000,
        'type': 'Skill',
        'skillName': 'Divine Intervention',
        'description': 'STAT% chance to prevent an ally from taking lethal damage, leaving them at 1 HP. Can activate once per ally.',
        'base': 0,
        'perLevel': 0,
        'boostMult': None,
        'boostedCards': [],
        'unobtainable': False,
    },
    {
        'name': 'Executioner',
        'imageAssetId': 107112410200129,
        'rarity': 15000,
        'type': 'Skill',
        'skillName': 'No Mercy',
        'description': 'Deal STAT% increased damage to enemies below 30% HP.',
        'base': 0,
        'perLevel': 0,
        'boostMult': None,
        'boostedCards': [],
        'unobtainable': False,
    },
    {
        'name': 'Mirror Knight',
        'imageAssetId': 119683077397825,
        'rarity': 250000,
        'type': 'Skill',
        'skillName': 'Retribution',
        'description': 'Reflect STAT% of damage taken back to the attacker.',
        'base': 0,
        'perLevel': 0,
        'boostMult': None,
        'boostedCards': [],
        'unobtainable': False,
    },
    {
        'name': 'Final Testament',
        'imageAssetId': 137681758300466,
        'rarity': 400000,
        'type': 'Skill',
        'skillName': 'Inheritance',
        'description': 'When an ally dies, the next ally inherits STAT% of its Stats.',
        'base': 0,
        'perLevel': 0,
        'boostMult': None,
        'boostedCards': [],
        'unobtainable': False,
    },
]
for aura in new_auras:
    if aura['name'] in by_name:
        by_name[aura['name']].update(aura)
    else:
        aura_sets[1].append(aura)
        by_name[aura['name']] = aura

for path, group in zip(aura_paths, aura_sets):
    path.write_text(json.dumps(group, ensure_ascii=False, separators=(',', ':')))

# Aura borders and combat boost types.
p = Path('src/types.ts')
t = p.read_text()
t = replace_once(
    t,
    "export type AuraBorderName = 'Platinum' | 'Crystal' | 'Galaxy'",
    "export type AuraBorderName = 'Platinum' | 'Crystal' | 'Ruby' | 'Galaxy'",
    'AuraBorderName Ruby',
)
t = replace_once(
    t,
    "  endTimes?: number\n  vampireMatron?: number\n  fossils?: number\n",
    "  endTimes?: number\n  vampireMatron?: number\n  stormSpirit?: number\n  guardianAngel?: number\n  executioner?: number\n  mirrorKnight?: number\n  finalTestament?: number\n  fossils?: number\n",
    'new aura battle boosts',
)
p.write_text(t)

# Aura values and direct engine plumbing.
p = Path('src/engine/auras.ts')
t = p.read_text()
t = replace_once(
    t,
    "  Platinum: 10,\n  Crystal: 100,\n  Galaxy: 1_000,\n",
    "  Platinum: 10,\n  Crystal: 100,\n  Ruby: 500,\n  Galaxy: 1_000,\n",
    'Ruby aura rarity multiplier',
)
t = replace_once(
    t,
    "  Platinum: 1,\n  Crystal: 2,\n  Galaxy: 3,\n",
    "  Platinum: 1,\n  Crystal: 2,\n  // Current Roblox client source omits Ruby from the Skill-aura tier table,\n  // so Ruby Skill auras resolve to the base tier even though Stat auras use x500 rarity.\n  Ruby: 0,\n  Galaxy: 3,\n",
    'Ruby skill tier behavior',
)
t = replace_once(
    t,
    "const CUSTOM_SKILL_VALUES: Record<string, readonly [number, number, number, number]> = {",
    "const CUSTOM_SKILL_VALUES: Record<string, readonly number[]> = {",
    'variable custom aura values',
)
t = replace_once(
    t,
    "  'Synth Human': [8, 10, 12, 15],\n}",
    "  'Synth Human': [8, 10, 12, 15],\n  'Storm Spirit': [10, 15, 20, 30],\n  'Guardian Angel': [10, 15, 20, 30],\n  Executioner: [15, 25, 35, 50],\n  'Mirror Knight': [10, 15, 20, 30],\n  // The NEW source contains a fifth 15% entry, but its current generic tier map never selects it.\n  'Final Testament': [5, 7.5, 10, 12.5, 15],\n}",
    'new custom skill values',
)
t = replace_once(
    t,
    "  if (custom) return custom[tier]\n",
    "  if (custom) return custom[tier] ?? custom[0] ?? 0\n",
    'custom aura value fallback',
)
t = replace_once(
    t,
    "  'End Times': 'endTimes',\n  'Vampire Matron': 'vampireMatron',\n}",
    "  'End Times': 'endTimes',\n  'Vampire Matron': 'vampireMatron',\n  'Storm Spirit': 'stormSpirit',\n  'Guardian Angel': 'guardianAngel',\n  Executioner: 'executioner',\n  'Mirror Knight': 'mirrorKnight',\n  'Final Testament': 'finalTestament',\n}",
    'new direct skill aura keys',
)
p.write_text(t)

# New blue-aura battle mechanics.
p = Path('src/engine/battle-v2.ts')
t = p.read_text()
t = replace_once(
    t,
    "  const off = offensive(runtime, attacker, target, damage)\n  damage = off.damage\n  bypass = bypass || off.bypass\n",
    "  const off = offensive(runtime, attacker, target, damage)\n  damage = off.damage\n  bypass = bypass || off.bypass\n\n  const executioner = runtime.state.boosts[attacker.team].executioner\n  if (executioner && target.maxHp > 0 && target.hp / target.maxHp < 0.3) {\n    damage *= 1 + executioner / 100\n  }\n",
    'Executioner damage hook',
)
t = replace_once(
    t,
    "  const appliedHpDamage = Math.min(hpTarget.hp, damage)\n  hpTarget.hp -= appliedHpDamage\n  if (appliedHpDamage > 0 && (hpTarget.counters.bindFatePair || 0) > 0) {\n",
    "  const appliedHpDamage = Math.min(hpTarget.hp, damage)\n  hpTarget.hp -= appliedHpDamage\n\n  const mirrorKnight = runtime.state.boosts[hpTarget.team].mirrorKnight\n  if (appliedHpDamage > 0 && attacker !== hpTarget && mirrorKnight && alive(attacker)) {\n    const reflected = Math.min(attacker.hp, appliedHpDamage * mirrorKnight / 100)\n    if (reflected > 0) {\n      attacker.hp -= reflected\n      pushAbilityDebug(runtime, hpTarget, 'Mirror Knight aura reflected ' + compactDebugNumber(reflected) + ' damage back to ' + (effectiveCardName(attacker) || attacker.definition.name) + '.')\n    }\n  }\n\n  if (appliedHpDamage > 0 && (hpTarget.counters.bindFatePair || 0) > 0) {\n",
    'Mirror Knight reflection hook',
)
t = replace_once(
    t,
    "      const card = deck[0]\n      if (!card || card.hp > 0) continue\n\n      if (hasAbility(runtime, card, 'Undying')) {\n",
    "      const card = deck[0]\n      if (!card || card.hp > 0) continue\n\n      const guardianAngel = runtime.state.boosts[team].guardianAngel\n      if (guardianAngel && !card.flags.guardianAngelUsed && runtime.rng.next() * 100 < guardianAngel) {\n        card.flags.guardianAngelUsed = true\n        card.hp = 1\n        pushAbilityDebug(runtime, card, 'Guardian Angel prevented lethal damage and left this ally at 1 HP. Its one save for this ally is now used.')\n        changed = true\n        continue\n      }\n\n      if (hasAbility(runtime, card, 'Undying')) {\n",
    'Guardian Angel lethal prevention',
)
t = replace_once(
    t,
    "      card.dead = true\n      runtime.state.fallen[team].push(card)\n      if (runtime.captureDebug) pushDebugEvent(runtime, {\n",
    "      card.dead = true\n      runtime.state.fallen[team].push(card)\n\n      const finalTestament = runtime.state.boosts[team].finalTestament\n      const inheritor = deck[0]\n      if (inheritor && finalTestament) {\n        const inheritedDamage = card.damage * finalTestament / 100\n        const inheritedHp = card.maxHp * finalTestament / 100\n        inheritor.damage += inheritedDamage\n        inheritor.maxHp += inheritedHp\n        inheritor.hp += inheritedHp\n        pushAbilityDebug(runtime, card, 'Final Testament passed ' + finalTestament + '% of its ATK and Max HP to ' + (effectiveCardName(inheritor) || inheritor.definition.name) + '.')\n      }\n\n      if (runtime.captureDebug) pushDebugEvent(runtime, {\n",
    'Final Testament inheritance hook',
)
t = replace_once(
    t,
    "      if (hasAbility(runtime, attacker, 'Black Flash') && alive(attacker) && target.hp > 0) {\n        dealDamage(runtime, attacker, target, 0.5, true)\n      }\n      resolveDeaths(runtime)\n    }\n",
    "      if (hasAbility(runtime, attacker, 'Black Flash') && alive(attacker) && target.hp > 0) {\n        dealDamage(runtime, attacker, target, 0.5, true)\n      }\n      resolveDeaths(runtime)\n\n      const stormSpirit = runtime.state.boosts[attacker.team].stormSpirit\n      const stormTarget = active(runtime, enemyTeam)\n      if (stormSpirit && stormTarget && alive(attacker) && runtime.rng.next() * 100 < stormSpirit) {\n        pushAbilityDebug(runtime, attacker, 'Storm Spirit triggered — immediately attacking again at 50% damage.')\n        const stormDamage = dealDamage(runtime, attacker, stormTarget, 0.5)\n        applyCollateralAfterHit(runtime, attacker, stormTarget, stormDamage)\n        resolveDeaths(runtime)\n      }\n    }\n",
    'Storm Spirit follow-up hook',
)
p.write_text(t)

# Tower search: quick search knows the new blue auras; intensive search tries Ruby too.
p = Path('src/engine/tower.ts')
t = p.read_text()
t = replace_once(
    t,
    "const CHEESE_AURAS = [null, 'End Times', 'Flame Wizard'] as const",
    "const CHEESE_AURAS = [null, 'End Times', 'Flame Wizard', 'Storm Spirit', 'Guardian Angel', 'Executioner', 'Mirror Knight', 'Final Testament'] as const",
    'quick Tower aura pool',
)
t = replace_once(
    t,
    "  // Stage 3: test the two known cheese auras plus no aura. Aura choice is allowed to rescue a team\n",
    "  // Stage 3: test the curated cheese auras plus no aura. Aura choice is allowed to rescue a team\n",
    'quick aura comment',
)
t = replace_once(
    t,
    "  const borders = [null, 'Platinum', 'Crystal', 'Galaxy'] as const",
    "  const borders = [null, 'Platinum', 'Crystal', 'Ruby', 'Galaxy'] as const",
    'Ruby intensive aura border',
)
t = t.replace('Base/Platinum/Crystal/Galaxy', 'Base/Platinum/Crystal/Ruby/Galaxy')
p.write_text(t)

# Browser UI: Ruby aura border + source-faithful custom values.
p = Path('index.html')
t = p.read_text()
t = replace_once(
    t,
    "  const AURA_RARITY_MULT={Platinum:10,Crystal:100,Galaxy:1000},AURA_BORDERS=Object.keys(AURA_RARITY_MULT),AURA_TIER={'':0,Platinum:1,Crystal:2,Galaxy:3};",
    "  const AURA_RARITY_MULT={Platinum:10,Crystal:100,Ruby:500,Galaxy:1000},AURA_BORDERS=Object.keys(AURA_RARITY_MULT),AURA_TIER={'':0,Platinum:1,Crystal:2,Ruby:0,Galaxy:3};",
    'UI Ruby aura border',
)
t = replace_once(
    t,
    "  const AURA_CUSTOM={Berserker:[5,10,15,20],'Flame Wizard':[15,25,35,50],Shielder:[2,5,7,10],'Synth Human':[8,10,12,15]};",
    "  const AURA_CUSTOM={Berserker:[5,10,15,20],'Flame Wizard':[15,25,35,50],Shielder:[2,5,7,10],'Synth Human':[8,10,12,15],'Storm Spirit':[10,15,20,30],'Guardian Angel':[10,15,20,30],Executioner:[15,25,35,50],'Mirror Knight':[10,15,20,30],'Final Testament':[5,7.5,10,12.5,15]};",
    'UI new aura values',
)
t = replace_once(
    t,
    "const tier=AURA_TIER[border]||0,custom=AURA_CUSTOM[aura.name];return custom?custom[tier]:(Number(aura.base)||0)+(Number(aura.perLevel)||0)*tier}",
    "const tier=AURA_TIER[border]||0,custom=AURA_CUSTOM[aura.name];return custom?(custom[tier]??custom[0]??0):(Number(aura.base)||0)+(Number(aura.perLevel)||0)*tier}",
    'UI custom aura fallback',
)
t = t.replace('Base/Platinum/Crystal/Galaxy', 'Base/Platinum/Crystal/Ruby/Galaxy')
p.write_text(t)

# Tower regression: End Times now has Base + four bordered variants.
p = Path('scripts/tower-cheese-search-regression.ts')
t = p.read_text()
t = replace_once(
    t,
    "assert.equal(noEndTimesPlan.auraVariants, intensivePlan.auraVariants - 4, 'Disabling End Times should remove its Base/Platinum/Crystal/Galaxy variants')",
    "assert.equal(noEndTimesPlan.auraVariants, intensivePlan.auraVariants - 5, 'Disabling End Times should remove its Base/Platinum/Crystal/Ruby/Galaxy variants')",
    'End Times Ruby regression',
)
p.write_text(t)

# Source-data regression for the NEW blue auras and the Ruby behavior found in the Roblox client.
Path('scripts/new-aura-regression.ts').write_text("""import assert from 'node:assert/strict'
import { buildSkillAuraBoosts, getAura, getAuraRarity, getSkillAuraValue } from '../src/engine/auras'

const expected = [
  ['Storm Spirit', 'stormSpirit', [10, 15, 20, 10, 30]],
  ['Guardian Angel', 'guardianAngel', [10, 15, 20, 10, 30]],
  ['Executioner', 'executioner', [15, 25, 35, 15, 50]],
  ['Mirror Knight', 'mirrorKnight', [10, 15, 20, 10, 30]],
  ['Final Testament', 'finalTestament', [5, 7.5, 10, 5, 12.5]],
] as const

for (const [name, boostKey, values] of expected) {
  const aura = getAura(name)
  assert.ok(aura, `Missing new aura ${name}`)
  assert.equal(aura.unobtainable, false, `${name} should be obtainable`)
  assert.equal(getSkillAuraValue(aura, null), values[0], `${name} Base value`)
  assert.equal(getSkillAuraValue(aura, 'Platinum'), values[1], `${name} Platinum value`)
  assert.equal(getSkillAuraValue(aura, 'Crystal'), values[2], `${name} Crystal value`)
  assert.equal(getSkillAuraValue(aura, 'Ruby'), values[3], `${name} Ruby value should match the current Roblox client tier map`)
  assert.equal(getSkillAuraValue(aura, 'Galaxy'), values[4], `${name} Galaxy value`)
  const built = buildSkillAuraBoosts({ auraName: name })
  assert.equal(built.implemented, true, `${name} must be implemented by the simulator`)
  assert.equal((built.boosts as unknown as Record<string, number>)[boostKey], values[0], `${name} combat boost`)
}

const adventurer = getAura('Adventurer')
assert.ok(adventurer)
assert.equal(getAuraRarity(adventurer, 'Ruby'), adventurer.rarity * 500, 'Ruby Stat Aura rarity multiplier should be x500')

const virtueRarities: Record<string, number> = {
  'Cedric Of Charity': 1_000_000_000,
  'Armin Of Humility': 2_000_000_000,
  'Krug Of Temperance': 3_000_000_000,
  'Lena Of Purity': 4_000_000_000,
  'Bruno Of Diligence': 5_000_000_000,
  'Skye Of Patience': 6_000_000_000,
  'Celeste Of Kindness': 10_000,
}
for (const [name, rarity] of Object.entries(virtueRarities)) {
  assert.equal(getAura(name)?.rarity, rarity, `${name} rarity should match NEW source`)
}

console.log('New blue aura + Ruby aura regression passed.')
""")

p = Path('package.json')
package = json.loads(p.read_text())
engine = package['scripts']['test:engine']
if 'scripts/new-aura-regression.ts' not in engine:
    package['scripts']['test:engine'] = engine + ' && tsx scripts/new-aura-regression.ts'
p.write_text(json.dumps(package, indent=2) + '\n')

print('NEW blue auras, Ruby aura border, and aura-source differences applied.')

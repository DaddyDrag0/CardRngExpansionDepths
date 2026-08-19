from pathlib import Path


def replace_once(path: str, old: str, new: str, label: str) -> None:
    file = Path(path)
    text = file.read_text(encoding='utf-8')
    if old not in text:
        raise SystemExit(f'Missing expected text for {label} in {path}')
    file.write_text(text.replace(old, new, 1), encoding='utf-8')


def replace_all(path: str, old: str, new: str, label: str) -> None:
    file = Path(path)
    text = file.read_text(encoding='utf-8')
    if old not in text:
        raise SystemExit(f'Missing expected text for {label} in {path}')
    file.write_text(text.replace(old, new), encoding='utf-8')


replace_once(
    'src/types.ts',
    "export type AuraBorderName = 'Platinum' | 'Crystal' | 'Ruby' | 'Galaxy'",
    "export type AuraBorderName = 'Platinum' | 'Crystal' | 'Galaxy'",
    'AuraBorderName',
)

replace_once(
    'src/engine/auras.ts',
    "  Crystal: 100,\n  Ruby: 500,\n  Galaxy: 1_000,",
    "  Crystal: 100,\n  Galaxy: 1_000,",
    'aura rarity Ruby multiplier',
)
replace_once(
    'src/engine/auras.ts',
    "  Crystal: 2,\n  // Current Roblox client source omits Ruby from the Skill-aura tier table,\n  // so Ruby Skill auras resolve to the base tier even though Stat auras use x500 rarity.\n  Ruby: 0,\n  Galaxy: 3,",
    "  Crystal: 2,\n  Galaxy: 3,",
    'aura Ruby tier',
)
replace_once(
    'src/engine/auras.ts',
    "  // The NEW source contains a fifth 15% entry, but its current generic tier map never selects it.\n  'Final Testament': [5, 7.5, 10, 12.5, 15],",
    "  // The NEW source contains a fifth 15% entry, but Aura cards only use Base/Platinum/Crystal/Galaxy.\n  'Final Testament': [5, 7.5, 10, 12.5, 15],",
    'Final Testament source note',
)

replace_once(
    'src/engine/tower.ts',
    "  const borders = [null, 'Platinum', 'Crystal', 'Ruby', 'Galaxy'] as const",
    "  const borders = [null, 'Platinum', 'Crystal', 'Galaxy'] as const",
    'Tower intensive aura borders',
)
replace_all(
    'src/engine/tower.ts',
    'Base/Platinum/Crystal/Ruby/Galaxy',
    'Base/Platinum/Crystal/Galaxy',
    'Tower Ruby aura text',
)

replace_once(
    'index.html',
    "const AURA_RARITY_MULT={Platinum:10,Crystal:100,Ruby:500,Galaxy:1000},AURA_BORDERS=Object.keys(AURA_RARITY_MULT),AURA_TIER={'':0,Platinum:1,Crystal:2,Ruby:0,Galaxy:3};",
    "const AURA_RARITY_MULT={Platinum:10,Crystal:100,Galaxy:1000},AURA_BORDERS=Object.keys(AURA_RARITY_MULT),AURA_TIER={'':0,Platinum:1,Crystal:2,Galaxy:3};",
    'UI aura border data',
)
replace_all(
    'index.html',
    'Base/Platinum/Crystal/Ruby/Galaxy',
    'Base/Platinum/Crystal/Galaxy',
    'UI Ruby aura text',
)

new_aura = Path('scripts/new-aura-regression.ts')
text = new_aura.read_text(encoding='utf-8')
text = text.replace(
    "import { buildSkillAuraBoosts, getAura, getAuraRarity, getSkillAuraValue } from '../src/engine/auras'",
    "import { buildSkillAuraBoosts, getAura, getSkillAuraValue } from '../src/engine/auras'",
)
text = text.replace("['Storm Spirit', 'stormSpirit', [10, 15, 20, 10, 30]]", "['Storm Spirit', 'stormSpirit', [10, 15, 20, 30]]")
text = text.replace("['Guardian Angel', 'guardianAngel', [10, 15, 20, 10, 30]]", "['Guardian Angel', 'guardianAngel', [10, 15, 20, 30]]")
text = text.replace("['Executioner', 'executioner', [15, 25, 35, 15, 50]]", "['Executioner', 'executioner', [15, 25, 35, 50]]")
text = text.replace("['Mirror Knight', 'mirrorKnight', [10, 15, 20, 10, 30]]", "['Mirror Knight', 'mirrorKnight', [10, 15, 20, 30]]")
text = text.replace("['Final Testament', 'finalTestament', [5, 7.5, 10, 5, 12.5]]", "['Final Testament', 'finalTestament', [5, 7.5, 10, 12.5]]")
text = text.replace("  assert.equal(getSkillAuraValue(aura, 'Ruby'), values[3], `${name} Ruby value should match the current Roblox client tier map`)\n  assert.equal(getSkillAuraValue(aura, 'Galaxy'), values[4], `${name} Galaxy value`)", "  assert.equal(getSkillAuraValue(aura, 'Galaxy'), values[3], `${name} Galaxy value`)")
text = text.replace("\nconst adventurer = getAura('Adventurer')\nassert.ok(adventurer)\nassert.equal(getAuraRarity(adventurer, 'Ruby'), adventurer.rarity * 500, 'Ruby Stat Aura rarity multiplier should be x500')\n", "\n")
text = text.replace("console.log('New blue aura + Ruby aura regression passed.')", "console.log('New blue aura regression passed.')")
if "'Ruby'" in text or 'Ruby aura' in text:
    raise SystemExit('Ruby aura references remain in scripts/new-aura-regression.ts')
new_aura.write_text(text, encoding='utf-8')

replace_once(
    'scripts/tower-cheese-search-regression.ts',
    "assert.equal(noEndTimesPlan.auraVariants, intensivePlan.auraVariants - 5, 'Disabling End Times should remove its Base/Platinum/Crystal/Ruby/Galaxy variants')",
    "assert.equal(noEndTimesPlan.auraVariants, intensivePlan.auraVariants - 4, 'Disabling End Times should remove its Base/Platinum/Crystal/Galaxy variants')",
    'Tower End Times aura variant count',
)

print('Removed Ruby from Aura borders while keeping Ruby as a normal card border.')

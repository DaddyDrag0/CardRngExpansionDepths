from pathlib import Path
import json

path = Path('src/engine/battle-v2.ts')
text = path.read_text()

replacements = [
    (
        """    case 'Immortal':
      card.maxHp *= 3.5
      card.hp *= 3.5
      break
""",
        """    case 'Immortal':
      // Typhon was nerfed from +250% HP to +200% HP: 3x total HP.
      card.maxHp *= 3
      card.hp *= 3
      break
""",
    ),
    (
        """  if (hasAbility(runtime, attacker, 'Patience')) runAbilityTrace(runtime, attacker, 'Patience', () => boostStats(attacker, 1.3))
""",
        """  if (hasAbility(runtime, attacker, 'Patience')) runAbilityTrace(runtime, attacker, 'Patience', () => { attacker.damage *= 1.3 })
""",
    ),
    (
        """function luminescentVeilHolder(runtime: Runtime, team: BattleTeam): CombatCard | undefined {
  return runtime.state.teams[team].find((card) => alive(card) && hasAbility(runtime, card, 'Luminescent Veil'))
}
""",
        """function luminescentVeilHolder(runtime: Runtime, team: BattleTeam): CombatCard | undefined {
  return runtime.state.teams[team].find((card) => alive(card) && hasAbility(runtime, card, 'Luminescent Veil'))
}

function luminescentVeilCanAffect(attacker: CombatCard): boolean {
  const name = effectiveCardName(attacker) || attacker.definition.name
  return name !== 'Kira' && name !== 'Judgment Day'
}
""",
    ),
    (
        """    if (veilHolder && successfulEvades < 2) {
""",
        """    if (veilHolder && luminescentVeilCanAffect(attacker) && successfulEvades < 2) {
""",
    ),
    (
        """function lifestealFraction(runtime: Runtime, attacker: CombatCard, base: number): number {
  const vamp = runtime.state.boosts[attacker.team].vampireMatron
  return vamp ? base * (100 + vamp * 5) / 100 : base
}
""",
        """function vampireMatronCanHeal(card: CombatCard): boolean {
  const name = effectiveCardName(card) || card.definition.name
  return name !== 'Odin' && name !== 'Gilgamesh'
}

function lifestealFraction(runtime: Runtime, attacker: CombatCard, base: number): number {
  const vamp = runtime.state.boosts[attacker.team].vampireMatron
  return vamp && vampireMatronCanHeal(attacker) ? base * (100 + vamp * 5) / 100 : base
}
""",
    ),
    (
        """  if (damage > 0 && vamp && !didRegen && alive(attacker)) {
""",
        """  if (damage > 0 && vamp && !didRegen && alive(attacker) && vampireMatronCanHeal(attacker)) {
""",
    ),
    (
        """    case 'Deadly Ambush': {
      const first = active(runtime, enemyTeam)
      if (first) {
        dealDamage(runtime, card, first)
        const current = active(runtime, enemyTeam)
        if (current && !statusProtected(runtime, current.team)) current.counters.poisonPercent = -0.15
      }
      break
    }
""",
        """    case 'Deadly Ambush': {
      const first = active(runtime, enemyTeam)
      if (first) {
        // Poison belongs to the card hit by the entry attack; do not jump it to the next
        // enemy if the entry hit kills its original target.
        dealDamage(runtime, card, first)
        if (alive(first) && !statusProtected(runtime, first.team)) first.counters.poisonPercent = -0.15
      }
      break
    }
""",
    ),
]

for old, new in replacements:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'Expected exactly one patch anchor, found {count}: {old[:90]!r}')
    text = text.replace(old, new, 1)
path.write_text(text)

abilities_path = Path('src/data/abilities-4.json')
abilities = json.loads(abilities_path.read_text())
abilities['Luminescent Veil'] = "Grants allies 40% Evasion, decreasing by 10% per successful evade to 20%, Max 2 per card. Gain 10% of prevented Damage 200% Cap. Does not work against Kira or Judgment Day."
abilities_path.write_text(json.dumps(abilities, separators=(',', ':')) + '\n')

package_path = Path('package.json')
package = package_path.read_text()
old_test = 'tsx scripts/engine-smoke.ts && tsx scripts/stall-regression.ts && tsx scripts/ability-trace-regression.ts'
new_test = old_test + ' && tsx scripts/announcement-balance-regression.ts'
if new_test not in package:
    if package.count(old_test) != 1:
        raise SystemExit('Could not find test:engine command anchor')
    package = package.replace(old_test, new_test, 1)
    package_path.write_text(package)

test_path = Path('scripts/announcement-balance-regression.ts')
test_path.write_text(r'''import { strict as assert } from 'node:assert'
import cards from '../src/data/cards'
import { simulateBattleV2 } from '../src/engine/battle-v2'
import { getAttack, getHealth } from '../src/engine/stats'
import type { DepthsEnemy, TeamLoadout } from '../src/types'

function card(name: string) {
  const found = cards.find((entry) => entry.name === name)
  assert(found, `Missing card definition: ${name}`)
  return found
}

function enemy(name: string, health: number, attack: number, power = health): DepthsEnemy {
  return { card: card(name), health, attack, power }
}

function combatCard(result: ReturnType<typeof simulateBattleV2>, team: 'Allies' | 'Enemies', name: string) {
  return [...result.state.teams[team], ...result.state.fallen[team]].find((entry) => entry.definition.name === name)
}

function close(actual: number, expected: number, label: string) {
  const tolerance = Math.max(1e-6, Math.abs(expected) * 1e-9)
  assert(Math.abs(actual - expected) <= tolerance, `${label}: expected ${expected}, got ${actual}`)
}

const typhonDef = card('Typhon')
const typhonBattle = simulateBattleV2(
  { cards: [{ cardName: 'Typhon', borders: [] }] },
  [enemy('Shining Armor', 1e30, 1e30)],
  1101, 1, false, true,
)
const typhon = combatCard(typhonBattle, 'Allies', 'Typhon')
assert(typhon, 'Typhon must exist after the regression battle.')
close(typhon.maxHp, getHealth(typhonDef) * 3, 'Typhon Immortal max HP')

const hunterDef = card('Hunter')
const hunterBattle = simulateBattleV2(
  { cards: [{ cardName: 'Hunter', borders: [] }] },
  [enemy('Shining Armor', 1e30, 1e30)],
  1102, 1, false, true,
)
const hunter = combatCard(hunterBattle, 'Allies', 'Hunter')
assert(hunter, 'Hunter must exist after the regression battle.')
close(hunter.maxHp, getHealth(hunterDef), 'Hunter Patience max HP')
close(hunter.damage, getAttack(hunterDef) * 1.3, 'Hunter Patience ATK')

const normalVampBattle = simulateBattleV2(
  {
    cards: [{ cardName: 'Shining Armor', borders: [] }],
    abilityAura: { auraName: 'Vampire Matron', border: null },
  },
  [enemy('Arthur', 1e20, getHealth(card('Shining Armor')) * 0.2)],
  1103, 1, false, true,
)
assert(
  normalVampBattle.debug?.events.some((event) => event.detail.includes('Vampire Matron aura healed')),
  'Vampire Matron should still heal ordinary allies.',
)

for (const excluded of ['Odin', 'Gilgamesh']) {
  const result = simulateBattleV2(
    {
      cards: [{ cardName: excluded, borders: [] }],
      abilityAura: { auraName: 'Vampire Matron', border: null },
    },
    [enemy('Arthur', 1e20, getHealth(card(excluded)) * 0.2)],
    excluded === 'Odin' ? 1104 : 1105, 1, false, true,
  )
  assert(
    !result.debug?.events.some((event) => event.card === excluded && event.detail.includes('Vampire Matron aura healed')),
    `Vampire Matron must not heal ${excluded}.`,
  )
}

const veilLoadout: TeamLoadout = {
  cards: [
    { cardName: 'Shining Armor', borders: [] },
    { cardName: 'Eclipseborn Luminant', borders: [] },
  ],
}
let ordinaryEvadeSeen = false
for (let seed = 1200; seed < 1230; seed++) {
  const result = simulateBattleV2(veilLoadout, [enemy('Arthur', 1e20, 100)], seed, 4, false, true)
  if (result.debug?.events.some((event) => event.detail.includes('Luminescent Veil evaded an attack'))) {
    ordinaryEvadeSeen = true
    break
  }
}
assert(ordinaryEvadeSeen, 'Luminescent Veil should still evade ordinary attackers.')

for (const excluded of ['Kira', 'Judgment Day']) {
  for (let seed = 1300; seed < 1320; seed++) {
    const result = simulateBattleV2(veilLoadout, [enemy(excluded, 1e20, 100)], seed, 4, false, true)
    assert(
      !result.debug?.events.some((event) => event.detail.includes('Luminescent Veil evaded an attack')),
      `Luminescent Veil must not evade ${excluded}.`,
    )
  }
}

const deadlyAmbushBattle = simulateBattleV2(
  { cards: [{ cardName: 'Dilophosaurus', borders: [] }] },
  [enemy('Shining Armor', 1, 1), enemy('Arthur', 1e20, 1e20)],
  1400, 2, false, true,
)
const secondEnemy = combatCard(deadlyAmbushBattle, 'Enemies', 'Arthur')
assert(secondEnemy, 'Second Deadly Ambush regression enemy must exist.')
assert.equal(secondEnemy.counters.poisonPercent || 0, 0, 'Deadly Ambush poison must not jump to the next enemy.')

console.log('Announcement balance regressions passed: Typhon, Hunter, Vampire Matron, Luminescent Veil, Deadly Ambush.')
''')

from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f'missing patch target: {label}')
    return text.replace(old, new, 1)

battle_path = Path('src/engine/battle-v2.ts')
battle = battle_path.read_text()

old_storm = """      const stormSpirit = runtime.state.boosts[attacker.team].stormSpirit
      const stormTarget = active(runtime, enemyTeam)
      if (stormSpirit && stormTarget && alive(attacker) && runtime.rng.next() * 100 < stormSpirit) {
        pushAbilityDebug(runtime, attacker, 'Storm Spirit triggered — immediately attacking again at 50% damage.')
        const stormDamage = dealDamage(runtime, attacker, stormTarget, 0.5)
        applyCollateralAfterHit(runtime, attacker, stormTarget, stormDamage)
        resolveDeaths(runtime)
      }
"""
new_storm = """      const stormSpirit = runtime.state.boosts[attacker.team].stormSpirit
      const stormTarget = active(runtime, enemyTeam)
      // In-game Overcharge only gets its post-attack proc while the card struck by the
      // primary attack is still alive. A killing primary hit does not roll Storm Spirit
      // against the next enemy that steps forward.
      if (stormSpirit && stormTarget && alive(attacker) && alive(target) && runtime.rng.next() * 100 < stormSpirit) {
        pushAbilityDebug(runtime, attacker, 'Storm Spirit triggered — immediately attacking again at 50% damage.')
        const stormDamage = dealDamage(runtime, attacker, stormTarget, 0.5)
        applyCollateralAfterHit(runtime, attacker, stormTarget, stormDamage)
        resolveDeaths(runtime)
      }
"""
battle = replace_once(battle, old_storm, new_storm, 'Storm Spirit post-kill proc')

old_horned = """    case 'Horned Attack': {
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
"""
new_horned = """    case 'Horned Attack': {
      const first = active(runtime, enemyTeam)
      if (first) {
        const hpBefore = first.hp
        const dealt = dealDamage(runtime, card, first)
        resolveDeaths(runtime)
        if (dealt > hpBefore && first.hp <= 0) {
          const next = active(runtime, enemyTeam)
          if (next) {
            const overflowDamage = Math.min(next.hp, dealt - hpBefore)
            // Preserve the live-game Triceratops overkill quirk: overflow that reaches a
            // Parallax behind the killed front card can kill Parallax without Paradox
            // retaliating into Triceratops.
            if (overflowDamage >= next.hp && hasAbility(runtime, next, 'Paradox') && !next.flags.paradox) {
              next.flags.paradox = true
              pushAbilityDebug(runtime, card, 'Horned Attack overkill bypassed Paradox on the card behind the defeated target.')
            }
            next.hp -= overflowDamage
          }
          resolveDeaths(runtime)
        }
      }
      break
    }
"""
battle = replace_once(battle, old_horned, new_horned, 'Triceratops overkill Paradox quirk')
battle_path.write_text(battle)

reg_path = Path('scripts/combat-corrections-regression.ts')
reg = reg_path.read_text()
marker = "// Calibration snapshot for the known Shuten/Desmond/Berserker deck.\n"
if marker not in reg:
    raise SystemExit('missing patch target: regression insertion point')
insert = r'''// Storm Spirit must not jump to the next enemy when the primary attack kills its target.
const stormKillLoadout: TeamLoadout = {
  cards: [{ cardName: 'Titan', borders: ['Galaxy'] }],
  abilityAura: { auraName: 'Storm Spirit', border: 'Galaxy' },
}
const stormKillEnemies: DepthsEnemy[] = [
  { card: card('Wizard'), power: 1, attack: 0, health: 1 },
  { card: card('Wizard'), power: 1, attack: 0, health: 1 },
]
for (let seed = 1; seed <= 40; seed++) {
  const battle = simulateBattleV2(stormKillLoadout, stormKillEnemies, seed, 20, true, true)
  const badProc = battle.debug.events.some((event) => event.detail?.includes('Storm Spirit triggered'))
  assert(!badProc, `Storm Spirit incorrectly proc'd after a killing primary hit on seed ${seed}`)
}

// But Storm Spirit must still proc normally when the primary target survives.
const stormSurviveEnemy: DepthsEnemy[] = [{ card: card('Titan'), power: 1_000_000_000, attack: 0, health: 1_000_000_000 }]
let sawStormProc = false
for (let seed = 1; seed <= 80 && !sawStormProc; seed++) {
  const battle = simulateBattleV2(stormKillLoadout, stormSurviveEnemy, seed, 1, true, true)
  sawStormProc = battle.debug.events.some((event) => event.detail?.includes('Storm Spirit triggered'))
}
assert(sawStormProc, 'Storm Spirit should still be able to proc when the primary target survives')
console.log('Storm Spirit kill-gate regression passed')

// Live-game quirk: Triceratops Horned Attack overkill can kill a Parallax in the
// next slot without Paradox killing Triceratops in return.
const triceratopsBattle = simulateBattleV2(
  { cards: [{ cardName: 'Triceratops', borders: [] }] },
  [
    { card: card('Wizard'), power: 10, attack: 0, health: 10 },
    { card: card('Parallax'), power: 10, attack: 0, health: 10 },
  ],
  777,
  20,
  true,
  true,
)
assert(triceratopsBattle.winner === 'Allies', `Triceratops overkill should bypass Paradox; got ${triceratopsBattle.winner}`)
assert(triceratopsBattle.state.teams.Allies.some((entry) => entry.definition.name === 'Triceratops'), 'Triceratops should survive the Parallax overkill quirk')
assert(triceratopsBattle.state.fallen.Enemies.some((entry) => entry.definition.name === 'Parallax'), 'Parallax should die to Triceratops overkill')
console.log('Triceratops overkill/Parallax regression passed')

'''
reg = reg.replace(marker, insert + marker, 1)
reg_path.write_text(reg)

print('Applied Storm Spirit kill-gate and Triceratops overkill behavior fixes.')

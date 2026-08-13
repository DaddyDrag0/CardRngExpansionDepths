from pathlib import Path

p = Path('src/engine/battle-v2.ts')
s = p.read_text()

def rep(old: str, new: str):
    global s
    if old not in s:
        raise SystemExit('patch anchor not found:\n' + old[:700])
    s = s.replace(old, new, 1)

rep(
    "import { applyStatAura, buildSkillAuraBoosts } from './auras'",
    "import { applySkillAuraTeamEffects, applyStatAura, buildSkillAuraBoosts, TOY_CARD_NAMES } from './auras'",
)

# A one-border-tier boost follows Expansion's rarity/stat ladder: Normal 1x, Platinum 4x,
# Crystal 16x, Ruby 32x, Galaxy 64x. Awakened Toy Bear caps at Galaxy-equivalent attack.
rep(
    "function borderTier(card: CombatCard): number {\n  const border = primaryBorder(card)\n  return border === 'Galaxy' ? 30 : border === 'Ruby' ? 25 : border === 'Crystal' ? 20 : border === 'Platinum' ? 10 : 0\n}\n",
    "function borderTier(card: CombatCard): number {\n  const border = primaryBorder(card)\n  return border === 'Galaxy' ? 30 : border === 'Ruby' ? 25 : border === 'Crystal' ? 20 : border === 'Platinum' ? 10 : 0\n}\n\nfunction toyBearAwakenedMultiplier(card: CombatCard, fallenToys: number): number {\n  const border = primaryBorder(card)\n  const current = border === 'Galaxy' ? 64 : border === 'Ruby' ? 32 : border === 'Crystal' ? 16 : border === 'Platinum' ? 4 : 1\n  const ladder = [1, 4, 16, 32, 64]\n  const start = Math.max(0, ladder.indexOf(current))\n  return ladder[Math.min(ladder.length - 1, start + fallenToys)] / current\n}\n",
)

# Apply whole-team skill aura effects before normal combat baselines are recorded.
rep(
    "  applyDeckPassives(allies)\n  applyDeckPassives(enemyCards)\n  const stat = applyStatAura(allies, loadout.statAura)\n  state.boosts = buildBoosts(loadout, state)",
    "  applyDeckPassives(allies)\n  applyDeckPassives(enemyCards)\n  const stat = applyStatAura(allies, loadout.statAura)\n  const skillTeam = applySkillAuraTeamEffects(allies, loadout.abilityAura)\n  state.boosts = buildBoosts(loadout, state)\n  if (skillTeam.aura && !skillTeam.implemented) state.unsupportedAbilities.add(`Aura: ${skillTeam.aura.name}`)",
)

# Awakened Toy Jack is an opposing-entry passive rather than a self-entry effect.
rep(
    "  if (enemy !== card && hasAbility(runtime, enemy, 'Desire')) stealStats(card, enemy, 0.1)\n  if (enemy !== card && hasAbility(runtime, enemy, 'Cosmic Maw')) stealStats(card, enemy, 0.2)\n",
    "  if (enemy !== card && hasAbility(runtime, enemy, 'Desire')) stealStats(card, enemy, 0.1)\n  if (enemy !== card && hasAbility(runtime, enemy, 'Cosmic Maw')) stealStats(card, enemy, 0.2)\n  if (enemy !== card && enemy.flags.awakened && hasAbility(runtime, enemy, 'Pop-Up Impression') && !statusProtected(runtime, card.team)) {\n    card.status.confused = Math.max(card.status.confused, enemy.counters.toyCount || 1)\n  }\n",
)

# Awakened Toy Bear replaces the base 2x entry attack with border-tier progression from fallen Toys.
rep(
    "    case 'Fluffy Aggression':\n      card.damage *= 2\n      break\n    case 'Speedy Progression':\n      card.counters.attacks = (card.counters.attacks || 0) + 3\n      break",
    "    case 'Fluffy Aggression':\n      if (card.flags.awakened) {\n        const fallenToys = new Set(\n          runtime.state.fallen[card.team]\n            .filter((fallen) => TOY_CARD_NAMES.has(fallen.definition.name))\n            .map((fallen) => fallen.definition.name),\n        ).size\n        card.damage *= toyBearAwakenedMultiplier(card, fallenToys)\n      } else card.damage *= 2\n      break\n    case 'Speedy Progression':\n      card.counters.attacks = (card.counters.attacks || 0) + (card.flags.awakened ? (card.counters.toyCount || 1) : 3)\n      break",
)

# Awakened Toy Jack's own entry also uses the unique-Toy count; later enemy entries are handled above.
rep(
    "    case 'Pop-Up Impression':\n      if (!statusProtected(runtime, enemy.team)) enemy.status.confused = Math.max(enemy.status.confused, 2)\n      break",
    "    case 'Pop-Up Impression':\n      if (!statusProtected(runtime, enemy.team)) {\n        const turns = card.flags.awakened ? (card.counters.toyCount || 1) : 2\n        enemy.status.confused = Math.max(enemy.status.confused, turns)\n      }\n      break",
)

# Awakened Nutcracker buffs each unique Toy by 10% whenever it actually takes damage.
rep(
    "    case 'Poke the Beast':\n      if (damage > 0 && !statusProtected(runtime, attacker.team)) attacker.status.burn = Math.max(attacker.status.burn, 2)\n      break",
    "    case 'Shelter Obsession':\n      if (damage > 0 && target.flags.awakened) {\n        const seen = new Set<string>()\n        const toyDeck = [...runtime.state.teams[target.team], ...runtime.state.fallen[target.team]]\n        for (const toy of toyDeck) {\n          if (!TOY_CARD_NAMES.has(toy.definition.name) || seen.has(toy.definition.name)) continue\n          seen.add(toy.definition.name)\n          boostStats(toy, 1.1)\n        }\n      }\n      break\n    case 'Poke the Beast':\n      if (damage > 0 && !statusProtected(runtime, attacker.team)) attacker.status.burn = Math.max(attacker.status.burn, 2)\n      break",
)

p.write_text(s)

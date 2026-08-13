from pathlib import Path

p = Path('src/engine/battle-v2.ts')
s = p.read_text()

def rep(old: str, new: str):
    global s
    if old not in s:
        raise SystemExit('patch anchor not found:\n' + old[:700])
    s = s.replace(old, new, 1)

# Yeti/Frozen Wrath applies the standard two-turn Frostbite status.
rep(
    "    case 'Frozen Wrath': target.counters.frostbite = 1; break",
    "    case 'Frozen Wrath': if (!statusProtected(runtime, target.team)) target.counters.frostbite = Math.max(target.counters.frostbite || 0, 2); break",
)

# Frostbite's 50% Max-HP loss is rolled when the already-frostbitten card is attacked.
# Capture the status before offensive effects so the attack that inflicts Frostbite does not proc itself.
rep(
    "function dealDamage(runtime: Runtime, attacker: CombatCard, originalTarget: CombatCard, mult = 1, bypass = false): number {\n  let target = originalTarget\n  if (attacker.status.confused > 0 && runtime.rng.next() < 0.5) target = attacker\n  if (attacker.status.confused > 0) attacker.status.confused -= 1\n\n  let damage = attacker.damage * mult",
    "function dealDamage(runtime: Runtime, attacker: CombatCard, originalTarget: CombatCard, mult = 1, bypass = false): number {\n  let target = originalTarget\n  if (attacker.status.confused > 0 && runtime.rng.next() < 0.5) target = attacker\n  if (attacker.status.confused > 0) attacker.status.confused -= 1\n\n  const frostbiteActiveOnAttack = (target.counters.frostbite || 0) > 0 && !statusProtected(runtime, target.team)\n\n  let damage = attacker.damage * mult",
)

rep(
    "  target.hp -= Math.min(target.hp, damage)\n\n  if (hasAbility(runtime, active(runtime, OTHER_TEAM[attacker.team]), 'Am I Beautiful?')) {",
    "  target.hp -= Math.min(target.hp, damage)\n\n  if (frostbiteActiveOnAttack && target.hp > 0 && runtime.rng.next() < 0.5) {\n    target.hp -= Math.min(target.hp, target.maxHp * 0.2)\n  }\n\n  if (hasAbility(runtime, active(runtime, OTHER_TEAM[attacker.team]), 'Am I Beautiful?')) {",
)

# Duration expires after the afflicted card completes its own turns; no stun/damage occurs here.
rep(
    "  if ((attacker.counters.frostbite || 0) > 0) {\n    attacker.counters.frostbite -= 1\n    if (runtime.rng.next() <= 0.5) {\n      attacker.status.stunned = Math.max(1, attacker.status.stunned)\n      attacker.hp -= attacker.maxHp * 0.2\n    }\n  }",
    "  if ((attacker.counters.frostbite || 0) > 0) attacker.counters.frostbite -= 1",
)

p.write_text(s)

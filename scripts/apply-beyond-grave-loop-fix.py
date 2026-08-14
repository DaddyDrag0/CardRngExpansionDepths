from pathlib import Path

p = Path('src/engine/battle-v2.ts')
s = p.read_text()
old = """      for (const revenant of revenants) {
        const fallenIndex = runtime.state.fallen[team].indexOf(revenant)
        if (fallenIndex >= 0) runtime.state.fallen[team].splice(fallenIndex, 1)
        revenant.dead = false
        revenant.hp = revenant.maxHp * 0.5
        revenant.entered = false
        runtime.state.teams[team].unshift(revenant)
      }
"""
new = """      for (const revenant of revenants) {
        // Two Beyond The Grave cards can otherwise revive each other forever.
        // Carry a chain counter only when one Beyond The Grave holder revives another;
        // unrelated ally deaths reset the chain. Resolve the pathological cycle at
        // the same 150-turn scale used by the source battle timeout.
        const beyondGraveChain = abilityNames(card).includes('Beyond The Grave')
          ? (card.counters.beyondGraveChain || 0) + 1
          : 1
        if (beyondGraveChain >= 150) continue
        const fallenIndex = runtime.state.fallen[team].indexOf(revenant)
        if (fallenIndex >= 0) runtime.state.fallen[team].splice(fallenIndex, 1)
        revenant.dead = false
        revenant.hp = revenant.maxHp * 0.5
        revenant.entered = false
        revenant.counters.beyondGraveChain = beyondGraveChain
        runtime.state.teams[team].unshift(revenant)
      }
"""
if new in s:
    print('Beyond The Grave loop guard already present.')
elif old not in s:
    raise SystemExit('Beyond The Grave anchor missing')
else:
    p.write_text(s.replace(old, new, 1))
    print('Applied Beyond The Grave loop guard.')

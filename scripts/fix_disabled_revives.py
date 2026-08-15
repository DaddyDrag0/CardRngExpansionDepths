from pathlib import Path

battle = Path('src/engine/battle-v2.ts')
s = battle.read_text(encoding='utf-8')
old = """  const name = resolvedAbility(runtime, target)\n  if (!name) return false\n  if (name === 'Revive' && !target.flags.revived && rand(runtime, target.team) > 0.5) {\n"""
new = """  const name = resolvedAbility(runtime, target)\n  // Revive-style abilities are still abilities. Respect Fuxi's Order of the Cosmos,\n  // Hell's Curse/Eclipse seals, Honor, End Times, and any other ability-disable path.\n  if (!name || !hasAbility(runtime, target, name)) return false\n  if (name === 'Revive' && !target.flags.revived && rand(runtime, target.team) > 0.5) {\n"""
if old not in s:
    raise SystemExit('tryRevive anchor not found')
s = s.replace(old, new, 1)
battle.write_text(s, encoding='utf-8')

smoke = Path('scripts/engine-smoke.ts')
t = smoke.read_text(encoding='utf-8')
anchor = """console.log('Expansion 2 card regressions passed: Bind Fate, Luminescent Veil, Ouroboros, Zombie Dragon -> Hades copy.')\n\nconsole.log(`Engine smoke tests passed: ${cards.length} cards, ${auras.length} auras.`)\n"""
insert = """console.log('Expansion 2 card regressions passed: Bind Fate, Luminescent Veil, Ouroboros, Zombie Dragon -> Hades copy.')\n\n// Ability-disable regression: revive/lethal-reset abilities must not bypass Fuxi's\n// Order of the Cosmos or Hell's Curse. Noveau Riche's Unpaid 'Interns' previously\n// revived from the shared tryRevive() path even while the card was locked/sealed.\nconst noveauRiche = cards.find((card) => card.name === 'Noveau Riche')\nassert(noveauRiche, 'Noveau Riche regression card missing')\nconst internEnemy = (): DepthsEnemy[] => [{ card: noveauRiche, power: 10, attack: 0, health: 10 }]\n\nconst fuxiLockBattle = simulateBattleV2(\n  { cards: [{ cardName: 'Fuxi', borders: ['Galaxy'] }] },\n  internEnemy(),\n  9944, 1, false, true,\n)\nconst fuxiIntern = [...fuxiLockBattle.state.teams.Enemies, ...fuxiLockBattle.state.fallen.Enemies]\n  .find((card) => card.definition.name === 'Noveau Riche')\nassert(fuxiIntern, 'Fuxi/Noveau regression target missing')\nassert((fuxiIntern.counters.interns || 0) === 0, `Order of the Cosmos failed to suppress Unpaid Interns: ${fuxiIntern.counters.interns}`)\nassert(fuxiLockBattle.state.fallen.Enemies.some((card) => card.definition.name === 'Noveau Riche'), 'Noveau Riche survived while Order of the Cosmos was active')\n\nconst hellSealBattle = simulateBattleV2(\n  { cards: [{ cardName: \"Hell's Army\", borders: ['Galaxy'] }] },\n  internEnemy(),\n  9955, 1, false, true,\n)\nconst hellIntern = [...hellSealBattle.state.teams.Enemies, ...hellSealBattle.state.fallen.Enemies]\n  .find((card) => card.definition.name === 'Noveau Riche')\nassert(hellIntern, \"Hell's Army/Noveau regression target missing\")\nassert(Boolean(hellIntern.flags.sealed), \"Hell's Curse did not seal Noveau Riche\")\nassert((hellIntern.counters.interns || 0) === 0, `Hell's Curse failed to suppress Unpaid Interns: ${hellIntern.counters.interns}`)\nassert(hellSealBattle.state.fallen.Enemies.some((card) => card.definition.name === 'Noveau Riche'), \"Noveau Riche survived after Hell's Curse removed its ability\")\nconsole.log(\"Ability-disable revive regression passed: Fuxi and Hell's Curse suppress Unpaid Interns.\")\n\nconsole.log(`Engine smoke tests passed: ${cards.length} cards, ${auras.length} auras.`)\n"""
if anchor not in t:
    raise SystemExit('engine smoke anchor not found')
t = t.replace(anchor, insert, 1)
smoke.write_text(t, encoding='utf-8')

print("Patched revive ability gating and added Fuxi/Hell's Curse regressions.")

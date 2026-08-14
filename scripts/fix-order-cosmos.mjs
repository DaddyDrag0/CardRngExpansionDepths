import fs from 'node:fs'

function patch(path, edits) {
  let text = fs.readFileSync(path, 'utf8')
  for (const [oldText, newText, label] of edits) {
    const count = text.split(oldText).length - 1
    if (count !== 1) throw new Error(`${label}: expected 1 match, found ${count}`)
    text = text.replace(oldText, newText)
  }
  fs.writeFileSync(path, text)
}

patch('src/types.ts', [
[
`  composerThreshold?: number
}`,
`  composerThreshold?: number
  noAbilities?: number
}`,
'BattleBoosts noAbilities type',
],
[
`  type: 'turn' | 'death' | 'revive' | 'stall'`,
`  type: 'turn' | 'death' | 'revive' | 'stall' | 'spawn'`,
'BattleDebug spawn event type',
],
])

patch('src/engine/battle-v2.ts', [
[
`function hasAbility(runtime: Runtime, card: CombatCard | undefined, name: string): boolean {
  if (!card || card.dead || card.flags.sealed || (card.counters.cosmosSeal || 0) > 0) return false`,
`function hasAbility(runtime: Runtime, card: CombatCard | undefined, name: string): boolean {
  if (!card || card.dead || card.flags.sealed || (runtime.state.boosts[card.team].noAbilities || 0) > 0) return false`,
'hasAbility team lock',
],
[
`    composerCount: boosts.composerCount,
    composerThreshold: boosts.composerThreshold,
  }`,
`    composerCount: boosts.composerCount,
    composerThreshold: boosts.composerThreshold,
    noAbilities: boosts.noAbilities,
  }`,
'preserve non-aura ability lock',
],
[
`    case 'Order of the Cosmos':
      for (const target of runtime.state.teams[enemyTeam]) target.counters.cosmosSeal = Math.max(target.counters.cosmosSeal || 0, 3)
      break`,
`    case 'Order of the Cosmos':
      // OG server source stores this as a team-wide NoAbilities counter.
      // It lasts for three turns TAKEN by the affected team, not three turns per card.
      runtime.state.boosts[enemyTeam].noAbilities = 3
      break`,
'Order of the Cosmos team lock',
],
[
`  if ((attacker.counters.cosmosSeal || 0) > 0) attacker.counters.cosmosSeal -= 1
}`,
`}`,
'remove per-card cosmos countdown',
],
[
`  statusEnd(runtime, attacker)
  processTeamTurnAbilities(runtime, attacker.team, attacker)
  resolveDeaths(runtime)
}`,
`  statusEnd(runtime, attacker)
  processTeamTurnAbilities(runtime, attacker.team, attacker)
  resolveDeaths(runtime)

  // Source behavior: Order of the Cosmos counts down only when the locked team
  // completes one of its turns. This also suppresses on-entry abilities while active.
  const lock = runtime.state.boosts[attacker.team].noAbilities || 0
  if (lock > 0) runtime.state.boosts[attacker.team].noAbilities = lock > 1 ? lock - 1 : undefined
}`,
'count down team ability lock',
],
[
`        counters: { normalDamage: card.damage, normalMaxHp: card.maxHp },`,
`        counters: { normalDamage: Math.ceil(card.power / 2), normalMaxHp: Math.ceil(card.power) },`,
'Nüwa spawned normal stats bookkeeping',
],
[
`      runtime.state.teams[card.team].push(created)
      break`,
`      runtime.state.teams[card.team].push(created)
      pushDebugEvent(runtime, {
        turn: runtime.state.turn,
        type: 'spawn',
        team: card.team,
        card: createdDefinition.name,
        detail: 'Creation and Restoration: Nüwa created ' + createdDefinition.name + ' at raw Power ' + Math.ceil(card.power),
        hp: created.hp,
        maxHp: created.maxHp,
        damage: created.damage,
      })
      break`,
'Nüwa debug spawn event',
],
])

const regression = `import { simulateBattleV2 } from '../src/engine/battle-v2'\nimport type { DepthsEnemy } from '../src/types'\nimport cards from '../src/data/cards'\n\nfunction card(name: string) {\n  const found = cards.find((c) => c.name === name)\n  if (!found) throw new Error('Missing card: ' + name)\n  return found\n}\n\nconst shen = card('Shén Lóng')\nconst enemies: DepthsEnemy[] = [\n  { card: shen, power: 1000, attack: 500, health: 1000 },\n]\nconst result = simulateBattleV2({ cards: [{ cardName: 'Fuxi', borders: [] }] }, enemies, 17, 20, true, true)\nconst firstTurn = result.debug?.events.find((e) => e.type === 'turn')\nif (!firstTurn?.detail.includes('defender 1000/1000 HP 500 ATK')) {\n  throw new Error('Order of the Cosmos failed to suppress Shén Lóng entry ability: ' + (firstTurn?.detail || 'no turn event'))\n}\nconsole.log('Order of the Cosmos regression passed.')\n`
fs.writeFileSync('scripts/order-cosmos-regression.ts', regression)
console.log('Applied source-aligned Order of the Cosmos fix and Nüwa debug bookkeeping.')

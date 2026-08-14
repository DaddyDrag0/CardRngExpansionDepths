import { simulateBattleV2 } from '../src/engine/battle-v2'
import type { CardDefinition, DepthsEnemy, TeamLoadout } from '../src/types'

const dummy: CardDefinition = {
  name: '__Zombie Hades Dummy__', imageAssetId: null, rarity: 1,
  statMultiplier: 1, hpMultiplier: 1, ability: null, weather: null, pack: null,
  boss: false, unobtainable: true, expires: false,
}

const loadout: TeamLoadout = {
  cards: [
    { cardName: 'Zombie Dragon', borders: [] },
    { cardName: 'Hades', borders: [] },
  ],
}
const enemies: DepthsEnemy[] = [{ card: dummy, power: 1e12, attack: 1_000_000, health: 1e12 }]
const result = simulateBattleV2(loadout, enemies, 123456789, 200, true, true)

console.log('winner', result.winner, 'turns', result.turns)
console.log('fallen allies', result.state.fallen.Allies.map((c) => ({
  name: c.definition.name,
  override: c.abilityOverride,
  unholyActive: c.flags.unholyActive,
  unholyTurns: c.counters.unholyTurns,
  poisonPercent: c.counters.poisonPercent,
})))
console.log('live allies', result.state.teams.Allies.map((c) => ({
  name: c.definition.name,
  override: c.abilityOverride,
  hp: c.hp,
  unholyActive: c.flags.unholyActive,
  unholyTurns: c.counters.unholyTurns,
})))
console.log('events')
for (const e of result.debug?.events || []) console.log(`T${e.turn} [${e.type}] ${e.team} ${e.card}: ${e.detail}`)

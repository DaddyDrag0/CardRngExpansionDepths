import assert from 'node:assert/strict'
import { simulateBattleV2 } from '../src/engine/battle-v2'
import { buildTowerEnemies } from '../src/engine/tower'

const enemies = buildTowerEnemies(['Parallax', 'Baby Skeleton', 'Baby Skeleton', 'Baby Skeleton'], 1, 'Normal')
const loadout: any = {
  cards: [{ cardName: 'Seraphim', borders: [] }],
  statAura: null,
  abilityAura: null,
}

const battle = simulateBattleV2(loadout, enemies, 1, 100, true, true)
const details = (battle.debug?.events || []).map((event) => event.detail).join('\n')
assert.match(details, /Paradox activated/)
assert.equal(battle.debug?.finalEnemies.length, 1, 'Sacred Judgment should continue hitting the snapshotted lineup after Paradox kills Seraphim')
assert.equal(battle.debug?.finalEnemies[0]?.name, 'Parallax', 'Parallax should be the only enemy left after consuming Paradox')
const babyDeaths = (battle.debug?.events || []).filter((event) => event.type === 'death' && event.team === 'Enemies' && event.card === 'Baby Skeleton').length
assert.equal(babyDeaths, 3, 'all three cards behind Parallax should still be hit and defeated by Sacred Judgment')

console.log('Sacred Judgment full-resolution regression passed.')

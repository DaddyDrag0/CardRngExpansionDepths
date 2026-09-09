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

// Parallax consumes Paradox and stays at 1 HP, but Sacred Judgment must continue
// resolving into every card that was in the lineup when the entry cast began.
const parallax = battle.debug?.finalEnemies.find((card) => card.name === 'Parallax')
assert.equal(parallax?.hp, 1, 'Parallax should survive the first Sacred Judgment hit at 1 HP after Paradox')
const babies = battle.debug?.finalEnemies.filter((card) => card.name === 'Baby Skeleton') || []
assert.equal(babies.length, 3, 'the three cards behind Parallax should still be present in the captured final snapshot')
assert.ok(babies.every((card) => card.hp <= 0), 'Sacred Judgment should still reduce every card behind Parallax to 0 HP after Seraphim dies')

console.log('Sacred Judgment full-resolution regression passed.')

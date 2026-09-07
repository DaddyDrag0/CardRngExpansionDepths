import assert from 'node:assert/strict'
import { MAX_TOWER_WIN_LOGS, simulateTowerBatchLogged } from '../src/engine/tower-logged'

const result = simulateTowerBatchLogged(
  {
    cards: Array.from({ length: 4 }, () => ({ cardName: 'Behemoth', borders: [] })),
    statAura: null,
    abilityAura: null,
  },
  ['Baby Skeleton', 'Baby Skeleton', 'Baby Skeleton', 'Baby Skeleton'],
  1,
  'Normal',
  12,
  424242,
)

assert.equal(result.runs, 12)
assert.ok(result.wins > 0, 'Easy Tower matchup should produce at least one winning run')
assert.ok(result.winningLogs.length > 0, 'Winning runs should produce representative debug logs')
assert.ok(result.winningLogs.length <= MAX_TOWER_WIN_LOGS, 'Representative logs must stay capped')
assert.ok(result.winningPatternCount >= result.winningLogs.length)
assert.ok(result.winningLogs.every((log) => log.occurrences >= 1))
assert.ok(result.winningLogs.every((log) => log.debug.initialAllies.length === 4))
assert.ok(result.winningLogs.every((log) => log.debug.initialEnemies.length === 4))
assert.ok(result.winningLogs.some((log) => log.debug.events.length > 0), 'At least one stored win should contain battle events')

console.log(`Tower win-log regression passed: ${result.wins}/${result.runs} wins, ${result.winningLogs.length} representative logs, ${result.winningPatternCount} patterns.`)

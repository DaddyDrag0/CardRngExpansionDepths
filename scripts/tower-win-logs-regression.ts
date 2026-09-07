import assert from 'node:assert/strict'
import { replayTowerWinningRun, simulateTowerBatchLogged } from '../src/engine/tower-logged'

const loadout = {
  cards: Array.from({ length: 4 }, () => ({ cardName: 'Behemoth', borders: [] as never[] })),
  statAura: null,
  abilityAura: null,
}
const enemies = ['Baby Skeleton', 'Baby Skeleton', 'Baby Skeleton', 'Baby Skeleton']

const result = simulateTowerBatchLogged(
  loadout,
  enemies,
  1,
  'Normal',
  25,
  424242,
)

assert.equal(result.runs, 25)
assert.ok(result.wins > 0, 'Easy Tower matchup should produce at least one winning run')
assert.equal(result.winningRuns.length, result.wins, 'Every winning battle must have its own compact summary')
assert.ok(result.winningPatternCount >= 1, 'Winning runs should still be grouped into outcome patterns for sorting/context')
assert.ok(result.winningRuns.every((run) => run.run >= 1 && run.run <= result.runs), 'Winning summaries must preserve the original simulation run number')
assert.ok(result.winningRuns.every((run) => run.seed > 0), 'Every winning summary needs its exact replay seed')
assert.ok(result.winningRuns.every((run) => run.patternId >= 1), 'Every winning summary needs an outcome pattern id')

const chosen = result.winningRuns[Math.floor(result.winningRuns.length / 2)]
const replay = replayTowerWinningRun(loadout, enemies, 1, 'Normal', chosen.seed, chosen.run)
assert.equal(replay.run, chosen.run)
assert.equal(replay.seed, chosen.seed)
assert.equal(replay.winner, 'Allies', 'Replaying a stored winning seed must reproduce the win')
assert.equal(replay.turns, chosen.turns, 'Replay turn count must match the original winning run')
assert.equal(replay.debug.initialAllies.length, 4)
assert.equal(replay.debug.initialEnemies.length, 4)
assert.ok(replay.debug.events.length > 0, 'On-demand replay must contain the full battle event timeline')

console.log(`Tower individual win-log regression passed: ${result.wins}/${result.runs} wins listed individually, replayed battle #${chosen.run} with ${replay.debug.events.length} events.`)

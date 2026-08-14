import { auraPackRangeForMedian } from '../src/engine/depths-rewards'
import { depthsFloorSpeedBonus, effectiveDepthsBattleSpeed, estimateBattleSeconds, inBattleAcceleration } from '../src/engine/depths-time'

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message) }
function close(a: number, b: number, eps = 1e-9) { return Math.abs(a - b) <= eps }

assert(effectiveDepthsBattleSpeed(1, true) === 4, 'Floor 1 Battle Speed should be 3 + Chrono 1')
assert(effectiveDepthsBattleSpeed(100, true) === 4.25, 'Floor 100 Battle Speed should include +0.25')
assert(depthsFloorSpeedBonus(1800) === 4.5, 'Depths floor Battle Speed bonus should cap at +4.5')
assert(effectiveDepthsBattleSpeed(5000, true) === 8.5, 'High-floor Battle Speed should cap at 8.5 with Chrono')
assert(inBattleAcceleration(9) === 1 && inBattleAcceleration(10) === 2, '10-attack acceleration mismatch')
assert(inBattleAcceleration(20) === 3 && inBattleAcceleration(40) === 5 && inBattleAcceleration(60) === 10, 'Long-battle acceleration mismatch')
assert(close(estimateBattleSeconds(1, 1, true), 0.4), 'One-turn floor 1 battle timing mismatch')
const reward = auraPackRangeForMedian(13334)
assert(reward.medianDepth === 13334, 'Median depth mismatch')
assert(reward.auraPackLow === 12838510, 'Low Aura Pack mismatch')
assert(reward.auraPackMedian === 18807292, 'Median Aura Pack mismatch')
assert(reward.auraPackHigh === 26117287, 'High Aura Pack mismatch')
console.log('Depths speed/reward regression passed:', reward)

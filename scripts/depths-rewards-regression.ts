import { auraPackRangeForMedian, auraPacksForDepth, depthsRewardStageAttack, estimatedDepthRange, potionDropsForDepth } from '../src/engine/depths-rewards'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

assert(depthsRewardStageAttack(1) === 39, 'StageATK floor 1 mismatch')
assert(depthsRewardStageAttack(100) === 2242, 'StageATK floor 100 mismatch')
assert(auraPacksForDepth(1) === 1, 'Aura Packs floor 1 mismatch')
assert(auraPacksForDepth(100) === 249, 'Aura Packs floor 100 mismatch')
const range = estimatedDepthRange(13334)
assert(range.low === 11334 && range.high === 15334, '15% estimated range mismatch: ' + JSON.stringify(range))
const reward = auraPackRangeForMedian(13334)
assert(reward.auraPackLow === 7464783, 'Low Aura Pack reward mismatch: ' + reward.auraPackLow)
assert(reward.auraPackHigh === 10992783, 'High Aura Pack reward mismatch: ' + reward.auraPackHigh)
const fullRunDrops = potionDropsForDepth(5000, false)
assert(Math.abs(fullRunDrops.rareWeather.oneInRuns - 2.15) < 0.02, 'Rare Weather full-run odds mismatch')
assert(Math.abs(fullRunDrops.rareWeather.endFloorOneIn - 3403) < 0.01, 'Rare Weather floor-5000 odds mismatch')
assert(Math.abs(fullRunDrops.jackpot.endFloorOneIn - 170) < 0.01, 'Jackpot floor-5000 odds mismatch')
const bountifulDrops = potionDropsForDepth(5000, true)
assert(Math.abs(bountifulDrops.rareWeather.oneInRuns - 1.84) < 0.02, 'Bountiful Rare Weather full-run odds mismatch')
assert(Math.abs(bountifulDrops.rareWeather.endFloorOneIn - 2722.4) < 0.1, 'Bountiful Rare Weather floor-5000 odds mismatch')
assert(Math.abs(bountifulDrops.jackpot.endFloorOneIn - 136) < 0.01, 'Bountiful Jackpot floor-5000 odds mismatch')
const galaxyDrops = potionDropsForDepth(5000,true,4)
assert(Math.abs(galaxyDrops.rareWeather.endFloorOneIn-3403/1.5)<0.01,'Galaxy Bountiful Delve boosts rare potion drops by 50%')
assert(Math.abs(galaxyDrops.jackpot.endFloorOneIn-170/1.5)<0.01,'Galaxy Bountiful Delve boosts jackpot drops by 50%')
assert(galaxyDrops.rareWeather.expected > bountifulDrops.rareWeather.expected,'Galaxy improves expected potion drops over Base')
assert(Math.abs(potionDropsForDepth(5000,false,4).rareWeather.expected-fullRunDrops.rareWeather.expected)<1e-10,'Disabled relic has no upgrade effect')

console.log('Depths reward regression passed:', reward)

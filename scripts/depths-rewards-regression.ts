import { auraPackRangeForMedian, auraPacksForDepth, auraPacksForClearedRange, depthsRewardStageAttack, estimatedDepthRange, potionDropsForDepth, jackpotPotionChanceForFloor, rareWeatherPotionChanceForFloor } from '../src/engine/depths-rewards'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

assert(depthsRewardStageAttack(1) === 39, 'StageATK floor 1 mismatch')
assert(depthsRewardStageAttack(100) === 2242, 'StageATK floor 100 mismatch')
assert(auraPacksForDepth(1) === 1, 'Aura Packs floor 1 mismatch')
assert(auraPacksForDepth(100) === 249, 'Aura Packs floor 100 mismatch')
assert(auraPacksForClearedRange(1,1)===0,'Losing the first Depths floor must reward zero packs')
assert(auraPacksForClearedRange(1,5)===auraPacksForDepth(4),'Defeat on floor 5 only pays floors 1–4')
assert(auraPacksForClearedRange(4,5)===auraPacksForDepth(4)-auraPacksForDepth(3),'Start at floor 4 must skip 1–3')
assert(auraPacksForClearedRange(5,5)===0,'Immediate loss on selected starting floor pays zero')
assert(auraPacksForClearedRange(4,5,true)===3*auraPacksForClearedRange(4,5),'Hard Depths pack multiplier is 3')
assert(potionDropsForDepth(4,false,0,5).rareWeather.expected===0,'No cleared floors means no expected potions')
assert(Math.abs(potionDropsForDepth(5,false,0,4).rareWeather.expected-
  (rareWeatherPotionChanceForFloor(4)+rareWeatherPotionChanceForFloor(5)))<1e-12,
  'Potion probability must sum only selected cleared floors')
const range = estimatedDepthRange(13334)
assert(range.low === 11334 && range.high === 15334, '15% estimated range mismatch: ' + JSON.stringify(range))
const reward = auraPackRangeForMedian(13334)
assert(reward.auraPackLow === 7464783, 'Low Aura Pack reward mismatch: ' + reward.auraPackLow)
assert(reward.auraPackHigh === 10992783, 'High Aura Pack reward mismatch: ' + reward.auraPackHigh)
// Ground truth: DepthsLootConfig Normal rolls with source StageATK scaling,
 // rarer items consuming drop chance before Jackpot.
const floor5000Factor = 1 + depthsRewardStageAttack(5000) / 100
const expectedRare5000 = floor5000Factor / 17_500_000
const preceding = [17_500_000, 1_100_000, 1_100_000, 1_000_000, 800_000]
const expectedJackpot5000 = preceding.reduce((remain, denom) => remain * (1 - floor5000Factor / denom), 1)
  * (floor5000Factor / 750_000)
assert(Math.abs(rareWeatherPotionChanceForFloor(5000) - expectedRare5000) < 1e-12, 'Rare Weather 5000 source odds mismatch')
assert(Math.abs(jackpotPotionChanceForFloor(5000) - expectedJackpot5000) < 1e-12, 'Jackpot 5000 source sequential odds mismatch')
assert(Math.abs(rareWeatherPotionChanceForFloor(5001) - expectedRare5000) < 1e-12, 'Rare Weather cap after 5000')
assert(Math.abs(jackpotPotionChanceForFloor(10000) - expectedJackpot5000) < 1e-12, 'Jackpot cap after 5000')
assert(Math.abs(rareWeatherPotionChanceForFloor(5000, true) / expectedRare5000 - 1.25) < 1e-12, 'Bountiful base must add 25% drop factor')
assert(Math.abs(rareWeatherPotionChanceForFloor(5000, true, 4) / expectedRare5000 - 1.5) < 1e-12, 'Galaxy Bountiful adds 50% drop factor')
assert(jackpotPotionChanceForFloor(5000, true) > jackpotPotionChanceForFloor(5000, false), 'Bountiful improves Jackpot chance')
const fullRunDrops = potionDropsForDepth(5000, false)
assert(Math.abs(fullRunDrops.rareWeather.oneInRuns - 2.409314828) < 0.001, 'Rare Weather full-run cumulative odds mismatch')
assert(Math.abs(fullRunDrops.rareWeather.endFloorOneIn - 3970.216569642) < 0.001, 'Rare Weather final-floor odds mismatch')
assert(Math.abs(fullRunDrops.jackpot.endFloorOneIn - 173.281556974) < 0.001, 'Jackpot final-floor odds mismatch')
const bountifulDrops = potionDropsForDepth(5000, true)
assert(Math.abs(bountifulDrops.rareWeather.oneInRuns - 2.047288373) < 0.001, 'Bountiful Rare Weather full-run odds mismatch')
const galaxyDrops = potionDropsForDepth(5000, true, 4)
assert(Math.abs(galaxyDrops.rareWeather.oneInRuns - 1.809498182) < 0.001, 'Galaxy Bountiful Rare Weather full-run odds mismatch')
assert(galaxyDrops.rareWeather.expected > bountifulDrops.rareWeather.expected, 'Galaxy increases rare expected drops')
assert(Math.abs(potionDropsForDepth(5000,false,4).rareWeather.expected-fullRunDrops.rareWeather.expected)<1e-10, 'Disabled relic cannot boost drop chance')

console.log('Depths reward regression passed:', reward)

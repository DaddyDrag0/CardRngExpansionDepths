import assert from 'node:assert/strict'
import { isTowerCheeseCandidateLegal, towerCheeseAnchors, towerCheeseCandidatePool, towerCheeseIntensivePlan } from '../src/engine/tower'

const pool = towerCheeseCandidatePool()
const norm = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '')
for (const expected of ['Judgment Day', 'Robin Hood', 'Parallax', 'Pandora', 'Kuchisake-onna', 'Fate Seamstress', 'Kira', 'Surtr', 'Control Freak', "Hell's Army", 'Noveau Riche', 'True Prophet']) {
  assert.ok(pool.some((name) => norm(name).includes(norm(expected)) || norm(expected).includes(norm(name))), `Missing cheese candidate matching ${expected}`)
}
assert.deepEqual(towerCheeseAnchors(['Sable The Envious', 'Good Boy', 'Good Boy', 'Good Boy']), ['Robin Hood'])
assert.deepEqual(towerCheeseAnchors(['Inari', 'Good Boy', 'Good Boy', 'Good Boy']), ['Noveau Riche'])
assert.deepEqual(towerCheeseAnchors(['Sable The Envious', 'Inari', 'Good Boy', 'Good Boy']), ['Robin Hood', 'Noveau Riche'])
assert.equal(isTowerCheeseCandidateLegal(['Parallax', 'Judgment Day', 'Pandora', 'Control Freak']), true)
assert.equal(isTowerCheeseCandidateLegal(['Parallax', 'Parallax', 'Judgment Day', 'Pandora']), false)
assert.equal(isTowerCheeseCandidateLegal(['Fate Seamstress', 'Judgment Day', 'Fate Seamstress', 'Pandora']), false)
assert.equal(isTowerCheeseCandidateLegal(['Fate Seamstress', 'Judgment Day', 'Parallax', 'Pandora']), true)
const customPool = towerCheeseCandidatePool({ excludedCards: ['Parallax'], addedCards: ['Behemoth'] })
assert.equal(customPool.includes('Parallax'), false, 'Excluded cards must be removed from the cheese search pool')
assert.equal(customPool.includes('Behemoth'), true, 'User-added cards must be included in the cheese search pool')
const intensivePlan = towerCheeseIntensivePlan()
const noParallaxPlan = towerCheeseIntensivePlan({ excludedCards: ['Parallax'] })
assert.ok(noParallaxPlan.orderedTeams < intensivePlan.orderedTeams, 'Excluding a card should shrink the intensive search space')
assert.ok(intensivePlan.plannedDiscoveryBattles >= 1_000_000, 'Intensive cheese search must plan at least one million discovery battles')
assert.ok(intensivePlan.auraVariants > 4, 'Intensive cheese search should test many Ability Aura/border variants')
const noEndTimesPlan = towerCheeseIntensivePlan({ hasEndTimes: false })
assert.equal(noEndTimesPlan.auraVariants, intensivePlan.auraVariants - 4, 'Disabling End Times should remove its Base/Platinum/Crystal/Galaxy variants')
assert.ok(intensivePlan.orderedTeams > 1_000, 'Intensive cheese search should test a large ordered deck space')
console.log(`Tower cheese search regression passed with ${pool.length} candidates.`)

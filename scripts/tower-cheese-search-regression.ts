import assert from 'node:assert/strict'
import { isTowerCheeseCandidateLegal, towerCheeseAnchors, towerCheeseCandidatePool } from '../src/engine/tower'

const pool = towerCheeseCandidatePool()
const norm = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '')
for (const expected of ['Judgment Day', 'Robin Hood', 'Parallax', 'Pandora', 'Kuchisake-onna', 'Fate Seamstress', 'Kira', 'Surtr', 'Control Freak', "Hell's Army", 'Noveau Riche']) {
  assert.ok(pool.some((name) => norm(name).includes(norm(expected)) || norm(expected).includes(norm(name))), `Missing cheese candidate matching ${expected}`)
}
assert.deepEqual(towerCheeseAnchors(['Sable The Envious', 'Good Boy', 'Good Boy', 'Good Boy']), ['Robin Hood'])
assert.deepEqual(towerCheeseAnchors(['Inari', 'Good Boy', 'Good Boy', 'Good Boy']), ['Noveau Riche'])
assert.deepEqual(towerCheeseAnchors(['Sable The Envious', 'Inari', 'Good Boy', 'Good Boy']), ['Robin Hood', 'Noveau Riche'])
assert.equal(isTowerCheeseCandidateLegal(['Parallax', 'Judgment Day', 'Pandora', 'Control Freak']), true)
assert.equal(isTowerCheeseCandidateLegal(['Parallax', 'Parallax', 'Judgment Day', 'Pandora']), false)
console.log(`Tower cheese search regression passed with ${pool.length} candidates.`)

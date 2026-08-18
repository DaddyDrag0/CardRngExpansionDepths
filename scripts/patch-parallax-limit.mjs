import fs from 'node:fs'

const towerPath = 'src/engine/tower.ts'
let tower = fs.readFileSync(towerPath, 'utf8')

const poolMarker = `export function towerCheeseCandidatePool(): string[] {
  const resolved = CHEESE_CARD_ALIASES.map(resolveCheeseCard).filter((name): name is string => Boolean(name))
  return [...new Set(resolved)]
}
`
const legalHelper = `${poolMarker}
/** Tower cheese inventory rules that differ from normal duplicate-friendly search. */
export function isTowerCheeseCandidateLegal(names: readonly string[]): boolean {
  return names.filter((name) => name === 'Parallax').length <= 1
}
`
if (!tower.includes(poolMarker)) throw new Error('Candidate pool marker not found')
tower = tower.replace(poolMarker, legalHelper)

const oldFilter = `    if (team.length !== 4 || teamKeys.has(key)) continue`
const newFilter = `    if (team.length !== 4 || teamKeys.has(key) || !isTowerCheeseCandidateLegal(team)) continue`
if (!tower.includes(oldFilter)) throw new Error('Candidate team filter marker not found')
tower = tower.replace(oldFilter, newFilter)
fs.writeFileSync(towerPath, tower)

const testPath = 'scripts/tower-cheese-search-regression.ts'
let test = fs.readFileSync(testPath, 'utf8')
const oldImport = `import { towerCheeseAnchors, towerCheeseCandidatePool } from '../src/engine/tower'`
const newImport = `import { isTowerCheeseCandidateLegal, towerCheeseAnchors, towerCheeseCandidatePool } from '../src/engine/tower'`
if (!test.includes(oldImport)) throw new Error('Regression import marker not found')
test = test.replace(oldImport, newImport)
const anchorMarker = `assert.deepEqual(towerCheeseAnchors(['Sable The Envious', 'Inari', 'Good Boy', 'Good Boy']), ['Robin Hood', 'Noveau Riche'])`
const legalityTests = `${anchorMarker}
assert.equal(isTowerCheeseCandidateLegal(['Parallax', 'Judgment Day', 'Pandora', 'Control Freak']), true)
assert.equal(isTowerCheeseCandidateLegal(['Parallax', 'Parallax', 'Judgment Day', 'Pandora']), false)`
if (!test.includes(anchorMarker)) throw new Error('Regression anchor marker not found')
test = test.replace(anchorMarker, legalityTests)
fs.writeFileSync(testPath, test)

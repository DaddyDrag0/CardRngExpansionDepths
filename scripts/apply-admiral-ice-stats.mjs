import fs from 'node:fs'

const cardsPath = 'src/data/cards-1.json'
const integrityPath = 'scripts/data-integrity.ts'

const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'))
const admiral = cards.find((card) => card.name === 'Admiral Ice')
if (!admiral) throw new Error('Admiral Ice not found')
if (admiral.rarity !== 750000) throw new Error(`Unexpected Admiral Ice rarity: ${admiral.rarity}`)
admiral.statMultiplier = 1.5
fs.writeFileSync(cardsPath, JSON.stringify(cards))

let integrity = fs.readFileSync(integrityPath, 'utf8')
const anchor = "assert.equal(cards.filter((card) => card.name === 'Conqueror').length, 1, 'Conqueror must exist exactly once')\n"
const check = "const admiralIce = cards.find((card) => card.name === 'Admiral Ice')\nassert(admiralIce, 'Admiral Ice must exist')\nassert.equal(admiralIce.rarity, 750000, 'Admiral Ice rarity changed unexpectedly')\nassert.equal(admiralIce.statMultiplier, 1.5, 'Admiral Ice stat multiplier must match game source')\n"
if (!integrity.includes(check)) {
  if (!integrity.includes(anchor)) throw new Error('Data integrity anchor not found')
  integrity = integrity.replace(anchor, anchor + check)
  fs.writeFileSync(integrityPath, integrity)
}

console.log('Admiral Ice corrected to 1.5x stat multiplier.')

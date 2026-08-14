import fs from 'node:fs'

const path = 'index.html'
let text = fs.readFileSync(path, 'utf8')

const replacements = [
  ['<span class="kicker">CARD LIBRARY</span><h3>Slot ${state.activeSlot+1}</h3>', '<span class="kicker">Cards</span><h3>Team ${state.activeSlot+1}</h3>'],
]

for (const [before, after] of replacements) {
  const count = text.split(before).length - 1
  if (count !== 1) throw new Error(`Expected 1 match for ${before}, found ${count}`)
  text = text.replace(before, after)
}

fs.writeFileSync(path, text)
console.log('Simplified card library labels.')

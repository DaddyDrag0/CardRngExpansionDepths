import fs from 'node:fs'
const path = 'src/engine/support.ts'
let text = fs.readFileSync(path, 'utf8')
const from = `  'Shiny Steal', 'Water Shield of Xuanwu', 'Constellar', "Pandora's Box",\n])`
const to = `  'Shiny Steal', 'Water Shield of Xuanwu', 'Constellar', "Pandora's Box",\n  'Cosmic Rivalry', 'Divine Ascension', 'Kitchen', 'Six Realms Staff',\n])`
if (!text.includes("'Cosmic Rivalry', 'Divine Ascension', 'Kitchen', 'Six Realms Staff'")) {
  const count = text.split(from).length - 1
  if (count !== 1) throw new Error(`Support registry anchor count: ${count}`)
  text = text.replace(from, to)
}
fs.writeFileSync(path, text)
console.log('Patched Manga root abilities into Depths support registry.')

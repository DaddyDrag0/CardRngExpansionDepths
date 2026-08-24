import fs from 'node:fs'

{
  const path = 'scripts/announcement-balance-regression.ts'
  let text = fs.readFileSync(path, 'utf8')
  text = text.replace("statAuraPercentForCard(desmond, auraProbe('Mother of Beasts'), galaxy)", "statAuraPercentForCard(desmond, auraProbe('Sable The Envious'), galaxy)")
  text = text.replace("'Desmond boosted Seven Sins cards must cap at 414% while its normal Galaxy boost stays 256%.'", "'Desmond boosted Seven Sins cards use the source multiplier for 414% at Galaxy.'")
  fs.writeFileSync(path, text)
}

{
  const path = 'scripts/insatiable-unholy-regression.ts'
  let text = fs.readFileSync(path, 'utf8')
  text = text.replace(
    "assert(names.join('|') === 'Darling|Volcano Spirit|Soft Paw|Michael', 'Reported enemy lineup changed: ' + names.join(' | '))",
    "assert(names.join('|') === 'Demon Hunter|Yamato no Orochi|Stegosaurus|Mummy', 'Reported enemy lineup changed: ' + names.join(' | '))",
  )
  fs.writeFileSync(path, text)
}

console.log('Aligned source aura and seeded Depths regressions for the Manga card pool.')

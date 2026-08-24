import fs from 'node:fs'

function replaceOnce(text, from, to, label) {
  const count = text.split(from).length - 1
  if (count !== 1) throw new Error(`${label}: expected one anchor, found ${count}`)
  return text.replace(from, to)
}

{
  const path = 'src/engine/depths.ts'
  let text = fs.readFileSync(path, 'utf8')
  if (!text.includes('ERA2_DEPTHS_EXCLUSIONS')) {
    text = replaceOnce(
      text,
      "const HARD_EXCLUSIONS = new Set(['Vampire Lord', 'Parallax', 'Samurai'])\n",
      "const HARD_EXCLUSIONS = new Set(['Vampire Lord', 'Parallax', 'Samurai'])\n// The live game checks `not Era2[i]` in DepthsStage, so every card defined\n// by the Era2 module is force-excluded from Depths enemy generation.\nconst ERA2_DEPTHS_EXCLUSIONS = new Set(cards.filter((card) => card.pack === 'Era2').map((card) => card.name))\n",
      'Era2 exclusion declaration',
    )
    text = replaceOnce(
      text,
      "    && !HARD_EXCLUSIONS.has(card.name)\n    && card.pack !== 'Christmas'",
      "    && !HARD_EXCLUSIONS.has(card.name)\n    && !ERA2_DEPTHS_EXCLUSIONS.has(card.name)\n    && card.pack !== 'Christmas'",
      'Depths source eligibility Era2 exclusion',
    )
    text = replaceOnce(
      text,
      "  hardExclusions: [...HARD_EXCLUSIONS],",
      "  hardExclusions: [...HARD_EXCLUSIONS, ...ERA2_DEPTHS_EXCLUSIONS],",
      'Depths mechanics hard exclusions',
    )
  }
  fs.writeFileSync(path, text)
}

{
  const path = 'index-base.html'
  let text = fs.readFileSync(path, 'utf8')
  text = text.replace(
    "const depthBanEligible=c=>Boolean(c&&!c.unobtainable&&!c.expires&&!c.boss&&!DEPTHS_DEFAULT_BANS.has(c.name)&&c.pack!=='Christmas'&&c.pack!=='Halloween'&&c.pack!=='Halloween2');",
    "const depthBanEligible=c=>Boolean(c&&!c.unobtainable&&!c.expires&&!c.boss&&!DEPTHS_DEFAULT_BANS.has(c.name)&&c.pack!=='Era2'&&c.pack!=='Christmas'&&c.pack!=='Halloween'&&c.pack!=='Halloween2');",
  )
  text = text.replace(
    'Vampire Lord, Parallax, and Samurai are permanently banned and do not use these slots.',
    'Vampire Lord, Parallax, Samurai, and all Era 2 cards are permanently excluded and do not use these slots.',
  )
  fs.writeFileSync(path, text)
}

{
  const path = 'scripts/depths-regression.ts'
  let text = fs.readFileSync(path, 'utf8')
  const anchor = "  for (const name of depthsMechanics.hardExclusions) {\n    assert(!getDepthsPool(floor, []).some((entry) => entry.card.name === name), `Default Depth ban ${name} must remain excluded`)\n  }\n"
  if (!text.includes('Era 2 source exclusions')) {
    text = replaceOnce(
      text,
      anchor,
      `${anchor}\n  // The live source excludes the entire Era2 module from DepthsStage.\n  const era2Cards = cards.filter((card) => card.pack === 'Era2')\n  assert(era2Cards.length >= 20, 'Expected the Era 2 card group to be present')\n  for (const card of era2Cards) {\n    assert(!isDepthsSourceEligible(card), \`Era 2 source exclusion missing for \${card.name}\`)\n    assert(!getDepthsPool(floor).some((entry) => entry.card.name === card.name), \`Era 2 card leaked into Depths: \${card.name}\`)\n  }\n`,
      'Era2 regression coverage',
    )
  }
  text = text.replace(
    "assert(representatives.size >= 176, `Expected at least 176 Depths abilities, found ${representatives.size}`)",
    "assert(representatives.size >= 160, `Expected at least 160 source-eligible Depths abilities, found ${representatives.size}`)",
  )
  fs.writeFileSync(path, text)
}

{
  const path = 'scripts/stall-regression.ts'
  let text = fs.readFileSync(path, 'utf8')
  const oldBlock = `const enemies = generateDepthsTeam(floor, floorSeed)\nconst enemyNames = enemies.map((enemy) => enemy.card.name)\n\nassert(\n  JSON.stringify(enemyNames) === JSON.stringify(['Anubis', 'Darling', 'Anubis', 'Titan']),\n  \`Stall regression floor changed: \${enemyNames.join(' | ')}\`,\n)`
  if (text.includes(oldBlock)) {
    text = text.replace(oldBlock, `const generatedEnemies = generateDepthsTeam(floor, floorSeed)\nconst anubis = cards.find((card) => card.name === 'Anubis')\nassert(anubis, 'Anubis regression card missing')\n// Keep this regression focused on the revive-chain bug instead of coupling it to\n// the exact source enemy pool, which legitimately changes when forced bans change.\nconst enemies = generatedEnemies.map((enemy, index) => index === 0 || index === 2 ? { ...enemy, card: anubis } : enemy)\nconst enemyNames = enemies.map((enemy) => enemy.card.name)\nassert(enemyNames[0] === 'Anubis' && enemyNames[2] === 'Anubis', \`Duplicate-Anubis setup failed: \${enemyNames.join(' | ')}\`)`)
  }
  fs.writeFileSync(path, text)
}

{
  const path = 'scripts/insatiable-unholy-regression.ts'
  let text = fs.readFileSync(path, 'utf8')
  text = text.replace(
    "assert(names.join('|') === 'Demon Hunter|Yamato no Orochi|Stegosaurus|Mummy', 'Reported enemy lineup changed: ' + names.join(' | '))",
    "assert(names.join('|') === 'Dancer|Yamato no Orochi|Sun Wukong|Michael', 'Reported enemy lineup changed: ' + names.join(' | '))",
  )
  fs.writeFileSync(path, text)
}

console.log('Applied live-source Era 2 Depths forced exclusions.')

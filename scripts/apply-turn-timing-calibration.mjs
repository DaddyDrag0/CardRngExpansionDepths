import fs from 'node:fs'

function replaceOnce(path, label, before, after) {
  let source = fs.readFileSync(path, 'utf8')
  const first = source.indexOf(before)
  if (first < 0) throw new Error(`Could not find ${label} in ${path}`)
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`Found multiple ${label} anchors in ${path}`)
  source = source.slice(0, first) + after + source.slice(first + before.length)
  fs.writeFileSync(path, source)
}

replaceOnce(
  'src/engine/depths-time.ts',
  'timing calibration comment',
  ` * The Depths loop also waits on the player's \`battlecd\` attribute after every\n * battle before requesting the next floor. The client does not contain the\n * server-side duration for that attribute, so INTER_FLOOR_OVERHEAD_SECONDS is\n * calibrated from observed live runs: ~13k floors in ~12h and ~22k in ~20h,\n * both landing near 3.3 seconds per floor overall once combat animation is included.`,
  ` * The Depths loop also waits on the player's \`battlecd\` attribute after every\n * battle before requesting the next floor. The client does not contain the\n * server-side duration for that attribute, so INTER_FLOOR_OVERHEAD_SECONDS is\n * calibrated from observed live runs. A current high-depth Shuten run reached\n * ~55k floors in ~24h; a 1-second inter-floor delay brings the simulator's\n * existing ~40h estimate for that run down to ~24.7h before minor animation variance.`,
)

replaceOnce(
  'src/engine/depths-time.ts',
  'inter-floor overhead constant',
  `export const INTER_FLOOR_OVERHEAD_SECONDS = 2`,
  `export const INTER_FLOOR_OVERHEAD_SECONDS = 1`,
)

replaceOnce(
  'scripts/depths-time-regression.ts',
  'one-turn timing expectation',
  `assert(close(estimateBattleSeconds(1, 1, true), 2.4), 'One-turn floor 1 battle timing mismatch')`,
  `assert(close(estimateBattleSeconds(1, 1, true), 1.4), 'One-turn floor 1 battle timing mismatch')`,
)

const combatPath = 'scripts/combat-corrections-regression.ts'
let combat = fs.readFileSync(combatPath, 'utf8')
const marker = `// Calibration snapshot for the known Shuten/Desmond/Berserker deck.`
if (!combat.includes(marker)) throw new Error('Could not find combat regression insertion marker')
if (combat.includes('Turn sequencing regressions: Shuten, Priest, Cosmic Pop Star')) throw new Error('Turn sequencing regressions already present')

const regression = `// Turn sequencing regressions: Shuten, Priest, Cosmic Pop Star.\n// These lock the live rules that extra turns carry across enemy replacement and\n// counterattacks happen inside the opponent's turn rather than consuming a turn.\nconst hugeEnemy: DepthsEnemy = { card: card('Titan'), power: 1e30, attack: 1, health: 1e30 }\n\nconst shutenTurnBattle = simulateBattleV2(\n  { cards: [{ cardName: 'Shuten-dōji', borders: ['Galaxy'] }] },\n  [\n    { card: card('Wizard'), power: 1, attack: 0, health: 1 },\n    hugeEnemy,\n  ],\n  8181,\n  5,\n  true,\n  true,\n)\nconst shutenTurns = shutenTurnBattle.debug?.events.filter((event) => event.type === 'turn').slice(0, 2) || []\nassert(shutenTurns.length === 2, 'Shuten sequencing regression did not produce two turns')\nassert(shutenTurns[0].team === 'Allies' && shutenTurns[1].team === 'Allies', 'Shuten Decapitate kill should skip the enemy replacement turn')\nassert(shutenTurns[0].card === 'Shuten-dōji' && shutenTurns[1].card === 'Shuten-dōji', 'Shuten should keep its extra turn after defeating the front enemy')\n\nconst priestTurnBattle = simulateBattleV2(\n  { cards: [{ cardName: 'Priest', borders: ['Galaxy'] }] },\n  [\n    { card: card('Wizard'), power: 1, attack: 0, health: 1 },\n    hugeEnemy,\n  ],\n  8282,\n  6,\n  true,\n  true,\n)\nconst priestTurns = priestTurnBattle.debug?.events.filter((event) => event.type === 'turn').slice(0, 3) || []\nassert(priestTurns.length === 3, 'Priest sequencing regression did not produce three turns')\nassert(priestTurns[0].team === 'Allies' && priestTurns[1].team === 'Allies', 'Priest Accelerate should start with two total turns (one queued extra turn)')\nassert(priestTurns[2].team === 'Enemies', 'Priest first Accelerate cycle should end after exactly two total turns')\n\nconst cosmicCounterBattle = simulateBattleV2(\n  { cards: [{ cardName: 'Wizard', borders: [] }, { cardName: 'Archer', borders: [] }] },\n  [{ card: card('Cosmic Pop Star'), power: 1e12, attack: 1e12, health: 1e30 }],\n  8383,\n  5,\n  true,\n  true,\n)\nconst cosmicCounter = cosmicCounterBattle.debug?.events.find((event) => event.type === 'ability' && event.card === 'Cosmic Pop Star' && event.detail?.includes('counterattack'))\nassert(Boolean(cosmicCounter), 'Cosmic Pop Star should counterattack during the enemy turn')\nconst cosmicTurns = cosmicCounterBattle.debug?.events.filter((event) => event.type === 'turn').slice(0, 2) || []\nassert(cosmicTurns.length === 2, 'Cosmic counter regression did not produce two turns')\nassert(cosmicTurns[0].team === 'Allies' && cosmicTurns[1].team === 'Enemies', 'Counterattack must not consume Cosmic Pop Star\\'s following normal turn')\nassert(cosmicTurns[1].card === 'Cosmic Pop Star', 'Cosmic Pop Star should take its normal turn after a counter-kill')\nconsole.log('Turn sequencing regressions passed: Shuten, Priest, Cosmic Pop Star')\n\n`

combat = combat.replace(marker, regression + marker)
fs.writeFileSync(combatPath, combat)

console.log('Applied 1-second Depths floor timing calibration and turn-sequencing regressions.')

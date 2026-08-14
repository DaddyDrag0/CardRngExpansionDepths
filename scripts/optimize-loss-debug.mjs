import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')
const write = (path, text) => fs.writeFileSync(path, text)
function replaceOnce(text, from, to, label) {
  const count = text.split(from).length - 1
  if (count !== 1) throw new Error(`${label}: expected 1 match, found ${count}`)
  return text.replace(from, to)
}

{
  const path = 'src/engine/battle-v2.ts'
  let text = read(path)
  text = replaceOnce(text,
`interface Runtime {
  state: BattleState
  rng: SeededRng
  debug: BattleDebug
}`,
`interface Runtime {
  state: BattleState
  rng: SeededRng
  debug: BattleDebug
  captureDebug: boolean
}`, 'Runtime captureDebug')

  text = replaceOnce(text,
`function pushDebugEvent(runtime: Runtime, event: BattleDebug['events'][number]) {
  if (runtime.debug.events.length >= 300) runtime.debug.events.shift()
  runtime.debug.events.push(event)
}`,
`function pushDebugEvent(runtime: Runtime, event: BattleDebug['events'][number]) {
  if (!runtime.captureDebug) return
  if (runtime.debug.events.length >= 300) runtime.debug.events.shift()
  runtime.debug.events.push(event)
}`, 'pushDebugEvent guard')

  text = replaceOnce(text,
`  markTurnCap = false,
): BattleResult {`,
`  markTurnCap = false,
  captureDebug = false,
): BattleResult {`, 'simulate signature')

  text = replaceOnce(text,
`  const runtime: Runtime = { state, rng: new SeededRng(seed), debug }
  resolveConstellarArts(runtime)
  debug.initialAllies = state.teams.Allies.map(debugCard)
  debug.initialEnemies = state.teams.Enemies.map(debugCard)`,
`  const runtime: Runtime = { state, rng: new SeededRng(seed), debug, captureDebug }
  resolveConstellarArts(runtime)
  if (captureDebug) {
    debug.initialAllies = state.teams.Allies.map(debugCard)
    debug.initialEnemies = state.teams.Enemies.map(debugCard)
  }`, 'debug initialization guard')

  text = replaceOnce(text,
`      pushDebugEvent(runtime, {
        turn: runtime.state.turn,
        type: 'death',
        team,
        card: effectiveCardName(card) || card.definition.name,
        detail: 'Card defeated',
        hp: 0,
        maxHp: card.maxHp,
        damage: card.damage,
      })`,
`      if (runtime.captureDebug) pushDebugEvent(runtime, {
        turn: runtime.state.turn,
        type: 'death',
        team,
        card: effectiveCardName(card) || card.definition.name,
        detail: 'Card defeated',
        hp: 0,
        maxHp: card.maxHp,
        damage: card.damage,
      })`, 'death debug guard')

  text = replaceOnce(text,
`        pushDebugEvent(runtime, {
          turn: runtime.state.turn,
          type: 'revive',
          team,
          card: revived.definition.name,
          detail: 'Beyond The Grave: one self-revive at half BASE HP; battle/aura stat changes reset',
          hp: revived.hp,
          maxHp: revived.maxHp,
          damage: revived.damage,
        })`,
`        if (runtime.captureDebug) pushDebugEvent(runtime, {
          turn: runtime.state.turn,
          type: 'revive',
          team,
          card: revived.definition.name,
          detail: 'Beyond The Grave: one self-revive at half BASE HP; battle/aura stat changes reset',
          hp: revived.hp,
          maxHp: revived.maxHp,
          damage: revived.damage,
        })`, 'revive debug guard')

  text = replaceOnce(text,
`      pushDebugEvent(runtime, {
        turn: state.turn,
        type: 'stall',
        team: state.moving,
        card: effectiveCardName(attacker) || attacker.definition.name,
        detail: \`OG-server 100-turn no-progress resolution vs \${effectiveCardName(defender) || defender.definition.name}: both active cards defeated\`,
        hp: attacker.hp, maxHp: attacker.maxHp, damage: attacker.damage,
      })`,
`      if (runtime.captureDebug) pushDebugEvent(runtime, {
        turn: state.turn,
        type: 'stall',
        team: state.moving,
        card: effectiveCardName(attacker) || attacker.definition.name,
        detail: \`OG-server 100-turn no-progress resolution vs \${effectiveCardName(defender) || defender.definition.name}: both active cards defeated\`,
        hp: attacker.hp, maxHp: attacker.maxHp, damage: attacker.damage,
      })`, 'stall debug guard')

  text = replaceOnce(text,
`    pushDebugEvent(runtime, {
      turn: state.turn,
      type: 'turn',
      team: state.moving,
      card: effectiveCardName(attacker) || attacker.definition.name,
      detail: \`vs \${effectiveCardName(defender) || defender.definition.name} | attacker \${Math.ceil(attacker.hp)}/\${Math.ceil(attacker.maxHp)} HP \${Math.ceil(attacker.damage)} ATK | defender \${Math.ceil(defender.hp)}/\${Math.ceil(defender.maxHp)} HP \${Math.ceil(defender.damage)} ATK\`,
      hp: attacker.hp, maxHp: attacker.maxHp, damage: attacker.damage,
    })`,
`    if (runtime.captureDebug) pushDebugEvent(runtime, {
      turn: state.turn,
      type: 'turn',
      team: state.moving,
      card: effectiveCardName(attacker) || attacker.definition.name,
      detail: \`vs \${effectiveCardName(defender) || defender.definition.name} | attacker \${Math.ceil(attacker.hp)}/\${Math.ceil(attacker.maxHp)} HP \${Math.ceil(attacker.damage)} ATK | defender \${Math.ceil(defender.hp)}/\${Math.ceil(defender.maxHp)} HP \${Math.ceil(defender.damage)} ATK\`,
      hp: attacker.hp, maxHp: attacker.maxHp, damage: attacker.damage,
    })`, 'turn debug guard')

  text = replaceOnce(text,
`  debug.finalAllies = state.teams.Allies.map(debugCard)
  debug.finalEnemies = state.teams.Enemies.map(debugCard)
  return { winner, turns: state.turn, state, unsupportedAbilities, trusted: unsupportedAbilities.length === 0, debug }`,
`  if (captureDebug) {
    debug.finalAllies = state.teams.Allies.map(debugCard)
    debug.finalEnemies = state.teams.Enemies.map(debugCard)
  }
  return { winner, turns: state.turn, state, unsupportedAbilities, trusted: unsupportedAbilities.length === 0, debug: captureDebug ? debug : undefined }`, 'final debug guard')
  write(path, text)
}

{
  const path = 'src/engine/simulation.ts'
  let text = read(path)
  text = replaceOnce(text,
`    if (battle.winner !== 'Allies') {
      onProgress?.(floor)
      return {`,
`    if (battle.winner !== 'Allies') {
      // Re-run only the losing battle with tracing enabled. This keeps thousands of
      // winning floors fast while still making the exact loss fully inspectable.
      const debugBattle = simulateBattleV2(loadout, enemies, floorSeed ^ 0x51ed270b, maxTurns, hasTurnCap, true)
      onProgress?.(floor)
      return {`, 'rerun losing battle for debug')
  text = replaceOnce(text,
`        debug: battle.debug,`,
`        debug: debugBattle.debug,`, 'use debug rerun payload')
  write(path, text)
}

{
  const path = 'scripts/anubis-regression.ts'
  let text = read(path)
  text = replaceOnce(text,
`const battle = simulateBattleV2(loadout, enemies, 12345, 500, true)`,
`const battle = simulateBattleV2(loadout, enemies, 12345, 500, true, true)`, 'Anubis regression debug flag')
  write(path, text)
}

console.log('Optimized diagnostics: only the losing battle is traced.')

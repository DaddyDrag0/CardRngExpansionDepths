import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')
const write = (path, text) => fs.writeFileSync(path, text)
const block = (lines) => lines.join('\n')
function replaceOnce(text, from, to, label) {
  const count = text.split(from).length - 1
  if (count !== 1) throw new Error(`${label}: expected 1 match, found ${count}`)
  return text.replace(from, to)
}

// Shared debug result types.
{
  const path = 'src/types.ts'
  let text = read(path)
  const from = block([
    'export interface BattleState {',
    '  teams: Record<BattleTeam, CombatCard[]>',
    '  fallen: Record<BattleTeam, CombatCard[]>',
    '  boosts: Record<BattleTeam, BattleBoosts>',
    '  turn: number',
    '  moving: BattleTeam',
    '  unsupportedAbilities: Set<string>',
    '}',
    '',
    'export interface BattleResult {',
    "  winner: BattleTeam | 'Draw'",
    '  turns: number',
    '  state: BattleState',
    '  unsupportedAbilities: string[]',
    '  trusted: boolean',
    '}',
  ])
  const to = block([
    'export interface BattleState {',
    '  teams: Record<BattleTeam, CombatCard[]>',
    '  fallen: Record<BattleTeam, CombatCard[]>',
    '  boosts: Record<BattleTeam, BattleBoosts>',
    '  turn: number',
    '  moving: BattleTeam',
    '  unsupportedAbilities: Set<string>',
    '}',
    '',
    'export interface BattleDebugCard {',
    '  name: string',
    '  ability: string | null',
    '  hp: number',
    '  maxHp: number',
    '  damage: number',
    '  power: number',
    '}',
    '',
    'export interface BattleDebugEvent {',
    '  turn: number',
    "  type: 'turn' | 'death' | 'revive' | 'stall'",
    '  team: BattleTeam',
    '  card: string',
    '  detail: string',
    '  hp?: number',
    '  maxHp?: number',
    '  damage?: number',
    '}',
    '',
    'export interface BattleDebug {',
    '  initialAllies: BattleDebugCard[]',
    '  initialEnemies: BattleDebugCard[]',
    '  finalAllies: BattleDebugCard[]',
    '  finalEnemies: BattleDebugCard[]',
    '  events: BattleDebugEvent[]',
    '  forcedStallResolutions: number',
    '  statAura?: { name: string; border: AuraBorderName | null; value?: number }',
    '  abilityAura?: { name: string; border: AuraBorderName | null; value?: number }',
    '}',
    '',
    'export interface BattleResult {',
    "  winner: BattleTeam | 'Draw'",
    '  turns: number',
    '  state: BattleState',
    '  unsupportedAbilities: string[]',
    '  trusted: boolean',
    '  debug?: BattleDebug',
    '}',
  ])
  text = replaceOnce(text, from, to, 'types debug')
  write(path, text)
}

// Battle engine: source-aligned Beyond The Grave + source 100-turn resolution + trace.
{
  const path = 'src/engine/battle-v2.ts'
  let text = read(path)
  text = replaceOnce(text,
    block(['  BattleBoosts,', '  BattleResult,', '  BattleState,']),
    block(['  BattleBoosts,', '  BattleDebug,', '  BattleResult,', '  BattleState,']),
    'BattleDebug import')

  text = replaceOnce(text,
    block(['interface Runtime {', '  state: BattleState', '  rng: SeededRng', '}']),
    block([
      'interface Runtime {',
      '  state: BattleState',
      '  rng: SeededRng',
      '  debug: BattleDebug',
      '}',
      '',
      'function debugCard(card: CombatCard) {',
      '  return {',
      '    name: effectiveCardName(card) || card.definition.name,',
      '    ability: ability(card),',
      '    hp: card.hp,',
      '    maxHp: card.maxHp,',
      '    damage: card.damage,',
      '    power: card.power,',
      '  }',
      '}',
      '',
      "function pushDebugEvent(runtime: Runtime, event: BattleDebug['events'][number]) {",
      '  if (runtime.debug.events.length >= 300) runtime.debug.events.shift()',
      '  runtime.debug.events.push(event)',
      '}',
    ]), 'runtime debug')

  text = replaceOnce(text,
    block([
      '      deck.shift()',
      '      card.hp = 0',
      '      card.dead = true',
      '      runtime.state.fallen[team].push(card)',
    ]),
    block([
      "      const canBeyondTheGrave = hasAbility(runtime, card, 'Beyond The Grave') && !card.flags.beyondGraveRevived",
      '',
      '      deck.shift()',
      '      card.hp = 0',
      '      card.dead = true',
      '      runtime.state.fallen[team].push(card)',
      '      pushDebugEvent(runtime, {',
      '        turn: runtime.state.turn,',
      "        type: 'death',",
      '        team,',
      '        card: effectiveCardName(card) || card.definition.name,',
      "        detail: 'Card defeated',",
      '        hp: 0,',
      '        maxHp: card.maxHp,',
      '        damage: card.damage,',
      '      })',
    ]), 'BTG eligibility and death trace')

  const oldBtg = block([
    '      const revenants = runtime.state.fallen[team].filter((fallen) =>',
    "        fallen !== card && abilityNames(fallen).includes('Beyond The Grave') && fallen.hp <= 0",
    '      )',
    '      for (const revenant of revenants) {',
    '        // Two Beyond The Grave cards can otherwise revive each other forever.',
    '        // Carry a chain counter only when one Beyond The Grave holder revives another;',
    '        // unrelated ally deaths reset the chain. Resolve the pathological cycle at',
    '        // the same 150-turn scale used by the source battle timeout.',
    "        const beyondGraveChain = abilityNames(card).includes('Beyond The Grave')",
    '          ? (card.counters.beyondGraveChain || 0) + 1',
    '          : 1',
    '        if (beyondGraveChain >= 150) continue',
    '        const fallenIndex = runtime.state.fallen[team].indexOf(revenant)',
    '        if (fallenIndex >= 0) runtime.state.fallen[team].splice(fallenIndex, 1)',
    '        revenant.dead = false',
    '        revenant.hp = revenant.maxHp * 0.5',
    '        revenant.entered = false',
    '        revenant.counters.beyondGraveChain = beyondGraveChain',
    '        // Expansion BattleClient appends Beyond The Grave revivals to the end of the team.',
    '        runtime.state.teams[team].push(revenant)',
    '      }',
  ])
  const newBtg = block([
    '      if (canBeyondTheGrave) {',
    '        // OG server source: the dying Anubis revives ITSELF once. A fresh card is',
    '        // rebuilt from Name/Border/Power, so temporary/aura stat changes do not carry over.',
    '        const baseMaxHp = card.power * (card.definition.hpMultiplier || 1)',
    '        const baseDamage = card.power / 2',
    '        const fallenIndex = runtime.state.fallen[team].indexOf(card)',
    '        if (fallenIndex >= 0) runtime.state.fallen[team].splice(fallenIndex, 1)',
    '        const revived: CombatCard = {',
    '          ...card,',
    "          id: `${card.id}:btg`,",
    '          hp: baseMaxHp / 2,',
    '          maxHp: baseMaxHp,',
    '          damage: baseDamage,',
    '          entered: false,',
    '          dead: false,',
    '          identityOverride: undefined,',
    '          abilityOverride: undefined,',
    '          bonusAbilities: undefined,',
    '          status: { stunned: 0, confused: 0, burn: 0, weakness: false, blind: false, shield: 0 },',
    '          flags: { beyondGraveRevived: true },',
    '          counters: { normalDamage: baseDamage, normalMaxHp: baseMaxHp },',
    '        }',
    '        runtime.state.teams[team].push(revived)',
    '        pushDebugEvent(runtime, {',
    '          turn: runtime.state.turn,',
    "          type: 'revive',",
    '          team,',
    '          card: revived.definition.name,',
    "          detail: 'Beyond The Grave: one self-revive at half BASE HP; battle/aura stat changes reset',",
    '          hp: revived.hp,',
    '          maxHp: revived.maxHp,',
    '          damage: revived.damage,',
    '        })',
    '      }',
  ])
  text = replaceOnce(text, oldBtg, newBtg, 'Beyond The Grave source behavior')

  text = replaceOnce(text,
    block([
      '  const state = createBattleStateV2(loadout, enemies)',
      '  const runtime: Runtime = { state, rng: new SeededRng(seed) }',
      '  resolveConstellarArts(runtime)',
    ]),
    block([
      '  const state = createBattleStateV2(loadout, enemies)',
      '  const debug: BattleDebug = {',
      '    initialAllies: [], initialEnemies: [], finalAllies: [], finalEnemies: [], events: [], forcedStallResolutions: 0,',
      '    statAura: loadout.statAura ? { name: loadout.statAura.auraName, border: loadout.statAura.border || null, value: state.boosts.Allies.statAuraValue } : undefined,',
      '    abilityAura: loadout.abilityAura ? { name: loadout.abilityAura.auraName, border: loadout.abilityAura.border || null, value: state.boosts.Allies.skillAuraValue } : undefined,',
      '  }',
      '  const runtime: Runtime = { state, rng: new SeededRng(seed), debug }',
      '  resolveConstellarArts(runtime)',
      '  debug.initialAllies = state.teams.Allies.map(debugCard)',
      '  debug.initialEnemies = state.teams.Enemies.map(debugCard)',
    ]), 'debug init')

  text = replaceOnce(text,
    block([
      '    if (turnsWithoutDeaths >= 150) {',
      '      attacker.hp = 0',
      '      defender.hp = 0',
      '      resolveDeaths(runtime)',
      '      continue',
      '    }',
    ]),
    block([
      '    if (turnsWithoutDeaths >= 100) {',
      '      debug.forcedStallResolutions += 1',
      '      pushDebugEvent(runtime, {',
      '        turn: state.turn,',
      "        type: 'stall',",
      '        team: state.moving,',
      '        card: effectiveCardName(attacker) || attacker.definition.name,',
      "        detail: `OG-server 100-turn no-progress resolution vs ${effectiveCardName(defender) || defender.definition.name}: both active cards defeated`,",
      '        hp: attacker.hp, maxHp: attacker.maxHp, damage: attacker.damage,',
      '      })',
      '      attacker.hp = 0',
      '      defender.hp = 0',
      '      resolveDeaths(runtime)',
      '      continue',
      '    }',
    ]), '100-turn source rule')

  text = replaceOnce(text,
    block(['    lastMover = attacker', '    lastTarget = defender', '', '    doTurn(runtime, attacker)']),
    block([
      '    lastMover = attacker',
      '    lastTarget = defender',
      '    pushDebugEvent(runtime, {',
      '      turn: state.turn,',
      "      type: 'turn',",
      '      team: state.moving,',
      '      card: effectiveCardName(attacker) || attacker.definition.name,',
      "      detail: `vs ${effectiveCardName(defender) || defender.definition.name} | attacker ${Math.ceil(attacker.hp)}/${Math.ceil(attacker.maxHp)} HP ${Math.ceil(attacker.damage)} ATK | defender ${Math.ceil(defender.hp)}/${Math.ceil(defender.maxHp)} HP ${Math.ceil(defender.damage)} ATK`,",
      '      hp: attacker.hp, maxHp: attacker.maxHp, damage: attacker.damage,',
      '    })',
      '',
      '    doTurn(runtime, attacker)',
    ]), 'turn trace')

  text = replaceOnce(text,
    block([
      '  const unsupportedAbilities = [...state.unsupportedAbilities].sort()',
      '  return { winner, turns: state.turn, state, unsupportedAbilities, trusted: unsupportedAbilities.length === 0 }',
      '}',
    ]),
    block([
      '  const unsupportedAbilities = [...state.unsupportedAbilities].sort()',
      '  debug.finalAllies = state.teams.Allies.map(debugCard)',
      '  debug.finalEnemies = state.teams.Enemies.map(debugCard)',
      '  return { winner, turns: state.turn, state, unsupportedAbilities, trusted: unsupportedAbilities.length === 0, debug }',
      '}',
    ]), 'return debug')

  write(path, text)
}

// Depths result carries exact seeds and the losing-battle trace.
{
  const path = 'src/engine/simulation.ts'
  let text = read(path)
  text = replaceOnce(text, "import type { TeamLoadout } from '../types'", "import type { BattleDebug, TeamLoadout } from '../types'", 'simulation import')
  text = replaceOnce(text,
    block([
      'export interface DepthsRunResult {',
      '  deathFloor: number',
      '  floorsCleared: number',
      '  battles: number',
      '  totalTurns: number',
      '  endingEnemies: string[]',
      '  trusted: boolean',
      '  unsupportedAbilities: string[]',
      '}',
    ]),
    block([
      'export interface DepthsRunResult {',
      '  deathFloor: number',
      '  floorsCleared: number',
      '  battles: number',
      '  totalTurns: number',
      '  endingEnemies: string[]',
      '  trusted: boolean',
      '  unsupportedAbilities: string[]',
      '  runSeed: number',
      '  floorSeed?: number',
      '  battleSeed?: number',
      '  debug?: BattleDebug',
      '}',
    ]), 'run debug fields')
  text = replaceOnce(text,
    block([
      '        endingEnemies: enemies.map((enemy) => enemy.card.name),',
      '        trusted: unsupported.size === 0,',
      '        unsupportedAbilities: [...unsupported].sort(),',
    ]),
    block([
      '        endingEnemies: enemies.map((enemy) => enemy.card.name),',
      '        trusted: unsupported.size === 0,',
      '        unsupportedAbilities: [...unsupported].sort(),',
      '        runSeed,',
      '        floorSeed,',
      '        battleSeed: floorSeed ^ 0x51ed270b,',
      '        debug: battle.debug,',
    ]), 'losing debug payload')
  text = replaceOnce(text,
    block([
      '    endingEnemies: [],',
      '    trusted: unsupported.size === 0,',
      '    unsupportedAbilities: [...unsupported].sort(),',
    ]),
    block([
      '    endingEnemies: [],',
      '    trusted: unsupported.size === 0,',
      '    unsupportedAbilities: [...unsupported].sort(),',
      '    runSeed,',
    ]), 'cap run seed')
  write(path, text)
}

// Live UI: every floor result becomes clickable and opens a copyable diagnostics dialog.
{
  const path = 'index.html'
  let text = read(path)
  const oldChip = "${r.runs.map((run,i)=>`<span title=\"Run ${i+1}${run.endingEnemies?.length?' · '+run.endingEnemies.join(' / '):''}\">${full(run.deathFloor)}</span>`).join('')}"
  const newChip = "${r.runs.map((run,i)=>`<span role=\"button\" tabindex=\"0\" style=\"cursor:pointer\" data-debug-team=\"${index}\" data-debug-run=\"${i}\" title=\"Run ${i+1}${run.endingEnemies?.length?' · '+run.endingEnemies.join(' / '):''} · click for debug\">${full(run.deathFloor)}</span>`).join('')}"
  text = replaceOnce(text, oldChip, newChip, 'clickable result chips')

  const persist = "  function persist(){try{localStorage.setItem(STORAGE,JSON.stringify({teams:state.teams.map(t=>({cards:t.cards,statAura:t.statAura,statAuraBorder:t.statAuraBorder,abilityAura:t.abilityAura,abilityAuraBorder:t.abilityAuraBorder})),activeTeam:state.activeTeam,runs:state.runs,cap:state.cap,seed:state.seed}))}catch(_){}}"
  const debugFn = block([
    '  function showRunDebug(teamIndex,runIndex){',
    '    const run=state.teams[teamIndex]?.result?.runs?.[runIndex],d=run?.debug;if(!run)return;',
    "    const fmt=n=>Number.isFinite(Number(n))?Math.round(Number(n)).toLocaleString('en-US'):'?';",
    "    const cardLine=c=>`${c.name} [${c.ability||'No ability'}] HP ${fmt(c.hp)}/${fmt(c.maxHp)} | ATK ${fmt(c.damage)} | Power ${fmt(c.power)}`;",
    '    const lines=[];',
    "    lines.push(`Team ${teamIndex+1} | Run ${runIndex+1} | Death floor ${fmt(run.deathFloor)}`);",
    "    lines.push(`Run seed ${run.runSeed} | Floor seed ${run.floorSeed??'?'} | Battle seed ${run.battleSeed??'?'}`);",
    "    lines.push(`Stat Aura: ${d?.statAura?`${d.statAura.name} ${d.statAura.border||'Base'} value=${d.statAura.value??'?'}`:'none'}`);",
    "    lines.push(`Ability Aura: ${d?.abilityAura?`${d.abilityAura.name} ${d.abilityAura.border||'Base'} value=${d.abilityAura.value??'?'}`:'none'}`);",
    "    lines.push(`Forced 100-turn resolutions: ${d?.forcedStallResolutions??0}`);",
    "    lines.push('', 'PLAYER BATTLE-START STATS');",
    "    for(const c of d?.initialAllies||[])lines.push(cardLine(c));",
    "    lines.push('', 'ENEMY BATTLE-START STATS');",
    "    for(const c of d?.initialEnemies||[])lines.push(cardLine(c));",
    "    lines.push('', 'FINAL PLAYER SURVIVORS');",
    "    for(const c of d?.finalAllies||[])lines.push(cardLine(c));",
    "    lines.push('', 'FINAL ENEMY SURVIVORS');",
    "    for(const c of d?.finalEnemies||[])lines.push(cardLine(c));",
    "    lines.push('', 'TRACE (last 300 important/turn events)');",
    "    for(const e of d?.events||[])lines.push(`T${e.turn} [${e.type.toUpperCase()}] ${e.team} ${e.card}: ${e.detail}`);",
    "    const text=lines.join('\\n');",
    "    const dialog=document.createElement('dialog');dialog.style.cssText='width:min(900px,94vw);max-height:88vh;background:#080d14;color:#c7d1dc;border:1px solid #334255;border-radius:12px;padding:14px';",
    "    const bar=document.createElement('div');bar.style.cssText='display:flex;gap:8px;justify-content:flex-end;margin-bottom:8px';",
    "    const copy=document.createElement('button');copy.textContent='Copy debug';const close=document.createElement('button');close.textContent='Close';",
    "    for(const b of [copy,close])b.style.cssText='background:#111925;color:#c7d1dc;border:1px solid #2a394a;border-radius:8px;padding:7px 10px;cursor:pointer';",
    "    const pre=document.createElement('pre');pre.textContent=text;pre.style.cssText='white-space:pre-wrap;font:11px/1.5 ui-monospace,Consolas,monospace;margin:0';",
    '    bar.append(copy,close);dialog.append(bar,pre);document.body.appendChild(dialog);dialog.showModal();',
    "    close.addEventListener('click',()=>{dialog.close();dialog.remove()});",
    "    copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(text);copy.textContent='Copied!'}catch(_){}});",
    '  }',
  ])
  text = replaceOnce(text, persist, debugFn + '\n' + persist, 'debug dialog function')
  text = replaceOnce(text,
    "  function bindEvents(){root.querySelectorAll('[data-team-tab]')",
    "  function bindEvents(){root.querySelectorAll('[data-debug-run]').forEach(el=>{const open=()=>showRunDebug(Number(el.dataset.debugTeam),Number(el.dataset.debugRun));el.addEventListener('click',open);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}})});root.querySelectorAll('[data-team-tab]')",
    'debug event binding')
  write(path, text)
}

// Direct regression for the source behavior we just recovered from Cardrng(1).rbxl.
write('scripts/anubis-regression.ts', block([
  "import cards from '../src/data/cards'",
  "import { simulateBattleV2 } from '../src/engine/battle-v2'",
  "import type { DepthsEnemy, TeamLoadout } from '../src/types'",
  '',
  'function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message) }',
  "const anubis = cards.find((card) => card.name === 'Anubis')",
  "const archer = cards.find((card) => card.name === 'Archer')",
  "assert(anubis && archer, 'Regression cards missing')",
  'const enemyPower = 100',
  'const enemies: DepthsEnemy[] = [',
  '  { card: anubis, power: enemyPower, attack: 50, health: 100 },',
  '  { card: archer, power: enemyPower, attack: 50, health: 100 },',
  ']',
  "const loadout: TeamLoadout = { cards: ['Behemoth','Behemoth','Behemoth','Behemoth'].map((cardName) => ({ cardName, borders: ['Galaxy'] })) }",
  'const battle = simulateBattleV2(loadout, enemies, 12345, 500, true)',
  "const revives = battle.debug?.events.filter((event) => event.type === 'revive' && event.card === 'Anubis') || []",
  "assert(revives.length === 1, `Expected exactly one Anubis revive, got ${revives.length}`)",
  'const revive = revives[0]',
  "assert(revive.maxHp === 100, `Expected base MaxHP 100 after revive, got ${revive.maxHp}`)",
  "assert(revive.hp === 50, `Expected half HP 50 after revive, got ${revive.hp}`)",
  "assert(revive.damage === 50, `Expected base ATK 50 after revive, got ${revive.damage}`)",
  "console.log('Anubis regression passed: self-revives exactly once at half base HP.')",
]) + '\n')

console.log('Applied source-aligned Anubis, stall, and debug changes.')

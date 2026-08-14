import fs from 'node:fs'

function read(path) { return fs.readFileSync(path, 'utf8') }
function write(path, text) { fs.writeFileSync(path, text) }
function replaceOnce(text, from, to, label) {
  const count = text.split(from).length - 1
  if (count !== 1) throw new Error(`${label}: expected 1 match, found ${count}`)
  return text.replace(from, to)
}

// 1) Add compact, serializable loss diagnostics to the shared result types.
{
  const path = 'src/types.ts'
  let text = read(path)
  text = replaceOnce(text,
`export interface BattleState {
  teams: Record<BattleTeam, CombatCard[]>
  fallen: Record<BattleTeam, CombatCard[]>
  boosts: Record<BattleTeam, BattleBoosts>
  turn: number
  moving: BattleTeam
  unsupportedAbilities: Set<string>
}

export interface BattleResult {
  winner: BattleTeam | 'Draw'
  turns: number
  state: BattleState
  unsupportedAbilities: string[]
  trusted: boolean
}
`,
`export interface BattleState {
  teams: Record<BattleTeam, CombatCard[]>
  fallen: Record<BattleTeam, CombatCard[]>
  boosts: Record<BattleTeam, BattleBoosts>
  turn: number
  moving: BattleTeam
  unsupportedAbilities: Set<string>
}

export interface BattleDebugCard {
  name: string
  ability: string | null
  hp: number
  maxHp: number
  damage: number
  power: number
}

export interface BattleDebugEvent {
  turn: number
  type: 'turn' | 'death' | 'revive' | 'stall'
  team: BattleTeam
  card: string
  detail: string
  hp?: number
  maxHp?: number
  damage?: number
}

export interface BattleDebug {
  initialAllies: BattleDebugCard[]
  initialEnemies: BattleDebugCard[]
  finalAllies: BattleDebugCard[]
  finalEnemies: BattleDebugCard[]
  events: BattleDebugEvent[]
  forcedStallResolutions: number
  statAura?: { name: string; border: AuraBorderName | null; value?: number }
  abilityAura?: { name: string; border: AuraBorderName | null; value?: number }
}

export interface BattleResult {
  winner: BattleTeam | 'Draw'
  turns: number
  state: BattleState
  unsupportedAbilities: string[]
  trusted: boolean
  debug?: BattleDebug
}
`, 'types debug interfaces')
  write(path, text)
}

// 2) Source-align Beyond The Grave, source-align the no-progress kill threshold,
//    and capture a compact trace of the losing battle.
{
  const path = 'src/engine/battle-v2.ts'
  let text = read(path)

  text = replaceOnce(text,
`  BattleBoosts,
  BattleResult,
  BattleState,`,
`  BattleBoosts,
  BattleDebug,
  BattleResult,
  BattleState,`, 'battle debug import')

  text = replaceOnce(text,
`interface Runtime {
  state: BattleState
  rng: SeededRng
}
`,
`interface Runtime {
  state: BattleState
  rng: SeededRng
  debug: BattleDebug
}

function debugCard(card: CombatCard) {
  return {
    name: effectiveCardName(card) || card.definition.name,
    ability: ability(card),
    hp: card.hp,
    maxHp: card.maxHp,
    damage: card.damage,
    power: card.power,
  }
}

function pushDebugEvent(runtime: Runtime, event: BattleDebug['events'][number]) {
  // Enough context for weird losses without returning megabytes for long fights.
  if (runtime.debug.events.length >= 300) runtime.debug.events.shift()
  runtime.debug.events.push(event)
}
`, 'runtime debug helpers')

  text = replaceOnce(text,
`      deck.shift()
      card.hp = 0
      card.dead = true
      runtime.state.fallen[team].push(card)
`,
`      // The original server checks Beyond The Grave on the card that is dying.
      // Capture this before setting dead=true because our hasAbility helper ignores dead cards.
      const canBeyondTheGrave = hasAbility(runtime, card, 'Beyond The Grave') && !card.flags.beyondGraveRevived

      deck.shift()
      card.hp = 0
      card.dead = true
      runtime.state.fallen[team].push(card)
      pushDebugEvent(runtime, {
        turn: runtime.state.turn,
        type: 'death',
        team,
        card: effectiveCardName(card) || card.definition.name,
        detail: 'Card defeated',
        hp: 0,
        maxHp: card.maxHp,
        damage: card.damage,
      })
`, 'capture death and BTG eligibility')

  text = replaceOnce(text,
`      const revenants = runtime.state.fallen[team].filter((fallen) =>
        fallen !== card && abilityNames(fallen).includes('Beyond The Grave') && fallen.hp <= 0
      )
      for (const revenant of revenants) {
        // Two Beyond The Grave cards can otherwise revive each other forever.
        // Carry a chain counter only when one Beyond The Grave holder revives another;
        // unrelated ally deaths reset the chain. Resolve the pathological cycle at
        // the same 150-turn scale used by the source battle timeout.
        const beyondGraveChain = abilityNames(card).includes('Beyond The Grave')
          ? (card.counters.beyondGraveChain || 0) + 1
          : 1
        if (beyondGraveChain >= 150) continue
        const fallenIndex = runtime.state.fallen[team].indexOf(revenant)
        if (fallenIndex >= 0) runtime.state.fallen[team].splice(fallenIndex, 1)
        revenant.dead = false
        revenant.hp = revenant.maxHp * 0.5
        revenant.entered = false
        revenant.counters.beyondGraveChain = beyondGraveChain
        // Expansion BattleClient appends Beyond The Grave revivals to the end of the team.
        runtime.state.teams[team].push(revenant)
      }
`,
`      if (canBeyondTheGrave) {
        // Original server source creates a fresh card from Name/Border/Power, sets BTG=true,
        // restores base (pre-aura / pre-battle-buff) ATK and Max HP, starts at half HP,
        // removes the dead copy from Fallen, and appends the revived copy to the team.
        const baseMaxHp = card.power * (card.definition.hpMultiplier || 1)
        const baseDamage = card.power / 2
        const fallenIndex = runtime.state.fallen[team].indexOf(card)
        if (fallenIndex >= 0) runtime.state.fallen[team].splice(fallenIndex, 1)
        const revived: CombatCard = {
          ...card,
          id: `${card.id}:btg`,
          hp: baseMaxHp / 2,
          maxHp: baseMaxHp,
          damage: baseDamage,
          entered: false,
          dead: false,
          identityOverride: undefined,
          abilityOverride: undefined,
          bonusAbilities: undefined,
          status: { stunned: 0, confused: 0, burn: 0, weakness: false, blind: false, shield: 0 },
          flags: { beyondGraveRevived: true },
          counters: { normalDamage: baseDamage, normalMaxHp: baseMaxHp },
        }
        runtime.state.teams[team].push(revived)
        pushDebugEvent(runtime, {
          turn: runtime.state.turn,
          type: 'revive',
          team,
          card: revived.definition.name,
          detail: 'Beyond The Grave: revived once at half base HP; battle/aura stat changes reset',
          hp: revived.hp,
          maxHp: revived.maxHp,
          damage: revived.damage,
        })
      }
`, 'replace incorrect Beyond The Grave behavior')

  text = replaceOnce(text,
`  const state = createBattleStateV2(loadout, enemies)
  const runtime: Runtime = { state, rng: new SeededRng(seed) }
  resolveConstellarArts(runtime)
`,
`  const state = createBattleStateV2(loadout, enemies)
  const debug: BattleDebug = {
    initialAllies: [],
    initialEnemies: [],
    finalAllies: [],
    finalEnemies: [],
    events: [],
    forcedStallResolutions: 0,
    statAura: loadout.statAura ? {
      name: loadout.statAura.auraName,
      border: loadout.statAura.border || null,
      value: state.boosts.Allies.statAuraValue,
    } : undefined,
    abilityAura: loadout.abilityAura ? {
      name: loadout.abilityAura.auraName,
      border: loadout.abilityAura.border || null,
      value: state.boosts.Allies.skillAuraValue,
    } : undefined,
  }
  const runtime: Runtime = { state, rng: new SeededRng(seed), debug }
  resolveConstellarArts(runtime)
  debug.initialAllies = state.teams.Allies.map(debugCard)
  debug.initialEnemies = state.teams.Enemies.map(debugCard)
`, 'initialize battle debug')

  text = replaceOnce(text,
`    if (turnsWithoutDeaths >= 150) {
      attacker.hp = 0
      defender.hp = 0
      resolveDeaths(runtime)
      continue
    }
`,
`    if (turnsWithoutDeaths >= 100) {
      debug.forcedStallResolutions += 1
      pushDebugEvent(runtime, {
        turn: state.turn,
        type: 'stall',
        team: state.moving,
        card: effectiveCardName(attacker) || attacker.definition.name,
        detail: `Original-server 100-turn no-progress resolution vs ${effectiveCardName(defender) || defender.definition.name}: both active cards are defeated`,
        hp: attacker.hp,
        maxHp: attacker.maxHp,
        damage: attacker.damage,
      })
      attacker.hp = 0
      defender.hp = 0
      resolveDeaths(runtime)
      continue
    }
`, 'source-align stall threshold')

  text = replaceOnce(text,
`    lastMover = attacker
    lastTarget = defender

    doTurn(runtime, attacker)
`,
`    lastMover = attacker
    lastTarget = defender
    pushDebugEvent(runtime, {
      turn: state.turn,
      type: 'turn',
      team: state.moving,
      card: effectiveCardName(attacker) || attacker.definition.name,
      detail: `vs ${effectiveCardName(defender) || defender.definition.name} | attacker ${Math.ceil(attacker.hp)}/${Math.ceil(attacker.maxHp)} HP ${Math.ceil(attacker.damage)} ATK | defender ${Math.ceil(defender.hp)}/${Math.ceil(defender.maxHp)} HP ${Math.ceil(defender.damage)} ATK`,
      hp: attacker.hp,
      maxHp: attacker.maxHp,
      damage: attacker.damage,
    })

    doTurn(runtime, attacker)
`, 'trace turn starts')

  text = replaceOnce(text,
`  const unsupportedAbilities = [...state.unsupportedAbilities].sort()
  return { winner, turns: state.turn, state, unsupportedAbilities, trusted: unsupportedAbilities.length === 0 }
}`, 
`  const unsupportedAbilities = [...state.unsupportedAbilities].sort()
  debug.finalAllies = state.teams.Allies.map(debugCard)
  debug.finalEnemies = state.teams.Enemies.map(debugCard)
  return { winner, turns: state.turn, state, unsupportedAbilities, trusted: unsupportedAbilities.length === 0, debug }
}`, 'return battle debug')

  write(path, text)
}

// 3) Preserve the exact seeds and losing-battle diagnostics on every run result.
{
  const path = 'src/engine/simulation.ts'
  let text = read(path)
  text = replaceOnce(text,
`import type { TeamLoadout } from '../types'`,
`import type { BattleDebug, TeamLoadout } from '../types'`, 'simulation debug import')

  text = replaceOnce(text,
`export interface DepthsRunResult {
  deathFloor: number
  floorsCleared: number
  battles: number
  totalTurns: number
  endingEnemies: string[]
  trusted: boolean
  unsupportedAbilities: string[]
}`,
`export interface DepthsRunResult {
  deathFloor: number
  floorsCleared: number
  battles: number
  totalTurns: number
  endingEnemies: string[]
  trusted: boolean
  unsupportedAbilities: string[]
  runSeed: number
  floorSeed?: number
  battleSeed?: number
  debug?: BattleDebug
}`, 'DepthsRunResult debug fields')

  text = replaceOnce(text,
`        endingEnemies: enemies.map((enemy) => enemy.card.name),
        trusted: unsupported.size === 0,
        unsupportedAbilities: [...unsupported].sort(),
`,
`        endingEnemies: enemies.map((enemy) => enemy.card.name),
        trusted: unsupported.size === 0,
        unsupportedAbilities: [...unsupported].sort(),
        runSeed,
        floorSeed,
        battleSeed: floorSeed ^ 0x51ed270b,
        debug: battle.debug,
`, 'losing run debug payload')

  text = replaceOnce(text,
`    endingEnemies: [],
    trusted: unsupported.size === 0,
    unsupportedAbilities: [...unsupported].sort(),
`,
`    endingEnemies: [],
    trusted: unsupported.size === 0,
    unsupportedAbilities: [...unsupported].sort(),
    runSeed,
`, 'cap run seed')
  write(path, text)
}

// 4) Make every result chip clickable and show the exact loss diagnostics in-place.
{
  const path = 'index.html'
  let text = read(path)

  text = replaceOnce(text,
`.floor-strip span{border:1px solid #243141;border-radius:7px;padding:4px 6px;color:#9eabba;font-size:8px}.ending-enemies`,
`.floor-strip span,.floor-strip button{border:1px solid #243141;border-radius:7px;padding:4px 6px;color:#9eabba;font-size:8px}.floor-strip button{background:#0b1119;cursor:pointer}.floor-strip button:hover{border-color:#477b76;color:#d7f2ed}.debug-overlay{position:fixed;inset:0;z-index:10000;background:rgba(2,5,9,.82);display:grid;place-items:center;padding:18px}.debug-modal{width:min(920px,96vw);max-height:90vh;overflow:auto;background:#080d14;border:1px solid #334255;border-radius:14px;box-shadow:0 24px 80px rgba(0,0,0,.65);padding:16px}.debug-head{display:flex;justify-content:space-between;gap:12px;align-items:center;position:sticky;top:-16px;background:#080d14;padding:10px 0;border-bottom:1px solid #1d2734;z-index:1}.debug-head h4{margin:0;font-size:14px}.debug-head-actions{display:flex;gap:6px}.debug-head button{border:1px solid #2a394a;background:#111925;color:#b7c5d4;border-radius:8px;padding:6px 9px;cursor:pointer}.debug-meta{display:flex;gap:10px;flex-wrap:wrap;color:#7f8c9d;font-size:9px;margin:12px 0}.debug-section{margin-top:13px}.debug-section>span{display:block;color:#687789;font-size:8px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px}.debug-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:6px}.debug-card{border:1px solid #223040;background:#0d141d;border-radius:8px;padding:8px;font-size:9px;color:#93a1b2}.debug-card b{display:block;color:#d7e0ea;font-size:10px;margin-bottom:3px}.debug-events{font:9px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre-wrap;background:#060a0f;border:1px solid #1d2734;border-radius:9px;padding:10px;color:#aab6c4}.ending-enemies`, 'debug modal styles')

  const floorRegex = /<div class="floor-strip">\$\{r\.runs\.map\(\(run,i\)=>`<span title="Run \$\{i\+1\}\$\{run\.endingEnemies\?\.length\?' · '\+run\.endingEnemies\.join\(' \/ '\):''\}">\$\{full\(run\.deathFloor\)\}<\/span>`\)\.join\(''\)\}<\/div>/
  if (!floorRegex.test(text)) throw new Error('index floor strip: exact run chip pattern not found')
  text = text.replace(floorRegex, `<div class="floor-strip">\${r.runs.map((run,i)=>\`<button type="button" data-debug-team="\${index}" data-debug-run="\${i}" title="Run \${i+1}\${run.endingEnemies?.length?' · '+run.endingEnemies.join(' / '):''} · click for debug">\${full(run.deathFloor)}</button>\`).join('')}</div>`)

  text = replaceOnce(text,
`  function persist(){try{localStorage.setItem(STORAGE,JSON.stringify({teams:state.teams.map(t=>({cards:t.cards,statAura:t.statAura,statAuraBorder:t.statAuraBorder,abilityAura:t.abilityAura,abilityAuraBorder:t.abilityAuraBorder})),activeTeam:state.activeTeam,runs:state.runs,cap:state.cap,seed:state.seed}))}catch(_){}}`,
`  function showRunDebug(teamIndex,runIndex){const team=state.teams[teamIndex],run=team?.result?.runs?.[runIndex],d=run?.debug;if(!run)return;const fmt=n=>Number.isFinite(Number(n))?Math.round(Number(n)).toLocaleString('en-US'):'?';const cards=(list=[])=>list.map(c=>\`<div class="debug-card"><b>\${esc(c.name)}</b>\${esc(c.ability||'No ability')}<br>HP \${fmt(c.hp)} / \${fmt(c.maxHp)}<br>ATK \${fmt(c.damage)} · Power \${fmt(c.power)}</div>\`).join('')||'<div class="debug-card">None</div>';const events=(d?.events||[]).map(e=>\`T\${e.turn} [\${e.type.toUpperCase()}] \${e.team} · \${e.card}: \${e.detail}\`).join('\\n')||'No trace was returned.';const auraText=[d?.statAura?\`Stat: \${d.statAura.name} \${d.statAura.border||'Base'} (\${d.statAura.value??'?'}%)\`:'Stat: none',d?.abilityAura?\`Ability: \${d.abilityAura.name} \${d.abilityAura.border||'Base'} (value \${d.abilityAura.value??'?'})\`:'Ability: none'].join(' · ');const plain=\`Run \${runIndex+1} | floor \${run.deathFloor} | runSeed \${run.runSeed} | floorSeed \${run.floorSeed??'?'} | battleSeed \${run.battleSeed??'?'}\\n\${auraText}\\nForced 100-turn resolutions: \${d?.forcedStallResolutions??0}\\nEnemies: \${(run.endingEnemies||[]).join(' / ')}\\n\\n\${events}\`;const overlay=document.createElement('div');overlay.className='debug-overlay';overlay.innerHTML=\`<div class="debug-modal"><div class="debug-head"><h4>Team \${teamIndex+1} · Run \${runIndex+1} · Floor \${full(run.deathFloor)}</h4><div class="debug-head-actions"><button data-copy-debug>Copy debug</button><button data-close-debug>Close</button></div></div><div class="debug-meta"><span>Run seed: \${run.runSeed}</span><span>Floor seed: \${run.floorSeed??'?'}</span><span>Battle seed: \${run.battleSeed??'?'}</span><span>Turns: \${run.totalTurns}</span><span>Forced stall: \${d?.forcedStallResolutions??0}</span></div><div class="debug-section"><span>Auras actually passed into battle</span><div class="debug-card">\${esc(auraText)}</div></div><div class="debug-section"><span>Player battle-start stats (after deck + Stat/Ability Aura setup)</span><div class="debug-grid">\${cards(d?.initialAllies)}</div></div><div class="debug-section"><span>Enemy battle-start stats</span><div class="debug-grid">\${cards(d?.initialEnemies)}</div></div><div class="debug-section"><span>Final surviving player cards</span><div class="debug-grid">\${cards(d?.finalAllies)}</div></div><div class="debug-section"><span>Final surviving enemy cards</span><div class="debug-grid">\${cards(d?.finalEnemies)}</div></div><div class="debug-section"><span>Last / important battle trace</span><div class="debug-events">\${esc(events)}</div></div></div>\`;document.body.appendChild(overlay);const close=()=>overlay.remove();overlay.querySelector('[data-close-debug]')?.addEventListener('click',close);overlay.addEventListener('click',e=>{if(e.target===overlay)close()});overlay.querySelector('[data-copy-debug]')?.addEventListener('click',async e=>{try{await navigator.clipboard.writeText(plain);e.currentTarget.textContent='Copied!'}catch(_){prompt('Copy debug:',plain)}})}
  function persist(){try{localStorage.setItem(STORAGE,JSON.stringify({teams:state.teams.map(t=>({cards:t.cards,statAura:t.statAura,statAuraBorder:t.statAuraBorder,abilityAura:t.abilityAura,abilityAuraBorder:t.abilityAuraBorder})),activeTeam:state.activeTeam,runs:state.runs,cap:state.cap,seed:state.seed}))}catch(_){}}`, 'insert run debug modal')

  text = replaceOnce(text,
`  function bindEvents(){root.querySelectorAll('[data-team-tab]')`,
`  function bindEvents(){root.querySelectorAll('[data-debug-run]').forEach(el=>el.addEventListener('click',()=>showRunDebug(Number(el.dataset.debugTeam),Number(el.dataset.debugRun))));root.querySelectorAll('[data-team-tab]')`, 'bind debug run buttons')

  write(path, text)
}

// 5) Regression: Anubis self-revives exactly once, at half BASE health and BASE attack.
write('scripts/anubis-regression.ts', `import cards from '../src/data/cards'\nimport { simulateBattleV2 } from '../src/engine/battle-v2'\nimport type { DepthsEnemy, TeamLoadout } from '../src/types'\n\nfunction assert(condition: unknown, message: string): asserts condition {\n  if (!condition) throw new Error(message)\n}\n\nconst anubis = cards.find((card) => card.name === 'Anubis')\nconst archer = cards.find((card) => card.name === 'Archer')\nassert(anubis && archer, 'Regression cards missing')\n\nconst enemyPower = 100\nconst enemies: DepthsEnemy[] = [\n  { card: anubis, power: enemyPower, attack: enemyPower / 2, health: enemyPower * (anubis.hpMultiplier || 1) },\n  { card: archer, power: enemyPower, attack: enemyPower / 2, health: enemyPower * (archer.hpMultiplier || 1) },\n]\nconst loadout: TeamLoadout = {\n  cards: ['Behemoth', 'Behemoth', 'Behemoth', 'Behemoth'].map((cardName) => ({ cardName, borders: ['Galaxy'] })),\n}\nconst battle = simulateBattleV2(loadout, enemies, 12345, 500, true)\nconst revives = battle.debug?.events.filter((event) => event.type === 'revive' && event.card === 'Anubis') || []\nassert(revives.length === 1, \\`Expected exactly one Anubis revive, got \\${revives.length}\\`)\nconst revive = revives[0]\nassert(revive.maxHp === 100, \\`Expected revived Anubis base MaxHP 100, got \\${revive.maxHp}\\`)\nassert(revive.hp === 50, \\`Expected revived Anubis half HP 50, got \\${revive.hp}\\`)\nassert(revive.damage === 50, \\`Expected revived Anubis base ATK 50, got \\${revive.damage}\\`)\nconsole.log('Anubis Beyond The Grave regression passed: one self-revive at half base HP.')\n`)

console.log('Applied current Depths fixes.')

import fs from 'node:fs'

const path = 'src/engine/battle-v2.ts'
let source = fs.readFileSync(path, 'utf8')

function replaceOrThrow(oldText, newText, label) {
  if (!source.includes(oldText)) throw new Error(`Could not find ${label}`)
  source = source.replace(oldText, newText)
}

replaceOrThrow(
`function resolveAuraFarm(runtime: Runtime, target: CombatCard, incoming: number): { target: CombatCard; damage: number } {
  if (incoming < target.hp) return { target, damage: incoming }
  const deck = runtime.state.teams[target.team]
  const piccolo = deck[1]
  if (!piccolo || piccolo.definition.name !== 'Piccolo' || piccolo.flags.farmed) return { target, damage: incoming }
  piccolo.flags.farmed = true
  deck[0] = piccolo
  deck[1] = target
  boostStats(piccolo, 2)
  if (target.definition.name === 'Kid Gohan') boostStats(piccolo, 1.5)
  return { target: piccolo, damage: 0 }
}`,
`function resolveAuraFarm(runtime: Runtime, target: CombatCard, incoming: number): { target: CombatCard; damage: number } {
  if (incoming < target.hp) return { target, damage: incoming }
  const deck = runtime.state.teams[target.team]
  const piccolo = deck[1]
  if (!piccolo || piccolo.definition.name !== 'Piccolo' || piccolo.flags.farmed) return { target, damage: incoming }
  const protectedName = effectiveCardName(target) || target.definition.name
  const fatherhood = target.definition.name === 'Kid Gohan'
  piccolo.flags.farmed = true
  deck[0] = piccolo
  deck[1] = target
  boostStats(piccolo, 2)
  if (fatherhood) boostStats(piccolo, 1.5)
  pushAbilityDebug(
    runtime,
    piccolo,
    `Aura Farm protected ${protectedName} from a lethal hit. Piccolo moved to the front, blocked the attack, and gained ${fatherhood ? '3× stats (Aura Farm + Mr. Piccolo)' : '2× stats'}.`,
  )
  return { target: piccolo, damage: 0 }
}`,
'Aura Farm resolver',
)

replaceOrThrow(
`  if (hasAbility(runtime, attacker, 'Chaos Destruction') && rand(runtime, attacker.team) > 0.5) {
    const deck = runtime.state.teams[enemyTeam]
    if (deck.length > 1) {
      const swapIndex = 1 + Math.floor(runtime.rng.next() * (deck.length - 1))
      ;[deck[0], deck[swapIndex]] = [deck[swapIndex], deck[0]]
      target = deck[0]
      onEntry(runtime, target)
      resolveDeaths(runtime)
    }
    attacker.flags.chaosTriple = true
  }`,
`  if (hasAbility(runtime, attacker, 'Chaos Destruction') && rand(runtime, attacker.team) > 0.5) {
    const deck = runtime.state.teams[enemyTeam]
    if (deck.length > 1) {
      const previousFront = deck[0]
      const swapIndex = 1 + Math.floor(runtime.rng.next() * (deck.length - 1))
      const swappedIn = deck[swapIndex]
      ;[deck[0], deck[swapIndex]] = [deck[swapIndex], deck[0]]
      target = deck[0]
      pushAbilityDebug(
        runtime,
        attacker,
        `Chaos Destruction swapped the enemy current card from ${effectiveCardName(previousFront) || previousFront.definition.name} to ${effectiveCardName(swappedIn) || swappedIn.definition.name}. The next attack deals 3× damage.`,
      )
      onEntry(runtime, target)
      resolveDeaths(runtime)
    } else {
      pushAbilityDebug(runtime, attacker, 'Chaos Destruction triggered. There was no other enemy card to swap in, and the next attack deals 3× damage.')
    }
    attacker.flags.chaosTriple = true
  }`,
'Chaos Destruction swap',
)

fs.writeFileSync(path, source)
console.log('Patched ability trace ordering details.')

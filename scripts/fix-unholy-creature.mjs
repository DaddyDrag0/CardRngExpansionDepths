import fs from 'node:fs'

function replaceOnce(path,before,after,label){
  let text=fs.readFileSync(path,'utf8')
  const count=text.split(before).length-1
  if(count!==1)throw new Error(`${label}: expected 1 match, found ${count}`)
  text=text.replace(before,after)
  fs.writeFileSync(path,text)
}

replaceOnce('src/engine/battle-v2.ts',
`      if (hasAbility(runtime, card, 'Unholy Creature')) {
        if (!card.flags.unholyActive) {
          card.flags.unholyActive = true
          card.counters.unholyTurns = 2
          card.hp = 1
          changed = true
          continue
        }
      }`,
`      if (hasAbility(runtime, card, 'Unholy Creature')) {
        if (!card.flags.unholyActive) {
          card.flags.unholyActive = true
          card.counters.unholyTurns = 2
          card.hp = 1
          changed = true
          continue
        }
        // Expansion description/server behavior: once the lethal state starts,
        // Zombie Dragon survives the full two-turn window. Further lethal hits
        // during that window cannot remove it early.
        if ((card.counters.unholyTurns || 0) > 0) {
          card.hp = 1
          changed = true
          continue
        }
      }`,
'Unholy Creature survival window')

const smoke='scripts/engine-smoke.ts'
let text=fs.readFileSync(smoke,'utf8')
const marker=`console.log('Expansion 150-turn no-progress regression passed:', timeoutBattle.turns, 'turns')\n`
if(!text.includes(marker))throw new Error('engine smoke marker missing')
const regression=`\nconst unholyEnemy: DepthsEnemy[] = [{\n  card: { ...dummy, name: '__Unholy Creature Enemy__' },\n  power: 1e12,\n  attack: 1e12,\n  health: 1e30,\n}]\nconst unholyBattle = simulateBattleV2(\n  { cards: [{ cardName: 'Zombie Dragon', borders: [] }] },\n  unholyEnemy,\n  24680,\n)\nassert(unholyBattle.winner === 'Enemies', 'Zombie Dragon survival regression should eventually end in defeat')\nassert(unholyBattle.turns >= 5, \`Zombie Dragon did not survive its full two-turn lethal window; battle ended at T\${unholyBattle.turns}\`)\nconsole.log('Zombie Dragon two-turn survival regression passed:', unholyBattle.turns, 'turns')\n`
text=text.replace(marker,marker+regression)
fs.writeFileSync(smoke,text)

console.log('Fixed Unholy Creature to survive the complete two-turn lethal window.')

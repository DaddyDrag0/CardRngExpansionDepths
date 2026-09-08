import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { simulateBattleV2 } from '../src/engine/battle-v2'
import { buildTowerEnemies } from '../src/engine/tower'

const battleSource = readFileSync('src/engine/battle-v2.ts', 'utf8')
const towerSource = readFileSync('src/engine/tower.ts', 'utf8')
const logUiSource = readFileSync('src/tower-win-logs-ui.js', 'utf8')
assert.match(battleSource, /canReceiveExternalProtection/)
assert.match(battleSource, /name === 'Destiny Sight' && canReceiveExternalProtection\(next\)/)
assert.match(battleSource, /name === 'Eternal Devotion' && canReceiveExternalProtection\(next\)/)
assert.match(battleSource, /Armageddon did not carry into the next enemy/)
assert.match(towerSource, /DISCOVERY_AURAS/)
assert.match(towerSource, /const quickSeed = nextSeed\(\)/)
assert.match(towerSource, /250, finalSeed/)
assert.doesNotMatch(logUiSource, /new MutationObserver\(queueRender\)/)

const enemies = buildTowerEnemies(['Baby Skeleton','Baby Skeleton','Baby Skeleton','Baby Skeleton'],1,'Normal')
const loadout:any = {
  cards:[
    {cardName:'Judgment Day',borders:[]},
    {cardName:'Robin Hood',borders:[]},
    {cardName:'Robin Hood',borders:[]},
    {cardName:'Robin Hood',borders:[]},
  ],
  statAura:null,
  abilityAura:{auraName:'Storm Spirit',border:null},
}
let found=false
for(let seed=1;seed<=1200&&!found;seed++){
  const battle=simulateBattleV2(loadout,enemies,seed,100,true,true)
  const details=(battle.debug?.events||[]).map((event)=>event.detail).join('\n')
  found=details.includes('Armageddon succeeded — this hit became lethal')
    && details.includes('Storm Spirit triggered')
    && details.includes('Armageddon did not carry into the next enemy')
}
assert.ok(found,'Judgment Day Overcharge after a lethal Armageddon should use half normal card damage instead of carrying infinity')
console.log('Tower cheese corrections passed.')

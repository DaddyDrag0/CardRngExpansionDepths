import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import cards from '../src/data/cards'
import { createBattleStateV2 } from '../src/engine/battle-v2'
import {
  HALLOWEEN_FIXED, HALLOWEEN_RANDOM_ENEMIES, halloweenStage,
  halloweenEnemyPower, halloweenEnemyCards, halloweenPackReward,
  halloweenPlayerPower, halloweenBanReason, halloweenCheckTeam,
  simulateHalloweenTower, searchHalloweenTower, probeHalloweenFloors, HALLOWEEN_DEFAULT_MIN_RARITY,
} from '../src/engine/halloween-tower'
import type { BorderName, TeamLoadout } from '../src/types'

const find=(name:string)=>{
  const card=cards.find(c=>c.name===name)
  assert(card,'Missing '+name)
  return card
}
const borders:BorderName[]=['Platinum','Crystal','Galaxy']
const own=(...names:string[]):TeamLoadout=>({
  cards:names.map(cardName=>({cardName,borders:[...borders]})),
})
// Player observed 185 ATK without Julius, 222 ATK with his 20% team passive.
assert.equal(halloweenPlayerPower(find('Triceratops'),borders),370)
assert.equal(Math.ceil(halloweenPlayerPower(find('Triceratops'),borders)/2),185)
const tri=own('Triceratops','Pterodactylus','Mothman','Julius Leader')
const enemies=halloweenEnemyCards(['Scarecrow','Witch','Banshee','Zombie'],17)
const normalized=createBattleStateV2(tri,enemies,{halloweenNormalizedPlayers:true,disablePlayerAuras:true})
assert.equal(normalized.teams.Allies[0].damage,222,'Triceratops must receive exactly 20% Julius Influence')
assert.equal(normalized.teams.Allies[1].damage,222,'Pterodactylus must receive the same boost')
assert.equal(normalized.teams.Allies[2].damage,234,'Mothman must begin at 195 and receive Influence')
// Enemy client preview/battle observations are stage-scaled, not by enemy rarity.
assert.equal(halloweenEnemyPower(14),335)
assert.equal(Math.ceil(halloweenEnemyPower(14)/2),168)
assert.equal(halloweenEnemyPower(15),338)
assert.equal(Math.ceil(halloweenEnemyPower(15)/2),169)
assert.equal(halloweenEnemyPower(17),343)
assert.equal(Math.ceil(halloweenEnemyPower(17)/2),172)
assert.equal(enemies[0].attack,172)
assert.equal(enemies[0].health,343*find('Scarecrow').hpMultiplier)
assert.equal(halloweenStage(15)[4],'Phantom')
assert.equal(halloweenStage(95)[4],'End Times')
assert.equal(halloweenStage(105)[0],'Savior')
assert.equal(halloweenStage(14,42).length,4)
assert.ok(halloweenStage(14,42).slice(0,4).every(x=>(HALLOWEEN_RANDOM_ENEMIES as readonly string[]).includes(x)))
assert.equal(halloweenPackReward(14),6_000)
assert.equal(halloweenPackReward(15),400_000)
assert.equal(halloweenPackReward(16),8_000)
assert.equal(halloweenPackReward(105),25_600_000)
assert.equal(halloweenBanReason('Vampire Lord'), 'Reported Halloween Tower ban')
assert.equal(halloweenBanReason('Fuxi'), 'Reported Halloween Tower ban')
for(const name of ['Behemoth','Parallax','Fate Seamstress']){
  assert.equal(halloweenBanReason(name),'Reported Halloween Tower ban',name+' must be excluded')
}
assert.ok(cards.some(c=>c.weather==='Rapture'))
for(const c of cards.filter(c=>c.weather==='Rapture'))assert.match(halloweenBanReason(c.name)||'',/Rapture/)
assert.ok(halloweenCheckTeam(own('Julius Leader','Julius Leader','Triceratops','Mothman')).some(x=>x.includes('at most one copy')))
assert.ok(halloweenCheckTeam(own('Triceratops','Mothman','Fuxi','Julius Leader')).some(x=>x.includes('Fuxi')))
assert.ok(halloweenCheckTeam(own('Triceratops','Mothman','Banshee','Julius Leader'),['Banshee']).some(x=>x.includes('Banshee')))
assert.equal(halloweenCheckTeam(own('Triceratops','Mothman','Banshee','Julius Leader')).length,0)
// Enemy fifth aura applies to enemy boosts, and Soul Guide suppresses player aura.
const arena=createBattleStateV2({...tri,abilityAura:{auraName:'Storm Spirit',border:null}},
  halloweenEnemyCards(HALLOWEEN_FIXED[15].slice(0,4),15),{
    halloweenNormalizedPlayers:true,disablePlayerAuras:true,
    enemySkillAura:{auraName:'Phantom',border:'Galaxy'},
  })
assert.equal(arena.boosts.Allies.stormSpirit,undefined,'Soul Guide did not suppress player aura')
assert.ok((arena.boosts.Enemies.phantom||0)>0,'Fixed stage extra enemy aura was ignored')
const summary=simulateHalloweenTower(own('Triceratops','Pterodactylus','Mothman','Julius Leader'),
  ['Scarecrow','Witch','Banshee','Zombie'],17,8,41)
assert.equal(summary.runs,8)
assert.equal(summary.wins+summary.losses+summary.draws,8)
assert.ok(summary.progress>=0&&summary.progress<=1)
// Small configurable pool: check all recommendation decks against reported bans.
const search=searchHalloweenTower(['Zombie','Zombie','Zombie','Zombie'],5,15,{
  pool:['Triceratops','Mothman','Julius Leader','Fuxi','Vampire Lord'],
  borders,
  extraBans:[],
})
assert.ok(search.recommendations.length>0)
for(const rec of search.recommendations)assert.deepEqual(halloweenCheckTeam(rec.loadout),[])
assert.equal(search.coveredCards,3)
assert.equal(search.minimumRarity,1)
assert.ok(search.tested>=search.coveredCards)
assert.match(search.searchMethod,/evolutionary/i)
assert.ok(!search.eligiblePool.includes('Fuxi')&&!search.eligiblePool.includes('Vampire Lord'))
// The assumed 1qd rarity floor normalizes low-odds card stats; real borders
// remain available to exceed the floor. No source-server claim is made.
assert.equal(HALLOWEEN_DEFAULT_MIN_RARITY,1e15)
assert.equal(halloweenPlayerPower(find('Triceratops'),[],1e15),350)
assert.equal(Math.ceil(halloweenPlayerPower(find('Triceratops'),[],1e15)/2),175)
assert.equal(halloweenPlayerPower(find('Triceratops'),borders,1e15),370)
const rawUnbordered=createBattleStateV2(own('Triceratops','Pterodactylus','Mothman','Julius Leader').cards.length===4
  ?{cards:['Triceratops','Pterodactylus','Mothman','Julius Leader'].map(cardName=>({cardName,borders:[]}))}
  :tri,enemies,{halloweenNormalizedPlayers:true,halloweenMinimumRarity:1e15,disablePlayerAuras:true})
assert.equal(rawUnbordered.teams.Allies[0].damage,210,'1qd min 175 ATK + Julius 20% should produce 210')
for(const name of ['Behemoth','Parallax','Fate Seamstress']){
  assert.ok(!search.eligiblePool.includes(name))
}
const allSearchCards=cards.filter(c=>!halloweenBanReason(c.name))
assert.ok(allSearchCards.length>120,'Global search has many eligible cards')
const baseline={cards:['Julius Leader','Anubis','Serket','Triceratops'].map(cardName=>({cardName,borders:[]}))}
const baselineFloor1=simulateHalloweenTower(baseline,halloweenStage(1,41).slice(0,4),1,16,818,[],undefined,1e15)
assert.equal(baselineFloor1.runs,16)
const floorSamples=probeHalloweenFloors(baseline,817,[],1e15)
assert.equal(floorSamples.length,11)
assert.deepEqual(floorSamples.map(x=>x.floor),[1,5,10,15,17,25,35,50,75,95,105])
console.log('1qd modeled baseline: stage 1 '+baselineFloor1.wins+'/16 wins; floor probes '+floorSamples.map(r=>r.floor+':'+r.wins+'/'+r.runs).join(', '))

const ui=readFileSync('src/halloween-ui.js','utf8')
const base=readFileSync('index-base.html','utf8')
const core=readFileSync('src/depths-ui.js','utf8')
assert.match(ui,/Search '\+pool.length\+' cards/)
assert.match(ui,/Ban card/)
assert.match(ui,/Only one Julius Leader/)
assert.match(ui,/All available cards/)
assert.match(ui,/hwt-min-rarity/)
assert.match(ui,/hwt-probe/)
assert.match(ui,/poolMode==='all'/)
assert.match(base,/halloween-ui.js/)
assert.match(core,/data-halloween-tab/)
assert.match(core,/view==='halloween'/)
console.log('Halloween Tower regression passed: player 185 → 222, enemy stages 14/15/17, source rosters, rewards, bans, Soul Guide and search.')

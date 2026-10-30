import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import cards from '../src/data/cards'
import { createBattleStateV2 } from '../src/engine/battle-v2'
import {
  HALLOWEEN_FIXED, HALLOWEEN_RANDOM_ENEMIES, halloweenStage,
  halloweenEnemyPower, halloweenEnemyCards, halloweenPackReward,
  halloweenPlayerPower, halloweenBanReason, halloweenCheckTeam, HALLOWEEN_FIXED_BASE_ATTACK,
  simulateHalloweenTower, searchHalloweenTower, probeHalloweenFloors, HALLOWEEN_DEFAULT_MIN_RARITY,
  halloweenUnavailableEvent, HALLOWEEN_UNAVAILABLE_EVENT_NAMES,
} from '../src/engine/halloween-tower'
import type { BorderName, TeamLoadout } from '../src/types'
import { HALLOWEEN_RULESET, halloweenBattleLabel, optimisticHalloweenScore, wilsonBounds } from '../src/engine/halloween-learning'

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
assert.ok(halloweenStage(105).includes('Living Armor'),'Current Horseman Halloween boss floor 105 has Living Armor instead of Abomination')
assert.ok(!halloweenStage(105).includes('Abomination'),'Old floor 105 Abomination roster must be updated')
assert.equal(halloweenStage(14,42).length,4)
assert.ok(halloweenStage(14,42).slice(0,4).every(x=>(HALLOWEEN_RANDOM_ENEMIES as readonly string[]).includes(x)))
assert.equal(halloweenPackReward(14),6_000)
assert.equal(halloweenPackReward(15),400_000)
assert.equal(halloweenPackReward(16),8_000)
assert.equal(halloweenPackReward(105),25_600_000)
assert.equal(halloweenBanReason('Vampire Lord'), 'Reported Halloween Tower ban')
assert.equal(halloweenBanReason('Fuxi'), 'Reported Halloween Tower ban')
assert.equal(halloweenBanReason('Pumpkin King'), 'Reported Halloween Tower ban')
for(const name of ['Behemoth','Parallax','Fate Seamstress','Sable The Envious','Supreme Ozzy','Ice King','Chaos','Mrs. Claus','Abomination','Pumpkin King','Mammoth']){
  assert.equal(halloweenBanReason(name),'Reported Halloween Tower ban',name+' must be excluded')
}
assert.ok(cards.some(c=>c.weather==='Rapture'))
for(const c of cards.filter(c=>c.weather==='Rapture'))assert.match(halloweenBanReason(c.name)||'',/Rapture/)
assert.ok(halloweenCheckTeam(own('Julius Leader','Julius Leader','Triceratops','Mothman')).some(x=>x.includes('duplicate copies')))
assert.ok(halloweenCheckTeam(own('Ghost','Ghost','Triceratops','Mothman')).some(x=>x.includes('duplicate copies')))
assert.ok(halloweenCheckTeam(own('Julius Leader','Triceratops','Triceratops','Mothman')).some(x=>x.includes('duplicate copies')),'No duplicate Triceratops even with just one Julius')
assert.ok(halloweenCheckTeam(own('Triceratops','Mothman','Abomination','Julius Leader')).some(x=>x.includes('Abomination')))
assert.ok(halloweenCheckTeam(own('Triceratops','Mothman','Pumpkin King','Julius Leader')).some(x=>x.includes('Pumpkin King')))
assert.ok(halloweenCheckTeam(own('Triceratops','Mothman','Mammoth','Julius Leader')).some(x=>x.includes('Mammoth')),'Mammoth must be banned from player teams')
for(const name of ['Santa Claus','Supreme Frank','Anubis & Hades']){
  assert.ok(HALLOWEEN_UNAVAILABLE_EVENT_NAMES.some(x=>x===name))
  assert.ok(halloweenUnavailableEvent(name))
  assert.match(halloweenBanReason(name)||'',/(not owned|Christmas event)/)
  assert.ok(halloweenBanReason(name,[],true),'Unavailable event card must not appear even with legacy toggle')
}
assert.equal(halloweenBanReason('Trick or Treater'),null,'Current Halloween3 cards stay available')
for(const name of ['Santa Claws','Krampus','Frosty The Snowman']){
  assert.ok(halloweenBanReason(name),'Unreleased Christmas card must not appear in default search: '+name)
}
assert.equal(halloweenBanReason('Pestilence'),null,'Current Four Horsemen can be obtained')
assert.ok(halloweenBanReason('100 Men'),'Old event exclusives excluded by default')
assert.equal(halloweenBanReason('100 Men',[],true),null,'Legacy toggle allows old exclusives when actually owned')
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
  pool:['Triceratops','Mothman','Pterodactylus','Serket','Julius Leader','Fuxi','Vampire Lord','Santa Claus','Anubis & Hades','Supreme Frank','Mammoth'],
  borders,
  extraBans:[],
})
assert.ok(search.recommendations.length>0)
for(const rec of search.recommendations)assert.deepEqual(halloweenCheckTeam(rec.loadout),[])
assert.equal(search.coveredCards,5)
assert.equal(search.minimumRarity,HALLOWEEN_DEFAULT_MIN_RARITY)
assert.ok(search.tested>=search.coveredCards)
assert.match(search.searchMethod,/confidence-guided/i)
assert.equal(search.ruleVersion,HALLOWEEN_RULESET)
assert.ok(search.labels.length>0)
for(const label of search.labels){
  assert.equal(label.estimated,true)
  assert.equal(label.ruleset,HALLOWEEN_RULESET)
  assert.ok(label.winInterval[0]<=label.pWin&&label.winInterval[1]>=label.pWin)
  assert.equal(new Set(label.allies).size,4)
}
assert.ok(!search.eligiblePool.includes('Fuxi')&&!search.eligiblePool.includes('Vampire Lord')&&!search.eligiblePool.includes('Mammoth'))
for(const n of ['Santa Claus','Anubis & Hades','Supreme Frank','Sable The Envious','Supreme Ozzy']){
  assert.ok(!search.eligiblePool.includes(n),n+' excluded')
}
const example=search.recommendations[0]
const interval=wilsonBounds(example.wins,example.runs)
assert.ok(interval[0]>=0&&interval[1]<=1)
const perfectModelInterval=wilsonBounds(256,256)
assert.ok(perfectModelInterval[0]<1&&perfectModelInterval[0]>0.98,'256/256 simulated wins cannot mean guaranteed 100%')
assert.ok(Number.isFinite(optimisticHalloweenScore(example)))
const labelExample=halloweenBattleLabel(example,5,example.loadout.cards.map(c=>c.cardName),['Zombie','Zombie','Zombie','Zombie'],42)
assert.equal(labelExample.estimated,true)
const unfinishedExample=halloweenBattleLabel({
  wins:1,losses:1,draws:2,unresolved:1,runs:4,progress:0.4,trusted:false,unsupportedAbilities:['Battle turn cap reached'],
},5,['Triceratops','Mothman','Julius Leader','Serket'],['Zombie','Zombie','Zombie','Zombie'],1)
assert.equal(unfinishedExample.unfinished,0.25)
assert.equal(unfinishedExample.pDraw,0.25)
assert.equal(unfinishedExample.pWin,0.25)
assert.equal(unfinishedExample.estimated,true)
// The assumed 1qd rarity floor normalizes low-odds card stats; real borders
// remain available to exceed the floor. No source-server claim is made.
assert.equal(HALLOWEEN_FIXED_BASE_ATTACK,160)
assert.equal(HALLOWEEN_DEFAULT_MIN_RARITY,1e15)
const equalBaseline=createBattleStateV2({
  cards:['Triceratops','Mothman','Ghost','Tarantula'].map(cardName=>({cardName,borders:[]})),
},enemies,{halloweenNormalizedPlayers:true,halloweenFixedAttack:160,disablePlayerAuras:true})
assert.deepEqual(equalBaseline.teams.Allies.map(c=>c.damage),[160,160,160,160])
assert.equal(equalBaseline.teams.Allies[0].maxHp,320)
const withJuliusFixed=createBattleStateV2({
  cards:['Triceratops','Julius Leader','Mothman','Serket'].map(cardName=>({cardName,borders:[]})),
},enemies,{halloweenNormalizedPlayers:true,halloweenFixedAttack:160,disablePlayerAuras:true})
assert.equal(withJuliusFixed.teams.Allies[0].damage,192,'Julius passive must still boost fixed 160 ATK')
assert.equal(halloweenPlayerPower(find('Triceratops'),[],1e15),350)
assert.equal(Math.ceil(halloweenPlayerPower(find('Triceratops'),[],1e15)/2),175)
assert.equal(halloweenPlayerPower(find('Triceratops'),borders,1e15),370)
const rawUnbordered=createBattleStateV2(own('Triceratops','Pterodactylus','Mothman','Julius Leader').cards.length===4
  ?{cards:['Triceratops','Pterodactylus','Mothman','Julius Leader'].map(cardName=>({cardName,borders:[]}))}
  :tri,enemies,{halloweenNormalizedPlayers:true,halloweenMinimumRarity:1e15,disablePlayerAuras:true})
assert.equal(rawUnbordered.teams.Allies[0].damage,210,'1qd min 175 ATK + Julius 20% should produce 210')
for(const name of ['Behemoth','Parallax','Fate Seamstress','Sable The Envious','Supreme Ozzy']){
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
assert.match(ui,/Search Decks/)
assert.match(ui,/'Mammoth'/,'Mammoth is included in the visible Halloween bans')
assert.match(ui,/95% model interval/,'Results show statistical uncertainty')
assert.match(ui,/All sampled wins do not guarantee success in-game/,'All simulated wins must not be displayed as a guarantee')
assert.doesNotMatch(ui,/state\.result\.winRate\*100/,'Raw 100% sample rate must not be the headline')
const compiledHalloweenWorker=readFileSync('browser/tower-worker.js','utf8')
assert.match(compiledHalloweenWorker,/"Pumpkin King","Mammoth"\]/,'Deployed worker must also exclude Mammoth')
assert.doesNotMatch(ui,/01 · ENCOUNTER|02 · TEAM|03 · RECOMMENDATIONS/)
assert.doesNotMatch(ui,/Some Halloween ability and HP mechanics|win rate <span/)
assert.match(ui,/160 ATK/)
assert.match(ui,/data-hwt-slot/)
assert.match(ui,/data-hwt-enemy/)
assert.match(ui,/fixedAttack:160/)
assert.doesNotMatch(ui,/Community bans/)
assert.doesNotMatch(ui,/hwt-legacy/)
assert.doesNotMatch(ui,/hwt-min-rarity/)
assert.doesNotMatch(ui,/data-hwt-border/)
assert.doesNotMatch(ui,/hwt-pool-mode/)
assert.doesNotMatch(ui,/hwt-probe/)
assert.match(base,/halloween-ui.js/)
assert.match(core,/data-halloween-tab/)
assert.match(core,/view==='halloween'/)
console.log('Halloween Tower regression passed: player 185 → 222, enemy stages 14/15/17, source rosters, rewards, bans, Soul Guide and search.')

import cards from '../data/cards'
import type { BorderName, CardDefinition, DepthsEnemy, TeamLoadout } from '../types'
import { simulateBattleV2 } from './battle-v2'
import { rarityWithBorders } from './stats'
import { SeededRng } from './rng'
import { halloweenBattleLabel, optimisticHalloweenScore, HALLOWEEN_RULESET, type HalloweenBattleLabel } from './halloween-learning'

/**
 * Halloween Tower (difficulty 4): source stage roster and client display formula.
 * The original client lacks the server battle/ban scripts. Thus player normalization
 * and enemy battle stat scaling below are CALIBRATED, not claimed server-authoritative.
 */
export const HALLOWEEN_FIXED: Record<number, string[]> = {
  5:['Zombie','Zombie','Zombie','Zombie'],
  10:['Zombie Nurse','Zombie Nurse','Zombie Nurse','Zombie Nurse'],
  15:['Sleep Paralysis','Michael M.','Knightmare','Zombie','Phantom'],
  20:['Headless Horseman','Witch','Headless Horseman','Witch'],
  25:['Walking Dead','Zombie','The Hanged Man','Dracula'],
  30:['Jason','Frankenstein','The Hanged Man','The Blood Countess','Phantom'],
  35:['Headless Horseman','Dracula','Witch','The Composer'],
  40:['Witch','Banshee','Witch','Banshee'],
  45:['Pestilence','Poison Witch','Zombie Dragon','Walking Dead','Phantom'],
  50:['Walking Dead','Walking Dead','Walking Dead','The Composer'],
  55:['Bloody Mary','Headless Horseman','Zombie Dragon','Flying Dutchman'],
  60:['Pestilence','Famine','Poison Witch','Zombie Dragon','Phantom'],
  65:['Nüwa','Tornado','Wind Spirit','Tornado'],
  70:['Cronus','Parallax','Cronus','Parallax'],
  75:['Pestilence','Famine','War','Zombie Dragon','Phantom'],
  80:['Hecate','Pandora','Set','Chaos','Berserker'],
  85:['Savior','Savior','The Blood Countess','Vampire Lord','Vampire Matron'],
  90:['Pestilence','Famine','War','Death'],
  95:["Hell's Army",'Heavenly Demon',"Heaven's Armor",'Judgment Day','End Times'],
  100:['Surtr','Odin','Thor','Loki'],
  105:['Savior','Bloody Mary','Abomination','Sable The Envious','End Times'],
}
export const HALLOWEEN_RANDOM_ENEMIES = [
  'Ghoul','Zombie Nurse','Night Witch','The Hanged Man','Walking Dead',
  'Headless Horseman','The Composer','Dracula','Sleep Paralysis','Michael M.',
  'Jason','Glamour','Zombie','Banshee','Witch','Scarecrow',
  'Revenant','Dr. Frankenstein','Marionette',
] as const

// Reported by players, not a recovered server-side validation table.
export const HALLOWEEN_REPORTED_BANS = [
  'Vampire Lord','Fuxi','Priest','Pandora','Black Plague','Wendigo','Glamour',
  'Fate Seamstress','Behemoth','Parallax','Sable The Envious','Supreme Ozzy',
] as const
// Old limited event cards are excluded by default; this status isn't a permanent ban.
export const HALLOWEEN_UNAVAILABLE_EVENT_NAMES = ['Santa Claus','Anubis & Hades','Supreme Frank'] as const
const CURRENT_REISSUED_NAMES = new Set(['Pestilence','Famine','War','Death'])
export function halloweenUnavailableEvent(name:string):boolean {
  const card=CARD_MAP.get(name)
  if(!card)return false
  if((HALLOWEEN_UNAVAILABLE_EVENT_NAMES as readonly string[]).includes(name))return true
  return Boolean(card.expires && card.pack !== 'Halloween3' && !CURRENT_REISSUED_NAMES.has(name))
}
// Halloween Part 2 rules prohibit ALL duplicate player cards, not just Julius.
export const HALLOWEEN_MAX_COPIES = 1
export const HALLOWEEN_ONE_COPY = ['Julius Leader'] as const
export const HALLOWEEN_SKILL_CANDIDATES = [
  'Triceratops','Pterodactylus','Mothman','Julius Leader','Anubis','Serket',
  'Neighbor','Tarantula','Ghost','Crow','Grey Pumpkin','The Faceless',
  'Scarecrow','Banshee','Witch','Poison Witch','Night Witch','Eerie Tree',
  'Living Armor','Pumpkin King','Robin Hood','Parallax','Fate Seamstress',
  'Kuchisake-onna','Behemoth','Shuten-dōji','Noveau Riche','Pestilence',
  'Death','Judgment Day','The Awakened One','The Composer',
] as const
const CARD_MAP = new Map(cards.map(c=>[c.name,c] as const))

export const HALLOWEEN_DEFAULT_MIN_RARITY = 1e15 // 1 quadrillion effective rarity, a search assumption, not a free border
export function halloweenPlayerPower(card: CardDefinition, borders: BorderName[] = [], minimumRarity = 1): number {
  return Math.ceil(200 + 10 * Math.log10(Math.max(1,minimumRarity,rarityWithBorders(card,borders))))
}
export function halloweenEnemyPower(floor:number):number {
  return Math.ceil(300 + 2.5 * Math.max(1,Math.min(105,Math.floor(floor))))
}
export function halloweenStage(floor:number,seed=1):string[] {
  const target=Math.max(1,Math.min(105,Math.floor(floor)))
  if (HALLOWEEN_FIXED[target]) return [...HALLOWEEN_FIXED[target]]
  // Roblox's original math.random cannot be exactly recreated in this TS RNG.
  // Let users correct the four observed random opponents in the UI.
  const rng=new SeededRng((seed ^ Math.imul(target,0x9e3779b1))>>>0)
  const eligible=HALLOWEEN_RANDOM_ENEMIES.filter(name=>CARD_MAP.has(name))
  return Array.from({length:4},()=>eligible[Math.floor(rng.next()*eligible.length)])
}
export function halloweenPackReward(floor:number):number {
  const f=Math.max(1,Math.min(105,Math.floor(floor)))
  if(f===105)return 25_600_000
  if(f%15===0)return 200_000*Math.pow(2,f/15)
  if(f%5===0)return 20_000*(f/5)
  return 2_000*Math.ceil(f/5)
}
export function halloweenBanReason(name:string,extraBans:readonly string[]=[],includeLegacy=false):string|null{
  const card=CARD_MAP.get(name)
  if(!card)return 'Unknown card'
  if(card.unobtainable)return 'Not an obtainable card'
  if(card.weather==='Rapture')return 'All Rapture cards are reportedly banned'
  if(extraBans.includes(name))return 'Banned in your personal restrictions'
  if((HALLOWEEN_REPORTED_BANS as readonly string[]).includes(name))return 'Reported Halloween Tower ban'
  if((HALLOWEEN_UNAVAILABLE_EVENT_NAMES as readonly string[]).includes(name))
    return 'Event-exclusive card reported not owned by players'
  if(!includeLegacy&&halloweenUnavailableEvent(name))return 'Legacy event card not known to be re-released (opt in if owned)'
  return null
}
export function halloweenCheckTeam(loadout:TeamLoadout,extraBans:readonly string[]=[],includeLegacy=false):string[]{
  const errors:string[]=[]
  if(loadout.cards.length!==4)errors.push('Exactly four cards are required')
  for(const slot of loadout.cards){
    const banned=halloweenBanReason(slot.cardName,extraBans,includeLegacy)
    if(banned)errors.push(slot.cardName+': '+banned)
  }
  const seen=new Set<string>()
  for(const slot of loadout.cards){
    if(seen.has(slot.cardName))errors.push(slot.cardName+': duplicate copies not allowed in Halloween Tower')
    seen.add(slot.cardName)
  }
  return [...new Set(errors)]
}
export function halloweenEnemyCards(names:readonly string[],floor:number):DepthsEnemy[]{
  if(names.length!==4)throw new Error('Halloween Tower requires four battle opponents')
  const power=halloweenEnemyPower(floor)
  return names.map(name=>{
    const card=CARD_MAP.get(name)
    if(!card)throw new Error('Unknown Halloween enemy: '+name)
    return {card,power,attack:Math.ceil(power/2),health:power*(card.hpMultiplier||1)}
  })
}
export interface HalloweenRunSummary {
  wins:number;losses:number;draws:number;runs:number;winRate:number
  progress:number;averageTurns:number;trusted:boolean;unsupportedAbilities:string[]
}
export interface HalloweenRecommendation extends HalloweenRunSummary {loadout:TeamLoadout}
export interface HalloweenSearchResult {
  recommendations:HalloweenRecommendation[];tested:number;battles:number;eligiblePool:string[]
  coveredCards:number;searchMethod:string;minimumRarity:number
  ruleVersion:string;labels:HalloweenBattleLabel[]
}
export function simulateHalloweenTower(
  loadout:TeamLoadout,enemyNames:string[],floor:number,runs=100,seed=1,extraBans:readonly string[]=[],
  onProgress?:(done:number,total:number)=>void,
  minimumRarity = HALLOWEEN_DEFAULT_MIN_RARITY,
  includeLegacy = false,
):HalloweenRunSummary{
  const errors=halloweenCheckTeam(loadout,extraBans,includeLegacy)
  if(errors.length)throw new Error(errors.join('; '))
  const enemies=halloweenEnemyCards(enemyNames,floor)
  const total=Math.min(2000,Math.max(1,Math.floor(runs)))
  const rng=new SeededRng(seed||1)
  const aura=HALLOWEEN_FIXED[Math.floor(floor)]?.[4]
  let wins=0,losses=0,draws=0,progress=0,turns=0,trusted=true
  const unsupported=new Set<string>()
  for(let i=0;i<total;i++){
    const battle=simulateBattleV2(loadout,enemies,Math.floor(rng.next()*0x7fffffff)||i+1,500,true,false,undefined,{
      halloweenNormalizedPlayers:true,halloweenMinimumRarity:minimumRarity,disablePlayerAuras:true,
      enemySkillAura:aura?{auraName:aura,border:'Galaxy'}:null,
    })
    if(battle.winner==='Allies')wins++
    else if(battle.winner==='Enemies')losses++
    else draws++
    const remaining=battle.state.teams.Enemies
    const cleared=battle.state.fallen.Enemies.length
    const damage=remaining.reduce((sum,c)=>sum+(c.maxHp>0?Math.min(1,Math.max(0,1-c.hp/c.maxHp)):0),0)
    progress+=(battle.winner==='Allies'?1:Math.min(.999,(cleared+damage)/4))
    turns+=battle.turns
    trusted=trusted&&battle.trusted
    for(const ability of battle.unsupportedAbilities)unsupported.add(ability)
    if(onProgress&&(i%10===9||i===total-1))onProgress(i+1,total)
  }
  return {wins,losses,draws,runs:total,winRate:wins/total,progress:progress/total,
    averageTurns:turns/total,trusted,unsupportedAbilities:[...unsupported].sort()}
}
function rank(a:HalloweenRunSummary,b:HalloweenRunSummary):number {
  return b.winRate-a.winRate||b.progress-a.progress||a.averageTurns-b.averageTurns
}
/**
 * A bounded evolutionary combat search, not a neural network.
 * Every eligible card is actually evaluated in at least two candidate orders.
 * The best mixed-skill decks are then mutated, reranked on common RNG seeds,
 * and independently verified. Order, matchups and abilities determine the score.
 */
export function searchHalloweenTower(
  enemyNames:string[],floor:number,seed=1,
  options:{
    pool?:string[];borders?:BorderName[];extraBans?:string[];current?:TeamLoadout
    minimumRarity?:number;includeLegacy?:boolean
  }={},
  onProgress?:(done:number,total:number)=>void,
):HalloweenSearchResult {
  halloweenEnemyCards(enemyNames,floor)
  const extra=options.extraBans||[]
  const includeLegacy=options.includeLegacy===true
  // With no explicit pool the search covers the ENTIRE obtainable, unbanned catalog.
  const pool=[...new Set((options.pool===undefined?cards.map(c=>c.name):options.pool)
    .filter(name=>CARD_MAP.has(name)&&!halloweenBanReason(name,extra,includeLegacy)))].sort()
  if(!pool.length)throw new Error('No eligible cards in the Halloween search pool')
  if(pool.length<4)throw new Error('Halloween Tower requires four distinct available cards in the search pool')
  const minimumRarity=Math.max(1,Number(options.minimumRarity)||HALLOWEEN_DEFAULT_MIN_RARITY)
  const border=options.borders||[]
  const rng=new SeededRng(seed||1)
  const draw=()=>Math.floor(rng.next()*0x7fffffff)||1
  const discoverySeed=draw(), evolutionSeed=draw(), verificationSeed=draw()
  const advancedSeed=draw(), finalSeed=draw()
  const randomName=()=>pool[Math.floor(rng.next()*pool.length)]
  const anchorNames=[...HALLOWEEN_SKILL_CANDIDATES].filter(name=>pool.includes(name))
  const randomWeighted=()=>{
    // Keep novel catalog cards in play, but also test established synergy cards.
    if(anchorNames.length&&rng.next()<0.32)return anchorNames[Math.floor(rng.next()*anchorNames.length)]
    return randomName()
  }
  const validNames=(names:string[])=>names.length===4
    &&new Set(names).size===4
  const seen=new Set<string>()
  const currentCards=options.current?.cards||[]
  const build=(names:string[],preserveCurrent=false):TeamLoadout=>{
    return {cards:names.map((cardName,i)=>{
      const original=preserveCurrent?currentCards[i]:undefined
      return {cardName,borders:original&&original.cardName===cardName?[...original.borders]:[...border]}
    })}
  }
  const candidates:TeamLoadout[]=[]
  const add=(names:string[],preserveCurrent=false)=>{
    if(!validNames(names)||names.some(n=>!pool.includes(n)))return
    const deck=build(names,preserveCurrent)
    if(halloweenCheckTeam(deck,extra,includeLegacy).length)return
    const key=deck.cards.map(c=>c.cardName+':'+c.borders.join('+')).join('|')
    if(!seen.has(key)){seen.add(key);candidates.push(deck)}
  }
  const filler=(avoid:string[])=>{
    // Reject duplicates before creating a candidate, not after wasting simulations.
    let result:string
    let attempts=0
    do{result=randomWeighted();attempts++}while(avoid.includes(result)&&attempts<100)
    if(avoid.includes(result)){
      const rest=pool.filter(name=>!avoid.includes(name))
      return rest[Math.floor(rng.next()*rest.length)]
    }
    return result
  }
  const randomTeam=(first?:string,position=0):string[]=>{
    const names:string[]=[]
    for(let i=0;i<4;i++)names.push(i===position&&first?first:filler(first?[first,...names]:names))
    return names
  }
  if(options.current?.cards.length===4)add(currentCards.map(c=>c.cardName),true)
  // Guaranteed catalog coverage: all selectable cards appear as both lead and
  // closer at least once (unless impossible due to Julius's one-copy limit).
  for(const name of pool){
    add(randomTeam(name,0))
    add(randomTeam(name,3))
  }
  for(let i=0;i<Math.min(320,Math.max(80,pool.length));i++){
    add(randomTeam())
  }
  const evaluate=(set:TeamLoadout[],runs:number,battleSeed:number,progressStart:number,total:number,
    onItem?:(entry:HalloweenRecommendation)=>void):HalloweenRecommendation[]=>{
    const scored:HalloweenRecommendation[]=[]
    for(let i=0;i<set.length;i++){
      const score=simulateHalloweenTower(set[i],enemyNames,floor,runs,battleSeed,extra,undefined,minimumRarity,includeLegacy)
      const entry={...score,loadout:set[i]}
      scored.push(entry);onItem?.(entry)
      if(onProgress&&(i%12===11||i===set.length-1))onProgress(progressStart+i+1,total)
    }
    return scored.sort(rank)
  }
  const initial= evaluate(candidates,2,discoverySeed,0,candidates.length+420+24)
  const parents=initial.slice(0,Math.min(40,initial.length))
  const generated:TeamLoadout[]=[]
  const evolutionSeen=new Set<string>()
  const pushEvolution=(names:string[])=>{
    if(!validNames(names))return
    const deck=build(names)
    if(halloweenCheckTeam(deck,extra,includeLegacy).length)return
    const key=deck.cards.map(c=>c.cardName+':'+c.borders.join('+')).join('|')
    if(!seen.has(key)&&!evolutionSeen.has(key)){
      evolutionSeen.add(key);generated.push(deck)
    }
  }
  // Multistart evolutionary mutations: single/double replacement, crossover,
  // and position swaps. We do not assume the first good team is globally best.
  let tries=0
  while(generated.length<420&&tries<5000){
    tries++
    const selected=parents[Math.floor(rng.next()*parents.length)].loadout.cards.map(c=>c.cardName)
    const names=[...selected],kind=tries%5
    if(kind===0){
      const other=parents[Math.floor(rng.next()*parents.length)].loadout.cards.map(c=>c.cardName)
      const cut=1+Math.floor(rng.next()*3)
      for(let j=cut;j<4;j++)names[j]=other[j]
    }else if(kind===1){
      const i=Math.floor(rng.next()*4),j=Math.floor(rng.next()*4)
      ;[names[i],names[j]]=[names[j],names[i]]
    }else{
      const count=kind===4?2:1
      for(let j=0;j<count;j++){
        const slot=Math.floor(rng.next()*4)
        names[slot]=filler(names.filter((_,i)=>i!==slot))
      }
    }
    pushEvolution(names)
  }
  const second=evaluate(generated,4,evolutionSeed,candidates.length,
    candidates.length+generated.length+24)
  const finalistMap=new Map<string,TeamLoadout>()
  const queue=[...initial.slice(0,24),...second.slice(0,30)]
  for(const entry of queue){
    const key=entry.loadout.cards.map(c=>c.cardName+':'+c.borders.join('+')).join('|')
    if(!finalistMap.has(key))finalistMap.set(key,entry.loadout)
  }
  // Adaptive best-first tournament: 16 seed-matched battles for the frontier,
  // spend 64 on contenders with the largest upper confidence bounds, then
  // 256 on the final 12. Each round gets independent seeds, preventing overfit.
  const frontier=[...finalistMap.values()].slice(0,48)
  const frontierScores=evaluate(frontier,16,verificationSeed,candidates.length+generated.length,
    candidates.length+generated.length+frontier.length+24+12)
  frontierScores.sort((a,b)=>optimisticHalloweenScore(b)-optimisticHalloweenScore(a))
  const promising=frontierScores.slice(0,24).map(entry=>entry.loadout)
  const deep=evaluate(promising,64,advancedSeed,candidates.length+generated.length+frontier.length,
    candidates.length+generated.length+frontier.length+promising.length+12)
  deep.sort((a,b)=>optimisticHalloweenScore(b)-optimisticHalloweenScore(a))
  const finalists=deep.slice(0,12).map(entry=>entry.loadout)
  const verified=evaluate(finalists,256,finalSeed,candidates.length+generated.length+
    frontier.length+promising.length,candidates.length+generated.length+
    frontier.length+promising.length+finalists.length)
  const labels=verified.slice(0,10).map(entry=>halloweenBattleLabel(entry,floor,
    entry.loadout.cards.map(c=>c.cardName),enemyNames,finalSeed))
  return {
    recommendations:verified.slice(0,10),tested:candidates.length+generated.length+
      frontier.length+promising.length+finalists.length,
    battles:[...initial,...second,...frontierScores,...deep,...verified].reduce((count,result)=>count+result.runs,0),
    eligiblePool:pool,coveredCards:pool.length,minimumRarity,ruleVersion:HALLOWEEN_RULESET,
    labels,searchMethod:'Catalog-wide screening → evolutionary crossovers → confidence-guided 16/64/256 battle verification',
  }
}

/** Probe sampled Halloween floors with a selected four-card team.
 * It does NOT prove that a floor is impossible for all possible teams. */
export function probeHalloweenFloors(
  loadout:TeamLoadout,seed=1,extraBans:readonly string[]=[],minimumRarity=HALLOWEEN_DEFAULT_MIN_RARITY,
  onProgress?:(done:number,total:number)=>void,
  includeLegacy=false,
):Array<{floor:number;wins:number;runs:number;winRate:number;progress:number;trusted:boolean}>{
  const floors=[1,5,10,15,17,25,35,50,75,95,105]
  const result:Array<{floor:number;wins:number;runs:number;winRate:number;progress:number;trusted:boolean}>=[]
  for(let i=0;i<floors.length;i++){
    const floor=floors[i],names=halloweenStage(floor,seed)
    const score=simulateHalloweenTower(loadout,names.slice(0,4),floor,16,seed+floor,extraBans,undefined,minimumRarity,includeLegacy)
    result.push({floor,wins:score.wins,runs:score.runs,winRate:score.winRate,progress:score.progress,trusted:score.trusted})
    onProgress?.(i+1,floors.length)
  }
  return result
}

import cards from '../data/cards'
import type { BorderName, CardDefinition, DepthsEnemy, TeamLoadout } from '../types'
import { simulateBattleV2 } from './battle-v2'
import { rarityWithBorders } from './stats'
import { SeededRng } from './rng'

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
] as const
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

export function halloweenPlayerPower(card: CardDefinition, borders: BorderName[] = []): number {
  return Math.ceil(200 + 10 * Math.log10(Math.max(1,rarityWithBorders(card,borders))))
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
export function halloweenBanReason(name:string,extraBans:readonly string[]=[]):string|null{
  const card=CARD_MAP.get(name)
  if(!card)return 'Unknown card'
  if(card.unobtainable)return 'Not an obtainable card'
  if(card.weather==='Rapture')return 'All Rapture cards are reportedly banned'
  if(extraBans.includes(name))return 'Banned in your personal restrictions'
  if((HALLOWEEN_REPORTED_BANS as readonly string[]).includes(name))return 'Reported Halloween Tower ban'
  return null
}
export function halloweenCheckTeam(loadout:TeamLoadout,extraBans:readonly string[]=[]):string[]{
  const errors:string[]=[]
  if(loadout.cards.length!==4)errors.push('Exactly four cards are required')
  for(const slot of loadout.cards){
    const banned=halloweenBanReason(slot.cardName,extraBans)
    if(banned)errors.push(slot.cardName+': '+banned)
  }
  for(const restricted of HALLOWEEN_ONE_COPY){
    if(loadout.cards.filter(c=>c.cardName===restricted).length>1)errors.push(restricted+': at most one copy')
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
}
export function simulateHalloweenTower(
  loadout:TeamLoadout,enemyNames:string[],floor:number,runs=100,seed=1,extraBans:readonly string[]=[],
  onProgress?:(done:number,total:number)=>void,
):HalloweenRunSummary{
  const errors=halloweenCheckTeam(loadout,extraBans)
  if(errors.length)throw new Error(errors.join('; '))
  const enemies=halloweenEnemyCards(enemyNames,floor)
  const total=Math.min(2000,Math.max(1,Math.floor(runs)))
  const rng=new SeededRng(seed||1)
  const aura=HALLOWEEN_FIXED[Math.floor(floor)]?.[4]
  let wins=0,losses=0,draws=0,progress=0,turns=0,trusted=true
  const unsupported=new Set<string>()
  for(let i=0;i<total;i++){
    const battle=simulateBattleV2(loadout,enemies,Math.floor(rng.next()*0x7fffffff)||i+1,500,true,false,undefined,{
      halloweenNormalizedPlayers:true,disablePlayerAuras:true,
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
 * Skill-oriented stochastic deck search. Uses ACTUAL normalized combat simulations,
 * not raw-ATK scoring. Users own/edit the candidate pool; no ownership is assumed.
 * The broad search is a heuristic shortlist, never an exhaustive optimality claim.
 */
export function searchHalloweenTower(
  enemyNames:string[],floor:number,seed=1,
  options:{pool?:string[];borders?:BorderName[];extraBans?:string[];current?:TeamLoadout}={},
  onProgress?:(done:number,total:number)=>void,
):HalloweenSearchResult {
  halloweenEnemyCards(enemyNames,floor)
  const extra=options.extraBans||[]
  const pool=[...new Set((options.pool?.length?options.pool:[...HALLOWEEN_SKILL_CANDIDATES])
    .filter(name=>CARD_MAP.has(name)&&!halloweenBanReason(name,extra)))]
  if(!pool.length)throw new Error('No eligible cards in the Halloween search pool')
  const border=options.borders||['Platinum','Crystal','Galaxy']
  const rng=new SeededRng(seed||1)
  const seedForCandidates=Math.floor(rng.next()*0x7fffffff)||1
  const seedForVerification=Math.floor(rng.next()*0x7fffffff)||2
  const teams:TeamLoadout[]=[]
  const seen=new Set<string>()
  const append=(names:string[],current?:TeamLoadout)=>{
    if(names.length!==4)return
    const trial:TeamLoadout={cards:names.map((cardName,i)=>{
      const original=current?.cards.find(c=>c.cardName===cardName)
      return {cardName,borders:original?[...original.borders]:[...border]}
    })}
    if(halloweenCheckTeam(trial,extra).length)return
    const key=trial.cards.map(c=>c.cardName+':'+c.borders.join('+')).join('|')
    if(seen.has(key))return
    seen.add(key);teams.push(trial)
  }
  if(options.current?.cards.length===4)append(options.current.cards.map(c=>c.cardName),options.current)
  const favorite=pool.filter(name=>['Julius Leader','Anubis','Serket','Triceratops','Mothman','Tarantula','Living Armor','The Faceless'].includes(name))
  for(let i=0;i<240;i++){
    const names:string[]=[]
    if(i%4===0&&favorite.length)names.push(favorite[i%favorite.length])
    while(names.length<4){
      const selected=pool[Math.floor(rng.next()*pool.length)]
      if(selected==='Julius Leader'&&names.includes(selected))continue
      names.push(selected)
    }
    append(names)
  }
  const broad:Array<HalloweenRecommendation>=[]
  let battles=0
  for(let i=0;i<teams.length;i++){
    const score=simulateHalloweenTower(teams[i],enemyNames,floor,3,seedForCandidates,extra)
    battles+=score.runs
    broad.push({...score,loadout:teams[i]})
    if(onProgress&&(i%10===9||i===teams.length-1))onProgress(i+1,teams.length)
  }
  broad.sort(rank)
  const verified:HalloweenRecommendation[]=[]
  for(const item of broad.slice(0,Math.min(18,broad.length))){
    const score=simulateHalloweenTower(item.loadout,enemyNames,floor,64,seedForVerification,extra)
    battles+=score.runs;verified.push({...score,loadout:item.loadout})
  }
  verified.sort(rank)
  return {recommendations:verified.slice(0,10),tested:teams.length,battles,eligiblePool:pool}
}

export type BorderName = 'Platinum' | 'Crystal' | 'Ruby' | 'Galaxy'
export type AuraBorderName = 'Platinum' | 'Crystal' | 'Galaxy'
export type BattleTeam = 'Allies' | 'Enemies'

export interface CardDefinition {
  name: string
  imageAssetId: number | null
  rarity: number
  statMultiplier: number
  hpMultiplier: number
  ability: string | null
  weather: string | null
  pack: string | null
  boss: boolean
  unobtainable: boolean
  expires: boolean
}

export interface AuraDefinition {
  name: string
  imageAssetId: number | null
  rarity: number
  type: string | null
  skillName: string | null
  description: string | null
  base: number
  perLevel: number
  boostMult: number | null
  boostedCards: string[]
  unobtainable: boolean
}

export interface TeamCard {
  cardName: string
  borders: BorderName[]
}

export interface AuraSelection {
  auraName: string
  border?: AuraBorderName | null
}

export interface TeamLoadout {
  cards: TeamCard[]
  statAura?: AuraSelection | null
  abilityAura?: AuraSelection | null
}

export interface DepthsEnemy {
  card: CardDefinition
  power: number
  attack: number
  health: number
}

export interface CombatCard {
  id: string
  definition: CardDefinition
  team: BattleTeam
  index: number
  borders: BorderName[]
  power: number
  hp: number
  maxHp: number
  damage: number
  entered: boolean
  dead: boolean
  boss: boolean
  abilityOverride?: string | null
  bonusAbilities?: string[]
  status: {
    stunned: number
    confused: number
    burn: number
    weakness: boolean
    blind: boolean
    shield: number
  }
  flags: Record<string, boolean>
  counters: Record<string, number>
}

export interface BattleBoosts {
  statAuraName?: string
  statAuraValue?: number
  skillAuraName?: string
  skillAuraValue?: number
  shielder?: number
  fate?: number
  flameWizard?: number
  phantom?: number
  berserker?: number
  synthHuman?: number
  endTimes?: number
  vampireMatron?: number
  fossils?: number
}

export interface BattleState {
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

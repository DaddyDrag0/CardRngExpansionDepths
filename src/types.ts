export type BorderName = 'Platinum' | 'Crystal' | 'Ruby' | 'Galaxy'

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

export interface DepthsEnemy {
  card: CardDefinition
  power: number
  attack: number
  health: number
}

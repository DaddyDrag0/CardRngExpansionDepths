import type { BorderName, CardDefinition, MutationWeather, TeamCard } from '../types'

export const BORDER_RARITY_MULTIPLIERS: Record<BorderName, number> = {
  Platinum: 100,
  Emerald: 1_000,
  Crystal: 10_000,
  Ruby: 100_000,
  Galaxy: 1_000_000,
}

export const WEATHER_MUTATION_STAT_MULTIPLIERS: Record<MutationWeather, number> = {
  Storm: 2,
  Snow: 2.1,
  Aurora: 2.3,
  Shroud: 2.5,
  'Meteor Shower': 3.5,
  'Time Storm': 4,
  Eclipse: 4.5,
  Virus: 5,
  'Blood Rain': 5.5,
  Armageddon: 6,
  Manga: 6.5,
  'Pumpkin Moon': 7.5,
  'The Great Deluge': 8,
  'Reality Fracture': 8.5,
  Dreamfall: 9,
}

export function mutationStatMultiplier(weather?: MutationWeather | null): number {
  return weather ? WEATHER_MUTATION_STAT_MULTIPLIERS[weather] ?? 1 : 1
}

export function rarityWithBorders(card: CardDefinition, borders: BorderName[] = []): number {
  return borders.reduce((rarity, border) => rarity * BORDER_RARITY_MULTIPLIERS[border], card.rarity)
}

/** CardStatTiers from Roblox: natural rarity, not border rarity; weather, bosses and limited cards exempt (Halloween exception). */
export function cardRarityTier(card: CardDefinition): number {
  if (card.weather || card.boss || card.sin || card.virtue) return 1
  const halloween = ['Halloween','Halloween2','Halloween3']
  const limited = card.expires || card.limited || card.collection != null || ['Christmas','Valentines','Easter','Halloween','Halloween2'].includes(card.pack || '')
  if (limited && !halloween.includes(card.pack || '') && !halloween.includes(card.collection || '')) return 1
  return card.rarity >= 250_000_000 ? 2.5 : card.rarity >= 100_000_000 ? 2 : card.rarity >= 50_000_000 ? 1.5 : 1
}
export function effectiveCardStatMultiplier(card: CardDefinition): number {
  return Math.max(Number(card.baseStatMultiplier ?? card.statMultiplier) || 1, cardRarityTier(card))
}
export function getPower(card: CardDefinition, borders: BorderName[] = [], mutationWeather?: MutationWeather | null): number {
  // Expansion Util.GetPower. Limited borders Great/Mighty/Almighty are intentionally unsupported.
  const rarity = card.name === 'Ouroboros' ? 100_000_000_000_000 : rarityWithBorders(card, borders)
  if (rarity <= 0) return 0
  return Math.pow(2, Math.log10(rarity)) * 10 * effectiveCardStatMultiplier(card) * mutationStatMultiplier(mutationWeather)
}

export function getHealth(card: CardDefinition, borders: BorderName[] = [], mutationWeather?: MutationWeather | null): number {
  return getPower(card, borders, mutationWeather) * (card.hpMultiplier || 1)
}

export function getAttack(card: CardDefinition, borders: BorderName[] = [], mutationWeather?: MutationWeather | null): number {
  return getPower(card, borders, mutationWeather) / 2
}

export function getTeamCardStats(card: CardDefinition, teamCard: TeamCard) {
  return {
    power: getPower(card, teamCard.borders, teamCard.mutationWeather),
    attack: getAttack(card, teamCard.borders, teamCard.mutationWeather),
    health: getHealth(card, teamCard.borders, teamCard.mutationWeather),
    effectiveRarity: rarityWithBorders(card, teamCard.borders),
  }
}

import cards from '../data/cards'
import type { CardDefinition, DepthsEnemy } from '../types'
import { getAttack, getHealth } from './stats'
import { SeededRng } from './rng'

const HARD_EXCLUSIONS = new Set([
  'Samurai', 'Seraphim', 'Vampire Lord', 'Loki', 'Fuxi', 'Parallax',
  'Nán Fāng Zhū Què', 'Brachiosaurus', 'Jersey Devil',
])

const WEATHER_WEIGHTS: Record<string, number> = {
  Storm: 0.5,
  Snow: 0.5,
  Aurora: 0.3,
  'Meteor Shower': 0.2,
  'Blood Rain': 0.1,
  Shroud: 0.1,
  Eclipse: 0.1,
  Rapture: 0.05,
  Virus: 0.2,
}

export function depthBudget(floor: number): number {
  return 3000 + Math.pow(floor, 2.75) * 40
}

export function depthsPower(floor: number): number {
  return Math.ceil(Math.sqrt(depthBudget(floor) * 2))
}

export function isDepthsSourceEligible(card: CardDefinition): boolean {
  return !card.unobtainable
    && !card.expires
    && !card.boss
    && !HARD_EXCLUSIONS.has(card.name)
    && card.pack !== 'Christmas'
    && card.pack !== 'Halloween'
    && card.pack !== 'Halloween2'
}

export function isUnlockedAtFloor(card: CardDefinition, floor: number): boolean {
  if (!isDepthsSourceEligible(card)) return false
  return getAttack(card) * getHealth(card) < depthBudget(floor)
}

export function getDepthsPool(floor: number) {
  return cards
    .filter((card) => isUnlockedAtFloor(card, floor))
    .map((card) => ({ card, weight: card.weather ? (WEATHER_WEIGHTS[card.weather] ?? 1) : 1 }))
}

export function generateDepthsTeam(floor: number, seed = floor): DepthsEnemy[] {
  const pool = getDepthsPool(floor)
  const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0)
  const rng = new SeededRng(seed)
  const power = depthsPower(floor)
  const result: DepthsEnemy[] = []

  if (!pool.length || totalWeight <= 0) return result

  for (let slot = 0; slot < 4; slot++) {
    let roll = rng.next() * totalWeight
    let picked = pool[pool.length - 1].card
    for (const entry of pool) {
      roll -= entry.weight
      if (roll < 0) {
        picked = entry.card
        break
      }
    }
    result.push({
      card: picked,
      power,
      attack: power / 2,
      health: power * (picked.hpMultiplier || 1),
    })
  }

  return result
}

export const depthsMechanics = {
  budgetFormula: '3000 + floor^2.75 × 40',
  enemyCount: 4,
  duplicateEnemiesAllowed: true,
  weatherWeights: WEATHER_WEIGHTS,
  hardExclusions: [...HARD_EXCLUSIONS],
}

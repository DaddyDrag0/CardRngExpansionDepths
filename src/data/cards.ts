import batch1 from './cards-1.json'
import batch2 from './cards-2.json'
import batch3 from './cards-3.json'
import batch4 from './cards-4.json'
import batch5 from './cards-5.json'
import batch6 from './cards-6.json'
import batch7 from './cards-7.json'
import type { CardDefinition } from '../types'

const allCards = [
  ...batch1,
  ...batch2,
  ...batch3,
  ...batch4,
  ...batch5,
  ...batch6,
  ...batch7,
] as CardDefinition[]

// Some source batches overlap at their boundaries. Keep a single definition per
// card name so duplicate entries never appear in the team/card pickers.
export const cards = Array.from(
  new Map(allCards.map((card) => [card.name, card] as const)).values(),
)

export default cards

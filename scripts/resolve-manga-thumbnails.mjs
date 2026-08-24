import fs from 'node:fs/promises'

const ids = [
  '110002833266451', // Limitless Rivals
  '79559745346915',  // The Awakened One
  '123755387112417', // Ultimate Brawler
  '109272849583933', // The Curse
  '76213153271303',  // Mangeka
]

const cachePath = 'src/data/thumbnails.json'
const cache = JSON.parse(await fs.readFile(cachePath, 'utf8'))

for (const id of ids) {
  const params = new URLSearchParams({ assetIds: id, size: '420x420', format: 'Png', isCircular: 'false' })
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const response = await fetch(`https://thumbnails.roblox.com/v1/assets?${params}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`${id}: HTTP ${response.status}`)
    const json = await response.json()
    const item = (json.data || []).find(entry => String(entry.targetId) === id)
    if (!item?.imageUrl) throw new Error(`${id}: no imageUrl returned`)
    cache[id] = item.imageUrl
    console.log(`${id} -> ${item.imageUrl}`)
  } finally {
    clearTimeout(timeout)
  }
}

await fs.writeFile(cachePath, JSON.stringify(cache, null, 2) + '\n')
console.log('Resolved all Manga thumbnails.')

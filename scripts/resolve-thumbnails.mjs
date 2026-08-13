import fs from 'node:fs/promises'

const cardFiles = [1,2,3,4,5,6].map(i => `src/data/cards-${i}.json`)
const auraFiles = [1,2].map(i => `src/data/auras-${i}.json`)

async function readAll(files) {
  const sets = await Promise.all(files.map(async file => JSON.parse(await fs.readFile(file, 'utf8'))))
  return sets.flat()
}

const items = [...await readAll(cardFiles), ...await readAll(auraFiles)]
const ids = [...new Set(items.map(item => item.imageAssetId).filter(Boolean).map(String))]
const output = {}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

for (let i = 0; i < ids.length; i += 20) {
  const chunk = ids.slice(i, i + 20)
  const params = new URLSearchParams({
    assetIds: chunk.join(','),
    size: '420x420',
    format: 'Png',
    isCircular: 'false',
  })

  let data = []
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(`https://thumbnails.roblox.com/v1/assets?${params}`, {
      headers: { Accept: 'application/json' },
    })
    if (response.ok) {
      const json = await response.json()
      data = json.data || []
      if (data.length) break
    }
    await sleep(800 * (attempt + 1))
  }

  for (const item of data) {
    if (item.imageUrl) output[String(item.targetId)] = item.imageUrl
  }

  await sleep(250)
}

await fs.writeFile('src/data/thumbnails.json', JSON.stringify(output, null, 2) + '\n')
console.log(`Resolved ${Object.keys(output).length}/${ids.length} Roblox thumbnails.`)

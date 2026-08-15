import fs from 'node:fs'

const ids = ['81556098422773','91389584710674','139426020484277']
const url = new URL('https://thumbnails.roblox.com/v1/assets')
url.searchParams.set('assetIds', ids.join(','))
url.searchParams.set('size', '420x420')
url.searchParams.set('format', 'Png')
url.searchParams.set('isCircular', 'false')

const response = await fetch(url)
if (!response.ok) throw new Error(`Roblox thumbnail request failed: ${response.status}`)
const payload = await response.json()
const found = new Map((payload.data || []).filter(x => x.imageUrl).map(x => [String(x.targetId), x.imageUrl]))
for (const id of ids) if (!found.get(id)) throw new Error(`No thumbnail returned for ${id}`)

const path = 'src/data/thumbnails.json'
const thumbs = JSON.parse(fs.readFileSync(path, 'utf8'))
for (const id of ids) thumbs[id] = found.get(id)
fs.writeFileSync(path, JSON.stringify(thumbs, null, 2) + '\n')
console.log(ids.map(id => `${id} -> ${thumbs[id]}`).join('\n'))

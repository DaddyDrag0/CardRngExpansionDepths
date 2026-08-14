import fs from 'node:fs'

const path = 'src/data/thumbnails.json'
const thumbs = JSON.parse(fs.readFileSync(path, 'utf8'))

const additions = {
  '81556098422773': 'https://www.roblox.com/asset-thumbnail/image?assetId=81556098422773&width=420&height=420&format=png',
  '91389584710674': 'https://www.roblox.com/asset-thumbnail/image?assetId=91389584710674&width=420&height=420&format=png',
  '139426020484277': 'https://www.roblox.com/asset-thumbnail/image?assetId=139426020484277&width=420&height=420&format=png',
}

Object.assign(thumbs, additions)
fs.writeFileSync(path, JSON.stringify(thumbs, null, 2) + '\n')
console.log('Imported Expansion 2 thumbnails:', Object.keys(additions).join(', '))

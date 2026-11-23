// Game CardStatTiers (ReplicatedStorage.Modules.CardStatTiers): a player-owned card that has no weather, is not a
// boss/sin/virtue and is not limited (Halloween packs excepted) uses max(StatMultiplier, tier), with tier 2.5 at
// rarity >= 250M, 2 at >= 100M and 1.5 at >= 50M. Enemy (Depths/dummy) cards keep their plain StatMultiplier.
// Every card the rule covers must carry the right rarityTier in the data and in the deployed depths worker.
import fs from 'node:fs'
const cards = fs.readdirSync('src/data').filter(f => /^cards-\d+\.json$/.test(f)).flatMap(f => JSON.parse(fs.readFileSync('src/data/' + f, 'utf8')))
const EVENT = new Set(['Christmas', 'Valentines', 'Easter', 'Halloween', 'Halloween2'])
const HALLOWEEN = new Set(['Halloween', 'Halloween2', 'Halloween3'])
const halloween = c => HALLOWEEN.has(c.pack || '') || HALLOWEEN.has(c.collection || '')
const limited = c => !!(c.expires || c.limited || c.collection != null || (c.pack && EVENT.has(c.pack)))
const eligible = c => c.weather == null && !c.boss && !c.sin && !c.virtue && (halloween(c) || !limited(c))
const tierFor = r => r >= 25e7 ? 2.5 : r >= 1e8 ? 2 : r >= 5e7 ? 1.5 : 1
const worker = fs.readFileSync('browser/depths-worker.js', 'utf8')
const bad = []
for (const c of cards) {
  const want = eligible(c) ? tierFor(c.rarity) : 1
  if (want > 1 && (Number(c.rarityTier) || 1) < want) bad.push(`${c.name}: data rarityTier ${c.rarityTier}, game tier ${want}`)
}
for (const name of ['The Ultimate General', 'Shadow Sovereign', 'Zen-kai', 'Astral Archivist', 'Hard Claws', 'Primeval Devourer']) {
  const m = worker.match(new RegExp('"name":"' + name + '"[^{}]*?"rarityTier":([\\d.]+)'))
  if (!m || Number(m[1]) !== 2.5) bad.push(`${name}: depths worker rarityTier ${m && m[1]}`)
}
if (bad.length) { console.error(bad.join('\n')); process.exit(1) }
console.log('Rarity stat tier regression passed: every eligible card at rarity >= 50M carries its game tier.')

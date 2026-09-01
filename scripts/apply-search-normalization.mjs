import fs from 'node:fs'
import assert from 'node:assert/strict'

const htmlPath = 'index-base.html'
const validatePath = 'scripts/validate-ui.mjs'
let html = fs.readFileSync(htmlPath, 'utf8')

const searchHelper = `  const searchKey=(v='')=>String(v).normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[đð]/gi,'d').replace(/ø/gi,'o').replace(/ł/gi,'l').replace(/æ/gi,'ae').replace(/œ/gi,'oe').replace(/ß/g,'ss').replace(/þ/gi,'th').replace(/[’‘]/g,"'").replace(/[‐‑‒–—―]/g,'-').toLowerCase();\n`

if (!html.includes("const searchKey=(v='')")) {
  const escLine = html.match(/^  const esc=.*$/m)
  if (!escLine) throw new Error('Could not find esc helper line')
  html = html.replace(escLine[0], escLine[0] + '\n' + searchHelper.trimEnd())
}

function replaceOnce(label, before, after) {
  const first = html.indexOf(before)
  if (first < 0) throw new Error(`Could not find ${label}`)
  if (html.indexOf(before, first + before.length) >= 0) throw new Error(`Found multiple ${label} anchors`)
  html = html.slice(0, first) + after + html.slice(first + before.length)
}

replaceOnce(
  'Tower card autocomplete',
  `const q=String(query||'').trim().toLowerCase();\n    const pool=state.cards.filter(c=>includeUnobtainable||!c.unobtainable);\n    const matches=pool.filter(c=>!q||c.name.toLowerCase().includes(q));\n    matches.sort((a,b)=>{\n      const an=a.name.toLowerCase(),bn=b.name.toLowerCase(),as=q&&an.startsWith(q),bs=q&&bn.startsWith(q);`,
  `const q=searchKey(query).trim();\n    const pool=state.cards.filter(c=>includeUnobtainable||!c.unobtainable);\n    const matches=pool.filter(c=>!q||searchKey(c.name).includes(q));\n    matches.sort((a,b)=>{\n      const an=searchKey(a.name),bn=searchKey(b.name),as=q&&an.startsWith(q),bs=q&&bn.startsWith(q);`,
)

replaceOnce(
  'Tower exact card match',
  `const exact=state.cards.find(c=>c.name.toLowerCase()===input.value.trim().toLowerCase());`,
  `const exact=state.cards.find(c=>searchKey(c.name)===searchKey(input.value).trim());`,
)

replaceOnce(
  'main library and Depth ban searches',
  `const team=current(),q=state.query.trim().toLowerCase(),banQ=state.depthBanQuery.trim().toLowerCase(),banCandidates=state.cards.filter(depthBanEligible).filter(c=>!state.depthBans.includes(c.name)).filter(c=>banQ&&(c.name.toLowerCase().includes(banQ)||(c.ability||'').toLowerCase().includes(banQ))).sort((a,b)=>a.name.localeCompare(b.name)).slice(0,8),shown=state.cards.filter(c=>!c.unobtainable||c.name==='Conqueror').filter(c=>!q||c.name.toLowerCase().includes(q)||(c.ability||'').toLowerCase().includes(q)).sort((a,b)=>b.rarity-a.rarity).slice(0,100)`,
  `const team=current(),q=searchKey(state.query).trim(),banQ=searchKey(state.depthBanQuery).trim(),banCandidates=state.cards.filter(depthBanEligible).filter(c=>!state.depthBans.includes(c.name)).filter(c=>banQ&&(searchKey(c.name).includes(banQ)||searchKey(c.ability||'').includes(banQ))).sort((a,b)=>a.name.localeCompare(b.name)).slice(0,8),shown=state.cards.filter(c=>!c.unobtainable||c.name==='Conqueror').filter(c=>!q||searchKey(c.name).includes(q)||searchKey(c.ability||'').includes(q)).sort((a,b)=>b.rarity-a.rarity).slice(0,100)`,
)

fs.writeFileSync(htmlPath, html)

let validate = fs.readFileSync(validatePath, 'utf8')
if (!validate.includes('Accent-insensitive card search helper missing')) {
  const marker = `if (!liveHtml.includes('state.towerFloor=Math.min(105,Math.max(1,Number(e.target.value)||1))')) throw new Error('Tower floor runtime clamp must remain 105')\n`
  if (!validate.includes(marker)) throw new Error('Could not find validate-ui insertion marker')
  const checks = `${marker}if (!liveHtml.includes("const searchKey=(v='')=>String(v).normalize('NFD')")) throw new Error('Accent-insensitive card search helper missing')\nif (!liveHtml.includes('searchKey(c.name).includes(q)')) throw new Error('Card search is not using normalized names')\nif (!liveHtml.includes('searchKey(c.name).includes(banQ)')) throw new Error('Depth ban search is not using normalized names')\n`
  validate = validate.replace(marker, checks)
  fs.writeFileSync(validatePath, validate)
}

function searchKey(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đð]/gi, 'd')
    .replace(/ø/gi, 'o')
    .replace(/ł/gi, 'l')
    .replace(/æ/gi, 'ae')
    .replace(/œ/gi, 'oe')
    .replace(/ß/g, 'ss')
    .replace(/þ/gi, 'th')
    .replace(/[’‘]/g, "'")
    .replace(/[‐‑‒–—―]/g, '-')
    .toLowerCase()
}

const samples = new Map([
  ['Dōng Fāng Qīng Lóng', 'dong fang qing long'],
  ['Běi Fāng Xuán Wǔ', 'bei fang xuan wu'],
  ['Nán Fāng Zhū Què', 'nan fang zhu que'],
  ['Nüwa', 'nuwa'],
  ['Shén Lóng', 'shen long'],
  ['Shuten-dōji', 'shuten-doji'],
])
for (const [original, plain] of samples) assert.equal(searchKey(original), plain)

console.log('Accent-insensitive card search patch applied and representative names verified.')

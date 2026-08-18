import fs from 'node:fs'

const indexPath = 'index.html'
let html = fs.readFileSync(indexPath, 'utf8')

const oldWorker = `towerWorker=new Worker('./browser/tower-worker.js');`
const newWorker = `towerWorker=new Worker('./browser/tower-worker.js?v=one-parallax-20260818');`
if (!html.includes(oldWorker)) throw new Error('Tower worker URL marker not found')
html = html.replace(oldWorker, newWorker)

const workerMarker = `  let towerWorker=null,towerRequestId=0,towerPendingId=0;\n`
const legalityHelper = `${workerMarker}  function towerRecommendationLegal(rec){return (rec?.loadout?.cards||[]).filter(slot=>slot?.cardName==='Parallax').length<=1}\n`
if (!html.includes(workerMarker)) throw new Error('Tower worker state marker not found')
html = html.replace(workerMarker, legalityHelper)

const oldResult = `          state.towerSearch=e.data.ok?e.data.result:{error:e.data.error||'Tower cheese search failed.'};render();return;`
const newResult = `          if(e.data.ok){const result=e.data.result||{};state.towerSearch={...result,recommendations:(result.recommendations||[]).filter(towerRecommendationLegal).slice(0,10)}}else state.towerSearch={error:e.data.error||'Tower cheese search failed.'};render();return;`
if (!html.includes(oldResult)) throw new Error('Tower cheese result marker not found')
html = html.replace(oldResult, newResult)

const oldLoad = `    const rec=state.towerSearch?.recommendations?.[index];if(!rec)return;`
const newLoad = `    const rec=state.towerSearch?.recommendations?.[index];if(!rec)return;if(!towerRecommendationLegal(rec)){state.towerSearch={...state.towerSearch,error:'Invalid cheese recommendation blocked: only one Parallax can be used.'};render();return}`
if (!html.includes(oldLoad)) throw new Error('Tower recommendation loader marker not found')
html = html.replace(oldLoad, newLoad)

fs.writeFileSync(indexPath, html)

const testPath = 'scripts/tower-cheese-search-regression.ts'
let test = fs.readFileSync(testPath, 'utf8')
if (!test.includes("import fs from 'node:fs'")) test = test.replace("import assert from 'node:assert/strict'\n", "import assert from 'node:assert/strict'\nimport fs from 'node:fs'\n")
const marker = `assert.equal(isTowerCheeseCandidateLegal(['Parallax', 'Parallax', 'Judgment Day', 'Pandora']), false)`
const guards = `${marker}\nconst towerHtml = fs.readFileSync('index.html', 'utf8')\nassert.ok(towerHtml.includes("tower-worker.js?v=one-parallax-20260818"), 'Tower worker URL must be cache-busted')\nassert.ok(towerHtml.includes('function towerRecommendationLegal'), 'UI must defensively reject multi-Parallax recommendations')`
if (!test.includes(marker)) throw new Error('Parallax legality regression marker not found')
if (!test.includes('Tower worker URL must be cache-busted')) test = test.replace(marker, guards)
fs.writeFileSync(testPath, test)

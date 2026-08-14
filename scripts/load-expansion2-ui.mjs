import fs from 'node:fs'
const path='index.html'
let html=fs.readFileSync(path,'utf8')
const old=`const cardFiles=[1,2,3,4,5,6].map(i=>fetch(\`./src/data/cards-\${i}.json\`).then(r=>r.json())),auraFiles=[1,2].map(i=>fetch(\`./src/data/auras-\${i}.json\`).then(r=>r.json())),abilityFiles=[1,2,3].map(i=>fetch(\`./src/data/abilities-\${i}.json\`).then(r=>r.json()))`
const next=`const cardFiles=[1,2,3,4,5,6,7].map(i=>fetch(\`./src/data/cards-\${i}.json\`).then(r=>r.json())),auraFiles=[1,2].map(i=>fetch(\`./src/data/auras-\${i}.json\`).then(r=>r.json())),abilityFiles=[1,2,3,4].map(i=>fetch(\`./src/data/abilities-\${i}.json\`).then(r=>r.json()))`
const count=html.split(old).length-1
if(count!==1) throw new Error(`Expected one UI data-loader match, found ${count}`)
html=html.replace(old,next)
fs.writeFileSync(path,html)
console.log('UI now loads cards-7.json and abilities-4.json.')

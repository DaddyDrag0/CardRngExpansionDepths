import fs from 'node:fs'

function replaceOnce(text, oldText, newText, label) {
  if (!text.includes(oldText)) throw new Error(`${label} anchor missing`)
  return text.replace(oldText, newText)
}

{
  const path = 'src/engine/battle-v2.ts'
  let text = fs.readFileSync(path, 'utf8')

  text = replaceOnce(
    text,
    "  resolveConstellarArts(runtime)\n  while (state.teams.Allies.length && state.teams.Enemies.length && state.turn < maxTurns) {",
    "  resolveConstellarArts(runtime)\n  let activePairKey = ''\n  let pairTurns: Record<string, number> = {}\n  while (state.teams.Allies.length && state.teams.Enemies.length && state.turn < maxTurns) {",
    'pair turn state',
  )

  text = replaceOnce(
    text,
    "    if (!attacker || !defender) break\n\n    doTurn(runtime, attacker)",
    "    if (!attacker || !defender) break\n\n    const nextPairKey = `${attacker.id}|${defender.id}`\n    if (nextPairKey !== activePairKey) {\n      activePairKey = nextPairKey\n      pairTurns = {}\n    }\n    pairTurns[attacker.id] = (pairTurns[attacker.id] || 0) + 1\n    if (pairTurns[attacker.id] > 150) {\n      attacker.hp = 0\n      defender.hp = 0\n      resolveDeaths(runtime)\n      continue\n    }\n\n    doTurn(runtime, attacker)",
    'per-card matchup turn limit',
  )

  fs.writeFileSync(path, text)
}

{
  const path = 'index.html'
  let text = fs.readFileSync(path, 'utf8')

  text = text.replace(
    '<label class="sim-field"><span>Seed</span><input id="seedInput" type="number" value="${state.seed}"></label>',
    '<div class="sim-field"><span>Enemy rolls</span><small>Fresh random enemies every test</small></div>',
  )

  text = text.replace(
    "root.querySelector('#seedInput')?.addEventListener('change',e=>{state.seed=Number(e.target.value)||1;persist();render()});",
    '',
  )

  text = replaceOnce(
    text,
    "function askWorker(index){if(!worker||!state.workerReady)return Promise.reject(new Error('Simulation worker is unavailable. Refresh and try again.'));const id=++requestId,t=state.teams[index];return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});worker.postMessage({id,loadout:loadoutFor(t),runs:state.runs,floorCap:state.cap,seed:state.seed>>>0})})}",
    "function askWorker(index,batchSeed){if(!worker||!state.workerReady)return Promise.reject(new Error('Simulation worker is unavailable. Refresh and try again.'));const id=++requestId,t=state.teams[index];return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});worker.postMessage({id,loadout:loadoutFor(t),runs:state.runs,floorCap:state.cap,seed:batchSeed>>>0})})}",
    'worker seed argument',
  )

  text = replaceOnce(
    text,
    "async function runTeams(indices){if(state.running||!indices.length)return;state.running=true;try{for(let order=0;order<indices.length;order++){",
    "async function runTeams(indices){if(state.running||!indices.length)return;state.running=true;const seedWords=new Uint32Array(1);crypto.getRandomValues(seedWords);const batchSeed=seedWords[0]||((Date.now()^Math.floor(performance.now()*1000))>>>0);try{for(let order=0;order<indices.length;order++){",
    'fresh batch seed',
  )

  text = text.replace('const response=await askWorker(index);', 'const response=await askWorker(index,batchSeed);state.teams[index].lastSeed=batchSeed;')

  fs.writeFileSync(path, text)
}

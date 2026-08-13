import fs from 'node:fs'

const path = 'index.html'
let text = fs.readFileSync(path, 'utf8')

function replaceOnce(oldText, newText, label) {
  if (!text.includes(oldText)) throw new Error(`${label} anchor missing`)
  text = text.replace(oldText, newText)
}

replaceOnce(
  "const state={cards:[],auras:[],abilities:{},thumbs:{},teams:Array.from({length:5},blankTeam),activeTeam:0,activeSlot:0,query:'',runs:15,cap:50000,seed:1000,running:false,runningLabel:'',workerReady:false};",
  "const state={cards:[],auras:[],abilities:{},thumbs:{},teams:Array.from({length:5},blankTeam),activeTeam:0,activeSlot:0,query:'',runs:15,cap:50000,seed:1000,running:false,runningLabel:'',workerReady:false,lastProgressRender:0};",
  'state',
)

replaceOnce(
  "state.runs=[3,8,15,30,50].includes(Number(s.runs))?Number(s.runs):15;",
  "state.runs=[1,3,8,15,30,50].includes(Number(s.runs))?Number(s.runs):15;",
  'restore run options',
)

replaceOnce(
  "${[3,8,15,30,50].map(n=>`<button data-runs=\"${n}\" class=\"${state.runs===n?'on':''}\">${n}</button>`).join('')}",
  "${[1,3,8,15,30,50].map(n=>`<button data-runs=\"${n}\" class=\"${state.runs===n?'on':''}\">${n}</button>`).join('')}",
  'render run options',
)

const oldActions = `<div class="sim-actions"><button class="secondary-run" data-run-active ${'${state.running||!complete(team)?\'disabled\':\'\'}'}>Test Team ${'${state.activeTeam+1}'}</button><button class="sim-run" data-run-ready ${'${state.running||ready===0?\'disabled\':\'\'}'}>${'${state.running?esc(state.runningLabel||\'Running…\'):`Test ${ready} Ready Team${ready===1?\'\':\'s\'}`}'}</button></div><p class="sim-footnote">30–50 runs at very high floors can take longer. The page remains responsive while the worker calculates.</p>`
const newActions = `<div class="sim-actions">${'${state.running?`<button class="secondary-run" disabled>${esc(state.runningLabel||\'Starting simulation…\')}</button><button class="sim-run" data-cancel-run>Cancel simulation</button>`:`<button class="secondary-run" data-run-active ${!complete(team)?\'disabled\':\'\'}>Test Team ${state.activeTeam+1}</button><button class="sim-run" data-run-ready ${ready===0?\'disabled\':\'\'}>Test ${ready} Ready Team${ready===1?\'\':\'s\'}</button>`}'}</div><p class="sim-footnote">${'${state.running?`Live progress updates every few floors. If one floor stops advancing for 20 seconds, the simulator will stop and report the run/floor instead of hanging.`:`Use 1 run for a quick diagnostic. Larger tests run in parallel across available CPU cores.`}'}</p>`
replaceOnce(oldActions, newActions, 'simulation actions')

const oldBindTail = "root.querySelector('[data-run-active]')?.addEventListener('click',()=>runTeams([state.activeTeam]));root.querySelector('[data-run-ready]')?.addEventListener('click',()=>runTeams(state.teams.map((t,i)=>complete(t)?i:-1).filter(i=>i>=0)))}"
const newBindTail = "root.querySelector('[data-run-active]')?.addEventListener('click',()=>runTeams([state.activeTeam]));root.querySelector('[data-run-ready]')?.addEventListener('click',()=>runTeams(state.teams.map((t,i)=>complete(t)?i:-1).filter(i=>i>=0)));root.querySelector('[data-cancel-run]')?.addEventListener('click',cancelSimulation)}"
replaceOnce(oldBindTail, newBindTail, 'bind actions')

const oldWorker = `  let worker=null,requestId=0;const pending=new Map();
  function startWorker(){try{worker=new Worker('./browser/depths-worker.js');worker.onmessage=e=>{const p=pending.get(e.data.id);if(!p)return;pending.delete(e.data.id);e.data.ok?p.resolve(e.data):p.reject(new Error(e.data.error||'Simulation failed'))};worker.onerror=e=>{for(const p of pending.values())p.reject(new Error(e.message||'Simulation worker failed'));pending.clear();state.workerReady=false};state.workerReady=true}catch(_){state.workerReady=false}}
  function loadoutFor(team){return{cards:team.cards.map(s=>({cardName:s.cardName,borders:[...s.borders]})),statAura:team.statAura?{auraName:team.statAura,border:team.statAuraBorder||null}:null,abilityAura:team.abilityAura?{auraName:team.abilityAura,border:team.abilityAuraBorder||null}:null}}
  function askWorker(index,batchSeed){if(!worker||!state.workerReady)return Promise.reject(new Error('Simulation worker is unavailable. Refresh and try again.'));const id=++requestId,t=state.teams[index];return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});worker.postMessage({id,loadout:loadoutFor(t),runs:state.runs,floorCap:state.cap,seed:batchSeed>>>0})})}
  async function runTeams(indices){if(state.running||!indices.length)return;state.running=true;const seedWords=new Uint32Array(1);crypto.getRandomValues(seedWords);const batchSeed=seedWords[0]||((Date.now()^Math.floor(performance.now()*1000))>>>0);try{for(let order=0;order<indices.length;order++){const index=indices[order];state.runningLabel=\`Testing Team ${'${index+1}'} · ${'${order+1}'}/${'${indices.length}'}\`;render();try{const response=await askWorker(index,batchSeed);state.teams[index].lastSeed=batchSeed;state.teams[index].result=response.result;state.teams[index].elapsedMs=response.elapsedMs;state.teams[index].lastError=''}catch(error){state.teams[index].result=null;state.teams[index].lastError=error.message||String(error);throw error}}}catch(error){console.error(error)}finally{state.running=false;state.runningLabel='';render()}}
`

const newWorker = `  let worker=null,requestId=0;const pending=new Map();
  function startWorker(){try{worker=new Worker('./browser/depths-worker.js');worker.onmessage=e=>{const p=pending.get(e.data.id);if(!p)return;if(e.data.kind==='progress'){const now=performance.now();state.runningLabel=\`Team ${'${p.teamIndex+1}'} · ${'${e.data.completedRuns||0}'}/${'${e.data.totalRuns||state.runs}'} runs done · Run ${'${Number(e.data.runIndex)+1}'} · Floor ${'${full(e.data.floor||1)}'}\`;if(now-state.lastProgressRender>250){state.lastProgressRender=now;render()}return}pending.delete(e.data.id);e.data.ok?p.resolve(e.data):p.reject(new Error(e.data.error||'Simulation failed'))};worker.onerror=e=>{for(const p of pending.values())p.reject(new Error(e.message||'Simulation worker failed'));pending.clear();state.workerReady=false};state.workerReady=true}catch(_){state.workerReady=false}}
  function cancelSimulation(){if(worker)worker.terminate();const error=new Error('Simulation cancelled');for(const p of pending.values())p.reject(error);pending.clear();state.workerReady=false;state.running=false;state.runningLabel='';startWorker();render()}
  function loadoutFor(team){return{cards:team.cards.map(s=>({cardName:s.cardName,borders:[...s.borders]})),statAura:team.statAura?{auraName:team.statAura,border:team.statAuraBorder||null}:null,abilityAura:team.abilityAura?{auraName:team.abilityAura,border:team.abilityAuraBorder||null}:null}}
  function askWorker(index,batchSeed){if(!worker||!state.workerReady)return Promise.reject(new Error('Simulation worker is unavailable. Refresh and try again.'));const id=++requestId,t=state.teams[index];return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject,teamIndex:index});worker.postMessage({id,loadout:loadoutFor(t),runs:state.runs,floorCap:state.cap,seed:batchSeed>>>0})})}
  async function runTeams(indices){if(state.running||!indices.length)return;state.running=true;state.lastProgressRender=0;const seedWords=new Uint32Array(1);crypto.getRandomValues(seedWords);const batchSeed=seedWords[0]||((Date.now()^Math.floor(performance.now()*1000))>>>0);try{for(let order=0;order<indices.length;order++){const index=indices[order];state.runningLabel=\`Starting Team ${'${index+1}'} · ${'${order+1}'}/${'${indices.length}'}\`;render();try{const response=await askWorker(index,batchSeed);state.teams[index].lastSeed=batchSeed;state.teams[index].result=response.result;state.teams[index].elapsedMs=response.elapsedMs;state.teams[index].lastError=''}catch(error){if((error.message||String(error))==='Simulation cancelled')return;state.teams[index].result=null;state.teams[index].lastError=error.message||String(error);throw error}}}catch(error){console.error(error)}finally{state.running=false;state.runningLabel='';render()}}
`
replaceOnce(oldWorker, newWorker, 'worker controller')

fs.writeFileSync(path, text)

import fs from 'node:fs'

const path = 'index-base.html'
let html = fs.readFileSync(path, 'utf8')

function replaceOnce(source, from, to, label) {
  const count = source.split(from).length - 1
  if (count !== 1) throw new Error(`${label}: expected exactly 1 match, found ${count}`)
  return source.replace(from, to)
}

html = replaceOnce(
  html,
  "  const blankTeam=()=>({cards:Array.from({length:4},()=>({cardName:'',borders:[]})),statAura:'',statAuraBorder:'',abilityAura:'',abilityAuraBorder:'',result:null,elapsedMs:0,lastError:''});\n  const state={cards:[],auras:[],abilities:{},thumbs:{},teams:Array.from({length:5},blankTeam),activeTeam:0,activeSlot:0,query:'',depthBans:[],depthBanQuery:'',",
  "  const blankTeam=()=>({cards:Array.from({length:4},()=>({cardName:'',borders:[]})),statAura:'',statAuraBorder:'',abilityAura:'',abilityAuraBorder:'',result:null,elapsedMs:0,lastError:''});\n  const blankBanLayouts=()=>Array.from({length:4},()=>[]);\n  const initialDepthBanLayouts=blankBanLayouts();\n  const state={cards:[],auras:[],abilities:{},thumbs:{},teams:Array.from({length:5},blankTeam),activeTeam:0,activeSlot:0,query:'',depthBanLayouts:initialDepthBanLayouts,activeDepthBanLayout:0,depthBans:initialDepthBanLayouts[0],depthBanQuery:'',",
  'ban layout state',
)

const helpers = `  const sanitizeBanList=list=>Array.isArray(list)?[...new Set(list.map(String))].filter(name=>depthBanEligible(cardByName(name))).slice(0,MAX_DEPTH_BANS):[];
  function setActiveDepthBans(list){const next=sanitizeBanList(list);state.depthBanLayouts[state.activeDepthBanLayout]=next;state.depthBans=next}
  function clearDepthResults(){state.teams.forEach(t=>{t.result=null;t.elapsedMs=0;t.lastError=''})}
  function encodeBanLayouts(){const payload={v:1,active:state.activeDepthBanLayout,layouts:state.depthBanLayouts.map(sanitizeBanList)},bytes=new TextEncoder().encode(JSON.stringify(payload));let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return 'CRB1-'+btoa(binary)}
  function decodeBanLayouts(code){const raw=String(code||'').trim();if(!raw.startsWith('CRB1-'))throw new Error('Ban code must start with CRB1-');let payload;try{const binary=atob(raw.slice(5)),bytes=Uint8Array.from(binary,ch=>ch.charCodeAt(0));payload=JSON.parse(new TextDecoder().decode(bytes))}catch(_){throw new Error('Invalid ban code')}if(!payload||payload.v!==1||!Array.isArray(payload.layouts))throw new Error('Unsupported ban code');const layouts=Array.from({length:4},(_,i)=>sanitizeBanList(payload.layouts[i]));const active=Math.max(0,Math.min(3,Math.floor(Number(payload.active)||0)));return{layouts,active}}
`
html = replaceOnce(html, '  function persist(){', helpers + '  function persist(){', 'ban helpers')

html = replaceOnce(
  html,
  'activeTeam:state.activeTeam,depthBans:state.depthBans,bountifulDepths:state.bountifulDepths',
  'activeTeam:state.activeTeam,depthBanLayouts:state.depthBanLayouts,activeDepthBanLayout:state.activeDepthBanLayout,bountifulDepths:state.bountifulDepths',
  'persist ban layouts',
)

html = replaceOnce(
  html,
  "state.rebanLegacyDepths=false;state.depthBans=Array.isArray(s.depthBans)?[...new Set(s.depthBans.map(String))].filter(name=>depthBanEligible(cardByName(name))).slice(0,MAX_DEPTH_BANS):[];state.towerExcludedCards=",
  "state.rebanLegacyDepths=false;state.depthBanLayouts=Array.isArray(s.depthBanLayouts)?Array.from({length:4},(_,i)=>sanitizeBanList(s.depthBanLayouts[i])):[sanitizeBanList(s.depthBans),[],[],[]];state.activeDepthBanLayout=Math.max(0,Math.min(3,Math.floor(Number(s.activeDepthBanLayout)||0)));state.depthBans=state.depthBanLayouts[state.activeDepthBanLayout];state.towerExcludedCards=",
  'restore ban layouts',
)

html = replaceOnce(
  html,
  '<div class=\\"depth-ban-box\\"><div class=\\"depth-ban-head\\">',
  '<div class=\\"depth-ban-box\\"><div class=\\"depth-ban-layouts\\"><div class=\\"depth-ban-layout-tabs\\">${state.depthBanLayouts.map((bans,i)=>`<button type=\\"button\\" data-depth-ban-layout=\\"${i}\\" class=\\"${state.activeDepthBanLayout===i?\'on\':\'\'}\\"><span>Ban ${i+1}</span><small>${bans.length}/${MAX_DEPTH_BANS}</small></button>`).join(\'\')}</div><div class=\\"depth-ban-layout-actions\\"><button type=\\"button\\" data-depth-bans-export>Export Bans</button><button type=\\"button\\" data-depth-bans-import>Import Bans</button></div></div><div class=\\"depth-ban-head\\">',
  'ban layout UI',
)

html = replaceOnce(
  html,
  '<span>Depth bans</span>',
  '<span>Depth bans · Ban ${state.activeDepthBanLayout+1}</span>',
  'active ban title',
)
html = html.replace("'12/12 bans selected'", "'14/14 bans selected'")

html = replaceOnce(
  html,
  '.depth-ban-box{margin-top:13px;border:1px solid var(--line-strong);background:var(--surface-1);border-radius:11px;padding:10px}.depth-ban-head',
  '.depth-ban-box{margin-top:13px;border:1px solid var(--line-strong);background:var(--surface-1);border-radius:11px;padding:10px}.depth-ban-layouts{display:grid;gap:7px;margin-bottom:10px;padding-bottom:9px;border-bottom:1px solid var(--line-inner)}.depth-ban-layout-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}.depth-ban-layout-tabs button{min-width:0;border:1px solid var(--line-soft);background:var(--surface-3);color:#8290a1;border-radius:8px;padding:6px 5px;cursor:pointer}.depth-ban-layout-tabs button span{display:block;font-size:8px;font-weight:800}.depth-ban-layout-tabs button small{display:block;color:#627184;font-size:7px;margin-top:2px}.depth-ban-layout-tabs button.on{border-color:var(--accent-line);background:var(--accent-soft);color:var(--accent-text-strong)}.depth-ban-layout-tabs button.on small{color:var(--accent)}.depth-ban-layout-actions{display:flex;gap:5px;justify-content:flex-end}.depth-ban-layout-actions button{border:1px solid var(--line-soft);background:var(--surface-2);color:#8b99aa;border-radius:7px;padding:5px 7px;font-size:8px;cursor:pointer}.depth-ban-layout-actions button:hover{border-color:var(--accent-line);color:var(--accent-text-strong)}.depth-ban-head',
  'ban layout styles',
)

const oldEvents = "root.querySelector('[data-bountiful-depths]')?.addEventListener('click',()=>{state.bountifulDepths=!state.bountifulDepths;state.teams.forEach(t=>{t.result=null;t.elapsedMs=0;t.lastError=''});persist();render()});root.querySelectorAll('[data-depth-ban-add]').forEach(el=>el.addEventListener('click',()=>{if(state.depthBans.length>=MAX_DEPTH_BANS)return;const name=el.dataset.depthBanAdd,card=cardByName(name);if(!depthBanEligible(card)||state.depthBans.includes(name))return;state.depthBans=[...state.depthBans,name].slice(0,MAX_DEPTH_BANS);state.depthBanQuery='';state.teams.forEach(t=>{t.result=null;t.elapsedMs=0;t.lastError=''});persist();render()}));root.querySelectorAll('[data-depth-ban-remove]').forEach(el=>el.addEventListener('click',()=>{state.depthBans.splice(Number(el.dataset.depthBanRemove),1);state.teams.forEach(t=>{t.result=null;t.elapsedMs=0;t.lastError=''});persist();render()}));root.querySelector('[data-depth-ban-clear]')?.addEventListener('click',()=>{state.depthBans=[];state.depthBanQuery='';state.teams.forEach(t=>{t.result=null;t.elapsedMs=0;t.lastError=''});persist();render()});"
const newEvents = "root.querySelector('[data-bountiful-depths]')?.addEventListener('click',()=>{state.bountifulDepths=!state.bountifulDepths;clearDepthResults();persist();render()});root.querySelectorAll('[data-depth-ban-layout]').forEach(el=>el.addEventListener('click',()=>{const next=Math.max(0,Math.min(3,Number(el.dataset.depthBanLayout)||0));if(next===state.activeDepthBanLayout)return;state.activeDepthBanLayout=next;state.depthBans=state.depthBanLayouts[next];state.depthBanQuery='';clearDepthResults();persist();render()}));root.querySelector('[data-depth-bans-export]')?.addEventListener('click',async()=>{const code=encodeBanLayouts(),button=root.querySelector('[data-depth-bans-export]');try{await navigator.clipboard.writeText(code);if(button){button.textContent='Copied!';setTimeout(()=>{if(button.isConnected)button.textContent='Export Bans'},900)}}catch(_){prompt('Copy this CRB1 ban code:',code)}});root.querySelector('[data-depth-bans-import]')?.addEventListener('click',()=>{const code=prompt('Paste a CRB1 ban code:');if(!code)return;try{const imported=decodeBanLayouts(code);state.depthBanLayouts=imported.layouts;state.activeDepthBanLayout=imported.active;state.depthBans=state.depthBanLayouts[state.activeDepthBanLayout];state.depthBanQuery='';clearDepthResults();persist();render()}catch(error){alert(`Could not import bans: ${error.message||error}`)}});root.querySelectorAll('[data-depth-ban-add]').forEach(el=>el.addEventListener('click',()=>{if(state.depthBans.length>=MAX_DEPTH_BANS)return;const name=el.dataset.depthBanAdd,card=cardByName(name);if(!depthBanEligible(card)||state.depthBans.includes(name))return;setActiveDepthBans([...state.depthBans,name]);state.depthBanQuery='';clearDepthResults();persist();render()}));root.querySelectorAll('[data-depth-ban-remove]').forEach(el=>el.addEventListener('click',()=>{setActiveDepthBans(state.depthBans.filter((_,i)=>i!==Number(el.dataset.depthBanRemove)));clearDepthResults();persist();render()}));root.querySelector('[data-depth-ban-clear]')?.addEventListener('click',()=>{setActiveDepthBans([]);state.depthBanQuery='';clearDepthResults();persist();render()});"
html = replaceOnce(html, oldEvents, newEvents, 'ban layout events')

fs.writeFileSync(path, html)

const validationPath = 'scripts/validate-ui.mjs'
let validation = fs.readFileSync(validationPath, 'utf8')
const validationAnchor = "if (!liveHtml.includes('searchKey(c.name).includes(banQ)')) throw new Error('Depth ban search is not using normalized names')\n"
const validationAdd = validationAnchor + "for (const hook of ['depthBanLayouts','data-depth-ban-layout','data-depth-bans-export','data-depth-bans-import','CRB1-']) {\n  if (!liveHtml.includes(hook)) throw new Error(`Ban layout/share hook missing: ${hook}`)\n}\n"
validation = replaceOnce(validation, validationAnchor, validationAdd, 'ban UI validation')
fs.writeFileSync(validationPath, validation)

console.log('Applied four Depth ban layouts with CRB1 import/export.')

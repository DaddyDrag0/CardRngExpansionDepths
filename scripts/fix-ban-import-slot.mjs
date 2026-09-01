import fs from 'node:fs'

const files = ['index-base.html']

const oldFns = `  function encodeBanLayouts(){const payload={v:1,active:state.activeDepthBanLayout,layouts:state.depthBanLayouts.map(sanitizeBanList)},bytes=new TextEncoder().encode(JSON.stringify(payload));let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return 'CRB1-'+btoa(binary)}
  function decodeBanLayouts(code){const raw=String(code||'').trim();if(!raw.startsWith('CRB1-'))throw new Error('Ban code must start with CRB1-');let payload;try{const binary=atob(raw.slice(5)),bytes=Uint8Array.from(binary,ch=>ch.charCodeAt(0));payload=JSON.parse(new TextDecoder().decode(bytes))}catch(_){throw new Error('Invalid ban code')}if(!payload||payload.v!==1||!Array.isArray(payload.layouts))throw new Error('Unsupported ban code');const layouts=Array.from({length:4},(_,i)=>sanitizeBanList(payload.layouts[i]));const active=Math.max(0,Math.min(3,Math.floor(Number(payload.active)||0)));return{layouts,active}}`

const newFns = `  function encodeBanLayouts(){const payload={v:2,bans:sanitizeBanList(state.depthBans)},bytes=new TextEncoder().encode(JSON.stringify(payload));let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return 'CRB1-'+btoa(binary)}
  function decodeBanLayouts(code){const raw=String(code||'').trim();if(!raw.startsWith('CRB1-'))throw new Error('Ban code must start with CRB1-');let payload;try{const binary=atob(raw.slice(5)),bytes=Uint8Array.from(binary,ch=>ch.charCodeAt(0));payload=JSON.parse(new TextDecoder().decode(bytes))}catch(_){throw new Error('Invalid ban code')}if(!payload)throw new Error('Unsupported ban code');if(payload.v===2&&Array.isArray(payload.bans))return sanitizeBanList(payload.bans);if(payload.v===1&&Array.isArray(payload.layouts)){const source=Math.max(0,Math.min(3,Math.floor(Number(payload.active)||0)));return sanitizeBanList(payload.layouts[source])}throw new Error('Unsupported ban code')}`

const oldImport = `root.querySelector('[data-depth-bans-import]')?.addEventListener('click',()=>{const code=prompt('Paste a CRB1 ban code:');if(!code)return;try{const imported=decodeBanLayouts(code);state.depthBanLayouts=imported.layouts;state.activeDepthBanLayout=imported.active;state.depthBans=state.depthBanLayouts[state.activeDepthBanLayout];state.depthBanQuery='';clearDepthResults();persist();render()}catch(error){alert(\`Could not import bans: \${error.message||error}\`)}});`
const newImport = `root.querySelector('[data-depth-bans-import]')?.addEventListener('click',()=>{const code=prompt(\`Paste a CRB1 ban code into Ban \${state.activeDepthBanLayout+1}:\`);if(!code)return;try{setActiveDepthBans(decodeBanLayouts(code));state.depthBanQuery='';clearDepthResults();persist();render()}catch(error){alert(\`Could not import bans: \${error.message||error}\`)}});`

for (const path of files) {
  let html = fs.readFileSync(path, 'utf8')
  if (!html.includes(oldFns)) throw new Error(`${path}: old ban codec not found`)
  if (!html.includes(oldImport)) throw new Error(`${path}: old ban import handler not found`)
  html = html.replace(oldFns, newFns).replace(oldImport, newImport)
  fs.writeFileSync(path, html)
}

const validationPath = 'scripts/validate-ui.mjs'
let validation = fs.readFileSync(validationPath, 'utf8')
const anchor = `for (const hook of ['depthBanLayouts','data-depth-ban-layout','data-depth-bans-export','data-depth-bans-import','CRB1-']) {\n  if (!liveHtml.includes(hook)) throw new Error(\`Ban layout/share hook missing: \${hook}\`)\n}\n`
const replacement = anchor + `if (!liveHtml.includes("payload={v:2,bans:sanitizeBanList(state.depthBans)}")) throw new Error('Ban export must contain only the active layout')\nif (!liveHtml.includes('setActiveDepthBans(decodeBanLayouts(code))')) throw new Error('Ban import must target the currently viewed layout')\n`
if (!validation.includes(anchor)) throw new Error('validation anchor not found')
validation = validation.replace(anchor, replacement)
fs.writeFileSync(validationPath, validation)

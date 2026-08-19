from pathlib import Path


def replace(path: str, old: str, new: str, expected: int = 1) -> None:
    p = Path(path)
    text = p.read_text()
    hits = text.count(old)
    if hits != expected:
        raise SystemExit(f"Expected {expected} matches in {path}, found {hits}: {old!r}")
    p.write_text(text.replace(old, new, expected))


# ---------------- src/engine/depths.ts ----------------
replace(
    'src/engine/depths.ts',
    "const HARD_EXCLUSIONS = new Set(['Vampire Lord'])\n\nexport const MAX_DEPTH_BANS = 12",
    "const HARD_EXCLUSIONS = new Set(['Vampire Lord'])\nexport const LEGACY_DEPTHS_BANS = ['Samurai', 'Seraphim', 'Loki', 'Fuxi', 'Parallax', 'Nán Fāng Zhū Què', 'Brachiosaurus', 'Jersey Devil'] as const\nconst LEGACY_DEPTHS_BAN_SET = new Set<string>(LEGACY_DEPTHS_BANS)\n\nexport const MAX_DEPTH_BANS = 12",
)
replace(
    'src/engine/depths.ts',
    "function preparedPool(floor: number, bannedCardNames: readonly string[] = []): PreparedPool {",
    "function preparedPool(floor: number, bannedCardNames: readonly string[] = [], rebanLegacyDepths = false): PreparedPool {",
)
replace(
    'src/engine/depths.ts',
    "  const bans = normalizeDepthBans(bannedCardNames)\n  const cacheKey = bans.length ? `${tier}|${bans.join('\\u0000')}` : ''\n  const cached = bans.length ? CUSTOM_BAN_POOL_CACHE.get(cacheKey) : POOL_CACHE.get(tier)\n  if (cached) return cached",
    "  const bans = normalizeDepthBans(bannedCardNames)\n  const cacheKey = bans.length || rebanLegacyDepths\n    ? `${tier}|${rebanLegacyDepths ? 'legacy|' : ''}${bans.join('\\u0000')}`\n    : ''\n  const cached = cacheKey ? CUSTOM_BAN_POOL_CACHE.get(cacheKey) : POOL_CACHE.get(tier)\n  if (cached) return cached",
)
replace(
    'src/engine/depths.ts',
    "  const banned = bans.length ? new Set(bans) : null\n  const entries = PREPARED\n    .filter((entry) => entry.unlockFloor <= maxUnlockFloor && !banned?.has(entry.card.name))",
    "  const banned = bans.length ? new Set(bans) : null\n  const legacyBanned = rebanLegacyDepths ? LEGACY_DEPTHS_BAN_SET : null\n  const entries = PREPARED\n    .filter((entry) => entry.unlockFloor <= maxUnlockFloor && !banned?.has(entry.card.name) && !legacyBanned?.has(entry.card.name))",
)
replace(
    'src/engine/depths.ts',
    "  if (bans.length) CUSTOM_BAN_POOL_CACHE.set(cacheKey, pool)\n  else POOL_CACHE.set(tier, pool)",
    "  if (cacheKey) CUSTOM_BAN_POOL_CACHE.set(cacheKey, pool)\n  else POOL_CACHE.set(tier, pool)",
)
replace(
    'src/engine/depths.ts',
    "export function getDepthsPool(floor: number, bannedCardNames: readonly string[] = []) {\n  const pool = preparedPool(floor, bannedCardNames)",
    "export function getDepthsPool(floor: number, bannedCardNames: readonly string[] = [], rebanLegacyDepths = false) {\n  const pool = preparedPool(floor, bannedCardNames, rebanLegacyDepths)",
)
replace(
    'src/engine/depths.ts',
    "export function generateDepthsTeam(floor: number, seed = floor, bannedCardNames: readonly string[] = []): DepthsEnemy[] {\n  const pool = preparedPool(floor, bannedCardNames)",
    "export function generateDepthsTeam(floor: number, seed = floor, bannedCardNames: readonly string[] = [], rebanLegacyDepths = false): DepthsEnemy[] {\n  const pool = preparedPool(floor, bannedCardNames, rebanLegacyDepths)",
)
replace(
    'src/engine/depths.ts',
    "  hardExclusions: [...HARD_EXCLUSIONS],\n  maxPlayerBans: MAX_DEPTH_BANS,",
    "  hardExclusions: [...HARD_EXCLUSIONS],\n  legacyHardExclusions: [...LEGACY_DEPTHS_BANS],\n  maxPlayerBans: MAX_DEPTH_BANS,",
)


# ---------------- src/engine/simulation.ts ----------------
replace(
    'src/engine/simulation.ts',
    "  /** Optional player-unlocked Depth bans. Default game exclusions remain active separately. */\n  bannedCardNames?: string[]",
    "  /** Optional player-unlocked Depth bans. Default game exclusions remain active separately. */\n  bannedCardNames?: string[]\n  /** Temporarily restore the eight pre-update default Depth bans. Does not consume player ban slots. */\n  rebanLegacyDepths?: boolean",
)
replace(
    'src/engine/simulation.ts',
    "    const enemies = generateDepthsTeam(floor, floorSeed, options.bannedCardNames)",
    "    const enemies = generateDepthsTeam(floor, floorSeed, options.bannedCardNames, options.rebanLegacyDepths)",
)
replace(
    'src/engine/simulation.ts',
    "      bannedCardNames: options.bannedCardNames,\n    })",
    "      bannedCardNames: options.bannedCardNames,\n      rebanLegacyDepths: options.rebanLegacyDepths,\n    })",
)


# ---------------- src/browser-worker.ts ----------------
replace(
    'src/browser-worker.ts',
    "  bannedCardNames?: string[]\n",
    "  bannedCardNames?: string[]\n  rebanLegacyDepths?: boolean\n",
    expected=2,
)
replace(
    'src/browser-worker.ts',
    "    bannedCardNames: request.bannedCardNames,\n  }, onProgress)",
    "    bannedCardNames: request.bannedCardNames,\n    rebanLegacyDepths: request.rebanLegacyDepths,\n  }, onProgress)",
)
replace(
    'src/browser-worker.ts',
    "        bannedCardNames: request.bannedCardNames,\n      } satisfies SingleRunRequest)",
    "        bannedCardNames: request.bannedCardNames,\n        rebanLegacyDepths: request.rebanLegacyDepths,\n      } satisfies SingleRunRequest)",
)


# ---------------- scripts/depths-regression.ts ----------------
replace(
    'scripts/depths-regression.ts',
    "  for (const name of depthsMechanics.hardExclusions) {\n    assert(!getDepthsPool(floor, []).some((entry) => entry.card.name === name), `Default Depth ban ${name} must remain excluded`)\n  }\n}",
    "  for (const name of depthsMechanics.hardExclusions) {\n    assert(!getDepthsPool(floor, []).some((entry) => entry.card.name === name), `Default Depth ban ${name} must remain excluded`)\n  }\n\n  const legacyPool = getDepthsPool(floor, [], true).map((entry) => entry.card.name)\n  for (const name of depthsMechanics.legacyHardExclusions) {\n    assert(!legacyPool.includes(name), `Legacy Depth reban did not remove ${name}`)\n  }\n  assert(getDepthsPool(floor, [], false).some((entry) => depthsMechanics.legacyHardExclusions.includes(entry.card.name as never)), 'Expected at least one legacy-unbanned card in the updated pool')\n}",
)


# ---------------- index.html ----------------
path = Path('index.html')
text = path.read_text()

old = '  <link rel="stylesheet" href="./src/styles.css" />'
new = r'''  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
  <meta http-equiv="Pragma" content="no-cache" />
  <meta http-equiv="Expires" content="0" />
  <link rel="stylesheet" href="./src/styles.css" />
  <script>
  (()=>{
    const check=async()=>{
      try{
        const response=await fetch(`./site-version.json?t=${Date.now()}`,{cache:'no-store'});
        if(!response.ok)return;
        const data=await response.json();
        const version=String(data.version||'').trim();
        if(!version)return;
        const url=new URL(location.href);
        if(url.searchParams.get('v')===version)return;
        try{if('caches' in window){for(const key of await caches.keys())await caches.delete(key)}}catch(_){}
        url.searchParams.set('v',version);
        location.replace(url.toString());
      }catch(_){}
    };
    check();
    setInterval(check,60000);
  })();
  </script>'''
if text.count(old) != 1:
    raise SystemExit('Stylesheet/version anchor missing')
text = text.replace(old, new, 1)

old = ".depth-ban-head b{color:#87d8ca;font-size:9px}"
new = old + ".depth-ban-title{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.reban-toggle{display:inline-flex;align-items:center;gap:5px;color:#8c9aab;font-size:8px;font-weight:650;cursor:pointer;white-space:nowrap}.reban-toggle input{margin:0;accent-color:#87d8ca}.reban-toggle span{color:#8c9aab!important;font-size:8px!important;font-weight:650!important}"
if text.count(old) != 1:
    raise SystemExit('Depth ban CSS anchor missing')
text = text.replace(old, new, 1)

old = "  const root=document.getElementById('root'),tooltip=document.getElementById('cardTooltip');"
new = old + "\n  const SITE_VERSION=new URL(location.href).searchParams.get('v')||'';\n  const versioned=path=>SITE_VERSION?`${path}${path.includes('?')?'&':'?'}v=${encodeURIComponent(SITE_VERSION)}`:path;\n  const styleLink=document.querySelector('link[rel=\"stylesheet\"]');if(styleLink&&SITE_VERSION)styleLink.href=versioned('./src/styles.css');"
if text.count(old) != 1:
    raise SystemExit('Root/version helper anchor missing')
text = text.replace(old, new, 1)

old = "  const DEPTHS_DEFAULT_BANS=new Set(['Vampire Lord']);"
new = old + "\n  const LEGACY_DEPTHS_BANS=new Set(['Samurai','Seraphim','Loki','Fuxi','Parallax','Nán Fāng Zhū Què','Brachiosaurus','Jersey Devil']);"
if text.count(old) != 1:
    raise SystemExit('Legacy UI ban anchor missing')
text = text.replace(old, new, 1)

old = "depthBanQuery:'',bountifulDepths:false,runs:15"
new = "depthBanQuery:'',bountifulDepths:false,rebanLegacyDepths:true,runs:15"
if text.count(old) != 1:
    raise SystemExit('State reban anchor missing')
text = text.replace(old, new, 1)

old = "activeTeam:state.activeTeam,depthBans:state.depthBans,bountifulDepths:state.bountifulDepths,runs:state.runs"
new = "activeTeam:state.activeTeam,depthBans:state.depthBans,bountifulDepths:state.bountifulDepths,rebanLegacyDepths:state.rebanLegacyDepths,runs:state.runs"
if text.count(old) != 1:
    raise SystemExit('Persist reban anchor missing')
text = text.replace(old, new, 1)

old = "state.seed=Number(s.seed)||1000;state.bountifulDepths=Boolean(s.bountifulDepths);state.depthBans=Array.isArray(s.depthBans)?[...new Set(s.depthBans.map(String))].filter(name=>depthBanEligible(cardByName(name))).slice(0,MAX_DEPTH_BANS):[];"
new = "state.seed=Number(s.seed)||1000;state.bountifulDepths=Boolean(s.bountifulDepths);state.rebanLegacyDepths=s.rebanLegacyDepths===undefined?true:Boolean(s.rebanLegacyDepths);state.depthBans=Array.isArray(s.depthBans)?[...new Set(s.depthBans.map(String))].filter(name=>depthBanEligible(cardByName(name))).slice(0,MAX_DEPTH_BANS):[];if(state.rebanLegacyDepths)state.depthBans=state.depthBans.filter(name=>!LEGACY_DEPTHS_BANS.has(name));"
if text.count(old) != 1:
    raise SystemExit('Restore reban anchor missing')
text = text.replace(old, new, 1)

old = "banCandidates=state.cards.filter(depthBanEligible).filter(c=>!state.depthBans.includes(c.name))"
new = "banCandidates=state.cards.filter(depthBanEligible).filter(c=>!state.depthBans.includes(c.name)).filter(c=>!state.rebanLegacyDepths||!LEGACY_DEPTHS_BANS.has(c.name))"
if text.count(old) != 1:
    raise SystemExit('Ban candidate reban anchor missing')
text = text.replace(old, new, 1)

old = '<div class="depth-ban-box"><div class="depth-ban-head"><span>Depth bans</span><div>'
new = '<div class="depth-ban-box"><div class="depth-ban-head"><div class="depth-ban-title"><span>Depth bans</span><label class="reban-toggle"><input type="checkbox" data-reban-banned ${state.rebanLegacyDepths?\'checked\':\'\'}><span>Reban banned cards</span></label></div><div>'
if text.count(old) != 1:
    raise SystemExit('Depth ban checkbox markup anchor missing')
text = text.replace(old, new, 1)

old = '<small>Optional player ban slots. Choose anywhere from 0 to 12. The cards banned by the game by default stay banned separately and do not use these slots.</small>'
new = '<small>Optional player ban slots. Choose anywhere from 0 to 12. Reban banned cards restores the eight pre-update bans without using these slots; Vampire Lord stays banned either way.</small>'
if text.count(old) != 1:
    raise SystemExit('Depth ban description anchor missing')
text = text.replace(old, new, 1)

old = "root.querySelector('[data-bountiful-depths]')?.addEventListener('click',()=>{state.bountifulDepths=!state.bountifulDepths;state.teams.forEach(t=>{t.result=null;t.elapsedMs=0;t.lastError=''});persist();render()});"
new = "root.querySelector('[data-reban-banned]')?.addEventListener('change',e=>{state.rebanLegacyDepths=Boolean(e.target.checked);if(state.rebanLegacyDepths)state.depthBans=state.depthBans.filter(name=>!LEGACY_DEPTHS_BANS.has(name));state.teams.forEach(t=>{t.result=null;t.elapsedMs=0;t.lastError=''});persist();render()});" + old
if text.count(old) != 1:
    raise SystemExit('Reban event anchor missing')
text = text.replace(old, new, 1)

old = "bannedCardNames:[...state.depthBans],bountifulDepths:state.bountifulDepths})"
new = "bannedCardNames:[...state.depthBans],rebanLegacyDepths:state.rebanLegacyDepths,bountifulDepths:state.bountifulDepths})"
if text.count(old) != 1:
    raise SystemExit('Worker request reban anchor missing')
text = text.replace(old, new, 1)

for old, new, label in [
    ("new Worker('./browser/depths-worker.js')", "new Worker(versioned('./browser/depths-worker.js'))", 'Depths worker cache-bust'),
    ("new Worker('./browser/tower-worker.js')", "new Worker(versioned('./browser/tower-worker.js'))", 'Tower worker cache-bust'),
    ("fetch(`./src/data/cards-${i}.json`).then", "fetch(versioned(`./src/data/cards-${i}.json`),{cache:'no-store'}).then", 'card data cache-bust'),
    ("fetch(`./src/data/auras-${i}.json`).then", "fetch(versioned(`./src/data/auras-${i}.json`),{cache:'no-store'}).then", 'aura data cache-bust'),
    ("fetch(`./src/data/abilities-${i}.json`).then", "fetch(versioned(`./src/data/abilities-${i}.json`),{cache:'no-store'}).then", 'ability data cache-bust'),
    ("fetch('./src/data/thumbnails.json',{cache:'no-store'})", "fetch(versioned('./src/data/thumbnails.json'),{cache:'no-store'})", 'thumbnail data cache-bust'),
]:
    if text.count(old) != 1:
        raise SystemExit(f'{label} anchor missing: {text.count(old)}')
    text = text.replace(old, new, 1)

path.write_text(text)

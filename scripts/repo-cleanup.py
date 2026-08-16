from __future__ import annotations

from collections import defaultdict
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'src' / 'data'


def read_json(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def write_json(path: Path, value) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')


def remove(path: str) -> None:
    target = ROOT / path
    if target.exists():
        target.unlink()
        print(f'removed {path}')


def source_references(patterns: list[re.Pattern[str]], excluded: set[str]) -> list[str]:
    hits: list[str] = []
    for path in ROOT.rglob('*'):
        if not path.is_file():
            continue
        rel = path.relative_to(ROOT).as_posix()
        if rel in excluded or rel.startswith('.git/') or rel.startswith('node_modules/'):
            continue
        if path.suffix not in {'.ts', '.tsx', '.js', '.mjs', '.html'}:
            continue
        text = path.read_text(encoding='utf-8', errors='ignore')
        if any(pattern.search(text) for pattern in patterns):
            hits.append(rel)
    return hits


# ---------------------------------------------------------------------------
# 1. Remove obsolete one-shot patch machinery. Keep real CI and thumbnail cache.
# ---------------------------------------------------------------------------
for obsolete in [
    '.github/workflows/add-long-battle-diagnostics.yml',
    '.github/workflows/apply-current-fixes.yml',
    '.github/workflows/fix-log-188.yml',
    '.github/workflows/fix-order-cosmos.yml',
    'scripts/add-long-battle-diagnostics.mjs',
    'scripts/apply-current-fixes.mjs',
    'scripts/apply-current-fixes-v2.mjs',
    'scripts/apply-current-fixes-v3.mjs',
    'scripts/apply-current-fixes-v4.mjs',
    'scripts/fix-log-188.mjs',
    'scripts/fix-order-cosmos.mjs',
    'scripts/fix-rotating-stall.mjs',
    'scripts/optimize-loss-debug.mjs',
]:
    remove(obsolete)


# ---------------------------------------------------------------------------
# 2. Remove dead legacy front-end / engine files only after proving no live refs.
# ---------------------------------------------------------------------------
index_text = (ROOT / 'index.html').read_text(encoding='utf-8')
if 'src/main.tsx' in index_text or '/src/main.tsx' in index_text:
    raise SystemExit('Refusing to remove React entrypoint: index.html still references src/main.tsx')

battle_refs = source_references(
    [
        re.compile(r"from\s+['\"](?:\.\./|\./)*battle['\"]"),
        re.compile(r"from\s+['\"][^'\"]*/engine/battle['\"]"),
        re.compile(r"import\(['\"][^'\"]*/engine/battle['\"]\)"),
    ],
    {'src/engine/battle.ts'},
)
if battle_refs:
    raise SystemExit(f'Refusing to remove legacy battle.ts; live references found: {battle_refs}')

remove('src/App.tsx')
remove('src/main.tsx')
remove('src/engine/battle.ts')
remove('tsconfig.node.json')

# abilities.ts was only part of the removed React scaffold. Keep it if anything else uses it.
abilities_refs = source_references(
    [re.compile(r"(?:from\s+|import\()['\"][^'\"]*data/abilities['\"]")],
    {'src/data/abilities.ts'},
)
if not abilities_refs:
    remove('src/data/abilities.ts')
else:
    print(f'kept src/data/abilities.ts; referenced by {abilities_refs}')


# ---------------------------------------------------------------------------
# 3. Physically eliminate duplicate card data instead of hiding it at runtime.
# ---------------------------------------------------------------------------
card_files = sorted(DATA.glob('cards-*.json'))
card_occurrences: dict[str, list[tuple[Path, dict]]] = defaultdict(list)
for path in card_files:
    for entry in read_json(path):
        card_occurrences[entry['name']].append((path, entry))

duplicates = {name: entries for name, entries in card_occurrences.items() if len(entries) > 1}
if duplicates:
    print('card duplicates before cleanup:', {name: [p.name for p, _ in entries] for name, entries in duplicates.items()})

preferred_file = {'Conqueror': 'cards-2.json'}
for name, entries in duplicates.items():
    serialized = {json.dumps(entry, sort_keys=True, ensure_ascii=False) for _, entry in entries}
    if len(serialized) != 1:
        raise SystemExit(f'Conflicting duplicate card definitions for {name}: {[p.name for p, _ in entries]}')
    keep_name = preferred_file.get(name, entries[0][0].name)
    if keep_name not in {path.name for path, _ in entries}:
        keep_name = entries[0][0].name
    for path, _ in entries:
        if path.name == keep_name:
            continue
        batch = read_json(path)
        updated = [entry for entry in batch if entry.get('name') != name]
        if len(updated) == len(batch):
            raise SystemExit(f'Could not remove duplicate {name} from {path.name}')
        write_json(path, updated)
        print(f'removed duplicate card {name} from {path.name}; kept {keep_name}')

# Validate exact and case-insensitive uniqueness after cleanup.
seen_exact: dict[str, str] = {}
seen_folded: dict[str, str] = {}
for path in card_files:
    for entry in read_json(path):
        name = entry['name']
        folded = name.casefold()
        if name in seen_exact:
            raise SystemExit(f'Duplicate card remains: {name} ({seen_exact[name]}, {path.name})')
        if folded in seen_folded:
            raise SystemExit(f'Case-insensitive duplicate card remains: {name} / {seen_folded[folded]}')
        seen_exact[name] = path.name
        seen_folded[folded] = name

# Revert the temporary runtime dedupe; clean source data + integrity tests are authoritative.
(ROOT / 'src/data/cards.ts').write_text(
    """import batch1 from './cards-1.json'\n"
    "import batch2 from './cards-2.json'\n"
    "import batch3 from './cards-3.json'\n"
    "import batch4 from './cards-4.json'\n"
    "import batch5 from './cards-5.json'\n"
    "import batch6 from './cards-6.json'\n"
    "import batch7 from './cards-7.json'\n"
    "import type { CardDefinition } from '../types'\n\n"
    "export const cards = [\n"
    "  ...batch1,\n"
    "  ...batch2,\n"
    "  ...batch3,\n"
    "  ...batch4,\n"
    "  ...batch5,\n"
    "  ...batch6,\n"
    "  ...batch7,\n"
    "] as CardDefinition[]\n\n"
    "export default cards\n""",
    encoding='utf-8',
)


# ---------------------------------------------------------------------------
# 4. Validate no overlapping aura/ability data. Conflicts should never be hidden.
# ---------------------------------------------------------------------------
def validate_named_batches(pattern: str, kind: str) -> None:
    seen: dict[str, str] = {}
    folded: dict[str, str] = {}
    for path in sorted(DATA.glob(pattern)):
        values = read_json(path)
        if not isinstance(values, list):
            raise SystemExit(f'{path.name} expected a JSON array')
        for entry in values:
            name = entry.get('name')
            if not name:
                raise SystemExit(f'{path.name} has a {kind} without a name')
            if name in seen:
                raise SystemExit(f'Duplicate {kind} {name}: {seen[name]} and {path.name}')
            if name.casefold() in folded:
                raise SystemExit(f'Case-insensitive duplicate {kind}: {name} / {folded[name.casefold()]}')
            seen[name] = path.name
            folded[name.casefold()] = name


def validate_ability_batches() -> None:
    seen: dict[str, tuple[str, str]] = {}
    folded: dict[str, str] = {}
    for path in sorted(DATA.glob('abilities-*.json')):
        values = read_json(path)
        if not isinstance(values, dict):
            raise SystemExit(f'{path.name} expected a JSON object')
        for name, description in values.items():
            if name in seen:
                previous_file, previous_description = seen[name]
                if previous_description != description:
                    raise SystemExit(f'Conflicting ability description for {name}: {previous_file} and {path.name}')
                raise SystemExit(f'Duplicate ability key {name}: {previous_file} and {path.name}')
            if name.casefold() in folded:
                raise SystemExit(f'Case-insensitive duplicate ability: {name} / {folded[name.casefold()]}')
            seen[name] = (path.name, description)
            folded[name.casefold()] = name


validate_named_batches('auras-*.json', 'aura')
validate_ability_batches()


# ---------------------------------------------------------------------------
# 5. Remove harmless duplicate entries in static support sets and assert clean set.
# ---------------------------------------------------------------------------
battle_v2 = ROOT / 'src/engine/battle-v2.ts'
battle_text = battle_v2.read_text(encoding='utf-8')
battle_text = battle_text.replace("  'Moonlight Beam', 'Firepower', 'Chainsaw',\n", "  'Firepower', 'Chainsaw',\n", 1)
battle_v2.write_text(battle_text, encoding='utf-8')

match = re.search(r"const FULLY_SUPPORTED = new Set\(\[(.*?)\]\)\n", battle_text, re.S)
if not match:
    raise SystemExit('Could not inspect FULLY_SUPPORTED')
items = re.findall(r"['\"]([^'\"]+)['\"]", match.group(1))
set_dupes = sorted({name for name in items if items.count(name) > 1})
if set_dupes:
    raise SystemExit(f'Duplicate FULLY_SUPPORTED entries remain: {set_dupes}')


# ---------------------------------------------------------------------------
# 6. Strip unused React tooling and make the package scripts the single CI source.
# ---------------------------------------------------------------------------
package_path = ROOT / 'package.json'
package = read_json(package_path)
package['scripts'] = {
    'dev': 'vite',
    'build': 'tsc --noEmit && vite build',
    'build:workers': 'esbuild src/browser-worker.ts --bundle --platform=browser --format=iife --target=es2020 --minify --outfile=browser/depths-worker.js && esbuild src/tower-worker.ts --bundle --platform=browser --format=iife --target=es2020 --minify --outfile=browser/tower-worker.js',
    'test:data': 'tsx scripts/data-integrity.ts',
    'test:engine': 'tsx scripts/engine-smoke.ts && tsx scripts/stall-regression.ts && tsx scripts/ability-trace-regression.ts && tsx scripts/announcement-balance-regression.ts && tsx scripts/anubis-regression.ts && tsx scripts/combat-corrections-regression.ts && tsx scripts/insatiable-unholy-regression.ts && tsx scripts/order-cosmos-regression.ts && tsx scripts/revive-grinch-regression.ts',
    'test:depths': 'tsx scripts/depths-regression.ts && tsx scripts/depths-rewards-regression.ts && tsx scripts/depths-time-regression.ts && tsx scripts/watchdog-heartbeat-regression.ts',
    'test:player': 'tsx scripts/player-coverage.ts',
    'test:ui': 'node scripts/validate-ui.mjs',
    'check': 'npm run build && npm run test:data && npm run test:engine && npm run test:depths && npm run test:player && npm run test:ui',
    'preview': 'vite preview',
}
package.pop('dependencies', None)
package['devDependencies'] = {
    'esbuild': 'latest',
    'tsx': 'latest',
    'typescript': 'latest',
    'vite': 'latest',
}
package_path.write_text(json.dumps(package, indent=2) + '\n', encoding='utf-8')

(ROOT / 'vite.config.ts').write_text(
    "import { defineConfig } from 'vite'\n\nexport default defineConfig({\n  base: '/CardRngExpansionDepths/',\n})\n",
    encoding='utf-8',
)

tsconfig_path = ROOT / 'tsconfig.json'
tsconfig = read_json(tsconfig_path)
tsconfig.get('compilerOptions', {}).pop('jsx', None)
tsconfig_path.write_text(json.dumps(tsconfig, indent=2) + '\n', encoding='utf-8')


# ---------------------------------------------------------------------------
# 7. Permanent data-integrity and static-UI checks so clutter cannot return silently.
# ---------------------------------------------------------------------------
(ROOT / 'scripts/data-integrity.ts').write_text(r'''import { strict as assert } from 'node:assert'
import cards1 from '../src/data/cards-1.json'
import cards2 from '../src/data/cards-2.json'
import cards3 from '../src/data/cards-3.json'
import cards4 from '../src/data/cards-4.json'
import cards5 from '../src/data/cards-5.json'
import cards6 from '../src/data/cards-6.json'
import cards7 from '../src/data/cards-7.json'
import auras1 from '../src/data/auras-1.json'
import auras2 from '../src/data/auras-2.json'
import abilities1 from '../src/data/abilities-1.json'
import abilities2 from '../src/data/abilities-2.json'
import abilities3 from '../src/data/abilities-3.json'
import abilities4 from '../src/data/abilities-4.json'

const cardBatches = [cards1, cards2, cards3, cards4, cards5, cards6, cards7]
const auraBatches = [auras1, auras2]
const abilityBatches = [abilities1, abilities2, abilities3, abilities4]

function assertUniqueNames(items: Array<{ name: string }>, label: string) {
  const exact = new Set<string>()
  const folded = new Map<string, string>()
  for (const item of items) {
    assert(item.name && item.name.trim(), `${label} has an empty name`)
    assert(!exact.has(item.name), `Duplicate ${label} name: ${item.name}`)
    const key = item.name.toLocaleLowerCase('en-US')
    assert(!folded.has(key), `Case-insensitive duplicate ${label}: ${item.name} / ${folded.get(key)}`)
    exact.add(item.name)
    folded.set(key, item.name)
  }
}

const cards = cardBatches.flat()
assertUniqueNames(cards, 'card')
assert.equal(cards.filter((card) => card.name === 'Conqueror').length, 1, 'Conqueror must exist exactly once')
for (const card of cards) {
  assert(Number.isFinite(card.rarity) && card.rarity > 0, `${card.name} has invalid rarity`)
  assert(Number.isFinite(card.statMultiplier) && card.statMultiplier > 0, `${card.name} has invalid statMultiplier`)
  assert(Number.isFinite(card.hpMultiplier) && card.hpMultiplier > 0, `${card.name} has invalid hpMultiplier`)
}

const auras = auraBatches.flat()
assertUniqueNames(auras, 'aura')

const abilityNames = new Set<string>()
const abilityFolded = new Map<string, string>()
for (const batch of abilityBatches) {
  for (const name of Object.keys(batch)) {
    assert(!abilityNames.has(name), `Duplicate ability description key: ${name}`)
    const key = name.toLocaleLowerCase('en-US')
    assert(!abilityFolded.has(key), `Case-insensitive duplicate ability: ${name} / ${abilityFolded.get(key)}`)
    abilityNames.add(name)
    abilityFolded.set(key, name)
  }
}

const missingDescriptions = [...new Set(cards.map((card) => card.ability).filter((name): name is string => Boolean(name) && !abilityNames.has(name)))]
assert.deepEqual(missingDescriptions, [], `Cards reference abilities with no description: ${missingDescriptions.join(', ')}`)

console.log(`Data integrity passed: ${cards.length} unique cards, ${auras.length} unique auras, ${abilityNames.size} unique ability descriptions.`)
''', encoding='utf-8')

(ROOT / 'scripts/validate-ui.mjs').write_text(r'''import fs from 'node:fs'

const html = fs.readFileSync('index.html', 'utf8')
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1])
if (!scripts.length) throw new Error('No inline live-page script found')
for (const script of scripts) new Function(script)

const requiredUiHooks = [
  "new Worker('./browser/depths-worker.js')",
  "new Worker('./browser/tower-worker.js')",
  'CRE1-',
  'Most common losing-floor enemies',
  'crypto.getRandomValues',
]
for (const hook of requiredUiHooks) {
  if (!html.includes(hook)) throw new Error(`Missing live-page hook: ${hook}`)
}
for (const removedHook of ['data-library-mode="bans"', 'data-library-mode="pool"', 'id="seedInput"', 'src/main.tsx']) {
  if (html.includes(removedHook)) throw new Error(`Removed/dead UI hook returned: ${removedHook}`)
}

const workerSource = fs.readFileSync('src/browser-worker.ts', 'utf8')
for (const removedField of ['excludedCardNames', 'selectedCardNames']) {
  if (workerSource.includes(removedField)) throw new Error(`Removed calculator-only field returned: ${removedField}`)
}

const battle = fs.readFileSync('src/engine/battle-v2.ts', 'utf8')
for (const required of [
  'let turnsWithoutDeaths = 0',
  'runtime.deathEpoch !== lastDeathEpoch',
  'runtime.deathEpoch += 1',
  'turnsWithoutDeaths >= 150',
  'beyondGraveRevived',
]) {
  if (!battle.includes(required)) throw new Error(`Battle safety hook missing: ${required}`)
}
if (battle.includes('pairTurns[')) throw new Error('Incorrect per-attacker timeout counter returned')

const styles = fs.readFileSync('src/styles.css', 'utf8')
if (styles.includes('.aura-exact b{display:none!important}')) throw new Error('Resolved aura values are hidden')

console.log(`Static UI validation passed (${scripts.length} inline script).`)
''', encoding='utf-8')


# ---------------------------------------------------------------------------
# 8. Simplify CI: one check command, deterministic install, both worker bundles.
# ---------------------------------------------------------------------------
(ROOT / '.github/workflows/engine-check.yml').write_text(r'''name: Engine Check

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run check
      - name: Build browser workers
        run: npm run build:workers
      - name: Verify worker bundles on pull requests
        if: github.event_name == 'pull_request'
        run: git diff --exit-code -- browser/depths-worker.js browser/tower-worker.js
      - name: Commit worker bundles on main
        if: github.event_name == 'push'
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add browser/depths-worker.js browser/tower-worker.js
          if git diff --cached --quiet; then
            echo "Browser bundles unchanged."
            exit 0
          fi
          git commit -m "Build browser worker bundles"
          git push
''', encoding='utf-8')

print('Repository cleanup edits prepared successfully.')

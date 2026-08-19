from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f'missing patch target: {label}')
    return text.replace(old, new, 1)

# Make thumbnail discovery future-proof so new cards-N.json files are always included.
thumb_path = Path('scripts/resolve-thumbnails.mjs')
thumb = thumb_path.read_text()
thumb = replace_once(
    thumb,
    "const cardFiles = [1,2,3,4,5,6].map(i => `src/data/cards-${i}.json`)\nconst auraFiles = [1,2].map(i => `src/data/auras-${i}.json`)\n",
    "const dataFiles = await fs.readdir('src/data')\nconst numberedDataFiles = prefix => dataFiles\n  .filter(file => new RegExp(`^${prefix}-\\\\d+\\\\.json$`).test(file))\n  .sort((a, b) => Number(a.match(/(\\\\d+)/)?.[1] || 0) - Number(b.match(/(\\\\d+)/)?.[1] || 0))\n  .map(file => `src/data/${file}`)\nconst cardFiles = numberedDataFiles('cards')\nconst auraFiles = numberedDataFiles('auras')\n",
    'thumbnail file list',
)
thumb_path.write_text(thumb)

# Fate Seamstress is a single-copy Tower cheese card, just like Parallax.
tower_path = Path('src/engine/tower.ts')
tower = tower_path.read_text()
tower = replace_once(
    tower,
    "const CARD_BY_NAME = new Map(cards.map((card) => [card.name, card] as const))\n",
    "const CARD_BY_NAME = new Map(cards.map((card) => [card.name, card] as const))\nconst SINGLE_COPY_CHEESE_CARDS = new Set(['Parallax', 'Fate Seamstress'])\n",
    'single-copy set',
)
tower = replace_once(
    tower,
    "export function isTowerCheeseCandidateLegal(names: readonly string[]): boolean {\n  return names.filter((name) => name === 'Parallax').length <= 1\n}\n",
    "export function isTowerCheeseCandidateLegal(names: readonly string[]): boolean {\n  return [...SINGLE_COPY_CHEESE_CARDS].every((restricted) => names.filter((name) => name === restricted).length <= 1)\n}\n",
    'Tower legal candidate check',
)
tower = replace_once(
    tower,
    "      if (name === 'Parallax' && current.includes('Parallax')) continue\n",
    "      if (SINGLE_COPY_CHEESE_CARDS.has(name) && current.includes(name)) continue\n",
    'intensive ordered-team duplicate guard',
)
tower_path.write_text(tower)

# Regression coverage for the new one-copy rule.
test_path = Path('scripts/tower-cheese-search-regression.ts')
test = test_path.read_text()
test = replace_once(
    test,
    "assert.equal(isTowerCheeseCandidateLegal(['Parallax', 'Parallax', 'Judgment Day', 'Pandora']), false)\n",
    "assert.equal(isTowerCheeseCandidateLegal(['Parallax', 'Parallax', 'Judgment Day', 'Pandora']), false)\nassert.equal(isTowerCheeseCandidateLegal(['Fate Seamstress', 'Judgment Day', 'Fate Seamstress', 'Pandora']), false)\nassert.equal(isTowerCheeseCandidateLegal(['Fate Seamstress', 'Judgment Day', 'Parallax', 'Pandora']), true)\n",
    'Fate Seamstress regression',
)
test_path.write_text(test)

print('Applied thumbnail discovery + single-copy Fate Seamstress fix.')

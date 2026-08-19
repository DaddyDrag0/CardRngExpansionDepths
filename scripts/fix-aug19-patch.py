from pathlib import Path
p = Path('scripts/apply-aug19-intensive-update.py')
t = p.read_text()
old = "t = replace_once(t, '  searchTowerCheese,\\n  simulateTowerBatch,', '  searchTowerCheese,\\n  searchTowerCheeseIntensive,\\n  simulateTowerBatch,', 'tower worker intensive import')"
new = "t = replace_once(t, \"import { searchTowerCheese, simulateTowerBatch, type TowerDifficulty } from './engine/tower'\", \"import { searchTowerCheese, searchTowerCheeseIntensive, simulateTowerBatch, type TowerDifficulty } from './engine/tower'\", 'tower worker intensive import')"
if old not in t: raise SystemExit('worker import patch line not found')
t = t.replace(old, new, 1)
old = "t = replace_once(t, '  seed: number\\n}', '  seed: number\\n  intensive?: boolean\\n}', 'tower worker request intensive flag')"
new = "t = replace_once(t, \"interface TowerCheeseSearchRequest {\\n  id: number\\n  kind: 'tower-cheese-search'\\n  enemyNames: string[]\\n  floor: number\\n  difficulty: TowerDifficulty\\n  seed: number\\n}\", \"interface TowerCheeseSearchRequest {\\n  id: number\\n  kind: 'tower-cheese-search'\\n  enemyNames: string[]\\n  floor: number\\n  difficulty: TowerDifficulty\\n  seed: number\\n  intensive?: boolean\\n}\", 'tower worker request intensive flag')"
if old not in t: raise SystemExit('worker request patch line not found')
t = t.replace(old, new, 1)
old = "t = replace_once(t, '      const result = searchTowerCheese(request.enemyNames, request.floor, request.difficulty, request.seed, (progress) => {', '      const search = request.intensive ? searchTowerCheeseIntensive : searchTowerCheese\\n      const result = search(request.enemyNames, request.floor, request.difficulty, request.seed, (progress) => {', 'tower worker search dispatch')"
new = "t = replace_once(t, '      const result = searchTowerCheese(\\n', '      const search = request.intensive ? searchTowerCheeseIntensive : searchTowerCheese\\n      const result = search(\\n', 'tower worker search dispatch')"
if old not in t: raise SystemExit('worker dispatch patch line not found')
t = t.replace(old, new, 1)
p.write_text(t)
print('Patch anchors fixed.')

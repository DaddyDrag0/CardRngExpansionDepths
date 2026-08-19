from pathlib import Path

p = Path('src/tower-worker.ts')
t = p.read_text()

old = "import { searchTowerCheese, searchTowerCheeseIntensive, simulateTowerBatch, type TowerDifficulty } from './engine/tower'"
new = "import { searchTowerCheese, searchTowerCheeseIntensive, simulateTowerBatch, type TowerCheeseSearchProgress, type TowerDifficulty } from './engine/tower'"
if t.count(old) != 1:
    raise SystemExit(f'worker import anchor found {t.count(old)} times')
t = t.replace(old, new, 1)

old = "const progress = (update: Parameters<typeof searchTowerCheese>[4] extends (...args: infer P) => unknown ? P[0] : never) =>"
new = "const progress = (update: TowerCheeseSearchProgress) =>"
if t.count(old) != 1:
    raise SystemExit(f'worker progress type anchor found {t.count(old)} times')
t = t.replace(old, new, 1)

p.write_text(t)
print('Tower worker progress typing fixed.')

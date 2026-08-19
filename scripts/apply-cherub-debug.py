from pathlib import Path
p=Path('scripts/depths-regression.ts')
t=p.read_text()
old="assert(Math.abs((enemyHealth - enemy.hp) - damage * 1.5) <= Math.max(1e-6, damage * 1e-9), 'Cherub should deal 1.5x damage')"
new="assert(Math.abs((enemyHealth - enemy.hp) - damage * 1.5) <= Math.max(1e-6, damage * 1e-9), `Cherub should deal 1.5x damage; base=${damage}, dealt=${enemyHealth-enemy.hp}, expected=${damage*1.5}`)"
if t.count(old)!=1: raise SystemExit(f'Cherub assert anchor found {t.count(old)} times')
p.write_text(t.replace(old,new,1))

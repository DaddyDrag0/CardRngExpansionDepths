from pathlib import Path

p=Path('scripts/stall-regression.ts')
t=p.read_text()
old="JSON.stringify(['Anubis', 'Darling', 'Anubis', 'ToadBoiGaming'])"
new="JSON.stringify(['Anubis', 'Darling', 'Anubis', 'Titan'])"
if t.count(old)!=1: raise SystemExit(f'stall lineup anchor found {t.count(old)} times')
p.write_text(t.replace(old,new,1))

p=Path('scripts/insatiable-unholy-regression.ts')
t=p.read_text()
old="assert(names.join('|') === 'Dancer|Wendigo|Sorcerer|Michael', 'Reported enemy lineup changed: ' + names.join(' | '))"
new="assert(names.join('|') === 'Darling|Volcano Spirit|Soft Paw|Michael', 'Reported enemy lineup changed: ' + names.join(' | '))"
if t.count(old)!=1: raise SystemExit(f'insatiable lineup anchor found {t.count(old)} times')
p.write_text(t.replace(old,new,1))

p=Path('scripts/depths-regression.ts')
t=p.read_text()
old="assert(Math.abs((enemyHealth - enemy.hp) - damage * 1.5) <= Math.max(1e-6, damage * 1e-9), 'Cherub should deal 1.5x damage')"
new="assert(Math.abs((enemyHealth - enemy.hp) - Math.ceil(damage * 1.5)) <= 1e-6, 'Cherub should deal 1.5x damage')"
if t.count(old)!=1: raise SystemExit(f'Cherub outgoing regression anchor found {t.count(old)} times')
t=t.replace(old,new,1)
old="assert(Math.abs((hp - holder.hp) - enemyAttack * 1.5) <= Math.max(1e-6, enemyAttack * 1e-9), 'Cherub should take 1.5x damage')"
new="assert(Math.abs((hp - holder.hp) - Math.ceil(enemyAttack * 1.5)) <= 1e-6, 'Cherub should take 1.5x damage')"
if t.count(old)!=1: raise SystemExit(f'Cherub incoming regression anchor found {t.count(old)} times')
p.write_text(t.replace(old,new,1))

print('Depth regressions updated for the new enemy pool and Cherub rounding.')

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

print('Depth lineup regressions updated for the new enemy pool.')

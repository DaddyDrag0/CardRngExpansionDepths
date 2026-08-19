from pathlib import Path
p=Path('scripts/stall-regression.ts')
t=p.read_text()
old="JSON.stringify(['Anubis', 'Darling', 'Anubis', 'ToadBoiGaming'])"
new="JSON.stringify(['Anubis', 'Darling', 'Anubis', 'Titan'])"
if t.count(old)!=1: raise SystemExit(f'stall lineup anchor found {t.count(old)} times')
p.write_text(t.replace(old,new,1))
print('Stall regression updated for the new Depth pool.')

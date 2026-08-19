from pathlib import Path
p=Path('src/engine/support.ts')
t=p.read_text()
old="  'Limitless', \"Monkey King's Rage\",\n"
new="  'Limitless', \"Monkey King's Rage\",\n  'Flames of Rebirth', 'God of Trickery', 'Long Reach', 'Order of the Cosmos', 'Sacred Judgment',\n"
if t.count(old)!=1: raise SystemExit(f'support insertion anchor found {t.count(old)} times')
p.write_text(t.replace(old,new,1))
print('Newly unbanned ability coverage enabled.')

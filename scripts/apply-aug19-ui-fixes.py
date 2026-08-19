from pathlib import Path
p=Path('index.html')
t=p.read_text()
old="persist();render()});root.querySelector('[data-bountiful-depths]')"
new="root.querySelector('[data-bountiful-depths]')"
if t.count(old)!=1: raise SystemExit(f'reban event tail anchor found {t.count(old)} times')
t=t.replace(old,new,1)
if 'data-reban-banned' in t: raise SystemExit('Legacy reban checkbox hook still exists after update')
p.write_text(t)
print('Removed the legacy reban event tail cleanly.')

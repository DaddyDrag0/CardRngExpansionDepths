from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old="'Perish','Mind Rift','Snowscape'"
new="'Perish','Snowscape'"
if old not in s:
    raise SystemExit('Mind Rift blocker anchor missing')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('Removed Mind Rift from hard Parallax blockers.')

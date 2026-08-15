from pathlib import Path
p=Path('scripts/improve_debug_logs.py')
s=p.read_text(encoding='utf-8')
old="h = debug_pattern.sub(new_debug, h, count=1)"
new="h = debug_pattern.sub(lambda _match: new_debug, h, count=1)"
if old not in s:
    raise SystemExit('debug replacement line not found')
p.write_text(s.replace(old,new,1),encoding='utf-8')
print('Patched debug updater to preserve literal backslashes.')

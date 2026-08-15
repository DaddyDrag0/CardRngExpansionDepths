from pathlib import Path
path=Path('index.html')
html=path.read_text(encoding='utf-8')
old="randomize enemy'?s ability|remove their ability on entry|cannot be killed by abilities"
new="randomize enemy'?s ability|cannot be killed by abilities"
if old not in html:
    raise SystemExit('Hell\'s Curse text-rule anchor not found')
html=html.replace(old,new,1)
path.write_text(html,encoding='utf-8')
print("Hell's Curse no longer forces End Times.")

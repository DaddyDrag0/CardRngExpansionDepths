from pathlib import Path

path=Path('index.html')
html=path.read_text(encoding='utf-8')
old="const specialCounter=enemies.map(enemy=>enemy?.ability==='Jealousy'?'Robin Hood':'');"
new="const specialCounter=enemies.map(enemy=>enemy?.name==='Inari'?'Noveau Riche':enemy?.ability==='Jealousy'?'Robin Hood':'');"
if old not in html:
    raise SystemExit('specialCounter anchor not found')
html=html.replace(old,new,1)
old_reason="if(specialCounter[index]){pick=specialCounter[index];reason='Jealousy redirects enemy abilities, so use Robin Hood here instead of feeding Sable a JD/Parallax ability.'}"
new_reason="if(specialCounter[index]){pick=specialCounter[index];reason=enemy.name==='Inari'?\"Noveau Riche hard-counters Final Tail, so save Parallax for another enemy.\":'Jealousy redirects enemy abilities, so use Robin Hood here instead of feeding Sable a JD/Parallax ability.'}"
if old_reason not in html:
    raise SystemExit('special counter reason anchor not found')
html=html.replace(old_reason,new_reason,1)
path.write_text(html,encoding='utf-8')
print('Inari now uses Noveau Riche and frees Parallax.')

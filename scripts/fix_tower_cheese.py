from pathlib import Path

path=Path('index.html')
html=path.read_text(encoding='utf-8')
old=r"'Hell\\'s Curse'"
if old in html:
    html=html.replace(old, '"Hell\'s Curse"')
path.write_text(html, encoding='utf-8')
print('Tower cheese syntax escape fixed.')

from pathlib import Path

path = Path('index.html')
text = path.read_text()
old = '''  const dropPct=v=>{const p=Math.max(0,Number(v)||0)*100;return `${Number(p.toFixed(p>=10?1:2))}%`};
  const dropHtml=drops?`<div class="reward-drop-grid"><div class="reward-drop-card"><span>Jackpot Potion ${drops.bountiful?'<em>· Bountiful</em>':''}</span><b>${one(drops.low.jackpot.expected)}–${one(drops.high.jackpot.expected)} / run</b></div><div class="reward-drop-card"><span>Rare Weather Potion ${drops.bountiful?'<em>· Bountiful</em>':''}</span><b>${dropPct(drops.median.rareWeather.expected)}</b></div></div>`:'';
'''
new = '''  const dropHtml=drops?`<div class="reward-drop-grid"><div class="reward-drop-card"><span>Jackpot Potion ${drops.bountiful?'<em>· Bountiful</em>':''}</span><b>${one(drops.low.jackpot.expected)}–${one(drops.high.jackpot.expected)} / run</b></div><div class="reward-drop-card"><span>Rare Weather Potion ${drops.bountiful?'<em>· Bountiful</em>':''}</span><b>Average of ${one(drops.median.rareWeather.expected)}</b></div></div>`:'';
'''
if old not in text:
    raise SystemExit('Rare Weather reward display block not found')
path.write_text(text.replace(old, new, 1))

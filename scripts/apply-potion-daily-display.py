from pathlib import Path

path = Path('index.html')
text = path.read_text()

old = '''  const drops=r.potionRewards;
  const dropHtml=drops?`<div class="reward-drop-grid"><div class="reward-drop-card"><span>Jackpot Potion ${drops.bountiful?'<em>· Bountiful</em>':''}</span><b>${one(drops.low.jackpot.expected)}–${one(drops.high.jackpot.expected)} / run</b></div><div class="reward-drop-card"><span>Rare Weather Potion ${drops.bountiful?'<em>· Bountiful</em>':''}</span><b>Average of ${one(drops.median.rareWeather.expected)}</b></div></div>`:'';
'''

new = '''  const drops=r.potionRewards;
  const runsPerDayLow=r.estimatedSecondsHigh>0?86400/r.estimatedSecondsHigh:0,runsPerDayMedian=r.estimatedSecondsMedian>0?86400/r.estimatedSecondsMedian:0,runsPerDayHigh=r.estimatedSecondsLow>0?86400/r.estimatedSecondsLow:0;
  const jackpotDayLow=drops?drops.low.jackpot.expected*runsPerDayLow:0,jackpotDayHigh=drops?drops.high.jackpot.expected*runsPerDayHigh:0,rareWeatherDay=drops?drops.median.rareWeather.expected*runsPerDayMedian:0;
  const dropHtml=drops?`<div class="reward-drop-grid"><div class="reward-drop-card"><span>Jackpot Potion ${drops.bountiful?'<em>· Bountiful</em>':''}</span><b>${one(drops.low.jackpot.expected)}–${one(drops.high.jackpot.expected)} / run</b><small>≈${one(jackpotDayLow)}–${one(jackpotDayHigh)} / day</small></div><div class="reward-drop-card"><span>Rare Weather Potion ${drops.bountiful?'<em>· Bountiful</em>':''}</span><b>Average of ${one(drops.median.rareWeather.expected)}</b><small>≈${one(rareWeatherDay)} / day</small></div></div>`:'';
'''

if text.count(old) != 1:
    raise SystemExit(f'Expected exactly one potion display block, found {text.count(old)}')

path.write_text(text.replace(old, new, 1))

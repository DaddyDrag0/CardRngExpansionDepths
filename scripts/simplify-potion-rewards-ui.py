from pathlib import Path

path = Path('index.html')
text = path.read_text()

old_css = ".reward-rate-note{margin-top:7px;border:1px solid #202b3a;background:#0b1119;border-radius:9px;padding:8px 9px;color:#748295;font-size:8px;line-height:1.55}.reward-rate-note b{color:#aebdcb}"
if old_css not in text:
    raise SystemExit('Potion rate note CSS not found')
text = text.replace(old_css, '', 1)

old_note = '<div class="reward-rate-note"><b>Depths potion rates:</b> Jackpot starts at 1 in 400 and reaches 1 in 170 per floor at 5,000+. Rare Weather is about 1 in 2.15 full 1–5,000 runs, then 1 in 3,403 per floor. With Bountiful Depths it is about 1 in 1.84 full runs and 1 in 2,722 per floor after 5,000.</div>'
if old_note not in text:
    raise SystemExit('Potion rate note UI not found')
text = text.replace(old_note, '', 1)

old = """  const dropPct=v=>{const p=Math.max(0,Math.min(1,Number(v)||0))*100;return `${p>=99.95?'99.9+':p>=10?p.toFixed(1):p.toFixed(2)}%`};
  const dropOdds=v=>Number.isFinite(Number(v))?full(Math.round(Number(v))):'∞';
  const dropHtml=drops?`<div class=\"reward-drop-grid\"><div class=\"reward-drop-card\"><span>Jackpot Potion ${drops.bountiful?'<em>· Bountiful</em>':''}</span><b>≈${one(drops.median.jackpot.expected)} / run</b><small>${one(drops.low.jackpot.expected)}–${one(drops.high.jackpot.expected)} expected across the Depth range · median end-floor odds 1 in ${dropOdds(drops.median.jackpot.endFloorOneIn)}</small></div><div class=\"reward-drop-card\"><span>Rare Weather Potion ${drops.bountiful?'<em>· Bountiful</em>':''}</span><b>≈${one(drops.median.rareWeather.expected)} / run</b><small>${dropPct(drops.median.rareWeather.atLeastOne)} chance to get at least one · ≈1 in ${one(drops.median.rareWeather.oneInRuns)} runs · median end-floor odds 1 in ${dropOdds(drops.median.rareWeather.endFloorOneIn)}</small></div></div>`:'';
"""
new = """  const dropPct=v=>{const p=Math.max(0,Math.min(1,Number(v)||0))*100;return `${p>=99.95?'99.9+':p>=10?p.toFixed(1):p.toFixed(2)}%`};
  const dropHtml=drops?`<div class=\"reward-drop-grid\"><div class=\"reward-drop-card\"><span>Jackpot Potion ${drops.bountiful?'<em>· Bountiful</em>':''}</span><b>${one(drops.low.jackpot.expected)}–${one(drops.high.jackpot.expected)} / run</b></div><div class=\"reward-drop-card\"><span>Rare Weather Potion ${drops.bountiful?'<em>· Bountiful</em>':''}</span><b>${dropPct(drops.median.rareWeather.atLeastOne)} chance</b></div></div>`:'';
"""
if old not in text:
    raise SystemExit('Potion reward result block not found')
text = text.replace(old, new, 1)

path.write_text(text)

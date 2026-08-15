from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')

old="towerRuns:1000"
new="towerRuns:10000"
if old not in s:
    raise SystemExit('towerRuns:1000 anchor missing')
s=s.replace(old,new,1)

css='    .tower-reroll-warning{margin-top:10px;border:1px solid #6c5530;background:#17130c;color:#e4c27e;border-radius:9px;padding:9px 11px;font-size:9px;line-height:1.45}.tower-reroll-warning b{color:#f0d59a}\n'
if '.tower-reroll-warning{' not in s:
    s=s.replace('  </style>',css+'  </style>',1)

old_sim="""      const simBody=sim?.error?`<div class=\"tower-sim-error\">${esc(sim.error)}</div>`:sim?`<div class=\"tower-sim-results\"><div><span>Wins</span><b>${full(sim.wins)} / ${full(sim.runs)}</b></div><div><span>Win rate</span><b>${(sim.winRate*100).toFixed(1)}%</b></div><div><span>Losses</span><b>${full(sim.losses)}</b></div><div><span>Avg turns</span><b>${one(sim.averageTurns)}</b></div></div><div class=\"tower-winbar\"><i style=\"width:${Math.max(0,Math.min(100,sim.winRate*100))}%\"></i></div><div class=\"tower-sim-note\">${sim.draws?`${full(sim.draws)} draws · `:''}${sim.elapsedMs<1000?`${Math.round(sim.elapsedMs)} ms`:`${(sim.elapsedMs/1000).toFixed(2)} s`} compute${sim.unsupportedAbilities?.length?` · Unsupported: ${esc(sim.unsupportedAbilities.join(', '))}`:''}</div>`:'';"""
new_sim="""      const rerollWarning=sim&&!fixed&&sim.runs===10000&&sim.wins<50?`<div class=\"tower-reroll-warning\"><b>Very low success rate.</b> You might want to reroll this Tower team.</div>`:'';
      const simBody=sim?.error?`<div class=\"tower-sim-error\">${esc(sim.error)}</div>`:sim?`<div class=\"tower-sim-results\"><div><span>Wins</span><b>${full(sim.wins)} / ${full(sim.runs)}</b></div><div><span>Win rate</span><b>${(sim.winRate*100).toFixed(2)}%</b></div><div><span>Losses</span><b>${full(sim.losses)}</b></div><div><span>Avg turns</span><b>${one(sim.averageTurns)}</b></div></div><div class=\"tower-winbar\"><i style=\"width:${Math.max(0,Math.min(100,sim.winRate*100))}%\"></i></div><div class=\"tower-sim-note\">${sim.draws?`${full(sim.draws)} draws · `:''}${sim.elapsedMs<1000?`${Math.round(sim.elapsedMs)} ms`:`${(sim.elapsedMs/1000).toFixed(2)} s`} compute${sim.unsupportedAbilities?.length?` · Unsupported: ${esc(sim.unsupportedAbilities.join(', '))}`:''}</div>${rerollWarning}`:'';"""
if old_sim not in s:
    raise SystemExit('simBody anchor missing')
s=s.replace(old_sim,new_sim,1)

p.write_text(s,encoding='utf-8')
print('Tower simulations now run 10,000 times with non-fixed reroll warning below 50 wins.')

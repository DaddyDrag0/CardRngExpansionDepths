from pathlib import Path
p=Path('src/engine/battle-v2.ts')
t=p.read_text()
old="""      || hasAbility(runtime, currentTarget, 'Blood Drinker')
      || hasAbility(runtime, currentTarget, 'Stolen Spotlight')
      || hasAbility(runtime, currentTarget, 'Poke the Beast')
"""
new="""      || hasAbility(runtime, currentTarget, 'Blood Drinker')
      || hasAbility(runtime, currentTarget, 'Poke the Beast')
"""
if old not in t: raise SystemExit('counter condition anchor missing')
t=t.replace(old,new,1)
old2="""        : hasAbility(runtime, currentTarget, 'Blood Drinker') ? 'Blood Drinker'
        : hasAbility(runtime, currentTarget, 'Stolen Spotlight') ? 'Stolen Spotlight'
        : hasAbility(runtime, currentTarget, 'Poke the Beast') ? 'Poke the Beast'
"""
new2="""        : hasAbility(runtime, currentTarget, 'Blood Drinker') ? 'Blood Drinker'
        : hasAbility(runtime, currentTarget, 'Poke the Beast') ? 'Poke the Beast'
"""
if old2 not in t: raise SystemExit('counter label anchor missing')
p.write_text(t.replace(old2,new2,1))
print('Removed unconditional Stolen Spotlight counter for diagnostic')

from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old="  const TOWER_PREEMPTIVE_BLOCKERS=new Set(['Northern Winds','Stardust Driver','Quick Strike','First Blood','Azure Dragon Wrath','Deadly Ambush','Fight Dirty','Heart Hunter','Stampede','Behavioral Therapy','Blinding Flash','Perish','Mind Rift','Snowscape','Red-Nosed Reindeer','Pop-Up Impression','Am I Beautiful?','Ice Age']);"
new=old+"\n  const TOWER_EXTRA_TURN_THREATS=new Set(['Haste','The World','Accelerate','First Progenitor','Melancholy']);"
if old not in s: raise SystemExit('preemptive blocker anchor missing')
s=s.replace(old,new,1)
old2="    if(TOWER_PREEMPTIVE_BLOCKERS.has(ability))block=true;"
new2="    if(TOWER_PREEMPTIVE_BLOCKERS.has(ability)||TOWER_EXTRA_TURN_THREATS.has(ability))block=true;"
if old2 not in s: raise SystemExit('blocker rule anchor missing')
s=s.replace(old2,new2,1)
p.write_text(s,encoding='utf-8')
print('Extra-turn Tower threats now consume Parallax/End Times capacity.')

from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')

anchor="  const TOWER_TRUE_PROPHET_BRIDGES=new Set(['Limitless']);"
addition=anchor+"\n  const TOWER_KUCHISAKE_THREATS=new Set(['The Fall']);"
if anchor not in s:
    raise SystemExit('True Prophet anchor missing')
s=s.replace(anchor,addition,1)

old="""    let prophetIndex=-1,prophetFollowupIndex=-1,parallaxIndex=-1;
    for(const i of blockerIndices){
      if(!TOWER_TRUE_PROPHET_BRIDGES.has(enemies[i]?.ability||''))continue;
      if(i>=enemies.length-1)continue;
      const next=i+1;
      const nextIsClean=!specialCounter[next]&&!threats[next].weird&&!threats[next].forceEndTimes&&!threats[next].block;
      const laterExtra=blockerIndices.find(j=>j>i&&TOWER_EXTRA_TURN_THREATS.has(enemies[j]?.ability||'')&&!specialCounter[j]);
      if(nextIsClean&&laterExtra!==undefined){prophetIndex=i;prophetFollowupIndex=next;parallaxIndex=laterExtra;break}
    }

    if(parallaxIndex<0){
      const candidate=blockerIndices.find(i=>i!==prophetIndex&&!threats[i].forceEndTimes);
      if(candidate!==undefined)parallaxIndex=candidate;
    }
    if(parallaxIndex<0){
      parallaxIndex=enemies.findIndex((enemy,i)=>i!==prophetIndex&&i!==prophetFollowupIndex&&!specialCounter[i]&&!threats[i].weird&&!threats[i].forceEndTimes);
    }
"""
new="""    let prophetIndex=-1,prophetFollowupIndex=-1,parallaxIndex=-1,kuchisakeIndex=-1;
    for(const i of blockerIndices){
      if(!TOWER_TRUE_PROPHET_BRIDGES.has(enemies[i]?.ability||''))continue;
      if(i>=enemies.length-1)continue;
      const next=i+1;
      const nextIsClean=!specialCounter[next]&&!threats[next].weird&&!threats[next].forceEndTimes&&!threats[next].block;
      const laterExtra=blockerIndices.find(j=>j>i&&TOWER_EXTRA_TURN_THREATS.has(enemies[j]?.ability||'')&&!specialCounter[j]);
      if(nextIsClean&&laterExtra!==undefined){prophetIndex=i;prophetFollowupIndex=next;parallaxIndex=laterExtra;break}
    }

    // The Fall punishes direct damage by reflecting the damage back onto the attacker. Treat it as a
    // separate trade threat rather than an End Times blocker. One copy gets Parallax. With 2+ copies,
    // Kuchisake-onna handles the first through persistent confusion and Parallax is saved for the last.
    // Only use this pattern when no harder blocker already needs the dedicated Parallax plan.
    const fallIndices=enemies.map((enemy,i)=>TOWER_KUCHISAKE_THREATS.has(enemy?.ability||'')&&!specialCounter[i]&&!threats[i].weird?i:-1).filter(i=>i>=0);
    if(parallaxIndex<0&&prophetIndex<0&&blockerIndices.length===0&&fallIndices.length){
      if(fallIndices.length>=2)kuchisakeIndex=fallIndices[0];
      parallaxIndex=fallIndices[fallIndices.length-1];
    }

    if(parallaxIndex<0){
      const candidate=blockerIndices.find(i=>i!==prophetIndex&&!threats[i].forceEndTimes);
      if(candidate!==undefined)parallaxIndex=candidate;
    }
    if(parallaxIndex<0){
      parallaxIndex=enemies.findIndex((enemy,i)=>i!==prophetIndex&&i!==prophetFollowupIndex&&i!==kuchisakeIndex&&!specialCounter[i]&&!threats[i].weird&&!threats[i].forceEndTimes);
    }
"""
if old not in s:
    raise SystemExit('planning anchor missing')
s=s.replace(old,new,1)

old_pick="""      if(specialCounter[index]){pick=specialCounter[index];reason=enemy.name==='Inari'?\"Noveau Riche hard-counters Final Tail, so save Parallax for another enemy.\":'Jealousy redirects enemy abilities, so use Robin Hood here instead of feeding Sable a JD/Parallax ability.'}
      else if(index===prophetIndex){pick='True Prophet';reason=`${enemy.ability||'This ability'} has a one-time first-hit defense. True Prophet burns it and gives the next JD Destiny Sight, saving Parallax for the later extra-turn threat.`}
"""
new_pick="""      if(specialCounter[index]){pick=specialCounter[index];reason=enemy.name==='Inari'?\"Noveau Riche hard-counters Final Tail, so save Parallax for another enemy.\":'Jealousy redirects enemy abilities, so use Robin Hood here instead of feeding Sable a JD/Parallax ability.'}
      else if(index===kuchisakeIndex){pick='Kuchisake-onna';reason=`${enemy.ability||'The Fall'} punishes direct damage. Kuchisake-onna uses persistent confusion so this high-stat enemy can damage itself, preserving Parallax for the last matching threat.`}
      else if(index===prophetIndex){pick='True Prophet';reason=`${enemy.ability||'This ability'} has a one-time first-hit defense. True Prophet burns it and gives the next JD Destiny Sight, saving Parallax for the later extra-turn threat.`}
"""
if old_pick not in s:
    raise SystemExit('pick anchor missing')
s=s.replace(old_pick,new_pick,1)

old_para="""      else if(index===parallaxIndex){pick='Parallax';reason=TOWER_EXTRA_TURN_THREATS.has(enemy.ability||'')?`${enemy.ability||'Extra turns'} can chain through your next card after a kill. Save Parallax here so Paradox kills this enemy when it kills Parallax.`:(threat.block?`${enemy.ability||'This ability'} can stop a direct kill, so reserve Parallax's one Paradox use for this card.`:'No blocker needs Parallax later, so use its one Paradox trade here instead of spending another JD.')}
"""
new_para="""      else if(index===parallaxIndex){pick='Parallax';reason=TOWER_KUCHISAKE_THREATS.has(enemy.ability||'')?`${enemy.ability||'The Fall'} punishes attackers for dealing damage. Save Parallax here so this enemy killing Parallax triggers Paradox instead.`:(TOWER_EXTRA_TURN_THREATS.has(enemy.ability||'')?`${enemy.ability||'Extra turns'} can chain through your next card after a kill. Save Parallax here so Paradox kills this enemy when it kills Parallax.`:(threat.block?`${enemy.ability||'This ability'} can stop a direct kill, so reserve Parallax's one Paradox use for this card.`:'No blocker needs Parallax later, so use its one Paradox trade here instead of spending another JD.'))}
"""
if old_para not in s:
    raise SystemExit('Parallax reason anchor missing')
s=s.replace(old_para,new_para,1)

s=s.replace('return {picks,endTimesNeeded,blockers,prophetIndex,parallaxIndex};','return {picks,endTimesNeeded,blockers,prophetIndex,parallaxIndex,kuchisakeIndex};',1)

p.write_text(s,encoding='utf-8')
print('Added generalized Kuchisake/Parallax rule for The Fall.')

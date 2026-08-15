from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')

anchor="  const TOWER_KUCHISAKE_THREATS=new Set(['The Fall']);"
if anchor not in s:
    raise SystemExit('kuchisake anchor missing')
if 'TOWER_OVERFLOW_THREATS' not in s:
    s=s.replace(anchor,anchor+"\n  const TOWER_OVERFLOW_THREATS=new Set(['Horned Attack']);",1)

old="if(TOWER_PREEMPTIVE_BLOCKERS.has(ability)||TOWER_EXTRA_TURN_THREATS.has(ability))block=true;"
new="if(TOWER_PREEMPTIVE_BLOCKERS.has(ability)||TOWER_EXTRA_TURN_THREATS.has(ability)||TOWER_OVERFLOW_THREATS.has(ability))block=true;"
if old not in s:
    raise SystemExit('threat classifier anchor missing')
s=s.replace(old,new,1)

old_decl="let prophetIndex=-1,prophetFollowupIndex=-1,parallaxIndex=-1,kuchisakeIndex=-1;"
new_decl="let prophetIndex=-1,prophetFollowupIndex=-1,parallaxIndex=-1,kuchisakeIndex=-1,overflowBufferIndex=-1;"
if old_decl not in s:
    raise SystemExit('planning declaration missing')
s=s.replace(old_decl,new_decl,1)

fall_block="""    if(parallaxIndex<0&&prophetIndex<0&&blockerIndices.length===0&&fallIndices.length){
      if(fallIndices.length>=2)kuchisakeIndex=fallIndices[0];
      parallaxIndex=fallIndices[fallIndices.length-1];
    }

    if(parallaxIndex<0){
"""
overflow_block="""    if(parallaxIndex<0&&prophetIndex<0&&blockerIndices.length===0&&fallIndices.length){
      if(fallIndices.length>=2)kuchisakeIndex=fallIndices[0];
      parallaxIndex=fallIndices[fallIndices.length-1];
    }

    // Horned Attack is different from a normal entry hit: lethal excess damage carries directly into
    // the next card and can kill a Parallax sitting behind a JD without giving Paradox a chance.
    // When possible, use a second Parallax immediately before the Parallax assigned to Horned Attack.
    // Tests with Triceratops in slots 2, 3, and 4 roughly doubled the win rate versus a single Para.
    const overflowIndices=blockerIndices.filter(i=>TOWER_OVERFLOW_THREATS.has(enemies[i]?.ability||''));
    if(parallaxIndex<0&&prophetIndex<0&&overflowIndices.length){
      const overflowIndex=overflowIndices[0];
      parallaxIndex=overflowIndex;
      const buffer=overflowIndex-1;
      if(buffer>=0&&!specialCounter[buffer]&&!threats[buffer].weird&&!threats[buffer].forceEndTimes&&buffer!==prophetIndex&&buffer!==prophetFollowupIndex&&buffer!==kuchisakeIndex){
        overflowBufferIndex=buffer;
      }
    }

    if(parallaxIndex<0){
"""
if fall_block not in s:
    raise SystemExit('fall planning block missing')
s=s.replace(fall_block,overflow_block,1)

old_find="parallaxIndex=enemies.findIndex((enemy,i)=>i!==prophetIndex&&i!==prophetFollowupIndex&&i!==kuchisakeIndex&&!specialCounter[i]&&!threats[i].weird&&!threats[i].forceEndTimes);"
new_find="parallaxIndex=enemies.findIndex((enemy,i)=>i!==prophetIndex&&i!==prophetFollowupIndex&&i!==kuchisakeIndex&&i!==overflowBufferIndex&&!specialCounter[i]&&!threats[i].weird&&!threats[i].forceEndTimes);"
if old_find not in s:
    raise SystemExit('fallback find anchor missing')
s=s.replace(old_find,new_find,1)

old_pick="""      if(specialCounter[index]){pick=specialCounter[index];reason=enemy.name==='Inari'?\"Noveau Riche hard-counters Final Tail, so save Parallax for another enemy.\":'Jealousy redirects enemy abilities, so use Robin Hood here instead of feeding Sable a JD/Parallax ability.'}
      else if(index===kuchisakeIndex){pick='Kuchisake-onna';reason=`${enemy.ability||'The Fall'} punishes direct damage. Kuchisake-onna uses persistent confusion so this high-stat enemy can damage itself, preserving Parallax for the last matching threat.`}
"""
new_pick="""      if(specialCounter[index]){pick=specialCounter[index];reason=enemy.name==='Inari'?\"Noveau Riche hard-counters Final Tail, so save Parallax for another enemy.\":'Jealousy redirects enemy abilities, so use Robin Hood here instead of feeding Sable a JD/Parallax ability.'}
      else if(index===overflowBufferIndex){pick='Parallax';reason='Buffer Parallax: Horned Attack can carry lethal excess damage through the current card into the next slot. A second Parallax here makes it much less likely the fresh Parallax behind it is deleted by overflow.'}
      else if(index===kuchisakeIndex){pick='Kuchisake-onna';reason=`${enemy.ability||'The Fall'} punishes direct damage. Kuchisake-onna uses persistent confusion so this high-stat enemy can damage itself, preserving Parallax for the last matching threat.`}
"""
if old_pick not in s:
    raise SystemExit('pick ordering anchor missing')
s=s.replace(old_pick,new_pick,1)

old_para="""      else if(index===parallaxIndex){pick='Parallax';reason=TOWER_KUCHISAKE_THREATS.has(enemy.ability||'')?`${enemy.ability||'The Fall'} punishes attackers for dealing damage. Save Parallax here so this enemy killing Parallax triggers Paradox instead.`:(TOWER_EXTRA_TURN_THREATS.has(enemy.ability||'')?`${enemy.ability||'Extra turns'} can chain through your next card after a kill. Save Parallax here so Paradox kills this enemy when it kills Parallax.`:(threat.block?`${enemy.ability||'This ability'} can stop a direct kill, so reserve Parallax's one Paradox use for this card.`:'No blocker needs Parallax later, so use its one Paradox trade here instead of spending another JD.'))}
"""
new_para="""      else if(index===parallaxIndex){pick='Parallax';reason=TOWER_OVERFLOW_THREATS.has(enemy.ability||'')?(overflowBufferIndex===index-1?`${enemy.ability||'Horned Attack'} carries excess lethal damage into the next card. Use the previous Parallax as a buffer so this fresh Parallax is not sitting directly behind a JD when Triceratops enters.`:`${enemy.ability||'Horned Attack'} can overkill the current card and pierce directly into Parallax without triggering Paradox. No free buffer slot was available, so this is an unsafe Parallax setup; simulate it before using it.`):(TOWER_KUCHISAKE_THREATS.has(enemy.ability||'')?`${enemy.ability||'The Fall'} punishes attackers for dealing damage. Save Parallax here so this enemy killing Parallax triggers Paradox instead.`:(TOWER_EXTRA_TURN_THREATS.has(enemy.ability||'')?`${enemy.ability||'Extra turns'} can chain through your next card after a kill. Save Parallax here so Paradox kills this enemy when it kills Parallax.`:(threat.block?`${enemy.ability||'This ability'} can stop a direct kill, so reserve Parallax's one Paradox use for this card.`:'No blocker needs Parallax later, so use its one Paradox trade here instead of spending another JD.')))}
"""
if old_para not in s:
    raise SystemExit('Parallax reason anchor missing')
s=s.replace(old_para,new_para,1)

old_return='return {picks,endTimesNeeded,blockers,prophetIndex,parallaxIndex,kuchisakeIndex};'
new_return='return {picks,endTimesNeeded,blockers,prophetIndex,parallaxIndex,kuchisakeIndex,overflowBufferIndex};'
if old_return not in s:
    raise SystemExit('return anchor missing')
s=s.replace(old_return,new_return,1)

p.write_text(s,encoding='utf-8')
print('Added Horned Attack overflow-aware double-Parallax rule.')

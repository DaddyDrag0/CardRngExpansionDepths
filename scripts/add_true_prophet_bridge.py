from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')

# Add a narrowly-scoped bridge list. Limitless is the proven interaction: True Prophet burns the one-time evade
# and gives the next JD a lethal dodge, preserving Parallax for a later extra-turn threat.
anchor="  const TOWER_EXTRA_TURN_THREATS=new Set(['Haste','The World','Accelerate','First Progenitor','Melancholy']);"
addition=anchor+"\n  const TOWER_TRUE_PROPHET_BRIDGES=new Set(['Limitless']);"
if anchor not in s:
    raise SystemExit('extra-turn anchor missing')
s=s.replace(anchor,addition,1)

old="""    const blockerIndices=threats.map((t,i)=>t.block&&!specialCounter[i]&&!t.weird?i:-1).filter(i=>i>=0);
    const blockers=blockerIndices.length,forced=threats.some((t,i)=>t.forceEndTimes&&!specialCounter[i]),endTimesNeeded=blockers>=2||forced;
    let parallaxIndex=blockerIndices.find(i=>!threats[i].forceEndTimes);
    if(parallaxIndex===undefined){
      parallaxIndex=enemies.findIndex((enemy,i)=>!specialCounter[i]&&!threats[i].weird&&!threats[i].forceEndTimes);
      if(parallaxIndex<0)parallaxIndex=-1;
    }
    const picks=enemies.map((enemy,index)=>{
      const threat=threats[index];let pick='Judgment Day',reason='Use JD for the one-shot attempt.';
      if(specialCounter[index]){pick=specialCounter[index];reason=enemy.name==='Inari'?\"Noveau Riche hard-counters Final Tail, so save Parallax for another enemy.\":'Jealousy redirects enemy abilities, so use Robin Hood here instead of feeding Sable a JD/Parallax ability.'}
      else if(threat.weird){pick='Pandora';reason=`${enemy.ability||'This ability'} can survive, revive, change, or otherwise extend past a clean one-shot, so use Pandora as the fallback cheese.`}
      else if(index===parallaxIndex){pick='Parallax';reason=threat.block?`${enemy.ability||'This ability'} can stop a direct kill, so reserve Parallax's one Paradox use for this card.`:'No blocker needs Parallax later, so use its one Paradox trade here instead of spending another JD.'}
      else if(threat.block){pick='Judgment Day';reason=endTimesNeeded?`${enemy.ability||'This ability'} can stop the direct kill. Parallax only covers one blocker, so End Times is needed for the remaining blocker(s).`:'This card can interfere with the direct kill.'}
      return {enemy:enemy.name,enemyAbility:enemy.ability||'No ability',pick,reason,threat};
    });
    return {picks,endTimesNeeded,blockers};"""
new="""    const blockerIndices=threats.map((t,i)=>t.block&&!specialCounter[i]&&!t.weird?i:-1).filter(i=>i>=0);
    const blockers=blockerIndices.length;

    // True Prophet bridge: if a single-use first-hit blocker (currently proven for Limitless) appears before
    // a later extra-turn threat, use True Prophet to burn that blocker and pass Destiny Sight to the next JD.
    // This preserves Parallax for the later extra-turn enemy, where Paradox prevents a lethal turn-chain.
    let prophetIndex=-1,prophetFollowupIndex=-1,parallaxIndex=-1;
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

    const unresolvedBlockers=blockerIndices.filter(i=>i!==prophetIndex&&i!==parallaxIndex);
    const forced=threats.some((t,i)=>t.forceEndTimes&&!specialCounter[i]&&i!==prophetIndex&&i!==parallaxIndex);
    const endTimesNeeded=unresolvedBlockers.length>0||forced;

    const picks=enemies.map((enemy,index)=>{
      const threat=threats[index];let pick='Judgment Day',reason='Use JD for the one-shot attempt.';
      if(specialCounter[index]){pick=specialCounter[index];reason=enemy.name==='Inari'?\"Noveau Riche hard-counters Final Tail, so save Parallax for another enemy.\":'Jealousy redirects enemy abilities, so use Robin Hood here instead of feeding Sable a JD/Parallax ability.'}
      else if(index===prophetIndex){pick='True Prophet';reason=`${enemy.ability||'This ability'} has a one-time first-hit defense. True Prophet burns it and gives the next JD Destiny Sight, saving Parallax for the later extra-turn threat.`}
      else if(index===prophetFollowupIndex){pick='Judgment Day';reason='This JD follows True Prophet: the enemy first-hit defense is already spent, and Destiny Sight can dodge one lethal answer to buy another Armageddon attempt.'}
      else if(threat.weird){pick='Pandora';reason=`${enemy.ability||'This ability'} can survive, revive, change, or otherwise extend past a clean one-shot, so use Pandora as the fallback cheese.`}
      else if(index===parallaxIndex){pick='Parallax';reason=TOWER_EXTRA_TURN_THREATS.has(enemy.ability||'')?`${enemy.ability||'Extra turns'} can chain through your next card after a kill. Save Parallax here so Paradox kills this enemy when it kills Parallax.`:(threat.block?`${enemy.ability||'This ability'} can stop a direct kill, so reserve Parallax's one Paradox use for this card.`:'No blocker needs Parallax later, so use its one Paradox trade here instead of spending another JD.')}
      else if(threat.block){pick='Judgment Day';reason=endTimesNeeded?`${enemy.ability||'This ability'} can stop the direct kill. The dedicated counters are already used, so End Times is needed for the remaining blocker(s).`:'This card can interfere with the direct kill.'}
      return {enemy:enemy.name,enemyAbility:enemy.ability||'No ability',pick,reason,threat};
    });
    return {picks,endTimesNeeded,blockers,prophetIndex,parallaxIndex};"""
if old not in s:
    raise SystemExit('makeTowerCheese planning block missing')
s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')
print('Added True Prophet bridge rule for Limitless + later extra-turn threats.')

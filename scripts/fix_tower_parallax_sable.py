from pathlib import Path

path=Path('index.html')
html=path.read_text(encoding='utf-8')

html=html.replace("  const TOWER_FORCE_END_TIMES=new Set(['Honor','Order of the Cosmos','Unbothered','Nothing','God of Trickery','Hell\\'s Curse','Erosion','Sacred Judgment','Horned Attack','Terror From Above','Dance of Discord']);","  const TOWER_FORCE_END_TIMES=new Set(['Honor','Order of the Cosmos','Unbothered','Nothing','God of Trickery','Erosion']);")

old=r'''  function makeTowerCheese(enemyNames){
    const enemies=enemyNames.map(cardByName),threats=enemies.map((card,i)=>towerThreat(card,i,enemies));
    const blockers=threats.filter(t=>t.block).length,forced=threats.some(t=>t.forceEndTimes),endTimesNeeded=blockers>=2||forced;
    let parallaxUsed=false;
    const picks=enemies.map((enemy,index)=>{
      const threat=threats[index];let pick='Judgment Day',reason='No one-shot blocker detected, so use JD for the kill.';
      if(threat.weird){pick='Pandora';reason=`${enemy.ability||'This ability'} can survive, revive, change, or otherwise extend past a clean one-shot, so use Pandora as the fallback cheese.`}
      else if(threat.block&&!threat.forceEndTimes&&!parallaxUsed){pick='Parallax';parallaxUsed=true;reason=`${enemy.ability||'This ability'} can stop the direct kill. Use Parallax here; Paradox only covers one blocker.`}
      else if(threat.block){pick='Judgment Day';reason=endTimesNeeded?`${enemy.ability||'This ability'} can stop the direct kill. Parallax is already reserved for one blocker, so End Times is required for this one.`:'This card can stop the direct kill.'}
      return {enemy:enemy.name,enemyAbility:enemy.ability||'No ability',pick,reason,threat};
    });
    return {picks,endTimesNeeded,blockers};
  }'''

new=r'''  function makeTowerCheese(enemyNames){
    const enemies=enemyNames.map(cardByName),threats=enemies.map((card,i)=>towerThreat(card,i,enemies));
    const specialCounter=enemies.map(enemy=>enemy?.ability==='Jealousy'?'Robin Hood':'');
    const blockerIndices=threats.map((t,i)=>t.block&&!specialCounter[i]&&!t.weird?i:-1).filter(i=>i>=0);
    const blockers=blockerIndices.length,forced=threats.some((t,i)=>t.forceEndTimes&&!specialCounter[i]),endTimesNeeded=blockers>=2||forced;
    let parallaxIndex=blockerIndices.find(i=>!threats[i].forceEndTimes);
    if(parallaxIndex===undefined){
      parallaxIndex=enemies.findIndex((enemy,i)=>!specialCounter[i]&&!threats[i].weird&&!threats[i].forceEndTimes);
      if(parallaxIndex<0)parallaxIndex=-1;
    }
    const picks=enemies.map((enemy,index)=>{
      const threat=threats[index];let pick='Judgment Day',reason='Use JD for the one-shot attempt.';
      if(specialCounter[index]){pick=specialCounter[index];reason='Jealousy redirects enemy abilities, so use Robin Hood here instead of feeding Sable a JD/Parallax ability.'}
      else if(threat.weird){pick='Pandora';reason=`${enemy.ability||'This ability'} can survive, revive, change, or otherwise extend past a clean one-shot, so use Pandora as the fallback cheese.`}
      else if(index===parallaxIndex){pick='Parallax';reason=threat.block?`${enemy.ability||'This ability'} can stop a direct kill, so reserve Parallax's one Paradox use for this card.`:'No blocker needs Parallax later, so use its one Paradox trade here instead of spending another JD.'}
      else if(threat.block){pick='Judgment Day';reason=endTimesNeeded?`${enemy.ability||'This ability'} can stop the direct kill. Parallax only covers one blocker, so End Times is needed for the remaining blocker(s).`:'This card can interfere with the direct kill.'}
      return {enemy:enemy.name,enemyAbility:enemy.ability||'No ability',pick,reason,threat};
    });
    return {picks,endTimesNeeded,blockers};
  }'''

if old not in html:
    raise SystemExit('makeTowerCheese block not found')
html=html.replace(old,new,1)

path.write_text(html,encoding='utf-8')
print('Updated Parallax priority and Sable counter.')

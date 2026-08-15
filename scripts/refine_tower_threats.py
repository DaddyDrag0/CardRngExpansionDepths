from pathlib import Path

path=Path('index.html')
html=path.read_text(encoding='utf-8')

old_force="  const TOWER_FORCE_END_TIMES=new Set(['Honor','Order of the Cosmos','Unbothered','Nothing','God of Trickery','Hell\\'s Curse','Erosion']);"
new_force="  const TOWER_FORCE_END_TIMES=new Set(['Honor','Order of the Cosmos','Unbothered','Nothing','God of Trickery','Hell\\'s Curse','Erosion','Sacred Judgment','Horned Attack','Terror From Above','Dance of Discord']);\n  const TOWER_PREEMPTIVE_BLOCKERS=new Set(['Northern Winds','Stardust Driver','Quick Strike','First Blood','Azure Dragon Wrath','Deadly Ambush','Fight Dirty','Heart Hunter','Stampede','Behavioral Therapy','Blinding Flash','Perish','Mind Rift','Snowscape','Red-Nosed Reindeer','Pop-Up Impression','Am I Beautiful?','Ice Age']);"
if old_force not in html:
    raise SystemExit('force set anchor missing')
html=html.replace(old_force,new_force,1)

old_rules="""    if(ability==='Unlucky'||ability==='Hex'||ability==='Limitless'||ability==='Danger Sense'||ability==='Final Tail'||ability==='The Loser'||ability==='Divine Barrier'||ability==='Transcend Time'||ability==='Invisibility'||ability==='Blinding Flash'||ability==='Stalwart'||ability==='Shelter Obsession'||ability==='Heavenly Ruler'||ability==='Indestructible')block=true;
    if(Number(state.towerFloor)===65&&index===0)block=true;
    if(index>0&&enemies[index-1]?.ability==='Destiny Sight')block=true;
    if(forceEndTimes)block=true;"""
new_rules="""    if(ability==='Unlucky'||ability==='Hex'||ability==='Limitless'||ability==='Danger Sense'||ability==='Final Tail'||ability==='The Loser'||ability==='Divine Barrier'||ability==='Transcend Time'||ability==='Invisibility'||ability==='Blinding Flash'||ability==='Stalwart'||ability==='Shelter Obsession'||ability==='Heavenly Ruler'||ability==='Indestructible')block=true;
    if(TOWER_PREEMPTIVE_BLOCKERS.has(ability))block=true;
    if(Number(state.towerFloor)===65&&index===0)block=true;
    if(index>0&&['Destiny Sight','Eternal Devotion','Final Stand'].includes(enemies[index-1]?.ability))block=true;
    if(index<enemies.length-1&&enemies[index+1]?.ability==='Aura Farm')block=true;
    const luminantIndex=enemies.findIndex(c=>c?.name==='Eclipseborn Luminant');
    if(luminantIndex>=0&&index<=luminantIndex)block=true;
    if(forceEndTimes)block=true;"""
if old_rules not in html:
    raise SystemExit('threat rules anchor missing')
html=html.replace(old_rules,new_rules,1)

path.write_text(html,encoding='utf-8')
print('Tower threat rules refined.')

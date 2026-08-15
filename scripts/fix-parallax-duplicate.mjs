import fs from 'node:fs'

const path = 'index.html'
let source = fs.readFileSync(path, 'utf8')

function replaceOrThrow(oldText, newText, label) {
  if (!source.includes(oldText)) throw new Error(`Could not find ${label}`)
  source = source.replace(oldText, newText)
}

replaceOrThrow(
`    // Horned Attack is different from a normal entry hit: lethal excess damage carries directly into
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
    }`,
`    // Horned Attack is different from a normal entry hit: lethal excess damage carries directly into
    // the next card and can kill a Parallax sitting behind another card without giving Paradox a chance.
    // Only one Parallax may be assigned to a cheese team, so reserve that single copy for Horned Attack
    // and never create a second Parallax buffer in the slot before it.
    const overflowIndices=blockerIndices.filter(i=>TOWER_OVERFLOW_THREATS.has(enemies[i]?.ability||''));
    if(parallaxIndex<0&&prophetIndex<0&&overflowIndices.length){
      parallaxIndex=overflowIndices[0];
      overflowBufferIndex=-1;
    }`,
'overflow Parallax assignment',
)

replaceOrThrow(
`      else if(index===overflowBufferIndex){pick='Parallax';reason='Buffer Parallax: Horned Attack can carry lethal excess damage through the current card into the next slot. A second Parallax here makes it much less likely the fresh Parallax behind it is deleted by overflow.'}
`,
``,
'buffer Parallax pick',
)

replaceOrThrow(
`      else if(index===parallaxIndex){pick='Parallax';reason=TOWER_OVERFLOW_THREATS.has(enemy.ability||'')?(overflowBufferIndex===index-1?\`${enemy.ability||'Horned Attack'} carries excess lethal damage into the next card. Use the previous Parallax as a buffer so this fresh Parallax is not sitting directly behind a JD when Triceratops enters.\`:\`${enemy.ability||'Horned Attack'} can overkill the current card and pierce directly into Parallax without triggering Paradox. No free buffer slot was available, so this is an unsafe Parallax setup; simulate it before using it.\`):(TOWER_KUCHISAKE_THREATS.has(enemy.ability||'')?\`${enemy.ability||'The Fall'} punishes attackers for dealing damage. Save Parallax here so this enemy killing Parallax triggers Paradox instead.\`:(TOWER_EXTRA_TURN_THREATS.has(enemy.ability||'')?\`${enemy.ability||'Extra turns'} can chain through your next card after a kill. Save Parallax here so Paradox kills this enemy when it kills Parallax.\`:(threat.block?\`${enemy.ability||'This ability'} can stop a direct kill, so reserve Parallax's one Paradox use for this card.\`:'No blocker needs Parallax later, so use its one Paradox trade here instead of spending another JD.')))}`,
`      else if(index===parallaxIndex){pick='Parallax';reason=TOWER_OVERFLOW_THREATS.has(enemy.ability||'')?\`${enemy.ability||'Horned Attack'} can overkill the current card and carry damage into the next slot. Reserve the team's single Parallax for this threat; the setup can still be risky because no second Parallax buffer is allowed.\`:(TOWER_KUCHISAKE_THREATS.has(enemy.ability||'')?\`${enemy.ability||'The Fall'} punishes attackers for dealing damage. Save Parallax here so this enemy killing Parallax triggers Paradox instead.\`:(TOWER_EXTRA_TURN_THREATS.has(enemy.ability||'')?\`${enemy.ability||'Extra turns'} can chain through your next card after a kill. Save Parallax here so Paradox kills this enemy when it kills Parallax.\`:(threat.block?\`${enemy.ability||'This ability'} can stop a direct kill, so reserve Parallax's one Paradox use for this card.\`:'No blocker needs Parallax later, so use its one Paradox trade here instead of spending another JD.')))}`,
'Parallax Horned Attack reason',
)

// Guard the final plan too: no future branch may accidentally recommend Parallax twice.
replaceOrThrow(
`    return {picks,endTimesNeeded,blockers,prophetIndex,parallaxIndex,kuchisakeIndex,overflowBufferIndex};`,
`    let seenParallax=false;
    for(const pick of picks){
      if(pick.pick!=='Parallax')continue;
      if(!seenParallax){seenParallax=true;continue}
      pick.pick='Judgment Day';
      pick.reason='Parallax is already assigned elsewhere on this team, so use Judgment Day here instead.';
    }
    return {picks,endTimesNeeded,blockers,prophetIndex,parallaxIndex,kuchisakeIndex,overflowBufferIndex};`,
'final cheese plan return',
)

fs.writeFileSync(path, source)
console.log('Removed duplicate Parallax recommendations.')

// workflow trigger

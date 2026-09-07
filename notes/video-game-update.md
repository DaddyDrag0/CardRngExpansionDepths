# Video Game update — private draft

Prepared for a feature-branch push only. Main and the live deployment are unchanged. Based on `VIDEO GAME Card RNG Expansion.rbxl`, inspected September 7, 2026, against repository commit 517df9d.

## Confirmed definitions

- Added all 12 Video Game cards with source image IDs, rarity, weather, stat multipliers and ability descriptions. Pack unlock: 25,000,000 rolls (CardPacks module). This battle calculator has no pack-unlock control.
- Added The Broken One (1/400,000,000; 1.2× stats), Supreme Ozzy (1/411,000,000; 2× stats), and unobtainable Joy/Sorrow summons. Fate Seamstress and Hera already existed. These four event cards reference September 12, 2026, 01:00 UTC in the current Cards module.
- Gamer: 1/400,000; Video Game pack boost 1.55×. Myths: 2× → 1.55×. The Sequel: 2× → 1.65×. Explicit 300% ceiling comes from the supplied Discord announcement; Galaxy source factors produce 299.15%, 299.15%, and 292.05%, respectively, rather than exactly 300%.
- Satan: source BoostMult is now 2 rather than the calculator's prior 2.5. Galaxy Blood Rain bonus becomes 226%.
- Fixed the Myths pack-name mapping typo in the aura summary. Cached all 17 added card/aura thumbnails.

## Unlisted or conflicting details

- The Broken One uses Split In Two. Joy and Sorrow each inherit 50% Max HP and 60% Damage. Supreme Ozzy's Ruler of Humans prevents attacks and adds 1.25× damage taken to party attack.
- The Sack's ability key is **The D8**, although its description says **D6**. Steven's description says Steve. Preserve the source names.
- Cry and Shade are additional descriptions with no card assigned to them in the current Cards definition; retained as descriptions, not invented new cards.
- Satan has an Anime skin asset, 96093898729668. Other card skin mappings exist, but this site has no skin selection feature and the earlier game export was not used to establish which skins are newly added. No skin UI was invented.
- Cannon: Discord says +3 per shot; Dialogue and Weather client strings still say +1. No server luck calculation is present to resolve the conflict, and this site has no cannon input.
- Anubis & Hades retains an Expires field with value 0. Preserve existing eligibility; do not mistake Lua's truthy 0 for a missing field.
- Armageddon's current description additionally says it cannot dodge or gain shields. This needs resolver verification before changing its interactions. Existing simulation behavior is preserved for now.
- Luminescent Veil's description omits the Kira/Judgment Day exception that the existing calculator documents from earlier evidence. Omission alone does not establish that the mechanic was removed; preserve the existing exception pending server evidence.

## Provisional combat models

The export contains card/aura/ability definitions and BattleClient, but no server battle resolver. Implemented draft models for the 12 pack abilities, Split In Two, and Ruler of Humans. They remain outside FULLY_SUPPORTED, so results using them stay unverified. Do not describe this draft as a validated 1:1 game simulation.

Ambiguities requiring server code or observed combat: Life Tap's damage increase is modeled per attack rather than permanently stacking; Glory Kill adds 50% of initial damage per kill; Waterfowl replaces every third primary attack with three half-damage hits; Jackpot follow-up applies to the surviving original target; Void triggers on the third attacking turn; freeze lasts until the frozen card's next skipped move; blocks absorb incoming damage in up to three partial/full blocks; Black Box direct damage and death-order interactions; Ozzy overkill and damage-source handling. These are draft interpretations, not confirmed server rules.

## Validation

- TypeScript/Vite build, both worker bundles, data integrity, static UI script check and new update regression passed.
- Existing targeted combat, aura, revive, stall, rewards, timing and watchdog regressions passed after updating the obsolete Satan expected value and preserving the original enemy fixtures in two combat regressions. New random-pool entries naturally change seeded lineups.
- Full engine-smoke and Depths coverage gates remain blocked by the deliberately unverified new abilities. Those gates were not weakened.
- No browser testing or deployment was performed.

## URL cleanup

Removed the version suffix from the address bar while preserving internal versioned asset requests and automatic update checks. Existing links containing `?v=...` are cleaned without discarding other parameters or anchors.

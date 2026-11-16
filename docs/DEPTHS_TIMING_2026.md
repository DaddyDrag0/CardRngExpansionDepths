# Depths playback timing — Emerald & Hardcore client export (Nov 2026)

Source: uploaded `CYBERPUNK Card RNG Expansion.rbxl`; client-side scripts extracted from
`LocalScript: BattleClient`, `LocalScript: Depths`, `LocalScript: DepthsHard`,
and `ReplicatedStorage/Modules/AutoBattleConfig`.

## Verified client playback rules

The `BattleClient` function `showBattle` obtains normal Battle Speed `p15`
from the user's setting. Normal Depths caps the setting at **3**. The client reads
`RelicBattleSpeedBonus`, `SkillTreeBattleSpeedBonus`,
`StructureBattleSpeedBonus`, and adds `min(floor(floor / 100) * .25, 4.5)`
for Normal/Hard Depths. It computes total attack playback speed from the
sum and multiplies **the entire speed** by 1.5 for `Song of War` or 2
for `Empyrean` / `Godlike Power`.

Playback multiplier also grows after consecutive `Attack` events:
- Event 1–9: 1× (10–19: 2×, 20–39: 3×, 40–59: 5×, 60+: 10×).
- The count resets on `Died`; `WarScytheEntry` and `MurderOfCrows`
  attacks do not advance it.
- Individual Attack events include segments resembling .3 + .2 + .5 seconds
  in the common animation, divided by `AttackSpeed` (or a 3×
  `FirstBlood` adjustment) and the effective playback speed.
  Many other events add their own waits.

## What the calculator implements

- Selectable unlocked base speed **1×, 1.5×, 2×, 3×**, based on the user's
  in-game Battle Speed selection. Users must select what they have unlocked.
- Six Battle Speed skill tree nodes totaling **+5.5 speed**; structure upgrades
  0–7 add **+0.25 per level**; Chrono Shard upgrade levels grant **+1 to +2**.
- Source floor speed adds +0.25 per 100 floors, capped at +4.5, and
  Song of War / Empyrean / Godlike Power multiply the combined total.
- Uses the 10/20/40/60 animation-acceleration thresholds and a constant-time
  approximation based on **each simulated floor's actual turn count**.
- Uses **0.8-second provisional floor/server overhead** and a **0.2-second
  attack-phase minimum**, both estimates, not confirmed game server constants.
  The floor overhead and animation scale can be adjusted in the Depths controls.
- Uses the **total earned packs divided by total simulated run seconds** to
  rank packs/hour. Rewards stop at the **last cleared floor**, not defeat floor,
  and omit floors skipped with the Start Floor setting.
- Normal and Hard Depths use the same stage generator at actual stage
  **floor × (Hard ? 10 : 1)** for **both enemy pool eligibility and power**.
- The game source confirms the **0.6-second NextFloorDelay** applies to
  Tower/Trial Auto Battle; it is **not** transferred into Depths.

## Known boundaries (do not call this 1:1)

The export only contains *client* playback code, not the server's actual
`battlecd` delay/retry policy. `AutoBattleConfig.NextFloorDelay=0.6`
applies to **Tower/Trial auto battle**, **not a verified Depths floor delay**.
Do not transfer its value into Depths calculations.

The battle simulator records battle **turns** but not every BattleClient
`Attack` / `Died` event. Follow-up attacks, death resets, speed modifiers,
tweens, animations and packet/network delay can diverge from the proxy
formula. The default .8-second floor delay and the .2-second minimum
animation phase are *calibration assumptions*, not leaked server constants.

**Recommendation:** compare 15–30 simulations for several builds under
one common speed baseline. Time real runs separately to validate absolute
estimates. Treat all packs/day and WRR/day as **estimates** until matching
real-world data validates the model.

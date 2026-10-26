# HORSEMAN Roblox place — source review (26 Oct 2026)

Source: user-provided `place 116512786685590 HORSEMAN Card RNG Expansion.rbxl`.
Binary Roblox place parsed to extract `ReplicatedStorage/Modules/Util`,
`Util/HalloweenStages`, `BTRewards/HalloweenInfinite`,
`Cards`, `Relics/RelicUpgrades`, and the local HalloweenTowerClient.

## Halloween Infinite — implemented preview only

The new client's `Util.GenHalloweenInfinite(floor,seed)` repeats the preset
`HalloweenStages` bosses using `((floor - 1) % 105) + 1`. Four random
enemies are drawn from packs Halloween, Halloween2, and collection Halloween3,
excluding `Unobtainable` and `Boss`. The real Roblox RNG is `Random.new`;
our browser preview uses a deterministic alternative. **Random enemy lineups
are samples, not exact reproductions of Roblox's server seed.**

- Enemy ATK: `floor(200000 + 1800000 * ((floor-1)/99))`.
- Enemy HP: `2 * enemy ATK`; Power: `2 * enemy ATK`.
- Extra preset fifth auras retain Galaxy borders.
- Infinite does **not** append Soul Guide in this client-side generator.
- Base pack rewards follow the exact precomputed 1–1000-floor weighted schedule
  in `BTRewards/HalloweenInfinite`, and its distinct formula after 1000.
- Every multiple of 105 adds 1 Pumpkin Moon Potion.
- The client displays packs with PackMulti / InstantPacks2X / Duped Entry
  bonuses applied, which aren't added to the **base** preview reward.

The uploaded client does **not** contain server battle-start validation,
an Infinite-specific *player* banlist, or player stat normalization.
Consequently Infinite currently has a **preview**, not a fabricated win-rate
calculator. The normal Halloween player bans are deliberately **not**
asserted to apply to Infinite mode. The 160-ATK assumption is scoped to the
existing 105-stage Halloween simulator.

## Regular Halloween changes

- User-confirmed: **Pumpkin King** is banned as a player card.
- Fixed stage **105** (and Infinite stages 105, 210, 315...): `Savior /
  Bloody Mary / Living Armor / Sable The Envious` + `End Times` aura.
  The previous `Abomination` third slot in old data is obsolete.
- `Witch Doctor` newly added, Virus mutation, 1/5,000,000,
  `StatMultiplier=6`, ability **Experimental Treatment**.
  The ability description is preserved but its exact status effect strength
  and timing are not in the client. Battle simulation therefore cannot
  assert full live-game fidelity for this ability.
- Pestilence, Famine, War, Death now have `StatMultiplier=1.5` in the
  Cards module versus 1 previously.

## Mutation stat multipliers (from Util)

| Mutation | Current multiplier |
|---|---:|
| Storm | 2 |
| Snow | 2.1 |
| Aurora | 2.3 |
| Shroud | 2.5 |
| Meteor Shower | 3.5 |
| Time Storm | 4 |
| Eclipse | 4.5 |
| Virus | 5 |
| Blood Rain | 5.5 |
| Armageddon | 6 |
| Manga | 6.5 |
| Pumpkin Moon | 7.5 |

The catalog, engine and site front-end values were updated together.

## Relic upgrades — extracted reference

The game's `ReplicatedStorage/Modules/Relics/RelicUpgrades` lists five tiers:
Base, Platinum, Crystal, Ruby, Galaxy, with four crafting upgrades.
These are the tier values (not the material costs):

| Relic | Base | Platinum | Crystal | Ruby | Galaxy |
|---|---:|---:|---:|---:|---:|
| ChronoShard (BattleSpeed) | 1 | 1.25 | 1.5 | 1.75 | 2 |
| BountifulDelve (RareLootBonus %) | 25 | 30 | 35 | 40 | 50 |
| LuckySurge (ProcBoost %) | 25 | 30 | 35 | 40 | 50 |
| TheDice (NthRollBoost %) | 100 | 125 | 175 | 225 | 300 |
| PotionMaster (PotionDurationBonus %) | 50 | 60 | 70 | 80 | 100 |
| Vicissitudes (PositiveBorderBoost %) | 10 | 15 | 20 | 25 | 30 |
| Quickdraw (RollSpeedBonus %) | 10 | 15 | 20 | 25 | 30 |
| HeavyHand (LuckBonus %) | 20 | 25 | 30 | 35 | 40 |

Crafting material costs are present in the same client module, but this
change does not add a separate relic-upgrade UI.

## Ban confidence / missing server information

The 105-floor calculator's Rapture and named restrictions remain
user/community-reported. Ban sources cannot be safely transferred to
Infinite without corroboration. `ArenaLegal` is Arena-only.
The local HalloweenTowerClient invokes the server via `BattleTower`
with difficulty 4 and the mode name; server validation scripts are
not included in the Roblox place.

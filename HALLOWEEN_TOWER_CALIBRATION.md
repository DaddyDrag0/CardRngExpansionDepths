# Halloween Tower calculator — calibrated v1

## Source and confidence

Source: the user's `HALLOWEEN Card RNG Expansion(1).rbxl`, specifically `ReplicatedStorage/Modules/Util/GenStage`, `HalloweenStages`, and `HalloweenTowerClient`. The complete server battle logic and deck-ban validation were **not** present in the saved Roblox place. The formulas below are an experimental simulator calibration; they are not equivalent to the original server's authoritative formulas.

### Confirmed by screenshots

- Player Triceratops (effective rarity 100qd; Platinum + Crystal + Galaxy) starts at 185 ATK after Julius Leader is removed; with Julius Leader, ATK is 222 (=185 × 1.2).
- Same deck supports Pterodactylus at 185, Mothman at 195, and Julius Leader at 204 after Influence.
- Enemy Stage 14 Night Witch ATK 168; Stage 15 Michael M. ATK 169; Stage 17 Witch preview 343 HP and 172 ATK.

### Working model (not yet server-proven)

- Player effective rarity `R` includes border rarity multipliers.
- Player power `ceil(200 + 10 log10(R))`, attack `ceil(power/2)`.
- Player HP defaults to `power * card.hpMultiplier` (HP normalization is provisional).
- Enemy base power `ceil(300 + 2.5*floor)`, attack `ceil(power/2)`, and HP `power * card.hpMultiplier`. Matches observed screenshots but the place's client preview can differ from authoritative combat initialization.
- Player rarity-based stat normalization intentionally does **not** apply ordinary inventory stat multipliers or mutations. The impact of special stats and mutations in live Halloween Tower still needs calibration.
- Julius Leader / Influence +20% team ATK is applied using the shared battle engine.
- Soul Guide / Resting Place on every enemy lineup is modeled as disabling player's Stat and Ability Auras. The exact server activation order needs verification.
- Fixed stage fifth aura (Phantom, Berserker, Vampire Matron, End Times) gets Galaxy border and applies enemy-side aura boosts.
- Roblox random lineup is generated with Lua `math.random`, which the site does not reproduce bit for bit. For non-fixed floors, the site generates a **sample** lineup and lets you enter the real four opponents.

### Restrictions

- **Player-reported category:** all Weather=Rapture cards are banned.
- **Player-reported names:** Vampire Lord, Fuxi (tentative), Priest, Pandora, Black Plague, Wendigo, Glamour.
- **Player-reported copy restriction:** maximum 1 Julius Leader.
- Other extra-turn, stat-on-kill, or Rapture-like abilities are **not automatically banned** solely because of their effect. Don't conflate Halloween's random enemy exclusions with player eligibility.
- The calculator provides browser-persisted additional bans for live discoveries.

### Recommended live testing

For each matchup, capture the stage, exact enemy order, candidate player card order, each card's full borders, **opening** HP/ATK (before combat buffs), applied auras, and eventual win/loss. Record banned-card error messages separately. Report discrepancies so the formulas and bans can be updated. Current search is a bounded, skill-based stochastic shortlist, not an exhaustive optimum or a guarantee of real-game wins.

Existing Depths and regular Tower tools must remain independent; Halloween-only normalization is opt-in via `BattleModeOptions`.

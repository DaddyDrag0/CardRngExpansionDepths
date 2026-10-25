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

## Global search and 1qd floor (2026-10-25)

- Player-reported bans now additionally include **Fate Seamstress**, **Behemoth**, and **Parallax**, on top of prior bans and all Rapture weather cards. **One Julius Leader** limit remains.
- The entire obtainable, non-reported-banned card catalog is the **default** search pool; a manual shortlist remains available.
- The "everybody owns every card with 1qd effective rarity at minimum" option is an explicit **hypothetical stat floor** of 1e15 rarity. Player attack is still derived from `ceil((200+10*log10(max(actual_effective_rarity,1e15)))/2)`. This means 1qd is **175 base ATK**, not 100, under the currently screenshot-fitted formula; exact server stats need additional calibration.
- Existing better card borders and effective rarity are preserved; no increase if already at or above 1qd. Other card differences, especially skills and HP multipliers, still matter.
- The search algorithm is a *bounded evolutionary combat tournament*, not a trained AI or exhaustive search. Every eligible catalog card appears in an evaluated lead and closer position; promising ordered teams are bred, mutated, reranked, then independently verified with fresh seeded full combat simulations.
- A "Check floors 1–105" probe runs the current four-card loadout against eleven representative stage samples. It tests *that deck only*. No wins in the samples **cannot** establish a stage is globally impossible.
- Existing browser settings from the earlier version are migrated to the all-cards mode with no assumed premium borders. Explicitly chosen player deck borders remain intact.

## Adaptive battle lab and event availability (2026-10-25)

**Availability rules:** `Sable The Envious` and `Supreme Ozzy` are now reported banned.
The update log explicitly bans **multiple entries of the same player card**,
so all duplicate player cards are blocked, including duplicate Julius Leader.

`Santa Claus`, `Anubis & Hades`, and `Supreme Frank` are excluded from
the default player search as reported inaccessible event exclusives.
Older cards marked `expires=true` are also excluded by default, **except**
currently released Halloween3 and the four horsemen (Death, War, Famine, Pestilence).
The former legacy exclusions are an assumption, not a verified server-wide ban.
The optional Include historical event cards checkbox re-enables those older
exclusives for players who actually own them, while the three specific
no-owner exclusions stay blocked. Enemy encounter generation is unaffected.

**Adaptive battle search:** the game simulator, not a separate machine-learning
model, labels matchups. The search first ensures lead and closer coverage across
all eligible cards, screens them against the selected stage, breeds and mutates
promising unique-card teams, and then uses progressive 16/64/256 battle
verification with independent seeds. Estimated probabilities show Wilson 95%
confidence ranges. Labels are explicitly marked `estimated: true`; incomplete
or unsupported engine mechanics are surfaced rather than treated as exact.

The uploaded Python code uses a native C kernel with probability-branch
search and an exact tablebase. That C kernel is **not** available within this
browser calculator, and the current TypeScript battle engine cannot exactly
enumerate stochastic branches. So our implementation follows its **versioned
training-label** and **adaptive rollout** architecture, not its exact-solver
algorithm.

**Export labels:** The Halloween tab's "Copy estimated training labels" exports
JSONL rows for finalists. Offline bulk generation is available via:

```bash
npm run halloween:labels -- --rows 100 --runs 64 --seed 123 --out data/halloween-labels.jsonl
```

Each row has a rule fingerprint over engine, cards, and data; matchups; seed;
outcome frequencies; confidence interval; and unsupported-ability flags.
Future model training should drop unsupported/uncalibrated labels and reject
stale rule fingerprints; there is **no neural model trained yet**.

# CardRngExpansionDepths

Card RNG Expansion Depths calculator.

## November 2026 calculator overhaul (test branch)

The 2026 calculator hub (Depths, Tower Cheese, Boss Cheese and Trial Cheese)
is being developed on `overhaul-test-2026`. Do not assume it is released on `main`.

### Validate changes

```sh
npm ci
npm run check
npm run build:workers
```

`npm run check` now includes the 2026 UI/data checks and smoke tests against
the **deployed** `browser/tower-worker.js`. The latter checks actual battles,
banned cards, mutation-only rules, 1-Rapture limits and special mode context.

**Important:** The 2026 Tower worker currently contains customized battle
mechanics that have not all been ported back into the legacy TypeScript
`src/tower-worker.ts` / engine source. To avoid deleting those mechanics,
`npm run build:workers` rebuilds only the Depths worker and then validates
the checked-in Tower worker. `npm run build:tower-worker:legacy` writes a
*separate* experimental bundle. Do not overwrite the deployed Tower worker
with the old TypeScript build until source parity is established.

### Data accuracy boundaries

- All 11 Tower modes exist, with exact boss-floor lineups where the export
  provides them. Non-boss opponents are **estimated**, not server-confirmed.
- The Boss Cheese file has 16 encounters and a 1-Rapture limit. The exported
  per-boss and per-difficulty ban tables are currently empty. The UI now
  applies those tables when verified restrictions are added.
- Fixed Trial enemies are defined; random Trial floors require entering the
  four enemies actually observed in game.
- The game export used by this project does not include complete 2026
  Instant Pack reward totals for all 11 towers or a Monthly Trial pack
  amount. The optional Tower reward planner deliberately leaves these
  unknown until the real values are supplied. With all 11 confirmed
  totals entered, it computes the true sum with or without a 2× multiplier.
- The battle simulator estimates uncertain mechanics. Always compare
  important results against real gameplay before promoting to `main`.

### Release check

Do not merge the overhaul into `main` solely on passing static checks.
Verify the preview visually on desktop/mobile; compare several battle
simulations against real matches; confirm current bans and reward data;
then merge after CI is green.

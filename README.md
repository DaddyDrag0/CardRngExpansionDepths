# Card RNG Expansion Calculator

A fan-made browser calculator for **Card RNG Expansion**, with deck simulation, card data, and progression tools.

**[Open the public calculator](https://daddydrag0.github.io/CardRngExpansionDepths/)**

## Features

- **Depths:** Test four-card decks, bans, relics, auras, rewards, and run-time estimates.
- **Hard Depths Ban Lab:** Compare two ban-selection strategies using bounded, seeded battle simulations.
- **Battle Replay:** Inspect individual fight events and test the replay animation without finishing a full run.
- **Tower, Boss & Trial Cheese:** Explore decks and simulate matchups, including activity-specific restrictions.
- **Data & rewards:** Card abilities, borders, mutations, rewards, and supporting game data.

Some features are available **only on the development branch** until tested and released.

## Branches

| Branch | Purpose |
| --- | --- |
| `main` | Stable public version |
| `overhaul-test-2026` | Active development and verification |

Development changes stay on the test branch until they have passed automated checks **and** practical browser/gameplay testing.

## Development

Requires Node.js 22 or later.

```sh
npm ci
npm run dev
npm run check
```

Use `npm run build` for a production build and `npm run build:workers` to validate the checked-in browser workers.

The deployed Tower worker contains hand-maintained combat behavior not fully represented in the legacy TypeScript source. **Do not replace `browser/tower-worker.js` using the legacy worker build** without first establishing feature parity.

## Accuracy

This is an independent simulator, not the game's server. Some mechanics and animations are approximations based on accessible client-side data and observed battles.

- **Depths timing:** Estimates are calculated from simulated turns and modeled playback delays; they are not guaranteed to match real run durations.
- **Ban Lab:** Danger-window benchmark scores are **not** full-run packs/day predictions.
- **Random encounters and Hardcore effects:** Some server-side behavior is unavailable and results may be approximate.

See [Depths timing notes](https://github.com/DaddyDrag0/CardRngExpansionDepths/blob/overhaul-test-2026/docs/DEPTHS_TIMING_2026.md) on the development branch for the timing model and known limitations.

## Repository layout

- `src/` — interface, data, game logic, and simulation source
- `browser/` — deployed simulator workers
- `scripts/` — tests, validation, and data utilities
- `.github/workflows/` — automated checks

The repository is maintained as a project for testing and comparing strategies. It is not affiliated with the game's creators.

# CardRngExpansionDepths

Card RNG Expansion Depths calculator.

## Site structure

The live page is intentionally split into small assets instead of keeping the full application inline in `index-base.html`:

- `src/depths-ui.js` — Depths/Tower UI and browser-side application logic.
- `src/depths-ui.css` — calculator-specific UI styles.
- `src/theme-controller.js` — theme selection/persistence.
- `src/site-version-watch.js` — live build refresh check.
- `src/feedback.js` / `src/feedback.css` — report/feedback dialog.
- `server/feedback-worker.mjs` — serverless relay for Discord feedback.

## Feedback relay

Do **not** put a Discord webhook URL in the public GitHub Pages code. The relay in `server/feedback-worker.mjs` reads it from a server-side environment secret named `DISCORD_WEBHOOK_URL`.

Deploy that worker (Cloudflare Workers or an equivalent serverless runtime), set:

- `DISCORD_WEBHOOK_URL` — Discord webhook URL, stored as a secret.
- `ALLOWED_ORIGIN` — normally `https://daddydrag0.github.io`.

Then put only the worker's public HTTPS URL in the `crx-feedback-endpoint` meta tag in `index-base.html`. The Discord webhook itself must never be committed.

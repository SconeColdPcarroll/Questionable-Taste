# Play it Forward

Play it Forward is a premium-feeling mobile app concept that connects to a user’s Spotify listening history and turns listening patterns into meaningful charitable donations.

The product direction for v1 is:
- Playful, edgy, and a little snarky tone (without naming and shaming).
- “Top 5 risky listens” donation suggestions (dark mode).
- One overall donation recommendation based on risky listening volume.
- A secondary “Great Listener” light mode path for charities supported by artists the user already loves.

See `docs/MVP_BLUEPRINT.md` for the full product blueprint, UX flow, data model, compliance guardrails, legal copy, and launch plan.


## How to keep building from here
Start with the execution checklist in `docs/NEXT_STEPS.md`, then use `docs/MVP_BLUEPRINT.md` as the source of truth for product and architecture decisions.


## Build status
Implementation has started with an API stub and CSV mapping import script:
- API stub: `apps/api/src/server.js`
- CSV import: `scripts/import-mappings.js`
- CSV format guide: `docs/CSV_IMPORT.md`

If you have your two CSV files now, we can load them immediately and generate live mapping data for the next build step.

If upload is blocked in your interface, use `data/artists.template.csv` and `data/charities.template.csv`, then run `npm run import:mappings:local`.

You can now also import a **single direct mapping CSV** (Artist, Recommended charity, EIN) or raw pasted text with literal `\n` separators via `npm run import:mappings:badbois`.

## Private admin web interface
A lightweight private admin UI is now available for maintaining artist → charity mappings:

1. Start API: `npm run api:start`
2. Open: `http://127.0.0.1:4000/admin`
3. Enter admin key (default): `play-it-forward-admin`
4. Manage mappings (create/edit/delete), which persist to `data/mappings.json`

For safer local usage, set a custom key before start:

```bash
ADMIN_KEY=your-secret-key npm run api:start
```


Admin UI now includes a **bulk import textarea** for pasted CSV text, plus inline edit support.

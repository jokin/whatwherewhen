# Elsewhere '26 — What Where When

The official event guide for **Elsewhere '26**, a Burning Man–style festival in the Monegros desert, Spain — 7–12 July 2026.

Browse 680 events across 37 camps, filter by day and category, find your camp on the map, save your favourites, and export your personal schedule to any calendar app. Works fully offline once installed.

## Install

Open the URL on your phone and tap **Add to Home Screen** (iOS: Share → Add to Home Screen · Android: the install banner appears automatically). After that it works with no signal — no connectivity needed at the festival.

## Features

- **Browse** — full event listing grouped by day, search by name/camp/description, filter by category, infinite scroll
- **Map** — schematic camp map, tap any barrio to see its events
- **Mine** — your saved events; export to `.ics` (imports into Apple Calendar, Google Calendar, etc.) or add individually via Google Calendar links

## Stack

Vite + React 18 + TypeScript, deployed to Netlify as a static PWA. All data is bundled at build time — no backend, no API calls.

## Development

```bash
npm install
npm run dev      # dev server at localhost:5173
npm run build    # production build → dist/
```

Pushes to `main` trigger automatic Netlify deploys.

## Data

Events live in [`src/data/events.json`](src/data/events.json), generated from the organiser's CSV export. To update:

1. Replace `event-guide-export.csv` with the new export
2. Run the parse script: `node scripts/parse-csv.js` *(see [HANDOFF.md](HANDOFF.md) for the full script)*
3. Commit and push — the deploy picks it up automatically

## License

Private — all rights reserved. Not for redistribution.

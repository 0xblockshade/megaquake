# MegaQuake — Live Global Earthquake Tracker

A Next.js app that displays a live, interactive world map of earthquakes with a curated sidebar of related X/Twitter posts from official sources.

## Features

- Interactive MapLibre map with magnitude-scaled markers
- Magnitude filters: M7.0+, M4.5+, All
- Time filters: 24h, 7 days, 30 days
- Auto-refresh every 60 seconds with pulse animation for new events
- Global stats bar: today, this week, strongest active, M7+ this year
- Curated social feed resolved via FxTwitter (no X API key required)
- Event detail pages at `/quake/[id]`
- Mobile-responsive layout with swipe-up curated feed drawer

## Data sources

- **Earthquakes**: [USGS Earthquake GeoJSON feeds](https://earthquake.usgs.gov/earthquakes/feed/) and FDSN event API
- **Social posts**: [FxTwitter API v2](https://docs.fxembed.com/api/introduction/) for resolving tracked post URLs
- **Basemap**: CARTO Dark Matter raster tiles (keyless). MapLibre worker files are copied to `public/maplibre` on `npm install`.

No paid API keys or environment variables are required for the MVP.

## Architecture

```
src/
  app/
    page.tsx                 # Main dashboard
    quake/[id]/page.tsx      # Event detail
    api/quakes/route.ts      # USGS proxy + normalization
    api/tweets/route.ts      # FxTwitter resolver
  components/                # Map, filters, feed, stats
  config/
    featured-events.json     # Verified USGS event IDs
    tracked-posts.json       # Curated X post URLs
  lib/                       # USGS, FxTwitter, types, utilities
```

Server route handlers cache upstream responses (~60s for quakes, ~5m for tweets). The client polls via SWR.

## Curated posts

Posts are configured in `src/config/tracked-posts.json`. FxTwitter resolves individual post URLs only — it does not support keyword search. Add official agency posts (USGS, EMSC, BMKG, etc.) by URL.

**Important**: This is a curated feed, not a live firehose. Earthquakes cannot be reliably predicted; any commentary posts must be labeled as unverified social commentary, not validated forecasts.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — production server
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript check
- `npm run test` — unit tests

## Deploy to Vercel

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com/new)
3. Deploy with default Next.js settings — no env vars needed

## Attribution

- Earthquake data: USGS
- Map tiles: OpenFreeMap / OpenStreetMap (attribution shown on map)
- Social content: respective X/Twitter authors via FxTwitter

## License

MIT

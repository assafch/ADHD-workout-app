# ADHD Strength PWA

ADHD-friendly Progressive Web App for tracking dumbbell-based strength training. Hebrew-first (RTL) with full English support, offline-capable via IndexedDB + service worker, and self-hosted on Railway.

## What's inside

- Single-deployment Express server that serves both `/api/*` and the React SPA from `client/dist`.
- Postgres + Drizzle ORM for the data layer (idempotent bootstrap on startup, no separate migrate step required).
- React 18 + Vite + Tailwind + i18next for the client.
- Dexie (IndexedDB) for offline-first writes, Workbox-driven service worker via `vite-plugin-pwa`.
- Two-phase "Wolverine" dumbbell program seeded automatically.

## Local development

```bash
# 1. Install (workspaces)
npm install

# 2. Configure env
cp .env.example .env
# fill in DATABASE_URL, JWT_SECRET (openssl rand -hex 32), SEED_EMAIL, SEED_PASSWORD

# 3. Run both server + client (concurrently)
npm run dev
```

- Server: http://localhost:8080 (api at /api/*)
- Client: http://localhost:5173 (proxies /api → :8080)

The seed user is created on first server boot using `SEED_EMAIL` / `SEED_PASSWORD`.

## Production build

```bash
npm run build   # builds shared, client, then server
npm start       # runs the Express server which serves the client too
```

## Deploy to Railway

1. Create a new Railway project.
2. Add the Postgres add-on; Railway will auto-set `DATABASE_URL`.
3. Connect your GitHub repo (or `railway up` from CLI).
4. Set the required env vars in the Railway dashboard:
   - `JWT_SECRET` — `openssl rand -hex 32`
   - `SEED_EMAIL`, `SEED_PASSWORD`, `SEED_NAME`
   - `NODE_ENV=production`
   - `ENABLE_REGISTRATION=false`
5. Railway runs `npm install` (workspaces postinstall handles deps) → `npm run build` → `npm start`.
6. Open the Railway-assigned URL on your phone and "Add to Home Screen".

The Express server runs the schema bootstrap (idempotent `CREATE TABLE IF NOT EXISTS`) and seeds exercises + the Wolverine program on every boot before listening, so deploys are zero-touch.

## Tech notes

- **Auth**: bcrypt (cost 12) + JWT (30-day expiry). Token in `localStorage`, sent as `Authorization: Bearer …`.
- **Offline writes**: every set log goes to Dexie immediately, then to the server. On reconnect the app flushes pending sets/sessions/body metrics; conflicts resolve by `clientId` UUID.
- **Phase auto-advance**: server bumps the active program from phase 1 → 2 once `today - programStartDate >= 14 days` AND completed sessions ≥ 6, on every `/api/today` call.
- **PRs**: server computes Epley 1RM at log time and sets `is_pr` if it beats the user's all-time best for that exercise.
- **Streak**: counts consecutive planned-training days that had a session (good or "bad day"). Rest/cardio days don't break the streak.

## Scripts

- `npm run dev` — concurrently server + client
- `npm run build` — builds everything for production
- `npm start` — runs the production Express server
- `npm run db:seed` — re-runs the idempotent seed (already runs on boot)

## License

Private.

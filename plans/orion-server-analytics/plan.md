# Server-Side Analytics for GamesPump

## What
Add server-side persistence for the existing client-side analytics. Events currently live in localStorage (per-browser, lost on cache clear). We're adding a PostgreSQL backend so analytics aggregate across all users and persist.

## Why
Track Usage is the highest-weight unaddressed growth concern (w3). Can't improve what we can't measure. Client-side only analytics are useless for product decisions — we need cross-user aggregation.

## How

### 1. Add `pg` dependency
```bash
npm install pg @types/pg
```

### 2. Database setup (`src/lib/db.ts`)
- Create a connection pool using `DATABASE_URL` env var
- Export a `query()` helper

### 3. Schema (`src/lib/analytics-schema.sql` — for reference)
```sql
CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,
  event VARCHAR(50) NOT NULL,
  props JSONB DEFAULT '{}',
  visitor_id VARCHAR(64) NOT NULL,
  session_id VARCHAR(64) NOT NULL,
  ip_hash VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_analytics_event ON analytics_events(event);
CREATE INDEX idx_analytics_created ON analytics_events(created_at);
CREATE INDEX idx_analytics_visitor ON analytics_events(visitor_id);
```

### 4. POST `/api/analytics/events` route (`src/app/api/analytics/events/route.ts`)
- Accepts `{ events: AnalyticsEvent[] }`
- **Validation:**
  - Event type whitelist: `page_view`, `game_start`, `game_end`, `room_created`, `room_joined`, `round_complete`, `share`
  - Max 50 events per batch
  - Max 10KB payload
  - Props values must be string/number/boolean only
- **Rate limiting:** In-memory Map, max 10 requests per IP per minute
- **IP hashing:** SHA-256 hash of IP (no raw IPs stored)
- Auto-creates the table on first request if it doesn't exist
- Returns `{ ok: true, count: N }`

### 5. GET `/api/analytics/dashboard` route (`src/app/api/analytics/dashboard/route.ts`)
- Returns aggregated stats from PostgreSQL:
  - Total events, unique visitors, total sessions
  - Page views by page
  - Game starts by game type
  - Game completions + completion rates
  - Events by day (last 30 days)
  - Top drop-off points
  - Return visit rate
- No auth for now (low priority — it's aggregate data, no PII)

### 6. Client-side flush (`src/components/AnalyticsProvider.tsx`)
- Client component that wraps the app
- On mount: starts a 60s interval that batches unsent events to `POST /api/analytics/events`
- On page unload: uses `navigator.sendBeacon()` to flush remaining events
- Tracks which events have been sent (index pointer in localStorage)
- Add to root layout

### 7. Update dashboard page (`src/app/stats/analytics/page.tsx`)
- Add a toggle: "Local Data" vs "Server Data"
- Server mode fetches from `GET /api/analytics/dashboard`
- Default to server mode when available

## Existing code to preserve
- `src/lib/analytics.ts` — keep ALL existing functions. Only add a `getUnsentEvents()` and `markEventsSent()` helper.
- All existing `track*()` calls across the codebase stay unchanged.

## Tests
- Verify POST endpoint rejects invalid event types
- Verify POST endpoint rejects oversized payloads
- Verify rate limiting kicks in after 10 requests/min
- Verify dashboard returns aggregated data

## Definition of Done
- Events flow from client → server → PostgreSQL
- Dashboard shows cross-user aggregated data
- sendBeacon flushes on page close
- Validation + rate limiting in place
- No existing functionality broken

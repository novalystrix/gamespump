# Cycle #235 Plan — Import / Export (Iteration 2/6)

## Existing State
- GamesPump has **no import/export feature** currently
- Player data stored in 10 localStorage keys across `gameHistory.ts`, `achievements.ts`, `analytics.ts`, `locale.ts`, `session.ts`
- Existing `/stats` page shows player stats and achievements
- Cycle #234 built import/export on monday-arcade (Nova) and a separate gamespump fork (Orion) — neither landed on the canonical `novalystrix/gamespump` repo
- Key lesson from #234: both agents must work on the same repo

## Specific Changes

### 1. New `src/lib/dataPortability.ts` module
- **`EXPORTABLE_KEYS`**: `gamespump_history`, `gamespump_total_games`, `gamespump_max_streak`, `gamespump_achievements`, `gamespump_shared`, `gamespump_locale`
- **Excluded** (device-specific analytics): `gamespump_events`, `gamespump_visitor_id`, `gamespump_session_id`, `gamespump_session_start`, `gamespump_analytics_sent_idx`, `gamespump_last_flush`, `gamespump_session`
- **`gatherExportData()`**: reads all exportable keys, returns `{ _meta: { version: 2, exportedAt, source: 'gamespump' }, data: Record<string, string|null> }`
- **`validateImportPayload(json)`**: checks `_meta.version`, validates `data` is object, validates known keys
- **`importData(payload, strategy: 'merge'|'replace')`**:
  - **merge**: for counters (`total_games`, `max_streak`) take max; for `history` union by roomCode+gameType keeping highest score, cap at 20; for `achievements` union keeping earliest `unlockedAt`; for `shared` OR; for `locale` keep existing
  - **replace**: clear exportable keys, write all from payload
- **`clearAllData()`**: removes all exportable keys

### 2. New `/data` page (`src/app/data/page.tsx`)
- Client component (`'use client'`)
- Two tabs: **Export** and **Import**
- **Export tab**: summary of current data (games played, achievements, streak), download JSON button, copy to clipboard button
- **Import tab**: file drop zone, file picker, paste textarea, parse → preview → confirm flow with merge/replace toggle
- **Danger zone**: clear all data with confirmation
- Back link to homepage
- Matches GamesPump's existing dark theme + Tailwind styling

### 3. Homepage link
- Add 💾 Data button next to 📊 Stats on `src/app/page.tsx`

## Files Affected
| File | Action |
|------|--------|
| `src/lib/dataPortability.ts` | CREATE — export/import/validate/merge logic |
| `src/app/data/page.tsx` | CREATE — UI page |
| `src/app/page.tsx` | EDIT — add Data link |

## Technical Details
- No server-side routes needed — all localStorage operations are client-side
- JSON schema version 2 (distinguishes from Orion's v1 on the fork)
- Export includes `_meta` with timestamp and source for provenance
- Merge logic reuses types from `gameHistory.ts` (`GameResult`) and `achievements.ts` (`UnlockedAchievement`)
- File size validation: reject imports > 1MB

## Verification Method
1. **Unit**: import/export logic tested manually via browser console
2. **Browser test**: open `/data`, verify export with seeded data, import valid JSON, import invalid JSON, merge correctness, tab switching
3. **Desktop + mobile (375px)** screenshots
4. **Build**: `npm run build` passes with no errors

# Mamad Games Plan — mamadgames.com

## Concept
Rebrand/localize GamesPump for the Israeli market as **משחקי ממ"ד** (Mamad Games).
Context: When missiles are fired at Israel, people run to the mamad (safe room) and wait.
They're stuck together with their phones. They need something to do RIGHT NOW.

**Tagline**: משחקים בממ"ד. בלי הורדות. בלי הרשמה. רק תשחקו.
(Play in the mamad. No downloads. No signup. Just play.)

## Domain
- **mamadgames.com** — purchased via Cloudflare ($10.46/year)
- Point to same Render app (gamespump) with custom domain
- Keep gamespump.onrender.com as a fallback

## Translation Scope

### Phase 1: Core UI (Hebrew)
Everything the user sees must be in Hebrew RTL.

**Files to translate:**
1. `src/app/page.tsx` — Homepage (hero, how-it-works, trust badges, game grid, CTAs)
2. `src/app/join/[code]/page.tsx` — Join page
3. `src/app/room/[code]/page.tsx` — Lobby (waiting room, player list, invite, game voting)
4. `src/app/stats/page.tsx` — Stats page
5. `src/app/not-found.tsx` — 404 page
6. `src/app/error.tsx` — Error page
7. `src/app/layout.tsx` — Metadata, title, description
8. `src/components/ShareResults.tsx` — Share text
9. `src/components/HowToPlay.tsx` — Game rules per game

**Game pages (10 total):**
- `src/app/game/[code]/trivia-clash/page.tsx`
- `src/app/game/[code]/word-blitz/page.tsx`
- `src/app/game/[code]/quick-draw/page.tsx`
- `src/app/game/[code]/memory-match/page.tsx`
- `src/app/game/[code]/this-or-that/page.tsx`
- `src/app/game/[code]/speed-math/page.tsx`
- `src/app/game/[code]/emoji-battle/page.tsx`
- `src/app/game/[code]/reaction-speed/page.tsx`
- `src/app/game/[code]/lie-detector/page.tsx`
- `src/app/game/[code]/color-chaos/page.tsx`

**SEO landing pages:**
- `src/app/games/[slug]/page.tsx` — All game descriptions + how to play

**Types/config:**
- `src/lib/types.ts` — Game names, descriptions in GAMES array

### Phase 2: RTL Support
- Add `dir="rtl"` to root layout for Hebrew
- Tailwind RTL plugin or manual adjustments
- Flip layout where needed (scores left, names right, etc.)
- Keep game canvases LTR (Quick Draw canvas, emoji grids)

### Phase 3: Content Localization
- **Trivia questions** — need Hebrew trivia questions (replace English ones)
- **Word Blitz** — need Hebrew letters + Hebrew word validation (big challenge)
- **Lie Detector prompts** — translate to Hebrew
- **This or That options** — translate/localize
- **Quick Draw words** — translate drawing prompts

### Phase 4: Hebrew-Specific Content
- **Mamad-themed games?** — "How long until the siren ends?" timer game, "What would you take to the mamad?" voting game
- **Hebrew social sharing** — share text in Hebrew
- **Israeli SEO** — target "משחקים בממד", "משחקים חינם", "משחקים לטלפון"

## Technical Approach

### Option A: i18n Framework (Recommended)
- Use `next-intl` or manual JSON locale files
- `/he/` prefix for Hebrew, `/en/` for English (or detect by domain)
- mamadgames.com → Hebrew by default
- gamespump.onrender.com → English by default
- Single codebase, dual presentation

### Option B: Hard Fork
- Simpler but doubles maintenance
- Copy the whole app, translate everything inline
- Not recommended

### Recommended: Option A with domain detection
```typescript
// In middleware.ts or layout.tsx
const locale = request.headers.get('host')?.includes('mamadgames') ? 'he' : 'en';
```

## OG Image / Branding
- New OG image with Hebrew text: "משחקי ממ"ד — משחקים ביחד בממ"ד"
- Keep the same game cover art (visual, language-neutral)
- New favicon? Or keep the gamepad

## SEO
- Hebrew meta tags for mamadgames.com
- Target keywords: משחקים בממד, משחקים חינם לטלפון, משחקים קבוצתיים, משחקים בלי הורדה
- Hebrew sitemap
- Blog posts targeting "מה לעשות בממד" (what to do in the mamad)

## Distribution Strategy
- **WhatsApp/Telegram groups** — "שלחו לקבוצת הממ"ד שלכם" (send to your mamad group)
- **Twitter/X Hebrew** — post during escalation events
- **r/Israel, r/hebrew** — community posts
- **Israeli Facebook groups** — parents, students, gaming
- **News sites** — pitch as "free app for mamad time"
- Timing is everything — be ready to push hard when escalation happens

## Priority Order
1. ✅ Buy domain (mamadgames.com)
2. Set up i18n infrastructure (next-intl or manual)
3. Translate homepage + lobby + game names
4. RTL support
5. Translate game UIs (start with simpler games: Reaction Speed, Emoji Battle, Speed Math, Color Chaos)
6. Hebrew trivia questions
7. Hebrew OG image + meta tags
8. Connect domain to Render
9. Social media push

## Timeline Estimate
- i18n setup: 1 hour
- Core UI translation: 2-3 hours
- RTL support: 1-2 hours
- Game translations: 3-4 hours (some games need new content)
- Total: ~1-2 days of focused work

## Notes
- Word Blitz in Hebrew is the hardest — needs Hebrew letter tiles + word validation. Consider replacing with a simpler Hebrew word game or deferring.
- Keep English as fallback for untranslated strings
- Game mechanics are universal — only UI text changes
- Trivia needs entirely new Hebrew question bank

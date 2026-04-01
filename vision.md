# GamesPump Vision

## What Is It
Free, instant party games — no signup, no downloads. Open the link, pick a name, play with friends. Mobile-first, designed for groups hanging out together (same room or remote).

## Live URL
https://gamespump.onrender.com

## Core Values
1. **Zero friction** — No accounts. No installs. 4-digit room codes. Under 10 seconds from link to lobby.
2. **Party energy** — Games are loud, fast, competitive. Rounds are short. Laughs are loud.
3. **Mobile-first** — Every interaction works on a phone screen with one thumb.
4. **Replayability** — Players should want to go "one more round" every time.

## Current Games (10) ✅ Target achieved
| Game | Type | Players | Duration |
|------|------|---------|----------|
| Quick Draw | Drawing + guessing | 3-8 | 3-5m |
| Word Blitz | Word racing | 2-8 | 2-3m |
| Trivia Clash | Trivia battles | 2-6 | 3-5m |
| Memory Match | Card matching | 2-4 | 3-5m |
| This or That | Opinion voting | 2-8 | 3-5m |
| Speed Math | Math racing | 2-6 | 3-5m |
| Emoji Battle | Visual search | 2-8 | 2-3m |
| Reaction Speed | Reflex test | 2-8 | 2-3m |
| Lie Detector | Social deception | 3-8 | 5-10m |
| Color Chaos | Stroop test | 2-8 | 3-5m |

## Stack
- Next.js 14, Tailwind CSS, TypeScript
- In-memory room state (server-side Map)
- Polling-based sync (no WebSocket yet)
- PWA-ready (install prompt)
- Cute animal avatars (Imagen 4 generated)

## North Star Metrics
- **Sessions per week** — are people coming back?
- **Games completed per session** — are they playing more than one?
- **Room size** — are people inviting friends?
- **Bounce rate** — do people leave before playing?

## Strategic Priorities
1. ✅ **Multi-round play** — DONE. All games support "play again" without leaving lobby.
2. ✅ **Speed scoring** — DONE. All 10 games reward faster answers.
3. ✅ **New games** — DONE. 10 games shipped (target was 10+).
4. ✅ **Social sharing** — DONE. Dynamic OG images, Web Share API, invite flow.
5. 🔄 **Sound & haptics** — All games have sound effects. Only Reaction Speed has haptics.
6. 🔲 **WebSocket migration** — move from polling to real-time for snappier gameplay.
7. ✅ **Analytics** — DONE. Client + server-side event tracking, all games instrumented.

## What We Don't Do
- No user accounts (keep it frictionless)
- No monetization yet (focus on engagement)
- No AI-generated content in gameplay (keep it human vs human)
- No heavy assets (stay fast on slow connections)

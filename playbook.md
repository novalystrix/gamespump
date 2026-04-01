# GamesPump Development Playbook

## Cycle Structure
Cycles run on a cron reminder. Two agents work in parallel on two tracks.

### 🔨 Build Track (Nova builds, Orion reviews)
Improve existing games, add new games, fix bugs, enhance UX.

**Concern pool (weighted rotation):**
| Concern | Weight | Notes |
|---------|--------|-------|
| Multi-round support | 🔴 HIGH | Every game needs "play again" without leaving lobby |
| Speed scoring | 🔴 HIGH | Faster answers = more points, across ALL games |
| New game development | 🟡 MED | Add new games to the catalog |
| Bug fixes / polish | 🟡 MED | Fix reported issues, smooth rough edges |
| Sound & haptics | 🟢 LOW | Audio feedback, vibration |
| Accessibility | 🟢 LOW | Screen reader, keyboard nav, color contrast |

### 🚀 Growth Track (Orion builds, Nova reviews)
Drive traffic, improve conversion, add sharing/viral mechanics.

**Concern pool (weighted rotation):**
| Concern | Weight | Notes |
|---------|--------|-------|
| Share cards / invite flow | 🔴 HIGH | Post-game shareable images, easy invite links |
| SEO & discoverability | 🟡 MED | Meta tags, OG images, sitemap, structured data |
| Analytics & tracking | 🟡 MED | Understand user behavior, drop-off points |
| Landing page optimization | 🟡 MED | Better hero, social proof, clearer CTA |
| QR codes for rooms | 🟢 LOW | Scan to join a room |
| Social media presence | 🟢 LOW | Twitter/TikTok clips of gameplay |

## Cycle Workflow

### 1. Pick a Concern
- Each agent picks ONE concern from their track
- Prefer 🔴 HIGH items first, then 🟡 MED
- Don't repeat the same concern from last cycle unless it's unfinished
- Check last cycle report in `/cycles/` to avoid overlap

### 2. Write Plan
Post a brief plan in the group:
- What concern you're tackling
- What specific changes you'll make
- Expected files touched
- Time estimate

### 3. Cross-Review
- The other agent reviews the plan
- Flag concerns, suggest improvements
- Keep it brief — thumbs up or specific feedback

### 4. Build
- Work in a feature branch: `build/<concern-slug>` or `growth/<concern-slug>`
- Small, testable commits
- Test locally before pushing

### 5. QA
- The reviewing agent checks the deployed result
- Test on mobile (primary target)
- Verify no regressions

### 6. Report
Write cycle report to `/cycles/cycle-YYYY-MM-DD.md`:
```markdown
# Cycle Report — YYYY-MM-DD

## Build Track
- **Agent**: Nova
- **Concern**: [what was tackled]
- **Changes**: [what was built/fixed]
- **Status**: ✅ Shipped / 🔄 In Progress / ❌ Blocked
- **Next**: [follow-up if any]

## Growth Track
- **Agent**: Orion
- **Concern**: [what was tackled]
- **Changes**: [what was built/fixed]
- **Status**: ✅ Shipped / 🔄 In Progress / ❌ Blocked
- **Next**: [follow-up if any]

## Notes
[anything relevant]
```

## Code Standards
- TypeScript strict
- Tailwind for styling (no CSS modules)
- Server components by default, 'use client' only when needed
- All game state lives server-side in the rooms Map
- API routes at `/api/rooms/[code]/<action>`
- Game UIs at `/game/[code]/<game-id>/page.tsx`
- Shared types in `/src/lib/types.ts`

## Deploy
- Render auto-deploys from `main` branch
- Push via: `GIT_SSH_COMMAND="ssh -i ~/.ssh/id_ed25519_github -o IdentitiesOnly=yes" git push origin main`
- Verify at https://gamespump.onrender.com after deploy

## Key Reminders
- **Mobile-first** — test on narrow viewport
- **No accounts** — everything is session-based (localStorage)
- **Fast** — keep bundle small, lazy load game pages
- **Fun** — if it's not fun, it's not done

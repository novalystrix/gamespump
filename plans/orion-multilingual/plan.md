# Per-Player Multilingual Game Content

## What
Make Trivia Clash and This or That serve game content in each player's language, so English and Hebrew players can play together in the same room.

## Why
"Make it multilingual" concern (w2) — players should play with their language of choice but in the same room together.

## Current State
- UI is fully bilingual (296 i18n keys, useLocale hook, language toggle)
- Game content is per-room: `room.locale` set by host, all players see same language
- Both en and he question sets exist for trivia + this-or-that
- Other games (Speed Math, Memory Match, Emoji Battle, Color Chaos, Reaction Speed) are language-agnostic

## Architecture

### Key Insight
The game-state API (`/api/rooms/[code]/game-state`) already sends per-player data (Quick Draw uses `pid` query param). We'll add a `locale` query param so each client gets content in their language.

### Changes

#### 1. Store both language versions in game state

**Trivia (`rooms.ts` — startGame trivia-clash case):**
- Fetch 10 questions from BOTH en and he pools
- Store as `questions_en` and `questions_he` in TriviaGameState
- Both arrays use the same `correctIndex` mapping (questions are different sets but same structure)

**This or That (`rooms.ts` — initThisOrThat):**
- Fetch 10 rounds from BOTH en and he pools  
- Store as `rounds_en` and `rounds_he` in ThisOrThatGameState

#### 2. Game state API serves per-locale content

**`/api/rooms/[code]/game-state` route:**
- Read `locale` query param from URL (default: 'he')
- For trivia-clash: pick question from `questions_en` or `questions_he` based on locale
- For this-or-that: pick round from `rounds_en` or `rounds_he` based on locale
- Response shape stays exactly the same (question/round object) — client doesn't know about dual storage

#### 3. Client passes locale in game-state poll

**All game pages that poll game-state:**
- Add `locale` param to the game-state fetch URL
- Client already has locale from `useLocale()` hook
- Change: `fetch(\`/api/rooms/${code}/game-state\`)` → `fetch(\`/api/rooms/${code}/game-state?locale=${locale}\`)`
- This affects: trivia-clash/page.tsx, this-or-that/page.tsx

#### 4. Update types

**TriviaGameState:**
- Add `questions_en: TriviaQuestion[]` and `questions_he: TriviaQuestion[]`
- Keep `questions` as the default (for backward compat / non-bilingual games)
- OR: replace `questions` with `questions_en` + `questions_he`

**ThisOrThatGameState:**
- Add `rounds_en: ThisOrThatRound[]` and `rounds_he: ThisOrThatRound[]`
- Keep `rounds` as default

#### 5. Answer validation stays unchanged
- Trivia answers are by index (correctIndex), not by text — works in any language
- This or That votes are 'A' or 'B' — language-agnostic
- No changes needed to answer submission routes

## Files to modify
- `src/lib/types.ts` — add bilingual fields to TriviaGameState and ThisOrThatGameState
- `src/lib/rooms.ts` — startGame trivia case + initThisOrThat to store both language versions
- `src/app/api/rooms/[code]/game-state/route.ts` — read locale param, serve correct language
- `src/app/game/[code]/trivia-clash/page.tsx` — pass locale in game-state fetch URL
- `src/app/game/[code]/this-or-that/page.tsx` — pass locale in game-state fetch URL

## Files NOT modified
- Question/answer submission routes (index-based, language-agnostic)
- Other 8 game pages (already language-agnostic)
- i18n keys (UI is already bilingual)
- Locale hook / locale system

## Definition of Done
- English player and Hebrew player in same room each see questions in their language
- Answer validation works regardless of language
- Existing single-language rooms still work (backward compat)
- No performance regression from storing 2x questions

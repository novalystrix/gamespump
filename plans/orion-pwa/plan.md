# PWA Support for GamesPump

## What
Make GamesPump installable as a Progressive Web App — home screen icon, standalone display, basic offline shell.

## Why
Marketing & Distribution (w2) — mobile-first party game should feel like a native app. PWA install = one tap, no app store. Increases return visits and perceived quality.

## How

### 1. Web App Manifest (`public/manifest.json`)
- name: "GamesPump"
- short_name: "GamesPump"
- start_url: "/"
- display: "standalone"
- theme_color: "#7c3aed" (purple to match the app)
- background_color: "#0f0f23" (dark background)
- icons: use existing favicon/logo or generate simple ones
- Categories: ["games", "entertainment"]

### 2. Apple Meta Tags (in layout.tsx `<head>`)
- `apple-mobile-web-app-capable`: yes
- `apple-mobile-web-app-status-bar-style`: black-translucent
- `apple-touch-icon`: 180x180 icon
- `theme-color` meta tag

### 3. Service Worker (`public/sw.js`)
- Basic cache-first for static assets (JS, CSS, fonts, images)
- Network-first for API routes
- Offline fallback page (simple "You're offline" message)
- Register in a client component

### 4. Install Prompt Component (`src/components/InstallPrompt.tsx`)
- Listen for `beforeinstallprompt` event
- Show a non-intrusive bottom banner: "Install GamesPump for the best experience"
- Dismiss button + "Install" button
- Only show after 2+ page views (check localStorage counter)
- Persist dismissal in localStorage (don't nag)
- i18n keys for en/he

### 5. PWA Icons
- Generate simple GamesPump icons at 192x192 and 512x512
- Use the existing emoji/branding style
- Place in public/icons/

## Files to create
- `public/manifest.json`
- `public/sw.js`
- `public/icons/icon-192.png` (placeholder or generated)
- `public/icons/icon-512.png` (placeholder or generated)
- `src/components/InstallPrompt.tsx`
- `src/components/ServiceWorkerRegister.tsx`

## Files to modify
- `src/app/layout.tsx` — add manifest link, Apple meta tags, ServiceWorkerRegister component
- `src/locales/en.json` — add install prompt strings
- `src/locales/he.json` — add install prompt strings

## Definition of Done
- Lighthouse PWA audit passes (installable)
- "Add to Home Screen" works on Android Chrome
- iOS Safari shows proper standalone mode
- Install banner appears after 2+ visits
- Service worker caches static assets

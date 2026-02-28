# PWA Trial Distribution — Progress

## Goal
Deploy ChefOS web app as a full PWA for friend trials with real auth, while keeping a secret dev bypass for admin/dev access.

## ALL STEPS COMPLETED

- [x] **devMode.ts** — Secret URL param (`?dev=true` / `?dev=false`) + localStorage persistence
- [x] **vite-plugin-pwa** — Installed as dev dependency
- [x] **vite.config.ts** — VitePWA plugin configured with auto-update service worker, workbox caching (Supabase API + static assets), offline fallback, 8MB precache limit
- [x] **PWAInstallPrompt.tsx** — Install banner with dismiss/remember, teal ChefOS branding
- [x] **offline.html** — Offline fallback page with retry button
- [x] **App.tsx** — PWAInstallPrompt mounted alongside ChefAIChat
- [x] **Build** — Successful. Service worker generated (sw.js + workbox), 20 precached entries

## Files Changed
| File | Change |
|------|--------|
| `apps/web/src/lib/devMode.ts` | `?dev=true` URL param + localStorage (was hardcoded `true`) |
| `apps/web/package.json` | Added `vite-plugin-pwa` devDep |
| `apps/web/vite.config.ts` | Added VitePWA plugin config |
| `apps/web/src/components/PWAInstallPrompt.tsx` | NEW — install prompt UI |
| `apps/web/public/offline.html` | NEW — offline fallback |
| `apps/web/src/App.tsx` | Imported + mounted `<PWAInstallPrompt />` |

## Next: Deploy to Vercel
1. Commit and push to your connected repo
2. Vercel auto-deploys
3. **Your link:** `yourapp.vercel.app` → friends get real auth
4. **Your admin link:** `yourapp.vercel.app?dev=true` → bypasses auth, persists in browser
5. **Revoke access:** tell them to visit `?dev=false`

## How Dev Access Works
- **Friends (trial):** share plain URL → real signup/login via Supabase
- **Devs/Admin:** share URL with `?dev=true` → full bypass, sticks in localStorage
- **Revoke:** `?dev=false` clears the bypass
- **Organic upgrade:** when native apps hit stores, friends log in with same credentials — all data transfers

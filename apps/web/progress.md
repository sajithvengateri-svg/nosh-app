# ChefOS Web App — Progress

## 1. PWA Trial Distribution — DONE

- [x] `devMode.ts` — Secret URL param (`?dev=true` / `?dev=false`) + localStorage persistence
- [x] `vite-plugin-pwa` — Installed, VitePWA plugin configured with auto-update SW, workbox caching, offline fallback
- [x] `PWAInstallPrompt.tsx` — Install banner with dismiss/remember
- [x] `offline.html` — Offline fallback page with retry button
- [x] Build successful — SW generated, 20 precached entries

## 2. Variant System — Mobile Tab Mirroring — DONE

All three web variants now mirror their mobile counterparts.

- [x] **BottomNav.tsx** — Rebuilt with 3 fixed tab layouts:
  - HomeChef: Home | My Recipes | My Kitchen | Safety | Games
  - EatSafe: Home | Food Safety | Scanner | Reports | Settings
  - ChefOS Pro: Home | Recipes | Kitchen | Safety | Games
- [x] **Kitchen.tsx** — HomeChef gets hub grid (7 items: Prep Lists, Pantry, Cost Calc, Equipment, Calendar, Housekeeping, Cheatsheets) + simplified Ingredients/Pantry tabs. Pro keeps full 7-tab layout.
- [x] **StoreMode type** — Added `'food_safety'` to union type
- [x] **modeConfig.ts** — Added `food_safety` to MODE_MODULES/MODE_FEATURES, added `isEatSafeMode()` helper
- [x] **Dashboard.tsx** — Renders variant-specific dashboards (HomeCookDashboard, EatSafeDashboard, or Pro)

## 3. Auth Flow Fixes — DONE

- [x] **Duplicate `/food-safety` route** — Public landing moved to `/food-safety-landing`, protected dashboard keeps `/food-safety`
- [x] **ProtectedRoute.tsx** — Added Nosh/PrepMi path detection, redirects unauthenticated `/nosh/*` users to `/nosh/auth`
- [x] **OAuth redirect loop** — Fixed `redirectTo` from `/auth` (loop) to `/dashboard`
- [x] **Nosh/PrepMi consolidation** — All `/prepmi/*` routes redirect to canonical `/nosh/*` paths. Added missing `/prepmi/admin` redirect.
- [x] **Auth.tsx store_mode derivation** — Now correctly derives `food_safety` mode from signup source param

### Updated references for `/food-safety-landing`:
| File | Change |
|------|--------|
| `App.tsx` | Route changed to `/food-safety-landing` |
| `CrossMarketFooter.tsx` | AU foodsafety link updated |
| `linkRegistry.ts` | Landing page path updated |
| `seoConfig.ts` | SEO key updated |
| `FoodSafetyLanding.tsx` | Self-references updated |
| `AdminFoodSafetyLanding.tsx` | Preview URL updated |
| `AdminAppLaunch.tsx` | Launch link updated |

## 4. Dev Hub & Share Pages — DONE

- [x] **dev.html** — All 27 variants with Landing/Web App/Mobile columns per variant
- [x] **share.html** — Shareable portfolio page with 8 region toggles (AU, IN, UAE, UK, SG, US, Standalone, Consumer), URL param persistence, copy share link
- [x] **vercel.json** — Negative lookahead regex excludes static HTML from SPA catch-all
- [x] **Link fix** — All links updated from non-existent subdomains (`homechef.chefos.ai`) to correct path-based routes (`chefos.ai/home-cook`)

### Live URLs:
- Dev hub: `https://chefos.ai/dev.html`
- Share page: `https://chefos.ai/share.html`

## 5. Shared Package + Feature Gate Fixes — DONE

Fixed type divergence between shared package and web-local types, and corrected EatSafe feature gating.

- [x] **StoreMode shared type** — Added `'food_safety'` to `packages/shared/src/types/store.types.ts` (was only in web-local)
- [x] **Shared modeConfig** — Added `food_safety` to `MODE_MODULES`/`MODE_FEATURES`, added `isEatSafeMode()` to `packages/shared/src/lib/modeConfig.ts`
- [x] **Shared index.ts** — Exported `isEatSafeMode` from shared package
- [x] **useFeatureGate.ts** — Fixed EatSafe blind spot: `food_safety` mode now maps to `eatsafe_au` variant (was falling through to `chefos`)
- [x] **FoodSafetyLanding.tsx** — Fixed missing `&source=food_safety` on final CTA fallback link

## 6. Auth Variant Branding — DONE

Auth page now shows variant-appropriate branding for all 7 active variants.

- [x] **Auth.tsx branding** — Title/subtitle/logo-link now variant-aware:
  - ChefOS → "ChefOS" / "Kitchen Management System"
  - HomeChef → "ChefOS Home" / "Home Kitchen Organiser"
  - EatSafe → "EatSafe" / "Food Safety Compliance"
  - MoneyOS → "MoneyOS" / "Financial Intelligence for Kitchens"
- [x] **Auth.tsx redirects** — Post-auth redirect is now variant-aware:
  - MoneyOS users → `/money/reactor`
  - All others → `/dashboard`
- [x] **Form labels** — Org name field shows "Business Name" for EatSafe (was "Kitchen / Restaurant Name")

## 7. Prep Mi Separation — PLANNED (Not Started)

Full separation of Prep Mi consumer app into its own repo, Supabase project, and Vercel deployment. Plan saved but deferred for later.

---

## Architecture Notes

### Domain: `chefos.ai` (served from `nosh-app` Vercel project)
### Supabase: `gmvfjgkzbpjimmzxcniv`

### Variant Detection Flow:
1. Landing pages pass `source` and `mode` query params to `/auth`
2. `Auth.tsx` derives `store_mode` from params
3. `signUp()` stores `store_mode` in org metadata
4. `OrgContext` reads `storeMode` from org
5. Components use `isHomeCookMode()` / `isEatSafeMode()` for conditional rendering

### Key Route Patterns:
- `/` — ChefOS Pro landing
- `/home-cook` — HomeChef landing
- `/food-safety-landing` — EatSafe landing (public)
- `/food-safety` — Food safety dashboard (protected)
- `/chefos-india`, `/home-cook-india`, `/food-safety-india` — India variants
- `/chefos-gcc`, `/home-cook-gcc`, `/food-safety-gcc` — GCC variants
- `/nosh` — Prep Mi consumer landing
- `/vendor-landing` — VendorOS landing
- `/money-landing` — MoneyOS landing

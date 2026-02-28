# Queitos - Kitchen & Restaurant Management Platform

## Stack
- Monorepo: apps/web (Vite React SPA) + apps/mobile (Expo RN) + packages/shared
- Backend: Supabase (Auth, PostgREST, Realtime, Storage, Edge Functions)
- Deploy: Vercel (web) + EAS (mobile)
- UI: Radix/shadcn + Tailwind (web), NativeWind + custom UI (mobile)
- State: Zustand + React Query v5
- Forms: React Hook Form + Zod

## Architecture Patterns

### Web Portals (apps/web/src/portals/)
Each portal: own dir → Layout.tsx + Sidebar + BottomNav + pages/
Register in: App.tsx (lazy routes) + lib/shared/appRegistry.ts
16 portals: bev, clock, restos, labour, supply, growth, money, quiet, overhead, reservation, admin, vendor, wing, games

### Mobile App (apps/mobile/)
Expo Router file-based routing: app/(app)/(tabs)/ for tabs, app/(app)/{feature}/ for screens
Providers: Auth → Org → Theme → Toast (all wrap routes in _layout.tsx)
Variants: chefos, homechef, eatsafe_brisbane, india_fssai (via APP_VARIANT env)
Feature gating: useFeatureGate() hook + VARIANT_BASE_FEATURES

### Sub-App Mobile Strategy
- React Native: Dashboard + Dashboard Settings ONLY
- Web: Everything else (deep CRUD, reports, config)
- Exception: ResOS gets RN for reservation management

### Database
- All tables: id UUID, org_id UUID, created_at, updated_at
- RLS everywhere: org_id IN (SELECT get_user_org_ids(auth.uid()))
- Photo evidence: Supabase Storage → public URL → DB column
- Realtime: useRealtime() hook (web), Supabase channel subscriptions (mobile)

### Spinoff Checklist (New Portal)
1. DB migration: supabase/migrations/YYYYMMDD_{name}.sql
2. Web portal: apps/web/src/portals/{name}/ (Layout, Sidebar, BottomNav, pages/)
3. Register: App.tsx routes + appRegistry.ts entry
4. Mobile dashboard: apps/mobile/app/(app)/{name}/index.tsx
5. Mobile settings: apps/mobile/app/(app)/{name}/settings.tsx
6. Hook: apps/mobile/hooks/use{Name}Dashboard.ts
7. Feature gate: add to VARIANT_BASE_FEATURES if needed

## Key Files
- Web router: apps/web/src/App.tsx
- Portal registry: apps/web/src/lib/shared/appRegistry.ts
- Mobile root layout: apps/mobile/app/_layout.tsx
- Mobile tabs: apps/mobile/app/(app)/(tabs)/_layout.tsx
- Mobile auth: apps/mobile/contexts/AuthProvider.tsx
- Mobile org: apps/mobile/contexts/OrgProvider.tsx
- Shared types: packages/shared/src/
- Edge function utils: supabase/functions/_shared/ (auth.ts, ai.ts, usage.ts)

## Design System & Brand

### Brand Identity
- Culinary theme: warm copper/amber primary with sage green accents
- Fonts: DM Sans (body), Playfair Display (headings/display)
- Each portal has its own gradient for visual identity

### Web Design Tokens (CSS Variables in apps/web/src/index.css)
- Primary: hsl(25 85% 45%) — copper/amber
- Accent: hsl(145 25% 40%) — sage green
- Destructive: hsl(0 72% 51%) — red
- Warning: hsl(38 92% 50%) — amber
- Success: hsl(145 45% 42%) — green
- Background: hsl(30 25% 97%) — warm off-white
- Radius: 0.75rem (12px base)
- Gradients: --gradient-copper (135deg copper-to-gold), --gradient-warm (vertical warm bg)

### Mobile Theme Colors (apps/mobile/contexts/ThemeProvider.tsx)
- 8 themes: Light, Dark, Pink Onion, Rainbow, Ocean, Terminal, Lavender, System
- All components use `useTheme()` → `colors.{token}` pattern
- Tokens: background, surface, card, cardBorder, text, textSecondary, textMuted, accent, accentBg, success, successBg, warning, warningBg, destructive, destructiveBg, border, inputBg
- Default accent: #6366F1 (Indigo)

### Portal Gradients (appRegistry.ts)
- ChefOS: from-orange-500 to-amber-500
- BevOS: from-purple-500 to-fuchsia-500
- RestOS: from-rose-500 to-pink-500
- ResOS: from-teal-500 to-cyan-500
- LabourOS: from-sky-500 to-blue-500
- SupplyOS: from-emerald-500 to-green-500
- GrowthOS: from-yellow-500 to-orange-500
- MoneyOS: from-lime-500 to-emerald-500
- OverheadOS: from-amber-500 to-yellow-600
- QuietOS: from-indigo-500 to-violet-500

### Component Patterns (Must Reuse)
- Web: shadcn/ui components in apps/web/src/components/ui/
- Mobile: custom components in apps/mobile/components/ui/ (Card, Button, Badge, Input, Skeleton, ScreenHeader, Modal, Tabs, Avatar, Select, DatePicker)
- Mobile features: apps/mobile/components/features/ (StatCard, CommandCentre, KitchenWall, etc.)
- Always use useTheme() colors — never hardcode colors in mobile components
- Button variants: default (#6366F1), secondary (#F3F4F6), outline (transparent+border), ghost, destructive (#DC2626)
- Badge variants: default, secondary, success, warning, destructive, outline
- Card: borderRadius 16, uses colors.card/cardBorder, shadow

### Typography Scale
- Hero/large number: fontSize 48, fontWeight 800
- Stat value: fontSize 28, fontWeight 800
- Page title (ScreenHeader): fontSize 20, fontWeight 800
- Card title: fontSize 18, fontWeight 700
- Section header: fontSize 16, fontWeight 700
- Body: fontSize 15
- Label: fontSize 13-14, fontWeight 500-600
- Small/badge: fontSize 12, fontWeight 600

### Spacing
- Screen padding: 16px horizontal
- Card padding: 20px (via CardContent)
- Gap between cards: 12px
- Section gap: 16px
- Border radius: buttons 12px, cards 16px, badges 9999px (pill), inputs 8px

## Existing Portals with Spinoff Potential
- AuditOS: from food_safety_logs + audit tables → multi-site auditing
- TrainingOS: from training_materials + records → L&D management
- SafetyOS: from food safety module → standalone compliance
- EventOS: from VenueFlow + res_functions → event management
- StockOS: from inventory + stocktakes → warehouse management
- HROS: from employee_profiles + labour → HR management

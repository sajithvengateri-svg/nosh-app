# ChefOS — Restaurant Intelligence Platform

Multi-variant restaurant management platform built with Supabase, Vercel, Expo, and Claude Code.

## Architecture

```
┌─────────────────────┐     ┌──────────────────────┐
│  Vercel (Web SPA)   │     │  Expo/EAS (Mobile)   │
│  apps/web           │     │  apps/mobile         │
│  - Admin portal     │     │  - ChefOS Pro        │
│  - Dev tools        │     │  - HomeChef          │
│  - Dashboard        │     │  - EatSafe Brisbane  │
│                     │     │  - ChefOS India      │
└────────┬────────────┘     └────────┬─────────────┘
         │                           │
         └───────────┬───────────────┘
                     │  Supabase Client SDK
                     v
┌──────────────────────────────────────────────────┐
│  Supabase (Backend)                              │
│  ├─ Auth (email/password, Google, Apple)         │
│  ├─ PostgreSQL (30+ tables, RLS)                 │
│  ├─ Edge Functions (64 total, 31 use AI)         │
│  ├─ Storage (food-safety, recipe-images, posts)  │
│  └─ Realtime subscriptions                       │
└──────────────────────────────────────────────────┘
```

## App Variants

| Variant | ENV | Bundle ID | Focus |
|---------|-----|-----------|-------|
| ChefOS Pro | `chefos` | `com.chefos.pro` | Full restaurant ops |
| HomeChef | `homechef` | `com.chefos.homechef` | Home cook lite |
| EatSafe Brisbane | `eatsafe_brisbane` | `com.eatsafe.brisbane` | BCC food safety |
| ChefOS India | `india_fssai` | `com.chefos.india` | FSSAI compliance |

## Development

### Prerequisites
- Node.js 18+
- Expo CLI
- Supabase CLI

### Mobile App
```bash
# Run default (ChefOS)
cd apps/mobile && npx expo start

# Run specific variant
APP_VARIANT=eatsafe_brisbane npx expo start
APP_VARIANT=india_fssai npx expo start
```

### Web App
```bash
cd apps/web && npm run dev
```

### Edge Functions
```bash
supabase functions serve
supabase functions deploy
```

## Project Structure

```
queitos/
├── apps/
│   ├── mobile/          # Expo React Native app (4 variants)
│   └── web/             # Vite React SPA (admin + dashboard)
├── packages/
│   └── shared/          # Shared types & config
├── supabase/
│   ├── functions/       # 64 edge functions
│   └── migrations/      # Database migrations
└── .github/workflows/   # CI/CD
```

# NOSH — Brand & Development Guide

## App Identity
- **Name**: NOSH (always uppercase)
- **Bundle ID**: com.noshapp.app
- **Stack**: Expo SDK 55 + React Native Web + TypeScript
- **Deploy**: `npx expo export --platform web` then `build-web.sh` then `vercel --prod`
- **URL**: https://dist-mocha-sigma-90.vercel.app
- **Run locally**: `cd ~/dinners-sorted && npx expo start --ios` or `--web`

## Brand Rules
- NO emojis anywhere in UI text, labels, buttons, or cards
- Light mode only (`userInterfaceStyle: "light"`)
- Warm, premium, editorial feel — not playful/childish
- Glass morphism on companion/canvas screen ONLY — plain Views everywhere else
- Haptic feedback on every interaction (lightTap, mediumTap, successNotification)

## Design Tokens — Always Use These

### Colors (import from `constants/colors`)
Use `Colors.*` for static, `getTheme()` for dynamic theme support.
```
primary:    #D94878   (CTAs, active states)
secondary:  #2A1F2D   (headers, dark text)
background: #FBF6F8   (screen bg)
card:       #FDFBFC   (card surfaces)
success:    #5BA37A   (positive states)
alert:      #E8A93E   (warnings)
wine:       #4A1528   (wine card bg)
cocktail:   #2D1A3A   (cocktail card bg)
text.primary:   #2A1F2D
text.secondary: #7A6B75
text.muted:     #A89DA3
border:     #E8DDE2
divider:    #F2ECF0
```

### Typography (import from `constants/typography`)
```
Heading:  Fraunces (serif) — titles, hero text, editorial
Body:     Inter (sans-serif) — all body text, labels, buttons
Mono:     JetBrains Mono — ingredients, technical data

Sizes: xs=12  sm=14  base=16  lg=18  xl=20  2xl=24  3xl=30  4xl=36
Weights: 400 body, 500 medium, 600 semibold labels, 700 bold headings
```

### Spacing (8px base unit)
```
xs=4  sm=8  md=16  lg=24  xl=32  xxl=48
Card padding: 16-20px
Card gap in feed: 4px
Section gaps: 24-32px
```

### Border Radius
```
card=20  button=24  pill=9999  companion=26
```

### Shadows (soft, diffused only)
```
Standard: color rgba(0,0,0,0.05), offset {0,4}, radius 12
Heavy:    color rgba(0,0,0,0.10), offset {0,8}, radius 24
```

### Glass (canvas/companion screen ONLY)
```
surface:      rgba(255,255,255,0.35)
surfaceDark:  rgba(42,31,45,0.3)
borderLight:  rgba(255,255,255,0.4)
blur: 40 (expo-blur intensity)
```

## Icons
- Library: `lucide-react-native`
- Default strokeWidth: 1.5 (use 1.75 for emphasis)
- Sizes: 12 tiny, 16 small, 20 standard, 24 large, 28+ hero

## Animations (React Native Animated API)
- Quick tap: `spring({ speed: 50, bounciness: 8 })`
- Soft entrance: `spring({ damping: 25, stiffness: 200 })`
- Stagger: 80-100ms delay between items
- Breathing: scale 1.0-1.04, 1500ms each direction
- Always `useNativeDriver: true`

## Haptics (import from `lib/haptics`)
- `lightTap()` — button press, card tap
- `mediumTap()` — significant action, sheet drag
- `successNotification()` — save, like, complete
- `selectionTap()` — swipe threshold

## Component Patterns
- Cards: Use `GlassCard` on canvas, plain `View` with `Glass.shadowLight` elsewhere
- Overlays: `OverlaySheet` (bottom sheet with pan-to-dismiss)
- Feed cards: Full-width, 20px borderRadius, 4px gap
- Badges: borderRadius 9999, paddingVertical 4, paddingHorizontal 10
- Uppercase labels: fontSize 11, letterSpacing 0.5-0.8, fontWeight 700

## File Structure
```
src/constants/colors.ts      — all colors, themes, Glass, spacing
src/constants/typography.ts   — fonts, sizes
src/components/               — GlassCard, GlassView (shared)
src/features/feed/            — feed cards, swipe, action bar
src/features/companion/       — bubble, quick menu
src/features/canvas/          — canvas screen, ticker, responses
src/features/overlays/        — settings, profile, chat sheets
src/lib/companion/            — companion store, wake word
src/lib/stores/               — zustand stores
src/lib/haptics.ts            — haptic helpers
app/(app)/feed.tsx            — main screen (canvas + feed)
```

## 6 Themes Available
pink_onion (default), kitchen, ocean, terminal, lavender, rainbow
All share the same structure — swap primary/secondary/bg/card/text colors.

## What NOT to Do
- No BlurView outside canvas/companion (removed — was annoying)
- No emojis in any UI
- No dark mode (light only)
- No Reanimated (included but unused — stick with Animated API)
- No new dependencies without good reason
- No over-engineering — minimal code for the task

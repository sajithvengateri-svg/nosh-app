#!/bin/bash
# Build NOSH web app with all post-export patches
set -e

echo "→ Building web bundle..."
npx expo export --platform web --clear

echo "→ Copying public assets..."
cp public/* dist/ 2>/dev/null || true
cp vercel.json dist/ 2>/dev/null || true

echo "→ Patching index.html..."
# Fix: Expo generates <script defer> but Zustand devtools uses import.meta
# which requires type="module". Also add PWA meta tags.
sed -i '' 's|<script src="\(/_expo/static/js/web/entry-[^"]*\.js\)" defer></script>|<script type="module" src="\1"></script>|' dist/index.html

# Add PWA meta tags after <title>
sed -i '' 's|<meta name="viewport" content="[^"]*" />|<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />|' dist/index.html

echo "→ Done! Deploy with: npx vercel deploy dist --prod --yes"

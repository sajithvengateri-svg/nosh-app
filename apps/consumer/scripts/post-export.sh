#!/bin/bash
# Post-export: patch index.html for fullscreen PWA + copy public assets
set -e

DIST="dist"

# Copy public assets into dist
cp -r public/* "$DIST/" 2>/dev/null || true

# Copy vercel.json for SPA rewrites
cp vercel.json "$DIST/" 2>/dev/null || true

# Patch viewport meta for fullscreen
sed -i '' 's/width=device-width, initial-scale=1, shrink-to-fit=no/width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover/' "$DIST/index.html"

# Insert PWA meta tags after <title>
sed -i '' '/<\/title>/a\
\    <!-- Full-screen PWA -->\
\    <meta name="apple-mobile-web-app-capable" content="yes" />\
\    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />\
\    <meta name="apple-mobile-web-app-title" content="NOSH" />\
\    <meta name="mobile-web-app-capable" content="yes" />\
\    <meta name="theme-color" content="#FBF8F4" />\
\    <link rel="manifest" href="/manifest.json" />\
\    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />\
\    <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
' "$DIST/index.html"

# Patch CSS: add 100dvh, safe-area, background
sed -i '' 's/height: 100%;/height: 100%; height: 100dvh;/g' "$DIST/index.html"
sed -i '' '/body {/a\
\      overscroll-behavior: none;\
\      -webkit-overflow-scrolling: touch;\
\      background-color: #FBF8F4;
' "$DIST/index.html"

echo "Post-export: PWA patching complete"

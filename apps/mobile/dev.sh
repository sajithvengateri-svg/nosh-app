#!/bin/zsh
# Quick variant switcher — one server at a time, one port (8081)
# Usage: ./dev.sh [variant] [--sim]
#   ./dev.sh              → menu picker
#   ./dev.sh india --sim  → start EatSafe India + open simulator
#   ./dev.sh london       → start EatSafe London

set -e
cd "$(dirname "$0")"

PORT=8081

# Resolve shortcut name to APP_VARIANT value
resolve_shortcut() {
  case "$1" in
    chefos)      echo "chefos" ;;
    home|homechef) echo "homechef" ;;
    brisbane)    echo "eatsafe_brisbane" ;;
    india|fssai) echo "india_fssai" ;;
    chefos-in)   echo "chefos_in" ;;
    home-in)     echo "homechef_in" ;;
    uae|dubai|gcc) echo "gcc_uae" ;;
    chefos-uae)  echo "chefos_uae" ;;
    home-uae)    echo "homechef_uae" ;;
    london)      echo "eatsafe_london" ;;
    uk|chefos-uk) echo "chefos_uk" ;;
    home-uk)     echo "homechef_uk" ;;
    sg|singapore) echo "eatsafe_sg" ;;
    chefos-sg)   echo "chefos_sg" ;;
    home-sg)     echo "homechef_sg" ;;
    ny)          echo "eatsafe_ny" ;;
    us|chefos-us) echo "chefos_us" ;;
    home-us)     echo "homechef_us" ;;
    nosh)        echo "nosh" ;;
    *)           echo "$1" ;;
  esac
}

# Resolve menu number to APP_VARIANT value
resolve_number() {
  case "$1" in
    1)  echo "chefos" ;;
    2)  echo "homechef" ;;
    3)  echo "eatsafe_brisbane" ;;
    4)  echo "chefos_in" ;;
    5)  echo "homechef_in" ;;
    6)  echo "india_fssai" ;;
    7)  echo "chefos_uae" ;;
    8)  echo "homechef_uae" ;;
    9)  echo "gcc_uae" ;;
    10) echo "chefos_uk" ;;
    11) echo "homechef_uk" ;;
    12) echo "eatsafe_london" ;;
    13) echo "chefos_sg" ;;
    14) echo "homechef_sg" ;;
    15) echo "eatsafe_sg" ;;
    16) echo "chefos_us" ;;
    17) echo "homechef_us" ;;
    18) echo "eatsafe_ny" ;;
    19) echo "nosh" ;;
    *)  echo "" ;;
  esac
}

# Parse args
VARIANT=""
OPEN_SIM=false
for arg in "$@"; do
  case "$arg" in
    --sim|-s) OPEN_SIM=true ;;
    *) VARIANT="$(resolve_shortcut "$arg")" ;;
  esac
done

# Interactive menu if no variant given
if [ -z "$VARIANT" ]; then
  echo ""
  echo "  ┌────────────────────────────────────────────────────────┐"
  echo "  │   Pick a variant to test                              │"
  echo "  ├────────────────────────────────────────────────────────┤"
  echo "  │                                                        │"
  echo "  │  AUSTRALIA                                             │"
  echo "  │   1) ChefOS        2) HomeChef      3) EatSafe Bris   │"
  echo "  │                                                        │"
  echo "  │  INDIA                                                 │"
  echo "  │   4) ChefOS IN     5) HomeChef IN   6) EatSafe India  │"
  echo "  │                                                        │"
  echo "  │  UAE                                                   │"
  echo "  │   7) ChefOS UAE    8) HomeChef UAE  9) EatSafe UAE    │"
  echo "  │                                                        │"
  echo "  │  UK                                                    │"
  echo "  │  10) ChefOS UK    11) HomeChef UK  12) EatSafe London │"
  echo "  │                                                        │"
  echo "  │  SINGAPORE                                             │"
  echo "  │  13) ChefOS SG    14) HomeChef SG  15) EatSafe SG    │"
  echo "  │                                                        │"
  echo "  │  US                                                    │"
  echo "  │  16) ChefOS US    17) HomeChef US  18) EatSafe NY    │"
  echo "  │                                                        │"
  echo "  │  CONSUMER                                              │"
  echo "  │  19) Nosh                                              │"
  echo "  │                                                        │"
  echo "  └────────────────────────────────────────────────────────┘"
  echo ""
  printf "  Enter number (1-19): "
  read choice
  VARIANT="$(resolve_number "$choice")"
  if [ -z "$VARIANT" ]; then
    echo "  Invalid choice."
    exit 1
  fi
  echo ""
  echo "  How do you want to run it?"
  echo "   1) Phone only (QR code for Expo Go)"
  echo "   2) iOS Simulator"
  echo "   3) Web browser"
  echo "   4) Phone + Simulator"
  echo ""
  printf "  Enter choice (1-4) [1]: "
  read run_choice
  run_choice="${run_choice:-1}"
fi

echo ""
echo "  Starting: $VARIANT on port $PORT"
echo ""

# Kill any existing Expo server on this port
EXISTING_PID=$(lsof -ti :$PORT 2>/dev/null || true)
if [ -n "$EXISTING_PID" ]; then
  echo "  Killing existing server on port $PORT (pid $EXISTING_PID)..."
  kill $EXISTING_PID 2>/dev/null || true
  sleep 1
fi

# Build extra flags based on run choice
EXTRA_FLAGS=""
case "${run_choice:-0}" in
  2) EXTRA_FLAGS="--ios" ;;
  3) EXTRA_FLAGS="--web" ;;
  4) EXTRA_FLAGS="--ios" ;;
esac

# Also apply --sim flag from CLI args
if [ "$OPEN_SIM" = true ]; then
  EXTRA_FLAGS="--ios"
fi

echo "  ─────────────────────────────────"
echo "  Scan QR with Expo Go on phone"
echo "  Press 'w' for web browser"
echo "  Press 'i' for iOS simulator"
echo "  Press 'a' for Android emulator"
echo "  ─────────────────────────────────"
echo ""

if [ "$VARIANT" = "nosh" ]; then
  cd "$HOME/dinners-sorted"
  exec npx expo start --port $PORT --clear $EXTRA_FLAGS
else
  export APP_VARIANT=$VARIANT
  exec npx expo start --port $PORT --clear $EXTRA_FLAGS
fi

#!/bin/zsh
# Run multiple app variants at once — each on its own port
# Usage: ./dev-multi.sh [variant1] [variant2] [variant3]
#   ./dev-multi.sh brisbane chefos india
#   ./dev-multi.sh              → interactive picker (up to 3)
#
# Each variant gets its own port:
#   Slot 1 → :8081    Slot 2 → :8082    Slot 3 → :8083
# Press Ctrl+C to kill all.

set -e
cd "$(dirname "$0")"

PORTS=(8081 8082 8083)
MAX_SLOTS=3
PIDS=()

cleanup() {
  echo ""
  echo "  Shutting down all servers..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  # Kill any leftover processes on our ports
  for port in "${PORTS[@]}"; do
    lsof -ti :"$port" 2>/dev/null | xargs kill 2>/dev/null || true
  done
  echo "  All stopped."
  exit 0
}
trap cleanup INT TERM

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

resolve_number() {
  case "$1" in
    1)  echo "chefos" ;;          2)  echo "homechef" ;;
    3)  echo "eatsafe_brisbane" ;; 4)  echo "chefos_in" ;;
    5)  echo "homechef_in" ;;      6)  echo "india_fssai" ;;
    7)  echo "chefos_uae" ;;       8)  echo "homechef_uae" ;;
    9)  echo "gcc_uae" ;;          10) echo "chefos_uk" ;;
    11) echo "homechef_uk" ;;      12) echo "eatsafe_london" ;;
    13) echo "chefos_sg" ;;        14) echo "homechef_sg" ;;
    15) echo "eatsafe_sg" ;;       16) echo "chefos_us" ;;
    17) echo "homechef_us" ;;      18) echo "eatsafe_ny" ;;
    19) echo "nosh" ;;
    *)  echo "" ;;
  esac
}

label_for() {
  case "$1" in
    chefos)           echo "ChefOS AU" ;;
    homechef)         echo "HomeChef AU" ;;
    eatsafe_brisbane) echo "EatSafe Brisbane" ;;
    chefos_in)        echo "ChefOS India" ;;
    homechef_in)      echo "HomeChef India" ;;
    india_fssai)      echo "EatSafe India" ;;
    chefos_uae)       echo "ChefOS UAE" ;;
    homechef_uae)     echo "HomeChef UAE" ;;
    gcc_uae)          echo "EatSafe UAE" ;;
    chefos_uk)        echo "ChefOS UK" ;;
    homechef_uk)      echo "HomeChef UK" ;;
    eatsafe_london)   echo "EatSafe London" ;;
    chefos_sg)        echo "ChefOS SG" ;;
    homechef_sg)      echo "HomeChef SG" ;;
    eatsafe_sg)       echo "EatSafe SG" ;;
    chefos_us)        echo "ChefOS US" ;;
    homechef_us)      echo "HomeChef US" ;;
    eatsafe_ny)       echo "EatSafe NY" ;;
    nosh)             echo "Nosh" ;;
    *)                echo "$1" ;;
  esac
}

# Collect variants from args or interactive menu
VARIANTS=()

if [ $# -gt 0 ]; then
  for arg in "$@"; do
    VARIANTS+=("$(resolve_shortcut "$arg")")
  done
else
  echo ""
  echo "  ┌────────────────────────────────────────────────────────┐"
  echo "  │   Pick variants to test (up to 3)                     │"
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
  read "choices?  Enter numbers separated by spaces (e.g. 1 3 6): "
  for c in ${(s: :)choices}; do
    v="$(resolve_number "$c")"
    if [ -n "$v" ]; then
      VARIANTS+=("$v")
    fi
  done
fi

if [ ${#VARIANTS[@]} -eq 0 ]; then
  echo "  No variants selected."
  exit 1
fi

if [ ${#VARIANTS[@]} -gt $MAX_SLOTS ]; then
  echo "  Max $MAX_SLOTS variants at once. Using first $MAX_SLOTS."
  VARIANTS=("${VARIANTS[@]:0:$MAX_SLOTS}")
fi

# Kill existing servers on our ports
for port in "${PORTS[@]}"; do
  lsof -ti :"$port" 2>/dev/null | xargs kill 2>/dev/null || true
done
sleep 1

echo ""
echo "  ┌────────────────────────────────────────────────────────┐"
echo "  │   Starting ${#VARIANTS[@]} variant(s)                              │"
echo "  ├────────────────────────────────────────────────────────┤"

for i in $(seq 1 ${#VARIANTS[@]}); do
  idx=$((i - 1))
  v="${VARIANTS[$i]}"
  p="${PORTS[$idx]}"
  label="$(label_for "$v")"
  echo "  │   Slot $i: $label → :$p                  │"
done

echo "  ├────────────────────────────────────────────────────────┤"
echo "  │   Scan QR codes on your phone to connect              │"
echo "  │   Press Ctrl+C to stop all servers                    │"
echo "  └────────────────────────────────────────────────────────┘"
echo ""

# Start each variant in the background
for i in $(seq 1 ${#VARIANTS[@]}); do
  idx=$((i - 1))
  v="${VARIANTS[$i]}"
  p="${PORTS[$idx]}"
  label="$(label_for "$v")"

  LOG="/tmp/expo-${v}.log"
  if [ "$v" = "nosh" ]; then
    (cd "$HOME/dinners-sorted" && npx expo start --port "$p" > "$LOG" 2>&1) &
  else
    APP_VARIANT="$v" npx expo start --port "$p" > "$LOG" 2>&1 &
  fi
  PIDS+=($!)
  echo "  [$label] started on :$p (pid $!) — log: $LOG"
done

echo ""
echo "  All servers running. Waiting... (Ctrl+C to stop)"
echo ""

# Wait for all background processes
wait

#!/bin/zsh
# Deploy OTA updates to specific verticals, streams, or all 18 variants
# Usage:
#   ./deploy.sh homechef              → all 6 homechef variants
#   ./deploy.sh chefos                → all 6 chefos variants
#   ./deploy.sh eatsafe               → all 6 eatsafe variants
#   ./deploy.sh all                   → all 18 variants
#   ./deploy.sh homechef,chefos       → 12 variants (both streams)
#   ./deploy.sh chefos_in             → single variant
#   ./deploy.sh au                    → all 3 AU variants
#   ./deploy.sh --profile preview ... → use specific EAS profile (default: production)
#   ./deploy.sh --message "fix" ...   → custom update message
#   ./deploy.sh --dry-run ...         → show what would deploy, don't run

set -e
cd "$(dirname "$0")"

# ── All 18 variants grouped by stream ────────────────────────────────

CHEFOS_VARIANTS="chefos chefos_in chefos_uae chefos_uk chefos_sg chefos_us"
HOMECHEF_VARIANTS="homechef homechef_in homechef_uae homechef_uk homechef_sg homechef_us"
EATSAFE_VARIANTS="eatsafe_brisbane india_fssai gcc_uae eatsafe_london eatsafe_sg eatsafe_ny"

# Grouped by region
AU_VARIANTS="chefos homechef eatsafe_brisbane"
IN_VARIANTS="chefos_in homechef_in india_fssai"
UAE_VARIANTS="chefos_uae homechef_uae gcc_uae"
UK_VARIANTS="chefos_uk homechef_uk eatsafe_london"
SG_VARIANTS="chefos_sg homechef_sg eatsafe_sg"
US_VARIANTS="chefos_us homechef_us eatsafe_ny"

ALL_VARIANTS="$CHEFOS_VARIANTS $HOMECHEF_VARIANTS $EATSAFE_VARIANTS"

# ── Defaults ─────────────────────────────────────────────────────────

PROFILE="production"
MESSAGE=""
DRY_RUN=false
ROLLBACK=false
TARGETS=""

# ── Parse args ───────────────────────────────────────────────────────

while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile|-p)
      PROFILE="$2"
      shift 2
      ;;
    --message|-m)
      MESSAGE="$2"
      shift 2
      ;;
    --dry-run|-n)
      DRY_RUN=true
      shift
      ;;
    --rollback|-r)
      ROLLBACK=true
      shift
      ;;
    --help|-h)
      echo ""
      echo "  deploy.sh — Push OTA updates to Queitos app variants"
      echo ""
      echo "  USAGE:"
      echo "    ./deploy.sh <target> [options]"
      echo ""
      echo "  TARGETS (streams):"
      echo "    chefos        All 6 ChefOS variants"
      echo "    homechef      All 6 HomeChef variants"
      echo "    eatsafe       All 6 EatSafe variants"
      echo "    all           All 18 variants"
      echo ""
      echo "  TARGETS (regions):"
      echo "    au            3 AU variants (chefos, homechef, eatsafe_brisbane)"
      echo "    in            3 India variants"
      echo "    uae           3 UAE variants"
      echo "    uk            3 UK variants"
      echo "    sg            3 Singapore variants"
      echo "    us            3 US variants"
      echo ""
      echo "  TARGETS (single variant):"
      echo "    chefos_in, homechef_uae, eatsafe_london, etc."
      echo ""
      echo "  TARGETS (combo — comma-separated):"
      echo "    homechef,eatsafe    12 variants"
      echo "    au,uk               6 variants"
      echo "    chefos,homechef_in  7 variants (6 chefos + 1 single)"
      echo ""
      echo "  OPTIONS:"
      echo "    --profile, -p <name>   EAS update profile (default: production)"
      echo "    --message, -m <text>   Update message"
      echo "    --rollback, -r         Rollback to previous OTA update"
      echo "    --dry-run, -n          Show resolved variants without deploying"
      echo "    --help, -h             Show this help"
      echo ""
      exit 0
      ;;
    *)
      TARGETS="$1"
      shift
      ;;
  esac
done

if [ -z "$TARGETS" ]; then
  echo ""
  echo "  Error: No target specified. Run ./deploy.sh --help for usage."
  echo ""
  exit 1
fi

# ── Resolve targets to variant list ──────────────────────────────────

resolve_target() {
  case "$1" in
    all)        echo "$ALL_VARIANTS" ;;
    chefos)     echo "$CHEFOS_VARIANTS" ;;
    homechef)   echo "$HOMECHEF_VARIANTS" ;;
    eatsafe)    echo "$EATSAFE_VARIANTS" ;;
    au)         echo "$AU_VARIANTS" ;;
    in)         echo "$IN_VARIANTS" ;;
    uae)        echo "$UAE_VARIANTS" ;;
    uk)         echo "$UK_VARIANTS" ;;
    sg)         echo "$SG_VARIANTS" ;;
    us)         echo "$US_VARIANTS" ;;
    *)          echo "$1" ;;
  esac
}

RESOLVED=""
IFS=',' read -rA target_parts <<< "$TARGETS"
for target in "${target_parts[@]}"; do
  target="$(echo "$target" | xargs)"  # trim whitespace
  RESOLVED="$RESOLVED $(resolve_target "$target")"
done

# Deduplicate
VARIANTS=($(echo "$RESOLVED" | tr ' ' '\n' | sort -u))
COUNT=${#VARIANTS[@]}

# Validate all variants exist
VALID_SET="$ALL_VARIANTS"
for v in "${VARIANTS[@]}"; do
  if ! echo "$VALID_SET" | grep -qw "$v"; then
    echo ""
    echo "  Error: Unknown variant '$v'"
    echo "  Valid variants: $ALL_VARIANTS"
    echo ""
    exit 1
  fi
done

# ── Summary ──────────────────────────────────────────────────────────

echo ""
echo "  ┌────────────────────────────────────────────────────────┐"
if [ "$ROLLBACK" = true ]; then
echo "  │   ROLLBACK OTA Update                                  │"
else
echo "  │   Deploy OTA Update                                    │"
fi
echo "  ├────────────────────────────────────────────────────────┤"
echo "  │  Target:   $TARGETS"
echo "  │  Profile:  $PROFILE"
echo "  │  Variants: $COUNT"
if [ -n "$MESSAGE" ]; then
echo "  │  Message:  $MESSAGE"
fi
echo "  │                                                        │"
for v in "${VARIANTS[@]}"; do
echo "  │    • $v"
done
echo "  │                                                        │"
echo "  └────────────────────────────────────────────────────────┘"
echo ""

if [ "$DRY_RUN" = true ]; then
  echo "  Dry run — no updates pushed."
  echo ""
  exit 0
fi

# ── Confirm ──────────────────────────────────────────────────────────

read "confirm?  Deploy to $COUNT variant(s)? (y/N): "
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "  Aborted."
  exit 0
fi

# ── Deploy loop ──────────────────────────────────────────────────────

SUCCEEDED=0
FAILED=0
FAILED_LIST=""

for v in "${VARIANTS[@]}"; do
  echo ""
  echo "  ──────────────────────────────────────"
  echo "  Deploying: $v ($((SUCCEEDED + FAILED + 1))/$COUNT)"
  echo "  ──────────────────────────────────────"

  MSG="${MESSAGE:-OTA update for $v}"

  if [ "$ROLLBACK" = true ]; then
    echo "  Rolling back $v on branch $PROFILE..."
    if APP_VARIANT="$v" npx eas-cli update:rollback --branch "$PROFILE" --non-interactive 2>&1; then
      SUCCEEDED=$((SUCCEEDED + 1))
      echo "  ✓ $v rolled back"
    else
      FAILED=$((FAILED + 1))
      FAILED_LIST="$FAILED_LIST $v"
      echo "  ✗ $v rollback failed"
    fi
    continue
  fi

  if APP_VARIANT="$v" npx eas-cli update --branch "$PROFILE" --message "$MSG" --non-interactive 2>&1; then
    SUCCEEDED=$((SUCCEEDED + 1))
    echo "  ✓ $v done"
  else
    FAILED=$((FAILED + 1))
    FAILED_LIST="$FAILED_LIST $v"
    echo "  ✗ $v failed"
  fi
done

# ── Results ──────────────────────────────────────────────────────────

echo ""
echo "  ┌────────────────────────────────────────────────────────┐"
echo "  │   Deploy Complete                                      │"
echo "  │  Succeeded: $SUCCEEDED / $COUNT"
if [ $FAILED -gt 0 ]; then
echo "  │  Failed:    $FAILED ($FAILED_LIST )"
fi
echo "  └────────────────────────────────────────────────────────┘"
echo ""

[ $FAILED -eq 0 ]

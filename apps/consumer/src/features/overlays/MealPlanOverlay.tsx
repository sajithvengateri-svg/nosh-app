import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import {
  UtensilsCrossed,
  Flame,
  Dice3,
  SkipForward,
  Package,
  X,
} from "lucide-react-native";
import { Colors, Spacing, BorderRadius, Glass } from "../../constants/colors";
import { useMealPlanStore } from "../../lib/stores/mealPlanStore";
import { useRecipeStore } from "../../lib/stores/recipeStore";
import { usePantryStore } from "../../lib/stores/pantryStore";
import { usePersonalityStore } from "../../lib/stores/personalityStore";
import { useVendorStore } from "../../lib/stores/vendorStore";
import { SEED_VENDORS } from "../../data/seedVendors";
import type { DayMode } from "../../lib/engines/weeklyPlanEngine";
import { calculateTotals, applyPreset, applySliderPosition } from "../../lib/engines/tierEngine";
import { lightTap, successNotification } from "../../lib/haptics";

// ── Helpers ──────────────────────────────────────────────────────

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_MODE_OPTIONS: { mode: DayMode; icon: React.ComponentType<any>; label: string }[] = [
  { mode: "usual", icon: UtensilsCrossed, label: "Usual" },
  { mode: "mix_it_up", icon: Flame, label: "Mix it up" },
  { mode: "go_nuts", icon: Dice3, label: "Go nuts" },
  { mode: "skip", icon: SkipForward, label: "Skip" },
  { mode: "leftover", icon: Package, label: "Leftover" },
];

type PlanView = "grid" | "generating" | "review" | "shopping";

function getMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

function getWeekDates(monday: string): string[] {
  const dates: string[] = [];
  const start = new Date(monday);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

// ── Main Component ───────────────────────────────────────────────

export function MealPlanOverlay() {
  const [view, setView] = useState<PlanView>("grid");

  const {
    entries,
    fetchWeek,
    removeMeal,
    getEntry,
    planProposal,
    weeklyShoppingList,
    isGenerating,
    dayModes,
    setDayMode,
    generatePlan,
    swapPlanDay,
    acceptPlan,
    generateShoppingList,
    clearProposal,
  } = useMealPlanStore();

  const recipes = useRecipeStore((s) => s.recipes);
  const pantryItems = usePantryStore((s) => s.items);
  const profile = usePersonalityStore((s) => s.profile);

  const monday = useMemo(() => getMonday(), []);
  const weekDates = useMemo(() => getWeekDates(monday), [monday]);

  useEffect(() => {
    fetchWeek(monday);
  }, [monday, fetchWeek]);

  // Transition to review when plan arrives
  useEffect(() => {
    if (planProposal && view === "generating") {
      setView("review");
    }
  }, [planProposal, view]);

  const filledCount = weekDates.filter((d) => getEntry(d)).length;

  // ── Grid View ──────────────────────────────────────────────

  if (view === "grid") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={styles.weekHeader}>
          <Text style={styles.weekTitle}>This Week</Text>
          <Text style={styles.weekMeta}>
            {filledCount}/7 meals planned
          </Text>
        </View>

        {DAY_LABELS.map((day, i) => {
          const date = weekDates[i];
          const entry = getEntry(date);
          const dayOfWeek = new Date(date + "T00:00:00").getDay();
          const mode = dayModes[dayOfWeek] ?? "usual";

          return (
            <View key={day} style={styles.dayRow}>
              <View style={styles.dayLabel}>
                <Text style={styles.dayText}>{day}</Text>
                <Text style={styles.dayDate}>{new Date(date + "T00:00:00").getDate()}</Text>
              </View>
              {entry?.recipe ? (
                <View style={styles.filledSlot}>
                  <Text style={styles.recipeName} numberOfLines={1}>
                    {entry.recipe.title}
                  </Text>
                  <Text style={styles.recipeMeta}>
                    {entry.recipe.vessel ? `1 ${entry.recipe.vessel}` : ""}
                    {entry.recipe.total_time_minutes ? ` · ${entry.recipe.total_time_minutes}m` : ""}
                  </Text>
                  <Pressable
                    onPress={() => { lightTap(); removeMeal(entry.id); }}
                    style={styles.removeSlot}
                  >
                    <X size={10} color={Colors.text.secondary} strokeWidth={1.5} />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.emptySlotWrap}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.modePillRow}>
                      {DAY_MODE_OPTIONS.map((opt) => (
                        <Pressable
                          key={opt.mode}
                          onPress={() => { lightTap(); setDayMode(dayOfWeek, opt.mode); }}
                          style={[
                            styles.modePill,
                            mode === opt.mode && styles.modePillActive,
                          ]}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <opt.icon size={12} color={Colors.text.secondary} strokeWidth={1.5} />
                            <Text style={styles.modePillText}>
                              {opt.label}
                            </Text>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>
          );
        })}

        {/* Plan My Week CTA */}
        <Pressable
          style={styles.primaryButton}
          onPress={() => {
            lightTap();
            setView("generating");
            generatePlan(
              recipes,
              pantryItems,
              monday,
              profile?.primary ?? "humpday_nosher",
            );
          }}
        >
          <Text style={styles.primaryButtonText}>Plan My Week</Text>
        </Pressable>

        {/* Generate shopping list if 3+ meals planned */}
        {filledCount >= 3 && (
          <Pressable
            style={styles.secondaryButton}
            onPress={() => {
              lightTap();
              // Build a pseudo-proposal from existing entries for shopping list
              generateShoppingList(recipes, pantryItems, SEED_VENDORS);
            }}
          >
            <Text style={styles.secondaryButtonText}>
              Generate Shopping List
            </Text>
          </Pressable>
        )}

        <Text style={styles.hint}>
          Set day modes for empty slots, then tap "Plan My Week" to auto-fill.
        </Text>
      </ScrollView>
    );
  }

  // ── Generating View ────────────────────────────────────────

  if (view === "generating" || isGenerating) {
    return (
      <View style={styles.centerWrap}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.genTitle}>Planning your week...</Text>
        <Text style={styles.genSub}>
          Matching recipes to your personality and pantry
        </Text>
      </View>
    );
  }

  // ── Review View ────────────────────────────────────────────

  if (view === "review" && planProposal) {
    const cookedDays = planProposal.days.filter((d) => d.recipe);

    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
        <Text style={styles.sectionTitle}>Your Weekly Plan</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{cookedDays.length}</Text>
            <Text style={styles.statLabel}>Meals</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              ${planProposal.totalEstimatedCost.toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>Est. Cost</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {Math.round(planProposal.pantryUtilisation * 100)}%
            </Text>
            <Text style={styles.statLabel}>Pantry Use</Text>
          </View>
        </View>

        {planProposal.days.map((day, i) => (
          <View key={i} style={styles.reviewDay}>
            <View style={styles.reviewDayHeader}>
              <Text style={styles.reviewDayLabel}>
                {DAY_LABELS[i]} {new Date(day.date + "T00:00:00").getDate()}
              </Text>
              <View style={styles.reviewDayMode}>
                {(() => {
                  const ModeIcon = DAY_MODE_OPTIONS.find((o) => o.mode === day.dayMode)?.icon;
                  return ModeIcon ? <ModeIcon size={16} color={Colors.text.secondary} strokeWidth={1.5} /> : null;
                })()}
              </View>
            </View>
            {day.recipe ? (
              <View style={styles.reviewRecipe}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewRecipeName}>{day.recipe.title}</Text>
                  <Text style={styles.reviewRecipeMeta}>
                    {day.recipe.cuisine} · {day.recipe.total_time_minutes}m · Score {day.score}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    lightTap();
                    swapPlanDay(i, recipes, pantryItems);
                  }}
                  style={styles.swapButton}
                >
                  <Text style={styles.swapButtonText}>Swap</Text>
                </Pressable>
              </View>
            ) : day.usesLeftoversFrom ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8 }}>
                <Package size={14} color={Colors.text.secondary} strokeWidth={1.5} />
                <Text style={[styles.leftoverText, { paddingVertical: 0 }]}>
                  Leftovers from {day.usesLeftoversFrom}
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8 }}>
                <SkipForward size={14} color={Colors.text.muted} strokeWidth={1.5} />
                <Text style={[styles.skipText, { paddingVertical: 0 }]}>Skipped</Text>
              </View>
            )}
          </View>
        ))}

        <View style={styles.buttonRow}>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => { lightTap(); clearProposal(); setView("grid"); }}
          >
            <Text style={styles.secondaryButtonText}>Start Over</Text>
          </Pressable>
          <Pressable
            style={[styles.primaryButton, { flex: 1, marginLeft: 12 }]}
            onPress={async () => {
              lightTap();
              await acceptPlan();
              successNotification();
              setView("grid");
            }}
          >
            <Text style={styles.primaryButtonText}>Accept Plan</Text>
          </Pressable>
        </View>

        {/* Generate shopping list from proposal */}
        {cookedDays.length >= 2 && (
          <Pressable
            style={[styles.primaryButton, { marginTop: 8 }]}
            onPress={() => {
              lightTap();
              generateShoppingList(recipes, pantryItems, SEED_VENDORS);
              setView("shopping");
            }}
          >
            <Text style={styles.primaryButtonText}>Generate Shopping List</Text>
          </Pressable>
        )}


      </ScrollView>
    );
  }

  // ── Shopping View ──────────────────────────────────────────

  if (view === "shopping" && weeklyShoppingList) {
    const list = weeklyShoppingList;

    // Group items by section
    const sections = new Map<string, typeof list.items>();
    for (const item of list.items) {
      const key = item.supermarketSection;
      const arr = sections.get(key) ?? [];
      arr.push(item);
      sections.set(key, arr);
    }

    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
        <Text style={styles.sectionTitle}>Weekly Shopping List</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{list.recipeCount}</Text>
            <Text style={styles.statLabel}>Recipes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{list.tieredItems.length}</Text>
            <Text style={styles.statLabel}>Items</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{list.pantryItemsSkipped}</Text>
            <Text style={styles.statLabel}>In Pantry</Text>
          </View>
        </View>

        {/* Total bar */}
        <View style={styles.totalBar}>
          <View style={styles.totalCol}>
            <Text style={styles.totalLabel}>Good</Text>
            <Text style={styles.totalValue}>${list.totals.good.toFixed(2)}</Text>
          </View>
          <View style={styles.totalCol}>
            <Text style={styles.totalLabel}>Current</Text>
            <Text style={[styles.totalValue, { color: Colors.primary }]}>
              ${list.totals.current.toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalCol}>
            <Text style={styles.totalLabel}>Best</Text>
            <Text style={styles.totalValue}>${list.totals.best.toFixed(2)}</Text>
          </View>
        </View>

        {/* Items grouped by section */}
        {Array.from(sections.entries()).map(([section, items]) => (
          <View key={section} style={styles.shoppingSection}>
            <Text style={styles.shoppingSectionTitle}>
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </Text>
            {items.map((item, idx) => (
              <View
                key={`${item.normalisedName}-${idx}`}
                style={[
                  styles.shoppingItem,
                  item.inPantry && styles.shoppingItemPantry,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.shoppingItemName,
                      item.inPantry && styles.shoppingItemStrike,
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text style={styles.shoppingItemQty}>
                    {item.totalQuantity} {item.unit}
                    {item.sourceRecipes.length > 1
                      ? ` · ${item.sourceRecipes.length} recipes`
                      : ""}
                  </Text>
                </View>
                {item.inPantry && (
                  <Text style={styles.pantryBadge}>In pantry</Text>
                )}
              </View>
            ))}
          </View>
        ))}

        <Pressable
          style={styles.secondaryButton}
          onPress={() => {
            lightTap();
            setView(planProposal ? "review" : "grid");
          }}
        >
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ── Fallback ───────────────────────────────────────────────

  return (
    <View style={styles.centerWrap}>
      <Text style={styles.genSub}>Loading...</Text>
      <Pressable
        style={[styles.secondaryButton, { marginTop: 20 }]}
        onPress={() => setView("grid")}
      >
        <Text style={styles.secondaryButtonText}>Back to Grid</Text>
      </Pressable>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.md },
  centerWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },

  // Header
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  weekTitle: { fontSize: 18, fontWeight: "700", color: Colors.secondary },
  weekMeta: { fontSize: 13, color: Colors.text.secondary },

  // Day rows
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  dayLabel: { width: 44, alignItems: "center" },
  dayText: { fontSize: 14, fontWeight: "700", color: Colors.text.secondary },
  dayDate: { fontSize: 11, color: Colors.text.muted, marginTop: 2 },

  filledSlot: {
    flex: 1,
    backgroundColor: Glass.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Glass.surfaceAccent,
    flexDirection: "row",
    alignItems: "center",
  },
  recipeName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
    flex: 1,
  },
  recipeMeta: { fontSize: 12, color: Colors.text.secondary },
  removeSlot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.divider,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  removeSlotText: { fontSize: 10, color: Colors.text.secondary },

  // Empty slot day mode pills
  emptySlotWrap: { flex: 1 },
  modePillRow: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 8,
  },
  modePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Glass.surface,
    borderWidth: 1,
    borderColor: Glass.borderLight,
  },
  modePillActive: { backgroundColor: Glass.surfaceAccent },
  modePillText: { fontSize: 12, color: Colors.text.secondary },

  // Buttons
  primaryButton: {
    backgroundColor: Glass.surface,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  primaryButtonText: { color: Colors.secondary, fontSize: 15, fontWeight: "600" },
  secondaryButton: {
    backgroundColor: "transparent",
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  secondaryButtonText: {
    color: Colors.text.secondary,
    fontSize: 14,
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
  },

  hint: {
    fontSize: 12,
    color: Colors.text.muted,
    textAlign: "center",
    marginTop: 12,
  },

  // Generating
  genTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.secondary,
    marginTop: Spacing.md,
  },
  genSub: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 8,
    textAlign: "center",
  },

  // Section title
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.secondary,
    marginBottom: Spacing.md,
  },

  // Stats row
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Glass.surface,
    borderRadius: BorderRadius.card,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Glass.borderLight,
    shadowColor: Glass.shadowLight.color,
    shadowOffset: Glass.shadowLight.offset,
    shadowRadius: Glass.shadowLight.radius,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.text.muted,
    marginTop: 2,
  },

  // Review day
  reviewDay: {
    marginBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
    paddingBottom: Spacing.sm,
  },
  reviewDayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  reviewDayLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text.secondary,
  },
  reviewDayMode: { fontSize: 16 },
  reviewRecipe: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Glass.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Glass.borderLight,
  },
  reviewRecipeName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.secondary,
  },
  reviewRecipeMeta: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  swapButton: {
    backgroundColor: Glass.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: Glass.borderLight,
  },
  swapButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.secondary,
  },
  leftoverText: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontStyle: "italic",
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
    color: Colors.text.muted,
    paddingVertical: 8,
  },

  // Shopping
  totalBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: Glass.surface,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    shadowColor: Glass.shadowLight.color,
    shadowOffset: Glass.shadowLight.offset,
    shadowRadius: Glass.shadowLight.radius,
  },
  totalCol: { alignItems: "center" },
  totalLabel: { fontSize: 12, color: Colors.text.muted },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.secondary,
    marginTop: 2,
  },

  shoppingSection: { marginBottom: Spacing.md },
  shoppingSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  shoppingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  shoppingItemPantry: { opacity: 0.5 },
  shoppingItemName: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.secondary,
  },
  shoppingItemStrike: {
    textDecorationLine: "line-through",
    color: Colors.text.muted,
  },
  shoppingItemQty: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  pantryBadge: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: "600",
    backgroundColor: Glass.surfaceAccent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
});

import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
  CookingPot,
  UtensilsCrossed,
  Salad,
  Zap,
  Sparkles,
  Lightbulb,
  Package,
  Flame,
  Check,
  ArrowLeft,
  Clock,
  Users,
  ChevronRight,
  Bookmark,
  ShoppingCart,
  CalendarPlus,
} from "lucide-react-native";
import { Colors, Spacing } from "../../../src/constants/colors";
import { Fonts, FontSizes } from "../../../src/constants/typography";
import { useRecipeStore } from "../../../src/lib/stores/recipeStore";
import { usePantryStore } from "../../../src/lib/stores/pantryStore";
import { useFavouritesStore } from "../../../src/lib/stores/favouritesStore";
import { useTrackingStore } from "../../../src/lib/stores/trackingStore";
import { useMealPlanStore } from "../../../src/lib/stores/mealPlanStore";
import { lightTap, mediumTap, successNotification } from "../../../src/lib/haptics";
import { ServingsAdjuster } from "../../../src/features/recipes/ServingsAdjuster";
import type { Recipe, RecipeIngredient } from "../../../src/lib/stores/recipeStore";

const HERO_HEIGHT = 320;

const VESSEL_ICON: Record<string, React.ComponentType<any>> = {
  pot: CookingPot,
  pan: UtensilsCrossed,
  tray: CookingPot,
  bowl: Salad,
  slow_cooker: CookingPot,
  appliance: Zap,
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  challenging: "Challenging",
  hard: "Hard",
  expert: "Expert",
};

function normalise(name: string): string {
  return name.toLowerCase().trim().replace(/s$/, "");
}

// ── Recipe Detail Screen ──────────────────────────────────────────
export default function RecipeDetailScreen() {
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();
  const getRecipeWithDetails = useRecipeStore((s) => s.getRecipeWithDetails);
  const pantryItems = usePantryStore((s) => s.items);
  const favourites = useFavouritesStore((s) => s.favourites);
  const addFavourite = useFavouritesStore((s) => s.addFavourite);
  const removeFavourite = useFavouritesStore((s) => s.removeFavourite);
  const insets = useSafeAreaInsets();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [servings, setServings] = useState(4);
  const [descExpanded, setDescExpanded] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const isFavourited = favourites.some(
    (f) => f.recipe_id === recipeId || f.id === recipeId,
  );

  // Load recipe
  useEffect(() => {
    if (!recipeId) return;
    setIsLoading(true);
    getRecipeWithDetails(recipeId).then((r) => {
      setRecipe(r);
      if (r) setServings(r.serves ?? 4);
      setIsLoading(false);
    });
  }, [recipeId, getRecipeWithDetails]);

  // Track page view
  useEffect(() => {
    if (!recipeId) return;
    useTrackingStore.getState().startPageView(recipeId, "feed");
    return () => {
      useTrackingStore.getState().endPageView();
    };
  }, [recipeId]);

  // Scroll tracking
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const maxScroll = contentSize.height - layoutMeasurement.height;
      if (maxScroll > 0) {
        const pct = (contentOffset.y / maxScroll) * 100;
        useTrackingStore.getState().trackScrollDepth(pct);
      }
    },
    [],
  );

  const handleToggleFavourite = useCallback(() => {
    if (!recipeId) return;
    lightTap();
    if (isFavourited) {
      removeFavourite(recipeId);
    } else {
      addFavourite(recipeId);
      successNotification();
    }
    useTrackingStore.getState().trackCta("favourite");
  }, [recipeId, isFavourited, addFavourite, removeFavourite]);

  const handleCookThis = useCallback(() => {
    if (!recipeId) return;
    mediumTap();
    useTrackingStore.getState().trackCta("cook_this");
    router.push(`/(app)/cook-mode/${recipeId}`);
  }, [recipeId]);

  const handleShopFirst = useCallback(() => {
    if (!recipeId) return;
    mediumTap();
    useTrackingStore.getState().trackCta("shop_first");
    router.push(`/(app)/shopping/${recipeId}`);
  }, [recipeId]);

  const handleSeeIngredients = useCallback(() => {
    if (!recipeId) return;
    lightTap();
    useTrackingStore.getState().trackCta("see_ingredients");
    router.push(`/(app)/recipe/ingredients/${recipeId}`);
  }, [recipeId]);

  const handleAddToMealPlan = useCallback(() => {
    if (!recipeId) return;
    mediumTap();
    const today = new Date().toISOString().slice(0, 10);
    useMealPlanStore.getState().setMeal(today, recipeId);
    successNotification();
    useTrackingStore.getState().trackCta("add_to_plan");
  }, [recipeId]);

  // Scale factor for servings
  const scaleFactor = recipe ? servings / (recipe.serves || 1) : 1;

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!recipe) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 16, color: Colors.text.secondary }}>
            Recipe not found
          </Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: Colors.primary, fontWeight: "600" }}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Pantry matching
  const pantryNormalised = new Set(pantryItems.map((i) => normalise(i.name)));
  const nonStaple = recipe.ingredients?.filter((i) => !i.is_pantry_staple) ?? [];
  const haveCount = nonStaple.filter((i) =>
    pantryNormalised.has(normalise(i.name)),
  ).length;
  const totalCount = nonStaple.length;
  const pantryPct = totalCount > 0 ? Math.round((haveCount / totalCount) * 100) : 0;
  const previewIngredients = (recipe.ingredients ?? []).slice(0, 6);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Hero with gradient overlay */}
        <View style={{ position: "relative" }}>
          {recipe.hero_image_url ? (
            <Image
              source={{ uri: recipe.hero_image_url }}
              style={styles.hero}
              contentFit="cover"
              transition={300}
            />
          ) : (
            <View style={[styles.hero, styles.heroPlaceholder]}>
              {(() => {
                const VesselIcon = VESSEL_ICON[recipe.vessel] ?? UtensilsCrossed;
                return (
                  <VesselIcon size={64} color={Colors.text.muted} strokeWidth={1.5} />
                );
              })()}
            </View>
          )}

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.55)"]}
            style={styles.heroGradient}
          />

          <Pressable
            onPress={() => { lightTap(); router.back(); }}
            style={[styles.backButton, { top: insets.top + 8 }]}
          >
            <ArrowLeft size={18} color="#FFF" strokeWidth={2} />
          </Pressable>

          <Pressable
            onPress={handleToggleFavourite}
            style={[styles.heroFavButton, { top: insets.top + 8 }]}
          >
            <Bookmark
              size={20}
              color="#FFF"
              strokeWidth={1.5}
              fill={isFavourited ? "#FFF" : "none"}
            />
          </Pressable>

          <View style={styles.heroCuisineBadge}>
            <Text style={styles.heroCuisineText}>
              {recipe.cuisine_type ?? recipe.cuisine}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {recipe.chef_name && (
            <Text style={styles.chefName}>{recipe.chef_name}</Text>
          )}

          <Text style={styles.title}>{recipe.title}</Text>

          {/* Source badge */}
          {recipe.source_type && (recipe.source_type === "nosh_nonna" || recipe.source_type === "nosh_pro") && (
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceBadgeText}>
                {recipe.source_type === "nosh_nonna" ? "Prep Mi Nonna" : "Prep Mi Pro"}
              </Text>
            </View>
          )}

          {recipe.description && (
            <Pressable onPress={() => setDescExpanded(!descExpanded)}>
              <Text
                style={styles.description}
                numberOfLines={descExpanded ? undefined : 3}
              >
                {recipe.description}
              </Text>
              {!descExpanded && recipe.description.length > 120 && (
                <Text style={styles.readMore}>Read more</Text>
              )}
            </Pressable>
          )}

          {/* Stats row */}
          <View style={styles.statsRow}>
            {recipe.prep_time_minutes > 0 && (
              <View style={styles.statPill}>
                <Clock size={13} color={Colors.primary} strokeWidth={1.5} />
                <Text style={styles.statText}>{recipe.prep_time_minutes}m prep</Text>
              </View>
            )}
            <View style={styles.statPill}>
              <Clock size={13} color={Colors.primary} strokeWidth={1.5} />
              <Text style={styles.statText}>{recipe.total_time_minutes} min</Text>
            </View>
            <View style={[styles.statPill, { gap: 6 }]}>
              <Users size={13} color={Colors.primary} strokeWidth={1.5} />
              <ServingsAdjuster value={servings} onChange={setServings} />
            </View>
            {recipe.difficulty && (
              <View style={styles.statPill}>
                <Flame size={13} color={Colors.primary} strokeWidth={1.5} />
                <Text style={styles.statText}>
                  {DIFFICULTY_LABELS[recipe.difficulty] ?? recipe.difficulty}
                </Text>
              </View>
            )}
            {(() => {
              const VesselIcon = VESSEL_ICON[recipe.vessel] ?? UtensilsCrossed;
              return (
                <View style={styles.statPill}>
                  <VesselIcon size={13} color={Colors.primary} strokeWidth={1.5} />
                  <Text style={styles.statText}>
                    1 {recipe.vessel.replace("_", " ")}
                  </Text>
                </View>
              );
            })()}
          </View>

          {/* Dietary tags */}
          {recipe.dietary_tags && recipe.dietary_tags.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 16 }}
            >
              <View style={{ flexDirection: "row", gap: 6 }}>
                {recipe.dietary_tags.map((tag: string) => (
                  <View key={tag} style={styles.dietaryPill}>
                    <Text style={styles.dietaryPillText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          {/* Pantry match bar */}
          {totalCount > 0 && (
            <View style={styles.pantrySection}>
              <View style={styles.pantryHeader}>
                <Sparkles size={14} color={Colors.primary} strokeWidth={1.5} />
                <Text style={styles.pantryLabel}>
                  {haveCount === totalCount
                    ? "You have all the ingredients!"
                    : `${haveCount} of ${totalCount} ingredients ready`}
                </Text>
                <Text style={styles.pantryPct}>{pantryPct}%</Text>
              </View>
              <View style={styles.pantryBarBg}>
                <View
                  style={[
                    styles.pantryBarFill,
                    {
                      width: `${pantryPct}%`,
                      backgroundColor: pantryPct === 100 ? Colors.success : Colors.primary,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Quick ingredient preview */}
          <View onLayout={() => useTrackingStore.getState().trackSection("ingredients")}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {previewIngredients.map((ing) => (
              <IngredientRow
                key={ing.id}
                ingredient={ing}
                inPantry={pantryNormalised.has(normalise(ing.name))}
                scale={scaleFactor}
              />
            ))}
            {(recipe.ingredients?.length ?? 0) > 0 && (
              <Pressable onPress={handleSeeIngredients} style={styles.seeAllButton}>
                <Text style={styles.seeAllText}>
                  {(recipe.ingredients?.length ?? 0) > 6
                    ? `See All ${recipe.ingredients?.length} Ingredients`
                    : "Full Ingredients & Method"}
                </Text>
                <ChevronRight size={16} color={Colors.primary} strokeWidth={1.5} />
              </Pressable>
            )}
          </View>

          {/* Workflow preview */}
          <View onLayout={() => useTrackingStore.getState().trackSection("workflow")}>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
              {recipe.workflow_cards?.length ?? 0} Cooking Steps
            </Text>
            {recipe.workflow_cards?.map((wc) => (
              <View key={wc.id} style={styles.stepPreview}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{wc.card_number}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>{wc.title}</Text>
                  <Text style={styles.stepInstruction} numberOfLines={1}>
                    {wc.instructions?.[0]}
                  </Text>
                </View>
                {wc.timer_seconds > 0 && (
                  <Text style={styles.stepTimer}>
                    {Math.ceil(wc.timer_seconds / 60)}m
                  </Text>
                )}
              </View>
            ))}
          </View>

          {/* Tips */}
          {recipe.tips && recipe.tips.length > 0 && (
            <View onLayout={() => useTrackingStore.getState().trackSection("tips")}>
              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Tips</Text>
              {recipe.tips.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Lightbulb size={14} color={Colors.alert} strokeWidth={1.5} style={{ marginTop: 3 }} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Storage */}
          {recipe.storage_notes && (
            <View onLayout={() => useTrackingStore.getState().trackSection("storage")}>
              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Storage</Text>
              <View style={styles.tipRow}>
                <Package size={14} color={Colors.text.secondary} strokeWidth={1.5} style={{ marginTop: 3 }} />
                <Text style={styles.tipText}>{recipe.storage_notes}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky bottom bar */}
      <View style={[styles.stickyBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          onPress={handleCookThis}
          style={({ pressed }) => [styles.letsCookButton, pressed && { opacity: 0.85 }]}
        >
          <Flame size={18} color="#FFF" strokeWidth={1.5} />
          <Text style={styles.letsCookText}>Let's Cook</Text>
        </Pressable>
        <View style={styles.secondaryRow}>
          <Pressable
            onPress={handleAddToMealPlan}
            style={({ pressed }) => [styles.secondaryButton, pressed && { backgroundColor: Colors.divider }]}
          >
            <CalendarPlus size={16} color={Colors.text.secondary} strokeWidth={1.5} />
            <Text style={styles.secondaryButtonText}>Plan</Text>
          </Pressable>
          <Pressable
            onPress={handleShopFirst}
            style={({ pressed }) => [styles.secondaryButton, pressed && { backgroundColor: Colors.divider }]}
          >
            <ShoppingCart size={16} color={Colors.text.secondary} strokeWidth={1.5} />
            <Text style={styles.secondaryButtonText}>Shop</Text>
          </Pressable>
          <Pressable
            onPress={handleToggleFavourite}
            style={({ pressed }) => [styles.secondaryButton, pressed && { backgroundColor: Colors.divider }]}
          >
            <Bookmark
              size={18}
              color={isFavourited ? Colors.primary : Colors.text.muted}
              strokeWidth={1.5}
              fill={isFavourited ? Colors.primary : "none"}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ── Ingredient Row ────────────────────────────────────────────────

function IngredientRow({ ingredient, inPantry, scale = 1 }: { ingredient: RecipeIngredient; inPantry: boolean; scale?: number }) {
  const dotColor = inPantry
    ? Colors.success
    : ingredient.is_pantry_staple
      ? Colors.alert
      : Colors.primary;

  return (
    <View style={styles.ingredientRow}>
      <View style={[styles.ingredientDot, { backgroundColor: dotColor }]} />
      <Text style={[styles.ingredientName, inPantry && { color: Colors.text.muted }]}>
        {ingredient.name}
      </Text>
      {ingredient.quantity && (
        <Text style={styles.ingredientQty}>
          {Math.round(ingredient.quantity * scale * 10) / 10} {ingredient.unit ?? ""}
        </Text>
      )}
      {inPantry && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
          <Check size={11} color={Colors.success} strokeWidth={2} />
          <Text style={styles.inPantryBadge}>Have</Text>
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  hero: { width: "100%", height: HERO_HEIGHT },
  heroPlaceholder: {
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT * 0.5,
  },
  backButton: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroFavButton: {
    position: "absolute",
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroCuisineBadge: {
    position: "absolute",
    bottom: 16,
    left: 16,
    backgroundColor: "rgba(217, 72, 120, 0.85)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroCuisineText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  contentContainer: { padding: 20 },
  chefName: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes["3xl"],
    fontWeight: "700",
    color: Colors.text.primary,
    lineHeight: 38,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 15,
    color: Colors.text.secondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statText: { fontSize: 13, color: Colors.text.secondary, fontWeight: "500" },

  // Pantry
  pantrySection: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pantryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  pantryLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: Colors.text.primary },
  pantryPct: { fontSize: 14, fontWeight: "700", color: Colors.primary },
  pantryBarBg: { height: 6, borderRadius: 3, backgroundColor: Colors.divider, overflow: "hidden" },
  pantryBarFill: { height: 6, borderRadius: 3 },

  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.text.primary, marginBottom: 12 },

  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  ingredientDot: { width: 8, height: 8, borderRadius: 4 },
  ingredientName: { flex: 1, fontSize: 15, color: Colors.text.primary },
  ingredientQty: { fontSize: 13, fontFamily: Fonts.mono, color: Colors.text.secondary },
  inPantryBadge: { fontSize: 11, fontWeight: "600", color: Colors.success },

  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 14,
    marginTop: 4,
  },
  seeAllText: { fontSize: 14, fontWeight: "600", color: Colors.primary },

  stepPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.text.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  stepTitle: { fontSize: 14, fontWeight: "600", color: Colors.text.primary },
  stepInstruction: { fontSize: 13, color: Colors.text.secondary, marginTop: 2 },
  stepTimer: { fontSize: 12, fontWeight: "600", color: Colors.primary },

  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 8 },
  tipText: { flex: 1, fontSize: 14, color: Colors.text.secondary, lineHeight: 20 },

  stickyBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  letsCookButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 24,
  },
  letsCookText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  secondaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 8,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  secondaryButtonText: { color: Colors.text.secondary, fontSize: 13, fontWeight: "600" },
  readMore: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  sourceBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(217, 72, 120, 0.1)",
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 6,
  },
  sourceBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  dietaryPill: {
    backgroundColor: "rgba(91, 163, 122, 0.1)",
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(91, 163, 122, 0.15)",
  },
  dietaryPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.success,
  },
});

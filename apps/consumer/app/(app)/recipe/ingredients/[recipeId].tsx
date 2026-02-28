import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Check,
  AlertTriangle,
  ShoppingCart,
  Flame,
  Timer,
} from "lucide-react-native";
import { Colors, Spacing } from "../../../../src/constants/colors";
import { Fonts, FontSizes } from "../../../../src/constants/typography";
import { useRecipeStore } from "../../../../src/lib/stores/recipeStore";
import { usePantryStore } from "../../../../src/lib/stores/pantryStore";
import { useTrackingStore } from "../../../../src/lib/stores/trackingStore";
import { lightTap, mediumTap } from "../../../../src/lib/haptics";
import { ServingsAdjuster } from "../../../../src/features/recipes/ServingsAdjuster";
import { SEED_VENDORS } from "../../../../src/data/seedVendors";
import type { Recipe, RecipeIngredient } from "../../../../src/lib/stores/recipeStore";

type IngredientAvailability = "in_pantry" | "can_substitute" | "need_to_buy";

interface EnrichedIngredient {
  ingredient: RecipeIngredient;
  availability: IngredientAvailability;
  vendorMatch?: { vendorName: string; price: number; productName: string };
}

function normalise(name: string): string {
  return name.toLowerCase().trim().replace(/s$/, "");
}

function findVendorMatch(ingredientName: string): EnrichedIngredient["vendorMatch"] | undefined {
  const norm = normalise(ingredientName);
  let best: EnrichedIngredient["vendorMatch"] | undefined;

  for (const vendor of SEED_VENDORS) {
    for (const product of vendor.products) {
      const nameMatch = normalise(product.name).includes(norm) || norm.includes(normalise(product.name));
      const tagMatch = product.tags?.some(
        (t: string) => normalise(t).includes(norm) || norm.includes(normalise(t)),
      );
      if (nameMatch || tagMatch) {
        if (!best || product.price < best.price) {
          best = {
            vendorName: vendor.name,
            price: product.price,
            productName: product.name,
          };
        }
      }
    }
  }
  return best;
}

// ── Ingredients & Method Screen ───────────────────────────────────
export default function IngredientsScreen() {
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();
  const getRecipeWithDetails = useRecipeStore((s) => s.getRecipeWithDetails);
  const pantryItems = usePantryStore((s) => s.items);
  const insets = useSafeAreaInsets();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [servings, setServings] = useState(4);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!recipeId) return;
    setIsLoading(true);
    getRecipeWithDetails(recipeId).then((r) => {
      setRecipe(r);
      if (r) setServings(r.serves ?? 4);
      setIsLoading(false);
    });
  }, [recipeId, getRecipeWithDetails]);

  const toggleChecked = (id: string) => {
    lightTap();
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const scaleFactor = recipe ? servings / (recipe.serves || 1) : 1;

  // Track ingredients viewed
  useEffect(() => {
    useTrackingStore.getState().trackIngredientsViewed();
  }, []);

  const pantryNormalised = useMemo(
    () => new Set(pantryItems.map((i) => normalise(i.name))),
    [pantryItems],
  );

  // Enrich ingredients
  const enriched = useMemo(() => {
    if (!recipe?.ingredients) return [];
    let vendorMatchCount = 0;

    const items: EnrichedIngredient[] = recipe.ingredients.map((ing) => {
      const inPantry = pantryNormalised.has(normalise(ing.name));
      let availability: IngredientAvailability;

      if (inPantry) {
        availability = "in_pantry";
      } else if (ing.is_pantry_staple) {
        availability = "can_substitute";
      } else {
        availability = "need_to_buy";
      }

      let vendorMatch: EnrichedIngredient["vendorMatch"] | undefined;
      if (availability === "need_to_buy") {
        vendorMatch = findVendorMatch(ing.name);
        if (vendorMatch) vendorMatchCount++;
      }

      return { ingredient: ing, availability, vendorMatch };
    });

    if (vendorMatchCount > 0) {
      useTrackingStore.getState().trackVendorMatchesShown(vendorMatchCount);
    }

    return items;
  }, [recipe?.ingredients, pantryNormalised]);

  const groups = useMemo(() => {
    const inPantry = enriched.filter((e) => e.availability === "in_pantry");
    const canSub = enriched.filter((e) => e.availability === "can_substitute");
    const needToBuy = enriched.filter((e) => e.availability === "need_to_buy");
    return { inPantry, canSub, needToBuy };
  }, [enriched]);

  const readyCount = groups.inPantry.length + groups.canSub.length;
  const totalCount = enriched.length;
  const needToBuyCount = groups.needToBuy.length;

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 16, color: Colors.text.secondary }}>Recipe not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => { lightTap(); router.back(); }} style={styles.headerBack}>
          <ArrowLeft size={20} color={Colors.text.primary} strokeWidth={1.5} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Ingredients</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{recipe.title}</Text>
        </View>
        <ServingsAdjuster value={servings} onChange={setServings} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20 }}
      >
        {/* Summary bar */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            {readyCount} of {totalCount} ingredients ready
          </Text>
          <View style={styles.summaryBarBg}>
            <View
              style={[
                styles.summaryBarFill,
                {
                  width: totalCount > 0 ? `${(readyCount / totalCount) * 100}%` : "0%",
                  backgroundColor: readyCount === totalCount ? Colors.success : Colors.primary,
                },
              ]}
            />
          </View>
        </View>

        {/* Need to Buy group */}
        {groups.needToBuy.length > 0 && (
          <View style={styles.group}>
            <View style={styles.groupHeader}>
              <View style={[styles.groupDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.groupTitle}>Need to Buy</Text>
              <Text style={styles.groupCount}>{groups.needToBuy.length}</Text>
            </View>
            {groups.needToBuy.map((item) => {
              const isChecked = checkedIngredients.has(item.ingredient.id);
              return (
                <Pressable
                  key={item.ingredient.id}
                  onPress={() => toggleChecked(item.ingredient.id)}
                  style={styles.ingredientRow}
                >
                  <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                    {isChecked && <Check size={12} color="#FFF" strokeWidth={2.5} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.ingredientName, isChecked && styles.ingredientChecked]}>{item.ingredient.name}</Text>
                    {item.vendorMatch && (
                      <Text style={styles.vendorHint}>
                        {item.vendorMatch.vendorName} · ${item.vendorMatch.price.toFixed(2)}
                      </Text>
                    )}
                  </View>
                  {item.ingredient.quantity && (
                    <Text style={styles.ingredientQty}>
                      {Math.round(item.ingredient.quantity * scaleFactor * 10) / 10} {item.ingredient.unit ?? ""}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Can Substitute group */}
        {groups.canSub.length > 0 && (
          <View style={styles.group}>
            <View style={styles.groupHeader}>
              <View style={[styles.groupDot, { backgroundColor: Colors.alert }]} />
              <Text style={styles.groupTitle}>Can Substitute</Text>
              <Text style={styles.groupCount}>{groups.canSub.length}</Text>
            </View>
            {groups.canSub.map((item) => {
              const isChecked = checkedIngredients.has(item.ingredient.id);
              return (
                <Pressable
                  key={item.ingredient.id}
                  onPress={() => toggleChecked(item.ingredient.id)}
                  style={styles.ingredientRow}
                >
                  <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                    {isChecked && <Check size={12} color="#FFF" strokeWidth={2.5} />}
                  </View>
                  <Text style={[styles.ingredientName, { flex: 1 }, isChecked && styles.ingredientChecked]}>{item.ingredient.name}</Text>
                  {item.ingredient.quantity && (
                    <Text style={styles.ingredientQty}>
                      {Math.round(item.ingredient.quantity * scaleFactor * 10) / 10} {item.ingredient.unit ?? ""}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* In Pantry group */}
        {groups.inPantry.length > 0 && (
          <View style={styles.group}>
            <View style={styles.groupHeader}>
              <View style={[styles.groupDot, { backgroundColor: Colors.success }]} />
              <Text style={styles.groupTitle}>In Your Pantry</Text>
              <Text style={styles.groupCount}>{groups.inPantry.length}</Text>
            </View>
            {groups.inPantry.map((item) => {
              const isChecked = checkedIngredients.has(item.ingredient.id);
              return (
                <Pressable
                  key={item.ingredient.id}
                  onPress={() => toggleChecked(item.ingredient.id)}
                  style={styles.ingredientRow}
                >
                  <View style={[styles.checkbox, styles.checkboxChecked, { backgroundColor: Colors.success }]}>
                    <Check size={12} color="#FFF" strokeWidth={2.5} />
                  </View>
                  <Text style={[styles.ingredientName, { flex: 1, color: Colors.text.muted }]}>
                    {item.ingredient.name}
                  </Text>
                  {item.ingredient.quantity && (
                    <Text style={styles.ingredientQty}>
                      {Math.round(item.ingredient.quantity * scaleFactor * 10) / 10} {item.ingredient.unit ?? ""}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Method section */}
        <View style={styles.methodHeader}>
          <Text style={styles.methodToggleText}>Method</Text>
          <Text style={styles.groupCount}>
            {recipe.workflow_cards?.length ?? 0} steps
          </Text>
        </View>

        {recipe.workflow_cards?.map((wc) => (
          <View key={wc.id} style={styles.stepRow}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>{wc.card_number}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{wc.title}</Text>
              {wc.instructions?.map((inst, i) => (
                <Text key={i} style={styles.stepInstruction}>{inst}</Text>
              ))}
              {wc.timer_seconds > 0 && (
                <Text style={styles.stepTimer}>
                  Timer: {Math.ceil(wc.timer_seconds / 60)} min
                </Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Sticky dual CTA */}
      <View style={[styles.stickyBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {needToBuyCount > 0 && (
          <Pressable
            onPress={() => { mediumTap(); router.push(`/(app)/shopping/${recipeId}`); }}
            style={({ pressed }) => [styles.shopButton, pressed && { opacity: 0.85 }]}
          >
            <ShoppingCart size={18} color="#FFF" strokeWidth={1.5} />
            <Text style={styles.shopButtonText}>Go Shopping</Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => { mediumTap(); router.push(`/(app)/cook-mode/${recipeId}`); }}
          style={({ pressed }) => [styles.cookButton, pressed && { opacity: 0.85 }]}
        >
          <Flame size={18} color={needToBuyCount > 0 ? Colors.text.secondary : "#FFF"} strokeWidth={1.5} />
          <Text style={[styles.cookButtonText, needToBuyCount > 0 && { color: Colors.text.secondary }]}>
            Start Cooking
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.text.muted,
    marginTop: 1,
  },

  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 8,
  },
  summaryBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.divider,
    overflow: "hidden",
  },
  summaryBarFill: {
    height: 6,
    borderRadius: 3,
  },

  group: {
    marginBottom: 20,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  groupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  groupTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  groupCount: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.muted,
  },

  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ingredientName: {
    fontSize: 15,
    color: Colors.text.primary,
  },
  ingredientQty: {
    fontSize: 13,
    fontFamily: Fonts.mono,
    color: Colors.text.secondary,
  },
  vendorHint: {
    fontSize: 12,
    color: Colors.text.muted,
    marginTop: 2,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  ingredientChecked: {
    textDecorationLine: "line-through" as const,
    color: Colors.text.muted,
  },
  methodHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 8,
  },
  methodToggleText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text.primary,
  },

  stepRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.text.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  stepInstruction: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 2,
  },
  stepTimer: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
    marginTop: 4,
  },

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
  shopButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 24,
  },
  shopButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  cookButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 24,
    marginTop: 8,
  },
  cookButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

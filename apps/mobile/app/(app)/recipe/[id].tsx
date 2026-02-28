import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Thermometer, ShieldCheck, Play } from "lucide-react-native";
import Constants from "expo-constants";
import { Image } from "expo-image";
import { useRecipe, useRecipeIngredients } from "../../../hooks/useRecipes";
import { useRecipePlatingSteps } from "../../../hooks/useRecipePlating";
import { useRecipeCCPs } from "../../../hooks/useRecipeCCPs";
import { useOrg } from "../../../contexts/OrgProvider";
import { useTheme } from "../../../contexts/ThemeProvider";
import { Badge } from "../../../components/ui/Badge";
import { Card, CardContent } from "../../../components/ui/Card";
import { Skeleton } from "../../../components/ui/Skeleton";
import { StepByStepViewer, type ViewerStep } from "../../../components/features/StepByStepViewer";

import { isHomeCook as isHomeCookVariant } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";

const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;

export default function RecipeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { storeMode } = useOrg();
  const { colors } = useTheme();
  const { data: recipe, isLoading, refetch, isRefetching } = useRecipe(id);
  const { data: recipeIngredients } = useRecipeIngredients(id);
  const { data: platingSteps } = useRecipePlatingSteps(id);
  const { data: ccpData } = useRecipeCCPs(id);

  const isHomeCook = isHomeCookVariant(APP_VARIANT);
  const [showMethodViewer, setShowMethodViewer] = useState(false);
  const [showPlatingViewer, setShowPlatingViewer] = useState(false);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: 24, gap: 16 }}>
          <Skeleton width={200} height={28} />
          <Skeleton width="100%" height={200} borderRadius={16} />
          <Skeleton width="60%" height={16} />
          <Skeleton width="80%" height={16} />
        </View>
      </SafeAreaView>
    );
  }

  if (!recipe) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.textSecondary }}>
            Recipe not found
          </Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: colors.accent, fontWeight: "600" }}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
  const foodCostPct =
    recipe.cost_per_serving && recipe.sell_price
      ? ((recipe.cost_per_serving / recipe.sell_price) * 100).toFixed(1)
      : null;

  const totalIngredientCost = recipeIngredients?.reduce((sum, ri) => {
    const cost = ri.ingredients?.cost_per_unit || 0;
    return sum + cost * ri.quantity;
  }, 0) || 0;

  // Also compute from JSON ingredients if no junction table data
  const jsonIngredients = Array.isArray(recipe.ingredients) ? recipe.ingredients as { name: string; quantity: number | null; unit: string; cost_per_unit?: number | null }[] : [];
  const jsonTotalCost = jsonIngredients.reduce((sum, i) => sum + ((i.quantity || 0) * (i.cost_per_unit || 0)), 0);
  const effectiveTotalCost = totalIngredientCost > 0 ? totalIngredientCost : jsonTotalCost;
  const effectiveCostPerServing = recipe.cost_per_serving || (recipe.servings && recipe.servings > 0 ? effectiveTotalCost / recipe.servings : 0);

  const targetPct = recipe.target_food_cost_percent || 30;
  const maxAllowedCost = recipe.sell_price ? recipe.sell_price * (targetPct / 100) : null;
  const isOverBudget = maxAllowedCost != null && effectiveCostPerServing > maxAllowedCost;
  const overBudgetAmount = maxAllowedCost != null ? effectiveCostPerServing - maxAllowedCost : 0;
  const grossProfit = recipe.sell_price ? recipe.sell_price - effectiveCostPerServing : null;
  const grossMarginPct = recipe.sell_price && recipe.sell_price > 0 ? ((1 - effectiveCostPerServing / recipe.sell_price) * 100).toFixed(1) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", padding: 16, paddingBottom: 0 }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowLeft size={18} color={colors.text} strokeWidth={1.5} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text }} numberOfLines={2}>
              {recipe.name}
            </Text>
            {recipe.category && (
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 2 }}>
                {recipe.category}
              </Text>
            )}
          </View>
          <Pressable
            onPress={() => router.push({ pathname: "/(app)/recipe/edit", params: { id: recipe.id } })}
            style={{ backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>Edit</Text>
          </Pressable>
        </View>

        {/* Image */}
        {recipe.image_url && (
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            <Image
              source={{ uri: recipe.image_url }}
              style={{ width: "100%", height: 200, borderRadius: 16 }}
              contentFit="cover"
              transition={300}
            />
          </View>
        )}

        {/* Quick stats */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            padding: 16,
            paddingBottom: 8,
          }}
        >
          {recipe.recipe_type && recipe.recipe_type !== "dish" && (
            <Badge variant="default">{recipe.recipe_type.replace("_", " ")}</Badge>
          )}
          {totalTime > 0 && (
            <Badge variant="secondary">{totalTime} min total</Badge>
          )}
          {recipe.prep_time != null && recipe.prep_time > 0 && (
            <Badge variant="secondary">{recipe.prep_time} min prep</Badge>
          )}
          {recipe.cook_time != null && recipe.cook_time > 0 && (
            <Badge variant="secondary">{recipe.cook_time} min cook</Badge>
          )}
          {recipe.servings && (
            <Badge variant="secondary">{recipe.servings} serves</Badge>
          )}
          {recipe.allergens && recipe.allergens.length > 0 &&
            recipe.allergens.map((a) => (
              <Badge key={a} variant="warning">{a}</Badge>
            ))}
        </View>

        {/* Description */}
        {recipe.description && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <Text style={{ fontSize: 15, color: colors.textSecondary, lineHeight: 22 }}>
              {recipe.description}
            </Text>
          </View>
        )}

        {/* Cost summary — hidden in simple home cook mode */}
        {!isHomeCook && (effectiveCostPerServing > 0 || effectiveTotalCost > 0) && (
          <Card style={{ marginHorizontal: 16, marginBottom: 12 }}>
            <CardContent style={{ paddingTop: 16 }}>
              {/* Header with status badge */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                  Cost Analysis
                </Text>
                {recipe.sell_price != null && effectiveCostPerServing > 0 && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: isOverBudget ? colors.destructiveBg : colors.successBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                    {isOverBudget ? (
                      <AlertTriangle size={12} color={colors.destructive} strokeWidth={1.5} />
                    ) : (
                      <CheckCircle size={12} color={colors.success} strokeWidth={1.5} />
                    )}
                    <Text style={{ fontSize: 11, fontWeight: "700", color: isOverBudget ? colors.destructive : colors.success }}>
                      {isOverBudget ? "Over Budget" : "On Target"}
                    </Text>
                  </View>
                )}
              </View>

              <View style={{ gap: 8 }}>
                {effectiveTotalCost > 0 && (
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: colors.textSecondary }}>Total Ingredient Cost</Text>
                    <Text style={{ fontWeight: "600", color: colors.text }}>${effectiveTotalCost.toFixed(2)}</Text>
                  </View>
                )}
                {effectiveCostPerServing > 0 && (
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: colors.textSecondary }}>Cost / Serving</Text>
                    <Text style={{ fontWeight: "600", color: colors.text }}>${effectiveCostPerServing.toFixed(2)}</Text>
                  </View>
                )}
                {recipe.sell_price != null && (
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: colors.textSecondary }}>Sell Price</Text>
                    <Text style={{ fontWeight: "600", color: colors.text }}>${recipe.sell_price.toFixed(2)}</Text>
                  </View>
                )}
                {maxAllowedCost != null && (
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: colors.textSecondary }}>Max Allowed Cost ({targetPct}%)</Text>
                    <Text style={{ fontWeight: "600", color: colors.text }}>${maxAllowedCost.toFixed(2)}</Text>
                  </View>
                )}
                {isOverBudget && overBudgetAmount > 0 && (
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: colors.destructive, fontWeight: "600" }}>Over Budget By</Text>
                    <Text style={{ fontWeight: "700", color: colors.destructive }}>${overBudgetAmount.toFixed(2)}</Text>
                  </View>
                )}
                {foodCostPct && (
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: colors.textSecondary }}>Food Cost %</Text>
                    <Text style={{ fontWeight: "700", color: Number(foodCostPct) > targetPct ? colors.destructive : colors.success }}>
                      {foodCostPct}%
                    </Text>
                  </View>
                )}

                {/* Margin section */}
                {grossProfit != null && recipe.sell_price != null && (
                  <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 4, gap: 8 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        {grossProfit > 0 ? (
                          <TrendingUp size={14} color={colors.success} strokeWidth={1.5} />
                        ) : (
                          <TrendingDown size={14} color={colors.destructive} strokeWidth={1.5} />
                        )}
                        <Text style={{ color: colors.textSecondary }}>Gross Profit / Serve</Text>
                      </View>
                      <Text style={{ fontWeight: "700", color: grossProfit > 0 ? colors.success : colors.destructive }}>
                        ${grossProfit.toFixed(2)}
                      </Text>
                    </View>
                    {grossMarginPct && (
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={{ color: colors.textSecondary }}>Gross Margin</Text>
                        <Text style={{ fontWeight: "700", color: Number(grossMarginPct) > 0 ? colors.success : colors.destructive }}>
                          {grossMarginPct}%
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </CardContent>
          </Card>
        )}

        {/* Ingredient Cost Breakdown */}
        {!isHomeCook && jsonIngredients.length > 0 && effectiveTotalCost > 0 && (
          <Card style={{ marginHorizontal: 16, marginBottom: 12 }}>
            <CardContent style={{ paddingTop: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
                Ingredient Cost Breakdown
              </Text>
              {jsonIngredients
                .filter((i) => (i.quantity || 0) * (i.cost_per_unit || 0) > 0)
                .sort((a, b) => ((b.quantity || 0) * (b.cost_per_unit || 0)) - ((a.quantity || 0) * (a.cost_per_unit || 0)))
                .map((item, idx) => {
                  const lineCost = (item.quantity || 0) * (item.cost_per_unit || 0);
                  const pct = effectiveTotalCost > 0 ? (lineCost / effectiveTotalCost) * 100 : 0;
                  return (
                    <View key={idx} style={{ marginBottom: 10 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                        <Text style={{ fontSize: 13, color: colors.text, flex: 1 }} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.textSecondary, marginRight: 8 }}>
                          {item.quantity} {item.unit}
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text, width: 60, textAlign: "right" }}>
                          ${lineCost.toFixed(2)}
                        </Text>
                      </View>
                      <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2 }}>
                        <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.accent, width: `${Math.min(pct, 100)}%` }} />
                      </View>
                      <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2 }}>{pct.toFixed(1)}%</Text>
                    </View>
                  );
                })}
            </CardContent>
          </Card>
        )}

        {/* Yield info for batch/portion prep */}
        {!isHomeCook && recipe.recipe_type && recipe.recipe_type !== "dish" && recipe.total_yield != null && (
          <Card style={{ marginHorizontal: 16, marginBottom: 12 }}>
            <CardContent style={{ paddingTop: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 8 }}>
                {recipe.recipe_type === "batch_prep" ? "Batch Yield" : "Yield"}
              </Text>
              <Text style={{ fontSize: 20, fontWeight: "800", color: colors.accent }}>
                {recipe.total_yield} {recipe.yield_unit || ""}
              </Text>
            </CardContent>
          </Card>
        )}

        {/* Ingredients from JSON (when no junction table data) */}
        {jsonIngredients.length > 0 && (!recipeIngredients || recipeIngredients.length === 0) && (
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
              Ingredients
            </Text>
            {jsonIngredients.map((item, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 15, color: colors.text, flex: 1 }}>{item.name}</Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, fontWeight: "500" }}>
                  {item.quantity || "—"} {item.unit}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Ingredients from junction table */}
        {recipeIngredients && recipeIngredients.length > 0 && (
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
              Ingredients
            </Text>
            {recipeIngredients.map((ri) => (
              <View
                key={ri.id}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, color: colors.text }}>
                    {ri.ingredients?.name || "Unknown"}
                  </Text>
                  {ri.notes && (
                    <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
                      {ri.notes}
                    </Text>
                  )}
                </View>
                <Text style={{ fontSize: 14, color: colors.textSecondary, fontWeight: "500" }}>
                  {ri.quantity} {ri.unit}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Instructions (JSON array) */}
        {recipe.instructions && Array.isArray(recipe.instructions) && (
          <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
                Method
              </Text>
              {(recipe.instructions as any[]).length > 0 && (
                <Pressable
                  onPress={() => setShowMethodViewer(true)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.accentBg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
                >
                  <Play size={14} color={colors.accent} strokeWidth={1.5} />
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.accent }}>Play</Text>
                </Pressable>
              )}
            </View>
            {(recipe.instructions as any[]).map((step, i) => {
              const stepText = typeof step === "string" ? step : step.text || JSON.stringify(step);
              const timerMin = typeof step === "object" ? step.timer_minutes : null;
              return (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    marginBottom: 16,
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: isHomeCook ? colors.warningBg : colors.accentBg,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "700",
                        color: isHomeCook ? colors.warning : colors.accent,
                      }}
                    >
                      {i + 1}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, color: colors.text, lineHeight: 22 }}>
                      {stepText}
                    </Text>
                    {timerMin != null && timerMin > 0 && (
                      <Text style={{ fontSize: 12, color: colors.accent, marginTop: 2 }}>
                        Timer: {timerMin} min
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Plating Guide */}
        {platingSteps && platingSteps.length > 0 && (
          <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
                Plating Guide
              </Text>
              <Pressable
                onPress={() => setShowPlatingViewer(true)}
                style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.accentBg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
              >
                <Play size={14} color={colors.accent} strokeWidth={1.5} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.accent }}>Play</Text>
              </Pressable>
            </View>
            {platingSteps.map((step, i) => (
              <View key={step.id || i} style={{ flexDirection: "row", marginBottom: 16, gap: 12 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accentBg, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.accent }}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, color: colors.text, lineHeight: 22 }}>{step.instruction}</Text>
                  {step.image_url && (
                    <Image source={{ uri: step.image_url }} style={{ width: "100%", height: 150, borderRadius: 12, marginTop: 8 }} contentFit="cover" />
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* CCP Mini-Timeline */}
        {!isHomeCook && ccpData && ccpData.length > 0 && (
          <Card style={{ marginHorizontal: 16, marginTop: 16 }}>
            <CardContent style={{ paddingTop: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <ShieldCheck size={16} color={colors.accent} strokeWidth={1.5} />
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                  Critical Control Points ({ccpData.length})
                </Text>
              </View>
              {ccpData.map((ccp, i) => (
                <View key={ccp.id || i} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: i < ccpData.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
                  <View style={{ backgroundColor: colors.warningBg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: colors.warning, textTransform: "uppercase" }}>{ccp.step_type}</Text>
                  </View>
                  {ccp.target_temp != null && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                      <Thermometer size={12} color={ccp.target_temp >= 5 && ccp.target_temp <= 60 ? colors.destructive : colors.success} strokeWidth={1.5} />
                      <Text style={{ fontSize: 13, fontWeight: "700", color: ccp.target_temp >= 5 && ccp.target_temp <= 60 ? colors.destructive : colors.success }}>{ccp.target_temp}°C</Text>
                    </View>
                  )}
                  <Text style={{ flex: 1, fontSize: 13, color: colors.textSecondary }} numberOfLines={2}>{ccp.description}</Text>
                </View>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Storage info */}
        {(recipe.shelf_life_days > 0 || recipe.shelf_life_hours > 0 || recipe.storage_temp) && (
          <Card style={{ marginHorizontal: 16, marginTop: 16 }}>
            <CardContent style={{ paddingTop: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 8 }}>
                Storage
              </Text>
              {recipe.storage_temp && (
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 4 }}>
                  Temp: {recipe.storage_temp}
                </Text>
              )}
              {(recipe.shelf_life_days > 0 || recipe.shelf_life_hours > 0) && (
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                  Shelf life:{" "}
                  {recipe.shelf_life_days > 0 ? `${recipe.shelf_life_days}d` : ""}
                  {recipe.shelf_life_hours > 0 ? ` ${recipe.shelf_life_hours}h` : ""}
                </Text>
              )}
              {recipe.storage_notes && (
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
                  {recipe.storage_notes}
                </Text>
              )}
            </CardContent>
          </Card>
        )}
      </ScrollView>

      {/* Step-by-step viewers */}
      {recipe.instructions && Array.isArray(recipe.instructions) && (
        <StepByStepViewer
          visible={showMethodViewer}
          onClose={() => setShowMethodViewer(false)}
          steps={(recipe.instructions as any[]).map((s) => ({
            text: typeof s === "string" ? s : s.text || "",
            timer_minutes: typeof s === "object" ? s.timer_minutes : null,
            image_url: typeof s === "object" ? s.image_url : null,
          }))}
          title="Method"
        />
      )}
      {platingSteps && platingSteps.length > 0 && (
        <StepByStepViewer
          visible={showPlatingViewer}
          onClose={() => setShowPlatingViewer(false)}
          steps={platingSteps.map((s) => ({
            text: s.instruction,
            image_url: s.image_url,
          }))}
          title="Plating"
        />
      )}
    </SafeAreaView>
  );
}

import { useState } from "react";
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, Switch } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { Input } from "../../../components/ui/Input";
import { useAppSettings } from "../../../hooks/useAppSettings";
import { useTheme } from "../../../contexts/ThemeProvider";

type CalcMode = "reverse" | "forward" | "target";

const MODES: { id: CalcMode; label: string; description: string }[] = [
  { id: "reverse", label: "Max Cost", description: "Set price & target % → Get max cost" },
  { id: "forward", label: "Set Price", description: "Set cost & target % → Get sell price" },
  { id: "target", label: "Check %", description: "Set cost & price → Get actual %" },
];

const QUICK_TARGETS = [22, 25, 28, 30, 32, 35];

export default function Costing() {
  const router = useRouter();
  const { colors } = useTheme();
  const { settings } = useAppSettings();

  const [mode, setMode] = useState<CalcMode>("reverse");
  const [sellPrice, setSellPrice] = useState("");
  const [targetPercent, setTargetPercent] = useState(settings.targetFoodCost || "30");
  const [actualCost, setActualCost] = useState("");
  const [servings, setServings] = useState("1");
  const [includeGST, setIncludeGST] = useState(settings.gstEnabled);
  const [gstRate, setGstRate] = useState(settings.taxRate || "10");

  const sell = parseFloat(sellPrice) || 0;
  const target = parseFloat(targetPercent) || 30;
  const cost = parseFloat(actualCost) || 0;
  const servingCount = parseInt(servings, 10) || 1;
  const gst = parseFloat(gstRate) || 0;

  // Ex-GST sell price
  const exGSTSell = includeGST && gst > 0 ? sell / (1 + gst / 100) : sell;

  // Reverse mode: max allowed cost
  const maxAllowedCost = exGSTSell * (target / 100);
  const maxIngredientBudget = maxAllowedCost * servingCount;
  const reverseMargin = exGSTSell - maxAllowedCost;
  const reverseMarginPct = 100 - target;

  // Forward mode: recommended sell price
  const forwardSellPrice = target > 0 ? cost / (target / 100) : 0;
  const forwardWithGST = includeGST && gst > 0 ? forwardSellPrice * (1 + gst / 100) : forwardSellPrice;
  const forwardMargin = forwardSellPrice - cost;

  // Target mode: actual food cost %
  const actualFoodCostPct = exGSTSell > 0 ? (cost / exGSTSell) * 100 : 0;
  const isOverBudget = cost > maxAllowedCost && cost > 0 && sell > 0;
  const costVariance = cost - maxAllowedCost;
  const suggestedPrice = target > 0 ? cost / (target / 100) : 0;

  const getHealthColor = (pct: number) => {
    if (pct <= 25) return colors.success;
    if (pct <= 30) return colors.success;
    if (pct <= 35) return colors.warning;
    return colors.destructive;
  };

  const getHealthLabel = (pct: number) => {
    if (pct <= 25) return "Excellent";
    if (pct <= 30) return "Good";
    if (pct <= 35) return "Watch";
    return "Too High";
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScreenHeader title="Food Cost Calculator" />

        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
          {/* GST Toggle Bar */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 14 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>Include GST</Text>
              <Switch value={includeGST} onValueChange={setIncludeGST} trackColor={{ true: colors.accent }} />
            </View>
            {includeGST && (
              <View style={{ marginTop: 10, gap: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>GST Rate:</Text>
                  <View style={{ width: 70 }}>
                    <Input
                      value={gstRate}
                      onChangeText={setGstRate}
                      keyboardType="decimal-pad"
                      placeholder="10"
                      containerStyle={{ marginBottom: 0 }}
                    />
                  </View>
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>%</Text>
                </View>
                {sell > 0 && (
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>
                    Ex-GST: ${exGSTSell.toFixed(2)} | GST: ${(sell - exGSTSell).toFixed(2)}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Mode Selector */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            {MODES.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => setMode(m.id)}
                style={{
                  flex: 1, alignItems: "center", padding: 12, borderRadius: 14,
                  backgroundColor: mode === m.id ? colors.accent : colors.surface,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: mode === m.id ? "#FFFFFF" : colors.textSecondary }}>
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: "center" }}>
            {MODES.find((m) => m.id === mode)?.description}
          </Text>

          {/* Inputs */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20, gap: 16 }}>
            {/* Sell Price — reverse & target modes */}
            {(mode === "reverse" || mode === "target") && (
              <Input
                label={`Sell Price ($)${includeGST ? " inc. GST" : ""}`}
                placeholder="e.g. 28.00"
                value={sellPrice}
                onChangeText={setSellPrice}
                keyboardType="decimal-pad"
              />
            )}

            {/* Target % — reverse & forward modes */}
            {(mode === "reverse" || mode === "forward") && (
              <View>
                <Input
                  label="Target Food Cost %"
                  placeholder="30"
                  value={targetPercent}
                  onChangeText={setTargetPercent}
                  keyboardType="decimal-pad"
                />
                <View style={{ flexDirection: "row", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {QUICK_TARGETS.map((pct) => (
                    <Pressable
                      key={pct}
                      onPress={() => setTargetPercent(String(pct))}
                      style={{
                        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
                        backgroundColor: target === pct ? colors.accent : colors.card,
                        borderWidth: 1, borderColor: target === pct ? colors.accent : colors.border,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: "600", color: target === pct ? "#FFFFFF" : colors.textSecondary }}>
                        {pct}%
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Actual Cost — forward & target modes */}
            {(mode === "forward" || mode === "target") && (
              <Input
                label="Actual Ingredient Cost ($)"
                placeholder="e.g. 8.50"
                value={actualCost}
                onChangeText={setActualCost}
                keyboardType="decimal-pad"
              />
            )}

            {/* Servings — reverse mode only */}
            {mode === "reverse" && (
              <Input
                label="Servings per Recipe"
                placeholder="1"
                value={servings}
                onChangeText={setServings}
                keyboardType="number-pad"
              />
            )}
          </View>

          {/* ─── Results ─── */}

          {/* REVERSE MODE RESULTS */}
          {mode === "reverse" && sell > 0 && (
            <View style={{ gap: 12 }}>
              <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 2, borderColor: colors.accent, padding: 24, alignItems: "center" }}>
                <Text style={{ fontSize: 42, fontWeight: "900", color: colors.accent }}>
                  ${maxAllowedCost.toFixed(2)}
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>Maximum Allowed Cost</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>per serving to hit {target}% food cost</Text>
              </View>

              {servingCount > 1 && (
                <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder, padding: 20, alignItems: "center" }}>
                  <Text style={{ fontSize: 28, fontWeight: "800", color: colors.text }}>${maxIngredientBudget.toFixed(2)}</Text>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>Total Recipe Budget for {servingCount} servings</Text>
                </View>
              )}

              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1, backgroundColor: colors.successBg, borderRadius: 12, padding: 16 }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>Target Margin</Text>
                  <Text style={{ fontSize: 22, fontWeight: "800", color: colors.success, marginTop: 4 }}>${reverseMargin.toFixed(2)}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: colors.successBg, borderRadius: 12, padding: 16 }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>Margin %</Text>
                  <Text style={{ fontSize: 22, fontWeight: "800", color: colors.success, marginTop: 4 }}>{reverseMarginPct.toFixed(1)}%</Text>
                </View>
              </View>
            </View>
          )}

          {/* FORWARD MODE RESULTS */}
          {mode === "forward" && cost > 0 && (
            <View style={{ gap: 12 }}>
              <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 2, borderColor: colors.accent, padding: 24, alignItems: "center" }}>
                <Text style={{ fontSize: 42, fontWeight: "900", color: colors.accent }}>
                  ${forwardWithGST.toFixed(2)}
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
                  Recommended Sell Price{includeGST ? " (inc. GST)" : ""}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                  to achieve {target}% food cost
                  {includeGST && ` (ex-GST: $${forwardSellPrice.toFixed(2)})`}
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1, backgroundColor: colors.successBg, borderRadius: 12, padding: 16 }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>Your Margin</Text>
                  <Text style={{ fontSize: 22, fontWeight: "800", color: colors.success, marginTop: 4 }}>${forwardMargin.toFixed(2)}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: colors.successBg, borderRadius: 12, padding: 16 }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>Margin %</Text>
                  <Text style={{ fontSize: 22, fontWeight: "800", color: colors.success, marginTop: 4 }}>{(100 - target).toFixed(1)}%</Text>
                </View>
              </View>
            </View>
          )}

          {/* TARGET (CHECK %) MODE RESULTS */}
          {mode === "target" && sell > 0 && cost > 0 && (
            <View style={{ gap: 12 }}>
              <View style={{
                backgroundColor: colors.card, borderRadius: 16, borderWidth: 2,
                borderColor: isOverBudget ? colors.destructive : colors.success,
                padding: 24, alignItems: "center",
              }}>
                <Text style={{ fontSize: 42, fontWeight: "900", color: isOverBudget ? colors.destructive : colors.success }}>
                  {actualFoodCostPct.toFixed(1)}%
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>Actual Food Cost %</Text>
                <View style={{ marginTop: 8, backgroundColor: (isOverBudget ? colors.destructive : colors.success) + "20", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: isOverBudget ? colors.destructive : colors.success }}>
                    {isOverBudget ? "Over budget!" : getHealthLabel(actualFoodCostPct)}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>Actual Margin</Text>
                  <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text, marginTop: 4 }}>${(exGSTSell - cost).toFixed(2)}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>Margin %</Text>
                  <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text, marginTop: 4 }}>{(100 - actualFoodCostPct).toFixed(1)}%</Text>
                </View>
              </View>

              {/* Over-budget alert */}
              {isOverBudget && (
                <View style={{ backgroundColor: colors.destructiveBg, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.destructive + "30" }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.destructive }}>
                    Cost is ${Math.abs(costVariance).toFixed(2)} over target
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
                    Reduce ingredients or increase sell price to ${suggestedPrice.toFixed(2)}
                    {includeGST && gst > 0 ? ` (${(suggestedPrice * (1 + gst / 100)).toFixed(2)} inc. GST)` : ""}
                  </Text>
                </View>
              )}

              {/* Recommended pricing at different targets */}
              <View style={{ backgroundColor: colors.warningBg, borderRadius: 16, padding: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 12 }}>Recommended Pricing</Text>
                <View style={{ gap: 8 }}>
                  {[25, 30, 35].map((t) => {
                    const recommended = cost / (t / 100);
                    const withGST = includeGST && gst > 0 ? recommended * (1 + gst / 100) : recommended;
                    return (
                      <View key={t} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={{ fontSize: 13, color: colors.textSecondary }}>At {t}% food cost</Text>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
                          ${withGST.toFixed(2)}{includeGST && gst > 0 ? " inc. GST" : ""}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

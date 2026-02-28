import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Linking,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useOrg } from "../../contexts/OrgProvider";
import Constants from "expo-constants";

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  nudgeType?: "upgrade_prompt" | "sneak_peek";
  onDismiss?: () => void;
  onConverted?: () => void;
}

const CHEF_OS_FEATURES = [
  "Full kitchen management suite",
  "Inventory & stock control",
  "Menu engineering & costing",
  "Staff scheduling & rosters",
  "Supplier management",
  "Advanced analytics & reports",
];

const AI_FEATURES = [
  "AI Recipe Assistant",
  "Smart menu suggestions",
  "Voice-enabled companion",
];

export default function UpgradeModal({
  visible,
  onClose,
  nudgeType = "upgrade_prompt",
  onDismiss,
  onConverted,
}: UpgradeModalProps) {
  const { currentOrg } = useOrg();
  const [isLoading, setIsLoading] = useState(false);
  const [includeAi, setIncludeAi] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [planPrices, setPlanPrices] = useState<{
    monthly: number | null;
    yearly: number | null;
    aiMonthly: number | null;
    aiYearly: number | null;
    currency: string;
  }>({ monthly: null, yearly: null, aiMonthly: null, aiYearly: null, currency: "gbp" });

  const storeMode = (currentOrg as any)?.store_mode || "restaurant";
  const storeKey = storeMode === "homecook" ? "homeos" : storeMode === "india" ? "chefos_india" : "chefos";

  useEffect(() => {
    if (!visible) return;
    const fetchPricing = async () => {
      const { data: plan } = await supabase
        .from("subscription_plans")
        .select("price_monthly, price_yearly, ai_addon_price_monthly, ai_addon_price_yearly, currency")
        .eq("tier", "pro")
        .eq("is_active", true)
        .eq("product_key", storeKey)
        .maybeSingle();
      if (plan) {
        setPlanPrices({
          monthly: (plan as any).price_monthly,
          yearly: (plan as any).price_yearly,
          aiMonthly: (plan as any).ai_addon_price_monthly,
          aiYearly: (plan as any).ai_addon_price_yearly,
          currency: (plan as any).currency || "gbp",
        });
      }
    };
    fetchPricing();
  }, [visible, storeKey]);

  const formatPrice = (amount: number | null, currency: string) => {
    if (amount == null) return "";
    const sym =
      currency === "gbp" ? "£" :
      currency === "usd" ? "$" :
      currency === "aud" ? "A$" :
      currency === "inr" ? "₹" :
      currency === "aed" ? "د.إ" :
      currency === "sgd" ? "S$" :
      currency.toUpperCase() + " ";
    return `${sym}${amount.toFixed(2)}`;
  };

  const handleUpgrade = async () => {
    if (!currentOrg?.id) return;

    setIsLoading(true);
    try {
      const { data: plans } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("tier", "pro")
        .eq("is_active", true)
        .eq("product_key", storeKey);

      const plan = plans?.[0];
      if (!plan) {
        Alert.alert("Error", "No active upgrade plan found");
        return;
      }

      const appScheme = Constants.expoConfig?.scheme ?? "queitos";
      const returnUrl = `${appScheme}://upgrade-complete`;

      const { data, error } = await supabase.functions.invoke("subscription-checkout", {
        body: {
          orgId: currentOrg.id,
          planId: (plan as any).id,
          billingPeriod,
          includeAiAddon: includeAi,
          returnUrl,
        },
      });

      if (error) throw error;
      if (data?.url) {
        onConverted?.();
        await Linking.openURL(data.url);
        onClose();
      }
    } catch (err: any) {
      console.error("Upgrade error:", err);
      Alert.alert("Upgrade Failed", err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {nudgeType === "sneak_peek" ? "Sneak Peek: ChefOS Pro" : "Upgrade to ChefOS Pro"}
          </Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#999" />
          </Pressable>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={styles.subtitle}>
            {nudgeType === "sneak_peek"
              ? "Here's a taste of what ChefOS Pro can do."
              : "Unlock the full power of ChefOS for your team."}
          </Text>

          {/* Features */}
          <Text style={styles.sectionTitle}>Included in Pro:</Text>
          {CHEF_OS_FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}

          {/* AI Add-on */}
          <Pressable
            style={[styles.addonCard, includeAi && styles.addonCardActive]}
            onPress={() => setIncludeAi(!includeAi)}
          >
            <View style={styles.addonHeader}>
              <Ionicons name="flash" size={18} color="#7c3aed" />
              <Text style={styles.addonTitle}>AI Add-on</Text>
              <View style={[styles.addonBadge, includeAi && styles.addonBadgeActive]}>
                <Text style={[styles.addonBadgeText, includeAi && { color: "#7c3aed" }]}>
                  {includeAi ? "Included" : "Add"}
                </Text>
              </View>
            </View>
            {AI_FEATURES.map((f) => (
              <View key={f} style={styles.featureRow}>
                <Ionicons name="sparkles" size={14} color="#a78bfa" />
                <Text style={[styles.featureText, { fontSize: 13 }]}>{f}</Text>
              </View>
            ))}
          </Pressable>

          {/* Pricing */}
          {planPrices.monthly != null && (
            <View style={{ alignItems: "center", marginTop: 12 }}>
              <Text style={{ fontSize: 24, fontWeight: "700", color: "#111" }}>
                {formatPrice(
                  billingPeriod === "yearly" ? planPrices.yearly : planPrices.monthly,
                  planPrices.currency,
                )}
                <Text style={{ fontSize: 13, fontWeight: "400", color: "#999" }}>
                  /{billingPeriod === "yearly" ? "yr" : "mo"}
                </Text>
              </Text>
              {includeAi && planPrices.aiMonthly != null && (
                <Text style={{ fontSize: 13, color: "#7c3aed", marginTop: 2 }}>
                  + {formatPrice(
                    billingPeriod === "yearly" ? planPrices.aiYearly : planPrices.aiMonthly,
                    planPrices.currency,
                  )}/{billingPeriod === "yearly" ? "yr" : "mo"} AI add-on
                </Text>
              )}
            </View>
          )}

          {/* Billing toggle */}
          <View style={styles.billingToggle}>
            <Pressable
              style={[styles.billingBtn, billingPeriod === "monthly" && styles.billingBtnActive]}
              onPress={() => setBillingPeriod("monthly")}
            >
              <Text style={[styles.billingBtnText, billingPeriod === "monthly" && styles.billingBtnTextActive]}>
                Monthly
              </Text>
            </Pressable>
            <Pressable
              style={[styles.billingBtn, billingPeriod === "yearly" && styles.billingBtnActive]}
              onPress={() => setBillingPeriod("yearly")}
            >
              <Text style={[styles.billingBtnText, billingPeriod === "yearly" && styles.billingBtnTextActive]}>
                Yearly (Save 20%)
              </Text>
            </Pressable>
          </View>

          {/* CTA */}
          <Pressable
            style={[styles.upgradeBtn, isLoading && { opacity: 0.6 }]}
            onPress={handleUpgrade}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="arrow-up-circle" size={20} color="#fff" />
                <Text style={styles.upgradeBtnText}>Upgrade Now</Text>
              </>
            )}
          </Pressable>

          {nudgeType === "sneak_peek" && (
            <Pressable
              style={styles.laterBtn}
              onPress={() => {
                onDismiss?.();
                onClose();
              }}
            >
              <Text style={styles.laterBtnText}>Maybe later</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 20, fontWeight: "700", color: "#111" },
  closeBtn: { padding: 4 },
  body: { flex: 1, paddingHorizontal: 20 },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#333" },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  featureText: { fontSize: 14, color: "#333" },
  addonCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    marginBottom: 8,
  },
  addonCardActive: { borderColor: "#c4b5fd", backgroundColor: "#faf5ff" },
  addonHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  addonTitle: { fontSize: 14, fontWeight: "600", color: "#333", flex: 1 },
  addonBadge: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  addonBadgeActive: { borderColor: "#c4b5fd", backgroundColor: "#ede9fe" },
  addonBadgeText: { fontSize: 11, fontWeight: "600", color: "#666" },
  billingToggle: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginVertical: 16,
  },
  billingBtn: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  billingBtnActive: { backgroundColor: "#111", borderColor: "#111" },
  billingBtnText: { fontSize: 13, fontWeight: "600", color: "#666" },
  billingBtnTextActive: { color: "#fff" },
  upgradeBtn: {
    backgroundColor: "#7c3aed",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  upgradeBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  laterBtn: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  laterBtnText: { fontSize: 14, color: "#999" },
});

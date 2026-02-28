import { View, Text, ScrollView, RefreshControl, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { useOrg } from "../../../contexts/OrgProvider";
import { useTheme } from "../../../contexts/ThemeProvider";
import { HubGrid, type HubItem } from "../../../components/features/HubGrid";
import { ComplianceToggleBanner } from "../../../components/features/ComplianceToggleBanner";

import { isHomeCook } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";
const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;
const IS_HOMECHEF = isHomeCook(APP_VARIANT);
import {
  ShieldCheck,
  Thermometer,
  SprayCan,
  Store,
  ClipboardCheck,
  FolderOpen,
  AlertTriangle,
  ChevronRight,
} from "lucide-react-native";

const SAFETY_ITEMS: HubItem[] = [
  { icon: ShieldCheck, label: "Food Safety", route: "/(app)/food-safety", module: "food-safety" },
  { icon: ClipboardCheck, label: "Audit", route: "/(app)/audit" },
  { icon: FolderOpen, label: "Docs", route: "/(app)/food-safety-docs" },
  { icon: SprayCan, label: "Cleaning", route: "/(app)/cleaning-management" },
];

export default function SafetyHub() {
  const { currentOrg } = useOrg();
  const { colors } = useTheme();
  const router = useRouter();
  const orgId = currentOrg?.id;

  // ── Hub stats query ──────────────────────────────────────────
  const { data, refetch, isRefetching } = useQuery({
    queryKey: ["safety-hub-full", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const today = new Date().toISOString().split("T")[0];

      const [
        safetyRes,
        cleaningRes,
        receivingRes,
        criticalRes,
      ] = await Promise.all([
        supabase.from("food_safety_logs").select("id, status", { count: "exact" }).eq("org_id", orgId).eq("date", today).eq("log_type", "temperature"),
        supabase.from("food_safety_logs").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("date", today).eq("log_type", "cleaning"),
        supabase.from("food_safety_logs").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("date", today).eq("log_type", "receiving"),
        supabase.from("food_safety_logs").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("date", today).eq("status", "critical"),
      ]);

      const todayLogs = safetyRes.data ?? [];
      const failCount = todayLogs.filter((l: any) => l.status === "fail" || l.status === "critical").length;

      return {
        tempChecks: safetyRes.count || 0,
        tempFailed: failCount,
        cleaningCount: cleaningRes.count || 0,
        receivingCount: receivingRes.count || 0,
        criticalAlerts: criticalRes.count || 0,
      };
    },
    enabled: !!orgId,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
      >
        <View style={{ padding: 24, paddingBottom: 16 }}>
          <Text style={{ fontSize: 28, fontWeight: "800", color: colors.text }}>Food Safety</Text>
          <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 4 }}>{IS_HOMECHEF ? "Safety & learning" : "Compliance & training hub"}</Text>
        </View>

        {/* BCC Compliance Toggle Banner */}
        <ComplianceToggleBanner />

        {/* Critical Alert Banner */}
        {(data?.criticalAlerts ?? 0) > 0 && (
          <Pressable
            onPress={() => router.push("/(app)/food-safety")}
            style={{
              flexDirection: "row", alignItems: "center", gap: 12,
              marginHorizontal: 16, marginBottom: 16, padding: 14, borderRadius: 12,
              backgroundColor: colors.destructive + "12",
              borderWidth: 1, borderColor: colors.destructive + "30",
            }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.destructive + "20", alignItems: "center", justifyContent: "center" }}>
              <AlertTriangle size={18} color={colors.destructive} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.destructive }}>
                {data!.criticalAlerts} Critical Alert{data!.criticalAlerts > 1 ? "s" : ""}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                Temperature readings out of safe range
              </Text>
            </View>
            <ChevronRight size={16} color={colors.destructive} strokeWidth={1.5} />
          </Pressable>
        )}

        {/* Quick Actions */}
        <View style={{ marginHorizontal: 16, marginBottom: 20 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
            Quick Actions
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Pressable
              onPress={() => router.push("/(app)/temp-grid" as any)}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center", gap: 6,
                backgroundColor: colors.success + "15", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14,
                borderWidth: 1, borderColor: colors.success + "30",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Thermometer size={15} color={colors.success} strokeWidth={1.5} />
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.success }}>Temp</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/(app)/food-safety/receiving" as any)}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center", gap: 6,
                backgroundColor: colors.warning + "15", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14,
                borderWidth: 1, borderColor: colors.warning + "30",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Store size={15} color={colors.warning} strokeWidth={1.5} />
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.warning }}>Receiving</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/(app)/food-safety/cleaning-bcc" as any)}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center", gap: 6,
                backgroundColor: colors.accent + "15", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14,
                borderWidth: 1, borderColor: colors.accent + "30",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <SprayCan size={15} color={colors.accent} strokeWidth={1.5} />
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.accent }}>Cleaning</Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* Hub tiles */}
        <HubGrid items={SAFETY_ITEMS} columns={2} />
      </ScrollView>
    </SafeAreaView>
  );
}

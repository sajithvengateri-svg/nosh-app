import { View, Text, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { useOrg } from "../../../contexts/OrgProvider";
import { useTheme } from "../../../contexts/ThemeProvider";
import { HubGrid, type HubItem } from "../../../components/features/HubGrid";
import { ClipboardList, Package, Factory, Wrench, Tag, Trash2, CalendarDays, CalendarClock, BarChart3, Home, FileText, Calculator } from "lucide-react-native";

import { isHomeCook } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";
const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;
const IS_HOMECHEF = isHomeCook(APP_VARIANT);

const ALL_KITCHEN_ITEMS: HubItem[] = [
  { icon: ClipboardList, label: "Prep Lists", route: "/(app)/prep-lists", module: "prep" },
  { icon: Package, label: "Inventory", route: "/(app)/(tabs)/inventory" },
  { icon: Factory, label: "Production", route: "/(app)/production", module: "production" },
  { icon: Wrench, label: "Equipment", route: "/(app)/equipment", module: "equipment" },
  { icon: Tag, label: "Sections", route: "/(app)/kitchen-sections", module: "kitchen-sections" },
  { icon: Trash2, label: "Waste Log", route: "/(app)/waste-log", module: "waste-log" },
  { icon: CalendarDays, label: "Calendar", route: "/(app)/calendar", module: "calendar" },
  { icon: CalendarClock, label: "Roster", route: "/(app)/roster", module: "roster" },
  { icon: BarChart3, label: "Menu Eng.", route: "/(app)/menu-engineering", module: "menu-engineering" },
  { icon: Calculator, label: "Cost Calc", route: "/(app)/costing" },
  { icon: Home, label: "House Keeping", route: "/(app)/housekeeping" },
  { icon: FileText, label: "Cheatsheets", route: "/(app)/cheatsheets", module: "cheatsheets" },
];

const HOMECHEF_KITCHEN_ITEMS: HubItem[] = [
  { icon: ClipboardList, label: "Prep Lists", route: "/(app)/prep-lists", module: "prep" },
  { icon: Package, label: "Pantry", route: "/(app)/(tabs)/inventory" },
  { icon: Calculator, label: "Cost Calc", route: "/(app)/costing" },
  { icon: Wrench, label: "Equipment", route: "/(app)/equipment", module: "equipment" },
  { icon: CalendarDays, label: "Calendar", route: "/(app)/calendar", module: "calendar" },
  { icon: Home, label: "House Keeping", route: "/(app)/housekeeping" },
  { icon: FileText, label: "Cheatsheets", route: "/(app)/cheatsheets", module: "cheatsheets" },
];

const KITCHEN_ITEMS = IS_HOMECHEF ? HOMECHEF_KITCHEN_ITEMS : ALL_KITCHEN_ITEMS;

export default function Kitchen() {
  const { currentOrg } = useOrg();
  const { colors } = useTheme();
  const orgId = currentOrg?.id;

  const { data: stats, refetch, isRefetching } = useQuery({
    queryKey: ["kitchen-hub-stats", orgId],
    queryFn: async () => {
      if (!orgId) return { prepPending: 0, equipAlerts: 0, productionBatches: 0 };
      const today = new Date().toISOString().split("T")[0];

      const [prepRes, equipRes, prodRes] = await Promise.all([
        supabase
          .from("prep_tasks")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId)
          .eq("date", today)
          .neq("status", "completed"),
        supabase
          .from("equipment")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId)
          .in("status", ["needs_maintenance", "broken"]),
        supabase
          .from("production_batches")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId)
          .eq("status", "in_progress"),
      ]);

      return {
        prepPending: prepRes.count || 0,
        equipAlerts: equipRes.count || 0,
        productionBatches: prodRes.count || 0,
      };
    },
    enabled: !!orgId,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <View style={{ padding: 24, paddingBottom: 16 }}>
          <Text style={{ fontSize: 28, fontWeight: "800", color: colors.text }}>
            {IS_HOMECHEF ? "My Kitchen" : "Kitchen"}
          </Text>
          <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 4 }}>{IS_HOMECHEF ? "Your cooking hub" : "Operations hub"}</Text>
        </View>

        {/* Summary stats */}
        <View style={{ flexDirection: "row", gap: 10, marginHorizontal: 16, marginBottom: 20 }}>
          <View style={{ flex: 1, backgroundColor: colors.warningBg, borderRadius: 14, padding: 14, alignItems: "center" }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: (stats?.prepPending ?? 0) > 0 ? colors.warning : colors.success }}>
              {stats?.prepPending ?? 0}
            </Text>
            <Text style={{ fontSize: 11, fontWeight: "600", color: colors.warning, marginTop: 2 }}>Prep Pending</Text>
          </View>
          {!IS_HOMECHEF && (
            <View style={{ flex: 1, backgroundColor: (stats?.equipAlerts ?? 0) > 0 ? colors.destructiveBg : colors.successBg, borderRadius: 14, padding: 14, alignItems: "center" }}>
              <Text style={{ fontSize: 20, fontWeight: "800", color: (stats?.equipAlerts ?? 0) > 0 ? colors.destructive : colors.success }}>
                {stats?.equipAlerts ?? 0}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: "600", color: (stats?.equipAlerts ?? 0) > 0 ? colors.destructive : colors.success, marginTop: 2 }}>Equip. Alerts</Text>
            </View>
          )}
          {!IS_HOMECHEF && (
            <View style={{ flex: 1, backgroundColor: colors.accentBg, borderRadius: 14, padding: 14, alignItems: "center" }}>
              <Text style={{ fontSize: 20, fontWeight: "800", color: colors.accent }}>
                {stats?.productionBatches ?? 0}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.accent, marginTop: 2 }}>In Production</Text>
            </View>
          )}
        </View>

        {/* 9-tile hub grid */}
        <HubGrid items={KITCHEN_ITEMS} columns={3} />
      </ScrollView>
    </SafeAreaView>
  );
}

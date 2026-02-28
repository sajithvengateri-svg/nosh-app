import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { isHomeCook } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";
import { useTheme } from "../../../contexts/ThemeProvider";
import { useOrg } from "../../../contexts/OrgProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { ComplianceProvider } from "../../../contexts/ComplianceProvider";
import { CleaningDashboard } from "../../../components/features/CleaningDashboard";
import { CleaningMonthlyGrid } from "../../../components/features/CleaningMonthlyGrid";
import { CleaningScheduleSetup } from "../../../components/features/CleaningScheduleSetup";
import { HomeCleaningChecklist } from "../../../components/features/HomeCleaningChecklist";
import { ChemicalGrid } from "../../../components/features/ChemicalGrid";

const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;
const IS_HOME_COOK = isHomeCook(APP_VARIANT);

// ── Pro view (restaurant) ────────────────────────────────────────────
type ProTab = "checklist" | "grid" | "setup";

function ProCleaningView() {
  const { colors } = useTheme();
  const [tab, setTab] = useState<ProTab>("checklist");

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, gap: 6 }}>
        {([
          { key: "checklist" as ProTab, label: "Checklist" },
          { key: "grid" as ProTab, label: "Monthly" },
          { key: "setup" as ProTab, label: "Setup" },
        ]).map((t) => {
          const active = tab === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center",
                backgroundColor: active ? colors.accent : colors.surface,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: active ? "#FFFFFF" : colors.textSecondary }}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {tab === "checklist" && <CleaningDashboard />}
      {tab === "grid" && <CleaningMonthlyGrid />}
      {tab === "setup" && <CleaningScheduleSetup />}
    </View>
  );
}

// ── Home cook view (simple checklist + chemicals) ────────────────────
type HomeTab = "cleaning" | "chemicals";

function HomeCleaningView() {
  const { colors } = useTheme();
  const [tab, setTab] = useState<HomeTab>("cleaning");

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, gap: 6 }}>
        {([
          { key: "cleaning" as HomeTab, label: "Cleaning" },
          { key: "chemicals" as HomeTab, label: "Chemicals" },
        ]).map((t) => {
          const active = tab === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center",
                backgroundColor: active ? colors.accent : colors.surface,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: active ? "#FFFFFF" : colors.textSecondary }}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {tab === "cleaning" && <HomeCleaningChecklist />}
      {tab === "chemicals" && <ChemicalGrid />}
    </View>
  );
}

// ── Page ─────────────────────────────────────────────────────────────
export default function CleaningBCCPage() {
  const { colors } = useTheme();
  const { storeMode } = useOrg();
  const isHome = IS_HOME_COOK;

  return (
    <ComplianceProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title="Cleaning" />
        {isHome ? <HomeCleaningView /> : <ProCleaningView />}
      </SafeAreaView>
    </ComplianceProvider>
  );
}

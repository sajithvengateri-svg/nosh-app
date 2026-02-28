import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { ComplianceProvider } from "../../../contexts/ComplianceProvider";
import { ReceivingGrid } from "../../../components/features/ReceivingGrid";
import { BCCSupplierRegister } from "../../../components/features/BCCSupplierRegister";

type Tab = "log" | "suppliers";

export default function ReceivingPage() {
  const { colors } = useTheme();
  return (
    <ComplianceProvider>
      <ReceivingInner colors={colors} />
    </ComplianceProvider>
  );
}

function ReceivingInner({ colors }: { colors: any }) {
  const [tab, setTab] = useState<Tab>("log");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Receiving" />

      {/* ── Tab switcher ───────────────────────────────────────── */}
      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 8 }}>
        {([
          { key: "log" as Tab, label: "Receiving Log" },
          { key: "suppliers" as Tab, label: "Suppliers" },
        ]).map((t) => {
          const active = tab === t.key;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: active ? colors.accent : colors.surface,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: active ? "#FFFFFF" : colors.textSecondary }}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── Tab content ────────────────────────────────────────── */}
      {tab === "log" && <ReceivingGrid />}
      {tab === "suppliers" && <BCCSupplierRegister />}
    </SafeAreaView>
  );
}

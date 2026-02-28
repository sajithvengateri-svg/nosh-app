import { View, Text, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { ComplianceProvider, useComplianceContext } from "../../../contexts/ComplianceProvider";

function SectionsInner() {
  const { colors } = useTheme();
  const { config, sectionToggles, loading, updateSectionToggle } = useComplianceContext();

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {(loading ? [] : Object.entries(sectionToggles)).map(([key, enabled]) => {
        const section = config.sections.find((s) => s.key === key);
        return (
          <View key={key} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontSize: 15, fontWeight: "500", color: colors.text, flex: 1 }}>{section?.label || key}</Text>
            <Switch
              value={enabled}
              onValueChange={(val) => updateSectionToggle(key, val)}
              trackColor={{ false: colors.border, true: colors.accent }}
            />
          </View>
        );
      })}
    </ScrollView>
  );
}

export default function SectionsPage() {
  const { colors } = useTheme();
  return (
    <ComplianceProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title="Sections" />
        <SectionsInner />
      </SafeAreaView>
    </ComplianceProvider>
  );
}

import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { ComplianceProvider } from "../../../contexts/ComplianceProvider";
import { ComplianceLogPage } from "../../../components/features/ComplianceLogPage";
import { Flame } from "lucide-react-native";
import type { LogPageConfig } from "../../../components/features/ComplianceLogPage";

const CONFIG: LogPageConfig = {
  logType: "reheating",
  title: "Reheating Log",
  icon: Flame,
  color: "#F59E0B",
  hasPhoto: false,
  items: [
    { key: "item_name", label: "Food Item", type: "text", placeholder: "e.g. Soup" },
    {
      key: "reheat_temp",
      label: "Reheat Temperature (°C)",
      type: "temperature",
      placeholder: "e.g. 75",
      thresholds: {
        pass: (v) => v >= 75,
        warn: (v) => v >= 60 && v < 75,
      },
    },
  ],
  emptyTitle: "No Reheating Logs",
  emptyDescription: "Record reheating temperatures — food must reach 75°C or above",
};

export default function ReheatingLogPage() {
  const { colors } = useTheme();
  return (
    <ComplianceProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title="Reheating Log" />
        <ComplianceLogPage config={CONFIG} />
      </SafeAreaView>
    </ComplianceProvider>
  );
}

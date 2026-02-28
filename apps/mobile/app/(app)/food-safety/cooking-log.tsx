import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { ComplianceProvider } from "../../../contexts/ComplianceProvider";
import { ComplianceLogPage } from "../../../components/features/ComplianceLogPage";
import { Flame } from "lucide-react-native";
import type { LogPageConfig } from "../../../components/features/ComplianceLogPage";

const CONFIG: LogPageConfig = {
  logType: "cooking",
  title: "Cooking Log",
  icon: Flame,
  color: "#EF4444",
  hasPhoto: true,
  items: [
    { key: "item_name", label: "Food Item", type: "text", placeholder: "e.g. Chicken breast" },
    {
      key: "core_temp",
      label: "Core Temperature (°C)",
      type: "temperature",
      placeholder: "e.g. 75",
      thresholds: {
        pass: (v) => v >= 75,
        warn: (v) => v >= 60 && v < 75,
      },
    },
    { key: "target_temp", label: "Target Temp (°C)", type: "text", placeholder: "e.g. 75" },
  ],
  emptyTitle: "No Cooking Logs",
  emptyDescription: "Record core temperatures of cooked foods to ensure they reach safe minimums",
};

export default function CookingLogPage() {
  const { colors } = useTheme();
  return (
    <ComplianceProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title="Cooking Log" />
        <ComplianceLogPage config={CONFIG} />
      </SafeAreaView>
    </ComplianceProvider>
  );
}

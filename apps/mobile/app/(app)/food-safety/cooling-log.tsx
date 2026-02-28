import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { ComplianceProvider } from "../../../contexts/ComplianceProvider";
import { ComplianceLogPage } from "../../../components/features/ComplianceLogPage";
import { Snowflake } from "lucide-react-native";
import type { LogPageConfig } from "../../../components/features/ComplianceLogPage";

const CONFIG: LogPageConfig = {
  logType: "cooling",
  title: "Cooling Log",
  icon: Snowflake,
  color: "#3B82F6",
  hasPhoto: false,
  items: [
    { key: "item_name", label: "Food Item", type: "text", placeholder: "e.g. Beef stew" },
    {
      key: "start_temp",
      label: "Start Temperature (°C)",
      type: "temperature",
      placeholder: "e.g. 60",
    },
    {
      key: "end_temp",
      label: "End Temperature (°C)",
      type: "temperature",
      placeholder: "e.g. 5",
      thresholds: {
        pass: (v) => v <= 5,
        warn: (v) => v > 5 && v <= 21,
      },
    },
    {
      key: "method",
      label: "Cooling Method",
      type: "select",
      options: ["Ice bath", "Blast chiller", "Shallow container", "Cold room", "Other"],
    },
  ],
  emptyTitle: "No Cooling Logs",
  emptyDescription: "Record cooling times and temperatures (60°C→21°C in 2hrs, 21°C→5°C in 4hrs)",
};

export default function CoolingLogPage() {
  const { colors } = useTheme();
  return (
    <ComplianceProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title="Cooling Log" />
        <ComplianceLogPage config={CONFIG} />
      </SafeAreaView>
    </ComplianceProvider>
  );
}

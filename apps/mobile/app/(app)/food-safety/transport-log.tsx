import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { ComplianceProvider } from "../../../contexts/ComplianceProvider";
import { ComplianceLogPage } from "../../../components/features/ComplianceLogPage";
import { Truck } from "lucide-react-native";
import type { LogPageConfig } from "../../../components/features/ComplianceLogPage";

const CONFIG: LogPageConfig = {
  logType: "transport",
  title: "Transport Log",
  icon: Truck,
  color: "#10B981",
  hasPhoto: true,
  items: [
    { key: "vehicle", label: "Vehicle / Container", type: "text", placeholder: "e.g. Delivery van #3" },
    { key: "item_name", label: "Food Item", type: "text", placeholder: "e.g. Catering order" },
    {
      key: "dispatch_temp",
      label: "Temp at Dispatch (°C)",
      type: "temperature",
      placeholder: "e.g. 4",
      thresholds: {
        pass: (v) => v >= 60 || v <= 5,
        warn: (v) => (v >= 55 && v < 60) || (v > 5 && v <= 8),
      },
    },
    {
      key: "arrival_temp",
      label: "Temp at Arrival (°C)",
      type: "temperature",
      placeholder: "e.g. 5",
      thresholds: {
        pass: (v) => v >= 60 || v <= 5,
        warn: (v) => (v >= 55 && v < 60) || (v > 5 && v <= 8),
      },
    },
  ],
  emptyTitle: "No Transport Logs",
  emptyDescription: "Record food temperatures at dispatch and arrival during transport",
};

export default function TransportLogPage() {
  const { colors } = useTheme();
  return (
    <ComplianceProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title="Transport Log" />
        <ComplianceLogPage config={CONFIG} />
      </SafeAreaView>
    </ComplianceProvider>
  );
}

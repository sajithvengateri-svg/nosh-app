import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { ComplianceProvider } from "../../../contexts/ComplianceProvider";
import { ComplianceLogPage } from "../../../components/features/ComplianceLogPage";
import { Droplets } from "lucide-react-native";
import type { LogPageConfig } from "../../../components/features/ComplianceLogPage";

const CONFIG: LogPageConfig = {
  logType: "handwash",
  title: "Handwash Check",
  icon: Droplets,
  color: "#3B82F6",
  hasPhoto: true,
  items: [
    { key: "station_location", label: "Station Location", type: "text", placeholder: "e.g. Kitchen prep area" },
    { key: "soap_available", label: "Soap Available", type: "boolean", options: ["Yes", "No"] },
    { key: "warm_water", label: "Warm Running Water", type: "boolean", options: ["Yes", "No"] },
    { key: "towels_available", label: "Paper Towels Available", type: "boolean", options: ["Yes", "No"] },
    { key: "basin_accessible", label: "Basin Easily Accessible", type: "boolean", options: ["Yes", "No"] },
  ],
  emptyTitle: "No Handwash Checks",
  emptyDescription: "Verify handwash stations have soap, warm water, and towels",
};

export default function HandwashCheckPage() {
  const { colors } = useTheme();
  return (
    <ComplianceProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title="Handwash Check" />
        <ComplianceLogPage config={CONFIG} />
      </SafeAreaView>
    </ComplianceProvider>
  );
}

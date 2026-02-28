import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { ComplianceProvider } from "../../../contexts/ComplianceProvider";
import { ComplianceLogPage } from "../../../components/features/ComplianceLogPage";
import { Sparkles } from "lucide-react-native";
import type { LogPageConfig } from "../../../components/features/ComplianceLogPage";

const CONFIG: LogPageConfig = {
  logType: "kitchen_clean",
  title: "Kitchen Clean",
  icon: Sparkles,
  color: "#6366F1",
  hasPhoto: true,
  items: [
    {
      key: "area",
      label: "Area",
      type: "select",
      options: ["Floors", "Walls & Ceilings", "Benchtops", "Equipment", "Cold Room", "Dry Store", "Toilets", "Other"],
    },
    { key: "cleaned", label: "Cleaned", type: "boolean", options: ["Yes", "No"] },
    { key: "sanitised", label: "Sanitised", type: "boolean", options: ["Yes", "No"] },
  ],
  emptyTitle: "No Kitchen Clean Checks",
  emptyDescription: "Record kitchen area cleanliness and sanitation status",
};

export default function KitchenCleanPage() {
  const { colors } = useTheme();
  return (
    <ComplianceProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title="Kitchen Clean" />
        <ComplianceLogPage config={CONFIG} />
      </SafeAreaView>
    </ComplianceProvider>
  );
}

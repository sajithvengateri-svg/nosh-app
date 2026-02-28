import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { ComplianceProvider } from "../../../contexts/ComplianceProvider";
import { ComplianceLogPage } from "../../../components/features/ComplianceLogPage";
import { SprayCan } from "lucide-react-native";
import type { LogPageConfig } from "../../../components/features/ComplianceLogPage";

const CONFIG: LogPageConfig = {
  logType: "sanitiser",
  title: "Sanitiser Check",
  icon: SprayCan,
  color: "#10B981",
  hasPhoto: false,
  items: [
    { key: "location", label: "Location", type: "text", placeholder: "e.g. Main kitchen bench" },
    {
      key: "sanitiser_type",
      label: "Sanitiser Type",
      type: "select",
      options: ["Quaternary Ammonium", "Chlorine-based", "Alcohol-based", "Other"],
    },
    {
      key: "concentration",
      label: "Concentration (ppm)",
      type: "ppm",
      placeholder: "e.g. 200",
      thresholds: {
        pass: (v) => v >= 150 && v <= 400,
        warn: (v) => v >= 100 && v < 150,
      },
    },
  ],
  emptyTitle: "No Sanitiser Checks",
  emptyDescription: "Test sanitiser concentration levels — typical range 150–400 ppm",
};

export default function SanitiserCheckPage() {
  const { colors } = useTheme();
  return (
    <ComplianceProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title="Sanitiser Check" />
        <ComplianceLogPage config={CONFIG} />
      </SafeAreaView>
    </ComplianceProvider>
  );
}

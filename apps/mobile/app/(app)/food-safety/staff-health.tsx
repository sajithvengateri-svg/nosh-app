import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { ComplianceProvider } from "../../../contexts/ComplianceProvider";
import { ComplianceLogPage } from "../../../components/features/ComplianceLogPage";
import { HeartPulse } from "lucide-react-native";
import type { LogPageConfig } from "../../../components/features/ComplianceLogPage";

const CONFIG: LogPageConfig = {
  logType: "staff_health",
  title: "Staff Health",
  icon: HeartPulse,
  color: "#EF4444",
  hasPhoto: true,
  hasDocUpload: true,
  items: [
    { key: "staff_name", label: "Staff Name", type: "text", placeholder: "Enter staff member name" },
    { key: "fit_to_work", label: "Fit to Work", type: "boolean", options: ["Yes", "No"] },
    { key: "illness_details", label: "Illness Details (if unfit)", type: "text", placeholder: "Describe symptoms..." },
  ],
  emptyTitle: "No Staff Health Checks",
  emptyDescription: "Check each staff member's fitness to work before their shift",
};

export default function StaffHealthPage() {
  const { colors } = useTheme();
  return (
    <ComplianceProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title="Staff Health" />
        <ComplianceLogPage config={CONFIG} />
      </SafeAreaView>
    </ComplianceProvider>
  );
}

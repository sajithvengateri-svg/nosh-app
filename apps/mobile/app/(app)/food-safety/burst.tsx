import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { ComplianceProvider, useComplianceContext } from "../../../contexts/ComplianceProvider";
import { DailyComplianceBurst } from "../../../components/features/DailyComplianceBurst";

function BurstInner() {
  const { sectionToggles } = useComplianceContext();
  return <DailyComplianceBurst sectionToggles={sectionToggles} />;
}

export default function BurstPage() {
  const { colors } = useTheme();
  return (
    <ComplianceProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title="Daily Burst" />
        <BurstInner />
      </SafeAreaView>
    </ComplianceProvider>
  );
}

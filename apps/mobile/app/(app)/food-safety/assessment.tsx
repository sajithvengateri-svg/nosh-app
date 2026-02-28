import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { ComplianceProvider } from "../../../contexts/ComplianceProvider";
import { SelfAssessment } from "../../../components/features/SelfAssessment";

export default function AssessmentPage() {
  const { colors } = useTheme();
  return (
    <ComplianceProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title="Self-Assessment" />
        <SelfAssessment />
      </SafeAreaView>
    </ComplianceProvider>
  );
}

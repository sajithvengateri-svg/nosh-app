import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { ComplianceProvider } from "../../../contexts/ComplianceProvider";
import { BCCHACCPPlan } from "../../../components/features/BCCHACCPPlan";

export default function HACCPPage() {
  const { colors } = useTheme();
  return (
    <ComplianceProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title="HACCP Plan" />
        <BCCHACCPPlan />
      </SafeAreaView>
    </ComplianceProvider>
  );
}

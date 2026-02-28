import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { BCCSelfAssessment } from "../../../components/features/BCCSelfAssessment";

export default function AuditPage() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="BCC Audit" />
      <BCCSelfAssessment />
    </SafeAreaView>
  );
}

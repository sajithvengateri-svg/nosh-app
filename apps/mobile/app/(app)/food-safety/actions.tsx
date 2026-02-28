import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { ComplianceProvider } from "../../../contexts/ComplianceProvider";
import { BCCCorrectiveActions } from "../../../components/features/BCCCorrectiveActions";

export default function ActionsPage() {
  const { colors } = useTheme();
  return (
    <ComplianceProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title="Corrective Actions" />
        <BCCCorrectiveActions />
      </SafeAreaView>
    </ComplianceProvider>
  );
}

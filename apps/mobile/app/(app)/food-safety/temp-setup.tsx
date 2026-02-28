import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { ComplianceProvider } from "../../../contexts/ComplianceProvider";
import { TempEquipmentSetup } from "../../../components/features/TempEquipmentSetup";

export default function TempSetupPage() {
  const { colors } = useTheme();
  return (
    <ComplianceProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title="Temperature Setup" />
        <TempEquipmentSetup />
      </SafeAreaView>
    </ComplianceProvider>
  );
}

import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { ComplianceProvider } from "../../../contexts/ComplianceProvider";
import { BCCEquipmentTraining } from "../../../components/features/BCCEquipmentTraining";

export default function EqTrainingPage() {
  const { colors } = useTheme();
  return (
    <ComplianceProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title="Equipment Training" />
        <BCCEquipmentTraining />
      </SafeAreaView>
    </ComplianceProvider>
  );
}

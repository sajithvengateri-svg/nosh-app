import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { ComplianceProvider } from "../../../contexts/ComplianceProvider";
import { BCCEquipmentCalibration } from "../../../components/features/BCCEquipmentCalibration";

export default function EquipmentPage() {
  const { colors } = useTheme();
  return (
    <ComplianceProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title="Equipment Calibration" />
        <BCCEquipmentCalibration />
      </SafeAreaView>
    </ComplianceProvider>
  );
}

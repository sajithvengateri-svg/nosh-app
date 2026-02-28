import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { ComplianceProvider } from "../../../contexts/ComplianceProvider";
import { BCCTrainingRegister } from "../../../components/features/BCCTrainingRegister";

export default function TrainingPage() {
  const { colors } = useTheme();
  return (
    <ComplianceProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title="Training Register" />
        <BCCTrainingRegister />
      </SafeAreaView>
    </ComplianceProvider>
  );
}

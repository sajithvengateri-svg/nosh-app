import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { ComplianceProvider } from "../../../contexts/ComplianceProvider";
import { ChemicalGrid } from "../../../components/features/ChemicalGrid";

export default function ChemicalPage() {
  const { colors } = useTheme();
  return (
    <ComplianceProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title="Chemical Safety" />
        <ChemicalGrid />
      </SafeAreaView>
    </ComplianceProvider>
  );
}

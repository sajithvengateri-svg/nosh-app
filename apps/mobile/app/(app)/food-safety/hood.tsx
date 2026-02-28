import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { ComplianceProvider } from "../../../contexts/ComplianceProvider";
import { ServiceLogGrid } from "../../../components/features/ServiceLogGrid";

export default function HoodPage() {
  const { colors } = useTheme();
  return (
    <ComplianceProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title="Hood Cleaning" />
        <ServiceLogGrid serviceType="hood_cleaning" title="Hood Cleaning" />
      </SafeAreaView>
    </ComplianceProvider>
  );
}

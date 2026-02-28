import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { ComplianceProvider } from "../../../contexts/ComplianceProvider";
import { BCCSupplierRegister } from "../../../components/features/BCCSupplierRegister";

export default function SuppliersPage() {
  const { colors } = useTheme();
  return (
    <ComplianceProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title="Suppliers" />
        <BCCSupplierRegister />
      </SafeAreaView>
    </ComplianceProvider>
  );
}

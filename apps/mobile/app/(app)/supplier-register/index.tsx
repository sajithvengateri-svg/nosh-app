import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { BCCSupplierRegister } from "../../../components/features/BCCSupplierRegister";

export default function SupplierRegisterPage() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Approved Suppliers" />
      <BCCSupplierRegister />
    </SafeAreaView>
  );
}

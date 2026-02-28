import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { TempCheckGrid } from "../../../components/features/TempCheckGrid";

export default function TempGridPage() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Temperature Log" />
      <TempCheckGrid />
    </SafeAreaView>
  );
}

import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { HomeCleaningChecklist } from "../../../components/features/HomeCleaningChecklist";

export default function HomeCleaningPage() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Kitchen Cleaning" />
      <HomeCleaningChecklist />
    </SafeAreaView>
  );
}

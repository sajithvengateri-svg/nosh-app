import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { MobileCleaningChecklist } from "../../../components/features/MobileCleaningChecklist";

export default function DailyCleaningChecklistPage() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Daily Closing Checklist" />
      <MobileCleaningChecklist />
    </SafeAreaView>
  );
}

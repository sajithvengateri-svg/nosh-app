import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeProvider";
import { OnboardingWizard } from "../../components/features/OnboardingWizard";

export default function OnboardingPage() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <OnboardingWizard />
    </SafeAreaView>
  );
}

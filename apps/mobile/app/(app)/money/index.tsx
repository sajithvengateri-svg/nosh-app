import { ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeProvider";
// MoneyOS is free for trials — no feature gate
import { useMoneyDashboard } from "../../../hooks/useMoneyDashboard";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { MoneyCommandCentre } from "../../../components/features/MoneyCommandCentre";

export default function MoneyDashboard() {
  const { colors } = useTheme();
  const { refetch, isRefetching } = useMoneyDashboard();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="MoneyOS" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <MoneyCommandCentre />
      </ScrollView>
    </SafeAreaView>
  );
}

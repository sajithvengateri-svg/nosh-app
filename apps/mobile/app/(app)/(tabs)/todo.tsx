import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeProvider";
import { CommandCentre } from "../../../components/features/CommandCentre";

export default function Todo() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <CommandCentre />
      </ScrollView>
    </SafeAreaView>
  );
}

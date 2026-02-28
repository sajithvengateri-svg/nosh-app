import { View, Text } from "react-native";
import Constants from "expo-constants";
import { isVendor } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";
import { useTheme } from "../../../contexts/ThemeProvider";
import { VendorDemands } from "../../../components/features/vendor/VendorDemands";

const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;

export default function DemandsTab() {
  const { colors } = useTheme();

  if (isVendor(APP_VARIANT)) return <VendorDemands />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: colors.textMuted }}>Not available</Text>
    </View>
  );
}

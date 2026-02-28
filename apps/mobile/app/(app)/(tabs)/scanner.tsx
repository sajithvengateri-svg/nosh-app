import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useTheme } from "../../../contexts/ThemeProvider";
import { DealScanner } from "../../../components/features/vendor/DealScanner";
import { isVendor } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";
import {
  Camera,
  FileText,
  Thermometer,
  Receipt,
  Tag,
  Package,
  ChevronRight,
} from "lucide-react-native";

const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;

const SCAN_OPTIONS = [
  {
    icon: FileText,
    label: "Delivery Docket",
    description: "Scan delivery docket to auto-fill receiving log",
    route: "/(app)/food-safety/scan-docket",
    color: "#10B981",
  },
  {
    icon: Thermometer,
    label: "Temp Display",
    description: "Read thermometer display to auto-fill temp log",
    route: "/(app)/food-safety",
    color: "#3B82F6",
  },
  {
    icon: Receipt,
    label: "Invoice",
    description: "Scan invoice to extract line items",
    route: "/(app)/invoices/scan",
    color: "#F59E0B",
  },
  {
    icon: Tag,
    label: "Ingredient Label",
    description: "Scan label for allergen detection",
    route: "/(app)/ingredients/scan",
    color: "#8B5CF6",
  },
  {
    icon: Package,
    label: "Asset Label",
    description: "Scan equipment label for asset register",
    route: "/(app)/equipment/scan",
    color: "#EC4899",
  },
];

export default function ScannerTab() {
  // Vendor variant: show deal scanner instead of compliance scanner
  if (isVendor(APP_VARIANT)) {
    return <DealScanner />;
  }

  const { colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 28, fontWeight: "800", color: colors.text }}>
            Scanner
          </Text>
          <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 4 }}>
            AI-powered scanning for compliance and operations
          </Text>
        </View>

        {SCAN_OPTIONS.map((option) => (
          <Pressable
            key={option.label}
            onPress={() => router.push(option.route as any)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: option.color + "15",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
              }}
            >
              <option.icon size={24} color={option.color} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
                {option.label}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
                {option.description}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} strokeWidth={1.5} />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

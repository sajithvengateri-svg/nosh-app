import { View, Text, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CreditCard, Building2, CheckCircle } from "lucide-react-native";
import { useTheme } from "../../../contexts/ThemeProvider";
import { ScreenHeader } from "../../ui/ScreenHeader";
import { lightTap } from "../../../lib/haptics";

export function VendorPaymentSetup() {
  const { colors } = useTheme();

  const showComingSoon = () => {
    lightTap();
    Alert.alert(
      "Coming Soon",
      "Payment method setup will be available when automated billing launches. For now, invoices are sent manually via Xero.",
      [{ text: "OK" }]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <ScreenHeader title="Payment Method" />

      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 20, lineHeight: 20 }}>
          Choose how you would like to pay your NOSH listing and usage fees.
          During beta, invoices are sent manually.
        </Text>

        {/* Card option */}
        <Pressable
          onPress={showComingSoon}
          style={({ pressed }) => ({
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            padding: 20,
            marginBottom: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: colors.accentBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CreditCard size={22} color={colors.accent} strokeWidth={1.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>
              Credit / Debit Card
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
              Visa, Mastercard, AMEX
            </Text>
          </View>
        </Pressable>

        {/* BECS option */}
        <Pressable
          onPress={showComingSoon}
          style={({ pressed }) => ({
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            padding: 20,
            marginBottom: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: colors.successBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Building2 size={22} color={colors.success} strokeWidth={1.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>
              BECS Direct Debit
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
              Bank account (BSB + Account)
            </Text>
            <View
              style={{
                alignSelf: "flex-start",
                backgroundColor: colors.successBg,
                borderRadius: 9999,
                paddingHorizontal: 8,
                paddingVertical: 2,
                marginTop: 4,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.success }}>
                Recommended
              </Text>
            </View>
          </View>
        </Pressable>

        {/* Info */}
        <View
          style={{
            backgroundColor: colors.accentBg,
            borderRadius: 12,
            padding: 16,
            marginTop: 8,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <CheckCircle size={16} color={colors.accent} strokeWidth={1.5} />
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.accent }}>
              Beta Pricing
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
            Founding vendors: $0 listing fee for 3 months, then $9/month.
            Usage fee: 1% for 3 months, then 2% of deal-tracked sales.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

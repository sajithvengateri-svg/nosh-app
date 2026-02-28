import { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { CheckCircle, X, Tag, User } from "lucide-react-native";
import { useTheme } from "../../../contexts/ThemeProvider";
import { lightTap, successNotification } from "../../../lib/haptics";
import type { DealCodeInfo } from "../../../hooks/useVendorDeals";

interface DealScanConfirmProps {
  dealInfo: DealCodeInfo;
  onConfirm: (amount: number) => void;
  onCancel: () => void;
  isRedeeming: boolean;
}

function formatCode(code: string): string {
  if (code.length === 8) return `${code.slice(0, 4)}-${code.slice(4)}`;
  return code;
}

export function DealScanConfirm({
  dealInfo,
  onConfirm,
  onCancel,
  isRedeeming,
}: DealScanConfirmProps) {
  const { colors } = useTheme();
  const [amount, setAmount] = useState("");

  const parsedAmount = parseFloat(amount);
  const isValid = !isNaN(parsedAmount) && parsedAmount > 0;

  const handleConfirm = () => {
    if (!isValid || isRedeeming) return;
    lightTap();
    onConfirm(parsedAmount);
  };

  const discount = dealInfo.deal.discount_percent
    ? `${dealInfo.deal.discount_percent}% OFF`
    : dealInfo.deal.discount_amount
      ? `$${dealInfo.deal.discount_amount} OFF`
      : null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <View
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderWidth: 1,
            borderBottomWidth: 0,
            borderColor: colors.cardBorder,
            padding: 24,
            paddingBottom: 40,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>
              Confirm Redemption
            </Text>
            <Pressable
              onPress={() => {
                lightTap();
                onCancel();
              }}
              hitSlop={12}
            >
              <X size={22} color={colors.textSecondary} strokeWidth={1.5} />
            </Pressable>
          </View>

          {/* Deal info */}
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Tag size={16} color={colors.accent} strokeWidth={1.5} />
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, flex: 1 }}>
                {dealInfo.deal.title}
              </Text>
            </View>

            {discount && (
              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: colors.accentBg,
                  borderRadius: 9999,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.accent }}>
                  {discount}
                </Text>
              </View>
            )}

            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <User size={14} color={colors.textSecondary} strokeWidth={1.5} />
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                {dealInfo.consumer_first_name}
              </Text>
            </View>

            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                color: colors.text,
                letterSpacing: 2,
                textAlign: "center",
                marginTop: 8,
                paddingVertical: 8,
                backgroundColor: colors.inputBg,
                borderRadius: 8,
              }}
            >
              {formatCode(dealInfo.code)}
            </Text>
          </View>

          {/* Sale amount input */}
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 8 }}>
            Sale Total
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              backgroundColor: colors.inputBg,
              paddingHorizontal: 16,
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 24, fontWeight: "700", color: colors.textMuted, marginRight: 4 }}>
              $
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              autoFocus
              style={{
                flex: 1,
                fontSize: 28,
                fontWeight: "700",
                color: colors.text,
                paddingVertical: 16,
              }}
            />
          </View>

          {/* Confirm button */}
          <Pressable
            onPress={handleConfirm}
            disabled={!isValid || isRedeeming}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              backgroundColor: isValid ? colors.accent : colors.border,
              borderRadius: 12,
              paddingVertical: 16,
              opacity: pressed && isValid ? 0.85 : 1,
              marginBottom: 12,
            })}
          >
            <CheckCircle size={20} color="#FFF" strokeWidth={1.5} />
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFF" }}>
              {isRedeeming ? "Processing..." : "Confirm Redemption"}
            </Text>
          </Pressable>

          {/* Cancel */}
          <Pressable
            onPress={() => {
              lightTap();
              onCancel();
            }}
            style={{ alignItems: "center", paddingVertical: 8 }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary }}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

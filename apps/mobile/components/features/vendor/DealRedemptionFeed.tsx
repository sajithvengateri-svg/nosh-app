import { View, Text, ActivityIndicator } from "react-native";
import { CircleDot } from "lucide-react-native";
import { useTheme } from "../../../contexts/ThemeProvider";
import { useVendorRedemptionFeed, type DealCode } from "../../../hooks/useVendorDeals";

interface DealRedemptionFeedProps {
  limit?: number;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function maskCode(code: string): string {
  if (code.length <= 4) return code;
  return code.slice(0, 4) + "****";
}

export function DealRedemptionFeed({ limit = 5 }: DealRedemptionFeedProps) {
  const { colors } = useTheme();
  const { data, isLoading } = useVendorRedemptionFeed(limit);

  if (isLoading) {
    return (
      <View style={{ paddingVertical: 16, alignItems: "center" }}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "700",
          color: colors.textMuted,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        RECENT REDEMPTIONS
      </Text>

      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          overflow: "hidden",
        }}
      >
        {data.map((item: DealCode, index: number) => (
          <View
            key={item.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: index < data.length - 1 ? 1 : 0,
              borderBottomColor: colors.border,
            }}
          >
            <CircleDot size={10} color={colors.success} strokeWidth={2} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: colors.text }}
                numberOfLines={1}
              >
                {item.deal_title ?? "Deal"}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                {maskCode(item.code)}
                {item.redeemed_at ? ` \u00b7 ${timeAgo(item.redeemed_at)}` : ""}
              </Text>
            </View>
            {item.transaction_amount != null && (
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.success }}>
                ${Number(item.transaction_amount).toFixed(2)}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

import { View, Text, ActivityIndicator } from "react-native";
import { DollarSign, Users, TrendingUp, Percent } from "lucide-react-native";
import { useTheme } from "../../../contexts/ThemeProvider";
import { useVendorUsageSummary } from "../../../hooks/useVendorDeals";

export function VendorUsageSummary() {
  const { colors } = useTheme();
  const { data, isLoading } = useVendorUsageSummary();

  if (isLoading) {
    return (
      <View style={{ paddingVertical: 16, alignItems: "center" }}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }

  if (!data || data.total_customers === 0) return null;

  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(2)}`;

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
        THIS WEEK
      </Text>

      {/* Stats row */}
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          padding: 16,
          marginBottom: 8,
        }}
      >
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
          <StatPill
            icon={Users}
            label="Customers"
            value={String(data.week_customers)}
            colors={colors}
          />
          <StatPill
            icon={DollarSign}
            label="Tracked Sales"
            value={fmt(data.week_tracked_sales)}
            colors={colors}
          />
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <StatPill
            icon={Percent}
            label="NOSH Cost"
            value={fmt(data.week_total_cost)}
            colors={colors}
          />
          <StatPill
            icon={TrendingUp}
            label="ROI"
            value={data.week_roi > 0 ? `${data.week_roi}:1` : "--"}
            colors={colors}
            highlight
          />
        </View>
      </View>

      {/* Comparison */}
      {data.week_tracked_sales > 0 && (
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            padding: 16,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: colors.textMuted,
              letterSpacing: 0.8,
              marginBottom: 8,
            }}
          >
            COMPARE
          </Text>
          <CompareRow
            label="Google Ads"
            detail={`~$${Math.round(data.week_customers * 4)} for ${data.week_customers} clicks`}
            colors={colors}
          />
          <CompareRow
            label="Uber Eats"
            detail={`${fmt(data.week_tracked_sales * 0.3)} (30% of sales)`}
            colors={colors}
          />
          <CompareRow
            label="Market stall"
            detail="$100-150 per day"
            colors={colors}
            last
          />
        </View>
      )}
    </View>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  colors,
  highlight,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>["colors"];
  highlight?: boolean;
}) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <Icon
          size={14}
          color={highlight ? colors.success : colors.textSecondary}
          strokeWidth={1.5}
        />
        <Text style={{ fontSize: 12, fontWeight: "500", color: colors.textSecondary }}>
          {label}
        </Text>
      </View>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "800",
          color: highlight ? colors.success : colors.text,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function CompareRow({
  label,
  detail,
  colors,
  last,
}: {
  label: string;
  detail: string;
  colors: ReturnType<typeof useTheme>["colors"];
  last?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 6,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary }}>{label}</Text>
      <Text style={{ fontSize: 13, color: colors.textMuted }}>{detail}</Text>
    </View>
  );
}

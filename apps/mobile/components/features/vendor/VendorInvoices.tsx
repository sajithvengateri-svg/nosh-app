import { View, Text, FlatList, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FileText, ChevronDown, ChevronUp } from "lucide-react-native";
import { useState } from "react";
import { useTheme } from "../../../contexts/ThemeProvider";
import { useVendorInvoices, type VendorInvoice } from "../../../hooks/useVendorDeals";
import { ScreenHeader } from "../../ui/ScreenHeader";
import { lightTap } from "../../../lib/haptics";

const STATUS_COLORS: Record<string, (c: ReturnType<typeof useTheme>["colors"]) => string> = {
  draft: (c) => c.textMuted,
  sent: (c) => c.accent,
  paid: (c) => c.success,
  overdue: (c) => c.destructive,
  disputed: (c) => c.warning,
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  });
}

export function VendorInvoices() {
  const { colors } = useTheme();
  const { data: invoices, isLoading } = useVendorInvoices();

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
        <ScreenHeader title="Invoices" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <ScreenHeader title="Invoices" />
      <FlatList
        data={invoices ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <FileText size={48} color={colors.textMuted} strokeWidth={1.5} />
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginTop: 16 }}>
              No invoices yet
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
              Invoices appear after your first deal redemptions
            </Text>
          </View>
        }
        renderItem={({ item }) => <InvoiceRow invoice={item} colors={colors} />}
      />
    </SafeAreaView>
  );
}

function InvoiceRow({
  invoice,
  colors,
}: {
  invoice: VendorInvoice;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const [expanded, setExpanded] = useState(false);
  const statusColor = (STATUS_COLORS[invoice.status] ?? STATUS_COLORS.draft)(colors);

  return (
    <Pressable
      onPress={() => {
        lightTap();
        setExpanded(!expanded);
      }}
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        padding: 16,
        marginBottom: 12,
      }}
    >
      {/* Header row */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>
            {invoice.invoice_type === "listing" ? "Listing Fee" : "Usage Fee"}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
            {formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {/* Status badge */}
          <View
            style={{
              backgroundColor: statusColor + "18",
              borderRadius: 9999,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "600", color: statusColor, textTransform: "capitalize" }}>
              {invoice.status}
            </Text>
          </View>

          {/* Amount */}
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
            ${invoice.total_amount.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Summary row */}
      {invoice.invoice_type === "usage" && (
        <View style={{ flexDirection: "row", gap: 16, marginTop: 10 }}>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>
            {invoice.redemption_count} redemptions
          </Text>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>
            ${invoice.tracked_sales_total.toFixed(2)} tracked
          </Text>
        </View>
      )}

      {/* Expand chevron */}
      <View style={{ alignItems: "center", marginTop: 8 }}>
        {expanded ? (
          <ChevronUp size={16} color={colors.textMuted} strokeWidth={1.5} />
        ) : (
          <ChevronDown size={16} color={colors.textMuted} strokeWidth={1.5} />
        )}
      </View>

      {/* Expanded detail */}
      {expanded && (
        <View
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <DetailRow label="Tracked Sales" value={`$${invoice.tracked_sales_total.toFixed(2)}`} colors={colors} />
          <DetailRow label="Usage Fee (2%)" value={`$${invoice.usage_fee_amount.toFixed(2)}`} colors={colors} />
          <DetailRow label="GST (10%)" value={`$${invoice.gst_amount.toFixed(2)}`} colors={colors} />
          <DetailRow label="Total" value={`$${invoice.total_amount.toFixed(2)}`} colors={colors} bold />
          {invoice.due_at && (
            <DetailRow label="Due" value={formatDate(invoice.due_at)} colors={colors} />
          )}
          {invoice.paid_at && (
            <DetailRow label="Paid" value={formatDate(invoice.paid_at)} colors={colors} />
          )}
        </View>
      )}
    </Pressable>
  );
}

function DetailRow({
  label,
  value,
  colors,
  bold,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>["colors"];
  bold?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
      <Text style={{ fontSize: 13, color: colors.textSecondary }}>{label}</Text>
      <Text
        style={{
          fontSize: 13,
          fontWeight: bold ? "700" : "500",
          color: bold ? colors.text : colors.textSecondary,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

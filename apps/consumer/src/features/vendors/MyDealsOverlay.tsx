import { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Tag, CheckCircle, XCircle, Clock, QrCode } from "lucide-react-native";
import { Colors, Glass, Spacing, BorderRadius } from "../../constants/colors";
import { useVendorStore, type DealRedemption } from "../../lib/stores/vendorStore";
import { lightTap } from "../../lib/haptics";
import { getTimeRemaining, isCodeExpired, formatCodeForDisplay } from "../../lib/services/dealCodeService";
import { DealQRScreen } from "./DealQRScreen";

export function MyDealsOverlay() {
  const myRedemptions = useVendorStore((s) => s.myRedemptions);
  const redemptionsLoading = useVendorStore((s) => s.redemptionsLoading);
  const loadMyRedemptions = useVendorStore((s) => s.loadMyRedemptions);

  const [activeQR, setActiveQR] = useState<{
    code: string;
    expiresAt: string;
    title: string;
    vendor: string;
  } | null>(null);

  useEffect(() => {
    loadMyRedemptions();
  }, [loadMyRedemptions]);

  if (activeQR) {
    return (
      <DealQRScreen
        code={activeQR.code}
        expiresAt={activeQR.expiresAt}
        dealTitle={activeQR.title}
        vendorName={activeQR.vendor}
        onClose={() => setActiveQR(null)}
      />
    );
  }

  if (redemptionsLoading && myRedemptions.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const active = myRedemptions.filter((r) => r.status === "active" && !isCodeExpired(r.expires_at));
  const past = myRedemptions.filter((r) => r.status !== "active" || isCodeExpired(r.expires_at));

  return (
    <FlatList
      data={[...active, ...past]}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        active.length > 0 ? (
          <Text style={styles.sectionTitle}>Active Deals</Text>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Tag size={48} color={Colors.text.muted} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No deals yet</Text>
          <Text style={styles.emptySubtext}>
            Claim deals from vendors to see them here
          </Text>
        </View>
      }
      renderItem={({ item, index }) => {
        const isFirstPast = active.length > 0 && index === active.length;
        return (
          <>
            {isFirstPast && <Text style={styles.sectionTitle}>Past Deals</Text>}
            <RedemptionCard
              redemption={item}
              onShowQR={() => {
                lightTap();
                setActiveQR({
                  code: item.code,
                  expiresAt: item.expires_at,
                  title: item.deal_title ?? "Deal",
                  vendor: item.vendor_name ?? "Vendor",
                });
              }}
            />
          </>
        );
      }}
    />
  );
}

function RedemptionCard({
  redemption,
  onShowQR,
}: {
  redemption: DealRedemption;
  onShowQR: () => void;
}) {
  const expired = isCodeExpired(redemption.expires_at);
  const isActive = redemption.status === "active" && !expired;

  const StatusIcon = isActive
    ? Clock
    : redemption.status === "redeemed"
      ? CheckCircle
      : XCircle;

  const statusColor = isActive
    ? Colors.primary
    : redemption.status === "redeemed"
      ? Colors.success
      : Colors.text.muted;

  const statusLabel = isActive
    ? getTimeRemaining(redemption.expires_at)
    : redemption.status === "redeemed"
      ? "Redeemed"
      : expired
        ? "Expired"
        : "Cancelled";

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{redemption.deal_title ?? "Deal"}</Text>
          <Text style={styles.cardVendor}>{redemption.vendor_name ?? "Vendor"}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "18" }]}>
          <StatusIcon size={12} color={statusColor} strokeWidth={1.5} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      {/* Code display */}
      <Text style={styles.codeText}>{formatCodeForDisplay(redemption.code)}</Text>

      <Text style={styles.dateText}>
        Claimed {new Date(redemption.claimed_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
        {redemption.redeemed_at && (
          ` \u00b7 Redeemed ${new Date(redemption.redeemed_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}`
        )}
      </Text>

      {/* Saved amount for redeemed deals */}
      {redemption.status === "redeemed" && redemption.transaction_amount != null && (
        <Text style={styles.savedText}>
          Sale: ${redemption.transaction_amount.toFixed(2)}
        </Text>
      )}

      {isActive && (
        <Pressable
          onPress={onShowQR}
          style={({ pressed }) => [styles.qrButton, { opacity: pressed ? 0.85 : 1 }]}
        >
          <QrCode size={16} color="#FFF" strokeWidth={1.5} />
          <Text style={styles.qrButtonText}>Show QR Code</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.text.muted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  card: {
    backgroundColor: Glass.surface,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    marginBottom: Spacing.sm + 4,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    shadowColor: Glass.shadowLight.color,
    shadowOffset: Glass.shadowLight.offset,
    shadowRadius: Glass.shadowLight.radius,
    shadowOpacity: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.secondary,
  },
  cardVendor: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  codeText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "JetBrains Mono",
    color: Colors.secondary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: Colors.text.muted,
    marginBottom: Spacing.sm,
  },
  savedText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.success,
    marginBottom: Spacing.sm,
  },
  qrButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.button,
    paddingVertical: 12,
    marginTop: Spacing.xs,
  },
  qrButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.secondary,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
});

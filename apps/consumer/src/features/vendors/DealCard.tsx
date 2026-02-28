import { View, Text, Pressable, StyleSheet } from "react-native";
import { Tag, Store, Clock } from "lucide-react-native";
import { Colors, Glass, Spacing, BorderRadius } from "../../constants/colors";
import { lightTap } from "../../lib/haptics";
import type { VendorDeal } from "../../lib/stores/vendorStore";

interface DealCardProps {
  deal: VendorDeal;
  onClaim: () => void;
  isClaiming: boolean;
  alreadyClaimed: boolean;
}

export function DealCard({ deal, onClaim, isClaiming, alreadyClaimed }: DealCardProps) {
  const daysLeft = Math.ceil(
    (new Date(deal.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.vendorRow}>
          <Store size={16} color={Colors.text.muted} strokeWidth={1.5} />
          <Text style={styles.vendorName}>{deal.vendor_name ?? "Vendor"}</Text>
        </View>
        {deal.discount_percent != null && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{deal.discount_percent}% OFF</Text>
          </View>
        )}
      </View>

      {/* Title + description */}
      <Text style={styles.title}>{deal.title}</Text>
      {deal.description && (
        <Text style={styles.description} numberOfLines={2}>
          {deal.description}
        </Text>
      )}

      {/* Meta row */}
      <View style={styles.metaRow}>
        {deal.min_order_value != null && deal.min_order_value > 0 && (
          <Text style={styles.metaText}>Min ${deal.min_order_value}</Text>
        )}
        <View style={styles.metaDot} />
        <Clock size={12} color={Colors.text.muted} strokeWidth={1.5} />
        <Text style={styles.metaText}>
          {daysLeft > 0 ? `${daysLeft}d left` : "Ends today"}
        </Text>
      </View>

      {/* Category pills */}
      {deal.applicable_categories && deal.applicable_categories.length > 0 && (
        <View style={styles.categoryRow}>
          {deal.applicable_categories.slice(0, 3).map((cat) => (
            <View key={cat} style={styles.categoryPill}>
              <Text style={styles.categoryText}>{cat}</Text>
            </View>
          ))}
          {deal.applicable_categories.length > 3 && (
            <Text style={styles.moreText}>
              +{deal.applicable_categories.length - 3}
            </Text>
          )}
        </View>
      )}

      {/* CTA */}
      <Pressable
        onPress={() => {
          lightTap();
          onClaim();
        }}
        disabled={isClaiming || alreadyClaimed}
        style={({ pressed }) => [
          styles.claimButton,
          alreadyClaimed && styles.claimButtonClaimed,
          { opacity: isClaiming ? 0.6 : pressed ? 0.85 : 1 },
        ]}
      >
        <Tag size={16} color={alreadyClaimed ? Colors.success : "#FFF"} strokeWidth={1.5} />
        <Text style={[styles.claimText, alreadyClaimed && styles.claimTextClaimed]}>
          {alreadyClaimed ? "Claimed" : isClaiming ? "Claiming..." : "Claim Deal"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  vendorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  vendorName: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.secondary,
  },
  discountBadge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  discountText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.secondary,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.sm,
  },
  metaText: {
    fontSize: 12,
    color: Colors.text.muted,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.text.muted,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: Spacing.sm + 4,
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    backgroundColor: Glass.surfaceHover,
    borderWidth: 1,
    borderColor: Glass.borderLight,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.text.secondary,
  },
  moreText: {
    fontSize: 11,
    color: Colors.text.muted,
    alignSelf: "center",
  },
  claimButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.button,
    paddingVertical: 12,
  },
  claimButtonClaimed: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.success,
  },
  claimText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  claimTextClaimed: {
    color: Colors.success,
  },
});

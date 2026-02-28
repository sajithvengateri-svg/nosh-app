import { useState, useRef, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Animated } from "react-native";
import { Tag, CheckCircle, Store } from "lucide-react-native";
import { Colors, Spacing, BorderRadius } from "../../constants/colors";
import { useVendorStore, type VendorDeal } from "../../lib/stores/vendorStore";
import { formatCodeForDisplay } from "../../lib/services/dealCodeService";
import { lightTap, successNotification } from "../../lib/haptics";

interface DealClaimSheetProps {
  deal: VendorDeal;
  onClose: () => void;
  onClaimed: (code: string, redemptionId: string, expiresAt: string) => void;
}

export function DealClaimSheet({ deal, onClose, onClaimed }: DealClaimSheetProps) {
  const claimDeal = useVendorStore((s) => s.claimDeal);
  const [status, setStatus] = useState<"confirm" | "claiming" | "success" | "error">("confirm");
  const [errorMsg, setErrorMsg] = useState("");
  const [claimedCode, setClaimedCode] = useState("");
  const [claimedExpiry, setClaimedExpiry] = useState("");
  const codeScale = useRef(new Animated.Value(0)).current;

  const handleClaim = async () => {
    setStatus("claiming");
    const redemption = await claimDeal(deal.id, deal.vendor_id);
    if (redemption) {
      setStatus("success");
      setClaimedCode(redemption.code);
      setClaimedExpiry(redemption.expires_at);
      successNotification();
    } else {
      setStatus("error");
      setErrorMsg("Could not claim this deal. You may have already claimed it.");
    }
  };

  // Animate code scale-in on success
  useEffect(() => {
    if (status === "success" && claimedCode) {
      Animated.spring(codeScale, {
        toValue: 1,
        speed: 16,
        bounciness: 8,
        useNativeDriver: true,
      }).start();

      // Transition to QR screen after delay
      const timer = setTimeout(() => {
        onClaimed(claimedCode, "", claimedExpiry);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, claimedCode, claimedExpiry, codeScale, onClaimed]);

  const formatExpiry = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" }) +
      " at " +
      d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });
  };

  return (
    <View style={styles.container}>
      {status === "confirm" && (
        <>
          <View style={styles.dealInfo}>
            <View style={styles.vendorRow}>
              <Store size={16} color={Colors.text.muted} strokeWidth={1.5} />
              <Text style={styles.vendorName}>{deal.vendor_name ?? "Vendor"}</Text>
            </View>
            <Text style={styles.dealTitle}>{deal.title}</Text>
            {deal.discount_percent != null && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{deal.discount_percent}% OFF</Text>
              </View>
            )}
            {deal.description && (
              <Text style={styles.description}>{deal.description}</Text>
            )}
            {deal.min_order_value != null && deal.min_order_value > 0 && (
              <Text style={styles.minOrder}>Minimum order: ${deal.min_order_value}</Text>
            )}
            <Text style={styles.validUntil}>
              Valid until {new Date(deal.end_date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
            </Text>
          </View>

          <Pressable
            onPress={() => { lightTap(); handleClaim(); }}
            style={({ pressed }) => [styles.claimButton, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Tag size={18} color="#FFF" strokeWidth={1.5} />
            <Text style={styles.claimButtonText}>Claim Deal</Text>
          </Pressable>

          <Pressable onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </>
      )}

      {status === "claiming" && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.statusText}>Claiming your deal...</Text>
        </View>
      )}

      {status === "success" && (
        <View style={styles.center}>
          <CheckCircle size={48} color={Colors.success} strokeWidth={1.5} />
          <Text style={[styles.statusText, { color: Colors.success }]}>Deal Claimed</Text>

          <Animated.View style={[styles.codeCard, { transform: [{ scale: codeScale }] }]}>
            <Text style={styles.codeValue}>{formatCodeForDisplay(claimedCode)}</Text>
          </Animated.View>

          {claimedExpiry && (
            <Text style={styles.expiryText}>
              Expires: {formatExpiry(claimedExpiry)}
            </Text>
          )}
          <Text style={styles.subText}>Generating your QR code...</Text>
        </View>
      )}

      {status === "error" && (
        <View style={styles.center}>
          <Text style={[styles.statusText, { color: Colors.primary }]}>Claim Failed</Text>
          <Text style={styles.subText}>{errorMsg}</Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.claimButton, { opacity: pressed ? 0.85 : 1, marginTop: Spacing.md }]}
          >
            <Text style={styles.claimButtonText}>Close</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
  },
  dealInfo: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  vendorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.sm,
  },
  vendorName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.secondary,
  },
  dealTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.secondary,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  discountBadge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: Spacing.sm,
  },
  discountText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  minOrder: {
    fontSize: 13,
    color: Colors.text.muted,
    marginBottom: 4,
  },
  validUntil: {
    fontSize: 13,
    color: Colors.text.muted,
  },
  claimButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.button,
    paddingVertical: 16,
    marginBottom: Spacing.sm,
  },
  claimButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.secondary,
  },
  center: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  statusText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.secondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  codeCard: {
    backgroundColor: Colors.divider,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginVertical: Spacing.md,
  },
  codeValue: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.secondary,
    fontFamily: "JetBrains Mono",
    letterSpacing: 2,
  },
  expiryText: {
    fontSize: 13,
    color: Colors.text.muted,
    marginBottom: Spacing.sm,
  },
  subText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
});

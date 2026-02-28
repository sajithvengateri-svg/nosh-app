import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Glass, Spacing } from "../../constants/colors";
import { useVendorStore } from "../../lib/stores/vendorStore";
import { DealCard } from "./DealCard";
import { DealClaimSheet } from "./DealClaimSheet";
import { DealQRScreen } from "./DealQRScreen";

export function VendorDealsSection() {
  const deals = useVendorStore((s) => s.deals);
  const dealsLoading = useVendorStore((s) => s.dealsLoading);
  const claimingDealId = useVendorStore((s) => s.claimingDealId);
  const myRedemptions = useVendorStore((s) => s.myRedemptions);
  const loadActiveDeals = useVendorStore((s) => s.loadActiveDeals);
  const loadMyRedemptions = useVendorStore((s) => s.loadMyRedemptions);

  const [claimingDeal, setClaimingDeal] = useState<typeof deals[number] | null>(null);
  const [qrData, setQrData] = useState<{
    code: string;
    expiresAt: string;
    title: string;
    vendor: string;
  } | null>(null);

  useEffect(() => {
    loadActiveDeals();
    loadMyRedemptions();
  }, [loadActiveDeals, loadMyRedemptions]);

  const claimedDealIds = new Set(
    myRedemptions
      .filter((r) => r.status === "active" || r.status === "redeemed")
      .map((r) => r.deal_id)
  );

  if (dealsLoading && deals.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  if (deals.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>DEALS</Text>

      {deals.map((deal) => (
        <DealCard
          key={deal.id}
          deal={deal}
          isClaiming={claimingDealId === deal.id}
          alreadyClaimed={claimedDealIds.has(deal.id)}
          onClaim={() => setClaimingDeal(deal)}
        />
      ))}

      {/* Claim confirmation sheet */}
      <Modal
        visible={!!claimingDeal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setClaimingDeal(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
          {claimingDeal && (
            <DealClaimSheet
              deal={claimingDeal}
              onClose={() => setClaimingDeal(null)}
              onClaimed={(code, _redemptionId, expiresAt) => {
                setClaimingDeal(null);
                setQrData({
                  code,
                  expiresAt,
                  title: claimingDeal.title,
                  vendor: claimingDeal.vendor_name ?? "Vendor",
                });
              }}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* QR code display */}
      <Modal
        visible={!!qrData}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setQrData(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
          {qrData && (
            <DealQRScreen
              code={qrData.code}
              expiresAt={qrData.expiresAt}
              dealTitle={qrData.title}
              vendorName={qrData.vendor}
              onClose={() => setQrData(null)}
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  loadingContainer: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.text.muted,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
});

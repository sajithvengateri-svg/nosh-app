import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Package,
  Tag,
  ShoppingCart,
  MapPin,
  TrendingUp,
  ScanLine,
  FileText,
  AlertTriangle,
} from "lucide-react-native";
import { useTheme } from "../../../contexts/ThemeProvider";
import { useVendorAuth } from "../../../contexts/VendorAuthProvider";
import { useVendorDeals } from "../../../hooks/useVendorDeals";
import { useVendorDemand } from "../../../hooks/useVendorDemand";
import { StatCard } from "../StatCard";
import { ScreenHeader } from "../../ui/ScreenHeader";
import { VendorUsageSummary } from "./VendorUsageSummary";
import { DealRedemptionFeed } from "./DealRedemptionFeed";
import { lightTap } from "../../../lib/haptics";
import { useState } from "react";

export function VendorDashboard() {
  const { colors } = useTheme();
  const router = useRouter();
  const { vendorProfile } = useVendorAuth();
  const { data: deals, refetch: refetchDeals } = useVendorDeals();
  const { data: demandInsights, refetch: refetchDemand } = useVendorDemand();
  const [refreshing, setRefreshing] = useState(false);

  const activeDeals = deals?.filter((d) => d.is_active) ?? [];
  const uniquePostcodes = new Set(demandInsights?.map((d) => d.postcode) ?? []);
  const totalCategories = vendorProfile?.categories?.length ?? 0;
  const paymentStatus = (vendorProfile as any)?.payment_status ?? "good";

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchDeals(), refetchDemand()]);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <ScreenHeader title="VendorOS" showBack={false} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* Enforcement banners */}
        {paymentStatus === "suspended" && (
          <EnforcementBanner
            icon={AlertTriangle}
            title="Account Suspended"
            message="Your listing has been removed due to unpaid invoices. Contact support to restore."
            colors={colors}
            variant="destructive"
          />
        )}
        {paymentStatus === "overdue" && (
          <EnforcementBanner
            icon={AlertTriangle}
            title="Payment Overdue"
            message="Deal creation is disabled until your outstanding invoice is paid."
            colors={colors}
            variant="destructive"
            onAction={() => {
              lightTap();
              router.push("/(app)/vendor/invoices");
            }}
            actionLabel="View Invoices"
          />
        )}
        {paymentStatus === "warning" && (
          <EnforcementBanner
            icon={AlertTriangle}
            title="Invoice Due Soon"
            message="You have an invoice due within 7 days."
            colors={colors}
            variant="warning"
            onAction={() => {
              lightTap();
              router.push("/(app)/vendor/invoices");
            }}
            actionLabel="View Invoices"
          />
        )}

        {/* Pending approval banner */}
        {vendorProfile?.status === "pending" && (
          <View
            style={{
              backgroundColor: colors.warningBg,
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.warning }}>
              Account Pending Approval
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
              Your vendor account is being reviewed. You can explore demand data while you wait.
            </Text>
          </View>
        )}

        {/* Stat cards - 2x2 grid */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <StatCard label="Products" value={totalCategories} icon={Package} />
          </View>
          <View style={{ flex: 1 }}>
            <StatCard label="Active Deals" value={activeDeals.length} icon={Tag} />
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <StatCard label="Orders" value={0} icon={ShoppingCart} />
          </View>
          <View style={{ flex: 1 }}>
            <StatCard label="Demand Areas" value={uniquePostcodes.size} icon={MapPin} />
          </View>
        </View>

        {/* Usage summary (ROI card) */}
        <VendorUsageSummary />

        {/* Recent redemptions feed */}
        <DealRedemptionFeed limit={5} />

        {/* Quick actions */}
        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
          Quick Actions
        </Text>

        <QuickAction
          icon={TrendingUp}
          label="View Demand"
          description="See what customers are looking for"
          onPress={() => {
            lightTap();
            router.push("/(app)/(tabs)/demands");
          }}
          colors={colors}
        />

        <QuickAction
          icon={Tag}
          label="Create Deal"
          description="Offer a discount to attract customers"
          onPress={() => {
            lightTap();
            router.push("/(app)/(tabs)/deals");
          }}
          colors={colors}
        />

        <QuickAction
          icon={ScanLine}
          label="Scan Code"
          description="Redeem a customer's deal QR code"
          onPress={() => {
            lightTap();
            router.push("/(app)/(tabs)/scanner");
          }}
          colors={colors}
        />

        <QuickAction
          icon={FileText}
          label="View Invoices"
          description="See your billing history and usage fees"
          onPress={() => {
            lightTap();
            router.push("/(app)/vendor/invoices");
          }}
          colors={colors}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function EnforcementBanner({
  icon: Icon,
  title,
  message,
  colors,
  variant,
  onAction,
  actionLabel,
}: {
  icon: typeof AlertTriangle;
  title: string;
  message: string;
  colors: ReturnType<typeof useTheme>["colors"];
  variant: "destructive" | "warning";
  onAction?: () => void;
  actionLabel?: string;
}) {
  const bg = variant === "destructive" ? colors.destructiveBg : colors.warningBg;
  const fg = variant === "destructive" ? colors.destructive : colors.warning;

  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Icon size={16} color={fg} strokeWidth={1.5} />
        <Text style={{ fontSize: 14, fontWeight: "600", color: fg }}>{title}</Text>
      </View>
      <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{message}</Text>
      {onAction && actionLabel && (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => ({
            alignSelf: "flex-start",
            marginTop: 8,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: fg }}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

function QuickAction({
  icon: IconComponent,
  label,
  description,
  onPress,
  colors,
}: {
  icon: typeof TrendingUp;
  label: string;
  description: string;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        padding: 16,
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
        <IconComponent size={22} color={colors.accent} strokeWidth={1.5} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{label}</Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{description}</Text>
      </View>
    </Pressable>
  );
}

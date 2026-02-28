import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, X, AlertTriangle } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../../contexts/ThemeProvider";
import { useVendorAuth } from "../../../contexts/VendorAuthProvider";
import { useVendorDeals, useCreateDeal, useToggleDeal, type VendorDeal } from "../../../hooks/useVendorDeals";
import { DEMAND_CATEGORIES } from "@queitos/shared";
import { ScreenHeader } from "../../ui/ScreenHeader";
import { SkeletonCard } from "../../ui/Skeleton";
import { lightTap } from "../../../lib/haptics";

type Channel = "d2c" | "b2b";

export function VendorDealMaker() {
  const { colors } = useTheme();
  const router = useRouter();
  const { vendorProfile } = useVendorAuth();
  const { data: deals, isLoading, refetch } = useVendorDeals();
  const createDeal = useCreateDeal();
  const toggleDeal = useToggleDeal();
  const [channel, setChannel] = useState<Channel>("d2c");
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const paymentStatus = (vendorProfile as any)?.payment_status ?? "good";
  const isBlocked = paymentStatus === "overdue" || paymentStatus === "suspended";

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <ScreenHeader title="Deals" showBack={false} />

      {/* Enforcement banner */}
      {isBlocked && (
        <Pressable
          onPress={() => router.push("/(app)/vendor/invoices" as any)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginHorizontal: 16,
            marginBottom: 12,
            padding: 14,
            borderRadius: 12,
            backgroundColor: colors.destructive + "15",
          }}
        >
          <AlertTriangle size={20} color={colors.destructive} strokeWidth={1.5} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.destructive }}>
              Deal creation disabled
            </Text>
            <Text style={{ fontSize: 12, color: colors.destructive, marginTop: 2 }}>
              Settle outstanding invoice to re-enable deals
            </Text>
          </View>
        </Pressable>
      )}
      {paymentStatus === "warning" && (
        <Pressable
          onPress={() => router.push("/(app)/vendor/invoices" as any)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginHorizontal: 16,
            marginBottom: 12,
            padding: 14,
            borderRadius: 12,
            backgroundColor: colors.warning + "15",
          }}
        >
          <AlertTriangle size={20} color={colors.warning} strokeWidth={1.5} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.warning }}>
              Invoice due soon
            </Text>
            <Text style={{ fontSize: 12, color: colors.warning, marginTop: 2 }}>
              Tap to view invoices
            </Text>
          </View>
        </Pressable>
      )}

      {/* D2C / B2B segment */}
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <View
          style={{
            flexDirection: "row",
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 4,
          }}
        >
          {(["d2c", "b2b"] as const).map((ch) => (
            <Pressable
              key={ch}
              onPress={() => { lightTap(); setChannel(ch); }}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                alignItems: "center",
                backgroundColor: channel === ch ? colors.accent : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: channel === ch ? "#FFF" : colors.textSecondary,
                }}
              >
                {ch === "d2c" ? "D2C Consumer" : "B2B Hospitality"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={deals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 40 }}>
              <Text style={{ fontSize: 15, color: colors.textMuted }}>No deals yet</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
                Tap + to create your first deal
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <DealCard
              deal={item}
              colors={colors}
              onToggle={() => {
                lightTap();
                toggleDeal.mutate({ id: item.id, is_active: !item.is_active });
              }}
            />
          )}
        />
      )}

      {/* FAB — hidden when payment overdue/suspended */}
      {!isBlocked && (
        <Pressable
          onPress={() => { lightTap(); setShowForm(true); }}
          style={({ pressed }) => ({
            position: "absolute",
            bottom: 100,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.accent,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.8 : 1,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 5,
          })}
        >
          <Plus size={24} color="#FFF" strokeWidth={2} />
        </Pressable>
      )}

      <CreateDealModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={async (input) => {
          await createDeal.mutateAsync(input);
          setShowForm(false);
        }}
        isSubmitting={createDeal.isPending}
        colors={colors}
      />
    </SafeAreaView>
  );
}

function DealCard({
  deal,
  colors,
  onToggle,
}: {
  deal: VendorDeal;
  colors: ReturnType<typeof useTheme>["colors"];
  onToggle: () => void;
}) {
  const isExpired = new Date(deal.end_date) < new Date();
  const statusColor = deal.is_active && !isExpired
    ? colors.success
    : isExpired
      ? colors.destructive
      : colors.warning;
  const statusLabel = isExpired ? "Expired" : deal.is_active ? "Active" : "Paused";

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>{deal.title}</Text>
          {deal.description && (
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }} numberOfLines={2}>
              {deal.description}
            </Text>
          )}
        </View>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 9999,
            backgroundColor: statusColor + "20",
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "600", color: statusColor }}>{statusLabel}</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 16, marginTop: 12 }}>
        {deal.discount_percent != null && (
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>
            {deal.discount_percent}% off
          </Text>
        )}
        {deal.min_order_value != null && (
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>
            Min ${deal.min_order_value}
          </Text>
        )}
        <Text style={{ fontSize: 13, color: colors.textSecondary }}>
          {deal.start_date} — {deal.end_date}
        </Text>
      </View>

      {deal.applicable_categories && deal.applicable_categories.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {deal.applicable_categories.map((cat) => (
            <View
              key={cat}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 9999,
                backgroundColor: colors.surface,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textSecondary }}>{cat}</Text>
            </View>
          ))}
        </View>
      )}

      {!isExpired && (
        <Pressable
          onPress={onToggle}
          style={({ pressed }) => ({
            marginTop: 12,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            paddingVertical: 10,
            alignItems: "center",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
            {deal.is_active ? "Pause Deal" : "Activate Deal"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function CreateDealModal({
  visible,
  onClose,
  onSubmit,
  isSubmitting,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: {
    title: string;
    description?: string;
    discount_percent?: number;
    min_order_value?: number;
    applicable_categories?: string[];
    start_date: string;
    end_date: string;
  }) => Promise<void>;
  isSubmitting: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(nextWeek);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a deal title");
      return;
    }
    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      discount_percent: discountPercent ? Number(discountPercent) : undefined,
      min_order_value: minOrder ? Number(minOrder) : undefined,
      applicable_categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      start_date: startDate,
      end_date: endDate,
    });
    // Reset form
    setTitle("");
    setDescription("");
    setDiscountPercent("");
    setMinOrder("");
    setSelectedCategories([]);
  };

  const inputStyle = {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: colors.inputBg,
    color: colors.text,
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>New Deal</Text>
          <Pressable onPress={onClose} style={{ padding: 4 }}>
            <X size={22} color={colors.text} strokeWidth={1.5} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}>
            Title
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. 20% Off All Produce"
            placeholderTextColor={colors.textMuted}
            style={inputStyle}
          />

          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}>
            Description (optional)
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Details about the deal..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            style={{ ...inputStyle, minHeight: 80, textAlignVertical: "top" }}
          />

          <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}>
                Discount %
              </Text>
              <TextInput
                value={discountPercent}
                onChangeText={setDiscountPercent}
                placeholder="e.g. 20"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={inputStyle}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}>
                Min Order $
              </Text>
              <TextInput
                value={minOrder}
                onChangeText={setMinOrder}
                placeholder="e.g. 50"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={inputStyle}
              />
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}>
                Start Date
              </Text>
              <TextInput
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                style={inputStyle}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 }}>
                End Date
              </Text>
              <TextInput
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                style={inputStyle}
              />
            </View>
          </View>

          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 8 }}>
            Categories
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
            {DEMAND_CATEGORIES.map((cat) => {
              const selected = selectedCategories.includes(cat);
              return (
                <Pressable
                  key={cat}
                  onPress={() => {
                    lightTap();
                    setSelectedCategories((prev) =>
                      selected ? prev.filter((c) => c !== cat) : [...prev, cat]
                    );
                  }}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 9999,
                    backgroundColor: selected ? colors.accent : colors.surface,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: selected ? "#FFF" : colors.textSecondary,
                    }}
                  >
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={({ pressed }) => ({
              backgroundColor: colors.accent,
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: "center",
              opacity: isSubmitting ? 0.6 : pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 16 }}>
              {isSubmitting ? "Creating..." : "Create Deal"}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

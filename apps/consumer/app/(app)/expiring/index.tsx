import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Trash2,
  Plus,
  AlertTriangle,
} from "lucide-react-native";
import { Colors, Glass } from "../../../src/constants/colors";
import { usePantryStore } from "../../../src/lib/stores/pantryStore";
import { useWasteStore, WasteEntry } from "../../../src/lib/stores/wasteStore";
import { lightTap, successNotification } from "../../../src/lib/haptics";

function daysUntilExpiry(expiryDate?: string): number | null {
  if (!expiryDate) return null;
  const now = new Date();
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function ExpiringPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, fetchPantry, removeItem } = usePantryStore();
  const wasteStore = useWasteStore();
  const [showLogWaste, setShowLogWaste] = useState(false);
  const [wasteName, setWasteName] = useState("");
  const [wasteCost, setWasteCost] = useState("");
  const [wasteReason, setWasteReason] = useState("expired");

  useEffect(() => {
    fetchPantry();
    // Fetch waste for last 30 days
    const since = new Date();
    since.setDate(since.getDate() - 30);
    wasteStore.fetchWaste(since.toISOString());
  }, []);

  // Items expiring within 7 days
  const expiringItems = items
    .filter((i) => {
      const d = daysUntilExpiry(i.expiry_date);
      return d !== null && d <= 7;
    })
    .sort(
      (a, b) =>
        (a.expiry_date ?? "").localeCompare(b.expiry_date ?? ""),
    );

  const expired = expiringItems.filter(
    (i) => (daysUntilExpiry(i.expiry_date) ?? 99) <= 0,
  );
  const expiringSoon = expiringItems.filter(
    (i) => (daysUntilExpiry(i.expiry_date) ?? 99) > 0,
  );

  const handleLogAsTrashed = (item: typeof items[0]) => {
    Alert.alert(
      "Log as waste?",
      `Move "${item.name}" to waste bin?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Waste",
          style: "destructive",
          onPress: () => {
            lightTap();
            wasteStore.logWaste({
              item_name: item.name,
              quantity: item.quantity ?? 1,
              unit: item.unit ?? null,
              estimated_cost: 0,
              reason: "expired",
            });
            removeItem(item.id);
          },
        },
      ],
    );
  };

  const handleSaveWaste = () => {
    if (!wasteName.trim()) return;
    wasteStore.logWaste({
      item_name: wasteName.trim(),
      quantity: 1,
      unit: null,
      estimated_cost: parseFloat(wasteCost) || 0,
      reason: wasteReason,
    });
    successNotification();
    setWasteName("");
    setWasteCost("");
    setShowLogWaste(false);
  };

  const REASONS = ["expired", "spoiled", "overcooked", "leftover", "other"];

  const totalWaste = wasteStore.totalWaste();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            lightTap();
            router.back();
          }}
          style={styles.backBtn}
        >
          <ChevronLeft size={20} color={Colors.text.secondary} />
        </Pressable>
        <Text style={styles.title}>Expiring & Waste</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <>
            {/* Summary pills */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryPill}>
                <AlertTriangle
                  size={18}
                  color={Colors.alert}
                  strokeWidth={2}
                />
                <Text style={styles.summaryNumber}>
                  {expiringItems.length}
                </Text>
                <Text style={styles.summaryLabel}>Expiring</Text>
              </View>
              <View style={styles.summaryPill}>
                <Trash2 size={18} color="#E53935" strokeWidth={2} />
                <Text style={styles.summaryNumber}>
                  ${totalWaste.toFixed(2)}
                </Text>
                <Text style={styles.summaryLabel}>Waste (30d)</Text>
              </View>
            </View>

            {/* ── Expired ─────────────────────────────── */}
            {expired.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: "#E53935" }]}>
                  Expired
                </Text>
                {expired.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemMeta}>
                        {item.quantity && item.unit
                          ? `${item.quantity} ${item.unit} · `
                          : ""}
                        Expired
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => handleLogAsTrashed(item)}
                      style={styles.trashBtn}
                    >
                      <Trash2 size={14} color="#E53935" strokeWidth={2} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* ── Expiring Soon ────────────────────────── */}
            {expiringSoon.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Expiring Soon</Text>
                <Text style={styles.sectionHint}>
                  Tap the bin to log as waste, or repurpose these items before
                  they go off.
                </Text>
                {expiringSoon.map((item) => {
                  const days = daysUntilExpiry(item.expiry_date) ?? 0;
                  return (
                    <View key={item.id} style={styles.itemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemMeta}>
                          {days === 1 ? "1 day left" : `${days} days left`}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => handleLogAsTrashed(item)}
                        style={styles.trashBtn}
                      >
                        <Trash2
                          size={14}
                          color={Colors.text.secondary}
                          strokeWidth={2}
                        />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}

            {expiringItems.length === 0 && (
              <View style={styles.emptyBlock}>
                <Text style={styles.emptyText}>
                  Nothing expiring soon — nice work!
                </Text>
              </View>
            )}

            {/* ── Waste Bin ────────────────────────────── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Waste Bin</Text>
                <Pressable
                  onPress={() => {
                    lightTap();
                    setShowLogWaste(!showLogWaste);
                  }}
                  style={styles.addWasteBtn}
                >
                  <Plus size={14} color={Colors.primary} strokeWidth={2.5} />
                  <Text style={styles.addWasteText}>Log Waste</Text>
                </Pressable>
              </View>

              {/* Quick add form */}
              {showLogWaste && (
                <View style={styles.wasteForm}>
                  <TextInput
                    style={styles.input}
                    placeholder="Item name"
                    placeholderTextColor={Colors.text.muted}
                    value={wasteName}
                    onChangeText={setWasteName}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Estimated cost ($)"
                    placeholderTextColor={Colors.text.muted}
                    keyboardType="decimal-pad"
                    value={wasteCost}
                    onChangeText={setWasteCost}
                  />
                  <View style={styles.reasonRow}>
                    {REASONS.map((r) => (
                      <Pressable
                        key={r}
                        onPress={() => {
                          lightTap();
                          setWasteReason(r);
                        }}
                        style={[
                          styles.reasonPill,
                          wasteReason === r && styles.reasonPillActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.reasonText,
                            wasteReason === r && styles.reasonTextActive,
                          ]}
                        >
                          {r}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Pressable
                    onPress={() => {
                      lightTap();
                      handleSaveWaste();
                    }}
                    style={[
                      styles.saveBtn,
                      !wasteName.trim() && { opacity: 0.4 },
                    ]}
                    disabled={!wasteName.trim()}
                  >
                    <Text style={styles.saveBtnText}>Save</Text>
                  </Pressable>
                </View>
              )}

              {/* Waste entries */}
              {wasteStore.entries.length > 0 ? (
                wasteStore.entries.slice(0, 10).map((e) => (
                  <View key={e.id} style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{e.item_name}</Text>
                      <Text style={styles.itemMeta}>
                        {e.reason ?? "waste"}
                        {e.estimated_cost > 0
                          ? ` · $${e.estimated_cost.toFixed(2)}`
                          : ""}
                        {" · "}
                        {new Date(e.logged_at).toLocaleDateString("en-AU", {
                          day: "numeric",
                          month: "short",
                        })}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noWaste}>No waste logged yet.</Text>
              )}
            </View>
          </>
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 20,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Glass.surface,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 18, fontWeight: "700", color: Colors.secondary },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  summaryPill: {
    flex: 1,
    backgroundColor: Glass.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: Glass.borderLight,
  },
  summaryNumber: { fontSize: 22, fontWeight: "700", color: Colors.secondary },
  summaryLabel: { fontSize: 12, color: Colors.text.secondary },
  section: {
    marginBottom: 20,
    backgroundColor: Glass.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Glass.borderLight,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 12,
    color: Colors.text.muted,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  itemName: { fontSize: 15, fontWeight: "500", color: Colors.text.primary },
  itemMeta: { fontSize: 12, color: Colors.text.secondary, marginTop: 2 },
  trashBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(229, 57, 53, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(229, 57, 53, 0.2)",
  },
  addWasteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  addWasteText: { fontSize: 12, fontWeight: "600", color: Colors.primary },
  wasteForm: {
    marginTop: 12,
    gap: 10,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  reasonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  reasonPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  reasonPillActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "14",
  },
  reasonText: { fontSize: 12, color: Colors.text.secondary },
  reasonTextActive: { color: Colors.primary, fontWeight: "600" },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  emptyBlock: { alignItems: "center", paddingVertical: 30 },
  emptyText: { fontSize: 14, color: Colors.text.muted },
  noWaste: {
    fontSize: 13,
    color: Colors.text.muted,
    textAlign: "center",
    paddingVertical: 16,
  },
});

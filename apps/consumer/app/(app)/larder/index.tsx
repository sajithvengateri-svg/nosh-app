import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, House } from "lucide-react-native";
import { Colors, Glass } from "../../../src/constants/colors";
import { usePantryStore, PantryItem } from "../../../src/lib/stores/pantryStore";
import { lightTap } from "../../../src/lib/haptics";
import { useEffect } from "react";

function daysUntilExpiry(expiryDate?: string): number | null {
  if (!expiryDate) return null;
  const now = new Date();
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function LarderPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, isLoading, fetchPantry } = usePantryStore();

  useEffect(() => {
    fetchPantry();
  }, [fetchPantry]);

  // Group by category
  const grouped = items.reduce<Record<string, PantryItem[]>>((acc, item) => {
    const cat = item.category ?? "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});
  const sections = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

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
        <Text style={styles.title}>Full Larder</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryPill}>
          <Text style={styles.summaryNumber}>{items.length}</Text>
          <Text style={styles.summaryLabel}>Total Items</Text>
        </View>
        <View style={styles.summaryPill}>
          <Text style={styles.summaryNumber}>
            {new Set(items.map((i) => i.category ?? "Other")).size}
          </Text>
          <Text style={styles.summaryLabel}>Categories</Text>
        </View>
      </View>

      {/* Items list */}
      <FlatList
        data={sections}
        keyExtractor={([cat]) => cat}
        renderItem={({ item: [category, categoryItems] }) => (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {category} ({categoryItems.length})
            </Text>
            {categoryItems.map((item) => {
              const days = daysUntilExpiry(item.expiry_date);
              const expiryColor =
                days !== null && days <= 1
                  ? "#E53935"
                  : days !== null && days <= 3
                    ? Colors.alert
                    : Colors.text.secondary;
              return (
                <View key={item.id} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemMeta}>
                      {item.quantity && item.unit
                        ? `${item.quantity} ${item.unit}`
                        : ""}
                      {item.added_via !== "manual"
                        ? ` · via ${item.added_via.replace("_", " ")}`
                        : ""}
                    </Text>
                  </View>
                  {days !== null && (
                    <Text style={[styles.expiryText, { color: expiryColor }]}>
                      {days <= 0 ? "Expired" : `${days}d`}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <House size={40} color={Colors.text.muted} strokeWidth={1.5} />
            <Text style={styles.emptyText}>
              {isLoading ? "Loading..." : "Your larder is empty."}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
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
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  summaryPill: {
    flex: 1,
    backgroundColor: Glass.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Glass.borderLight,
  },
  summaryNumber: { fontSize: 24, fontWeight: "700", color: Colors.secondary },
  summaryLabel: { fontSize: 12, color: Colors.text.secondary, marginTop: 4 },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 1,
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
  expiryText: { fontSize: 13, fontWeight: "600" },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.text.secondary },
});

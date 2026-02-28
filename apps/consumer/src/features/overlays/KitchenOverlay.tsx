import { useEffect } from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { House, X } from "lucide-react-native";
import { Colors, Glass } from "../../constants/colors";
import { usePantryStore, PantryItem } from "../../lib/stores/pantryStore";
import { lightTap } from "../../lib/haptics";

function daysUntilExpiry(expiryDate?: string): number | null {
  if (!expiryDate) return null;
  const now = new Date();
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ days }: { days: number | null }) {
  if (days === null) return null;
  const color = days <= 1 ? "#E53935" : days <= 3 ? Colors.alert : Colors.success;
  const label = days <= 0 ? "Expired" : days === 1 ? "1 day" : `${days} days`;
  return (
    <View style={[styles.badge, { backgroundColor: Glass.surfaceAccent }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function KitchenOverlay() {
  const { items, isLoading, fetchPantry, removeItem } = usePantryStore();

  useEffect(() => {
    fetchPantry();
  }, [fetchPantry]);

  const handleRemove = (id: string) => {
    lightTap();
    removeItem(id);
  };

  // Group by category
  const grouped = items.reduce<Record<string, PantryItem[]>>((acc, item) => {
    const cat = item.category ?? "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});
  const sections = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

  return (
    <View style={styles.container}>
      {/* Stats bar */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{items.length}</Text>
          <Text style={styles.statLabel}>Items</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>
            {items.filter((i) => {
              const d = daysUntilExpiry(i.expiry_date);
              return d !== null && d <= 3;
            }).length}
          </Text>
          <Text style={styles.statLabel}>Expiring soon</Text>
        </View>
      </View>

      <FlatList
        data={sections}
        keyExtractor={([cat]) => cat}
        renderItem={({ item: [category, categoryItems] }) => (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{category}</Text>
            {categoryItems.map((item) => {
              const days = daysUntilExpiry(item.expiry_date);
              return (
                <View key={item.id} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.quantity && item.unit && (
                      <Text style={styles.itemDetail}>
                        {item.quantity} {item.unit}
                      </Text>
                    )}
                  </View>
                  <ExpiryBadge days={days} />
                  <Pressable
                    onPress={() => handleRemove(item.id)}
                    style={styles.removeButton}
                  >
                    <X size={12} color={Colors.text.secondary} strokeWidth={1.5} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={{ marginBottom: 12 }}>
              <House size={40} color={Colors.text.muted} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyText}>
              {isLoading
                ? "Loading your kitchen..."
                : "Your kitchen is empty.\nScan your fridge or add items manually."}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  stat: {
    flex: 1,
    backgroundColor: Glass.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Glass.borderLight,
    shadowColor: Glass.shadowLight.color,
    shadowOffset: Glass.shadowLight.offset,
    shadowRadius: Glass.shadowLight.radius,
  },
  statNumber: { fontSize: 28, fontWeight: "700", color: Colors.secondary },
  statLabel: { fontSize: 12, color: Colors.text.secondary, marginTop: 4 },
  section: { marginBottom: 16 },
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
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Glass.borderLight,
  },
  itemName: { fontSize: 15, color: Colors.text.primary, fontWeight: "500" },
  itemDetail: { fontSize: 12, color: Colors.text.secondary, marginTop: 2 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Glass.borderLight },
  badgeText: { fontSize: 11, fontWeight: "600" },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Glass.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Glass.borderLight,
  },
  removeText: { fontSize: 12, color: Colors.text.secondary },
  empty: { alignItems: "center", paddingTop: 40 },
  emptyText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
});

import { useEffect, useState } from "react";
import { View, Text, Pressable, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import {
  House,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertTriangle,
  Trash2,
} from "lucide-react-native";
import { Colors, Glass } from "../../constants/colors";
import { usePantryStore, PantryItem } from "../../lib/stores/pantryStore";
import { useWasteStore } from "../../lib/stores/wasteStore";
import { useSettingsStore } from "../../lib/stores/settingsStore";
import {
  useKitchenSpend,
  SpendPeriod,
} from "../../hooks/useKitchenSpend";
import { AddExpenseSheet } from "./AddExpenseSheet";
import { lightTap } from "../../lib/haptics";

// ── Helpers ───────────────────────────────────────────────────────────

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

const PERIODS: SpendPeriod[] = ["week", "month", "year"];
const PERIOD_LABELS: Record<SpendPeriod, string> = {
  week: "Week",
  month: "Month",
  year: "Year",
};

// ── Component ─────────────────────────────────────────────────────────

export function KitchenOverlay() {
  const router = useRouter();
  const { items, isLoading, fetchPantry, removeItem } = usePantryStore();
  const spend = useKitchenSpend();
  const wasteStore = useWasteStore();
  const showWastage = useSettingsStore((s) => s.showWastage);
  const [showAddExpense, setShowAddExpense] = useState(false);

  useEffect(() => {
    fetchPantry();
    // Fetch waste for last 30 days for the counter
    const since = new Date();
    since.setDate(since.getDate() - 30);
    wasteStore.fetchWaste(since.toISOString());
  }, [fetchPantry]);

  const handleRemove = (id: string) => {
    lightTap();
    removeItem(id);
  };

  // Group pantry by category
  const grouped = items.reduce<Record<string, PantryItem[]>>((acc, item) => {
    const cat = item.category ?? "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});
  const sections = Object.entries(grouped).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  const expiringCount = items.filter((i) => {
    const d = daysUntilExpiry(i.expiry_date);
    return d !== null && d <= 3;
  }).length;

  const totalWaste = wasteStore.totalWaste();

  const formatCurrency = (n: number) =>
    `$${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

  // ── Spend Dashboard (ListHeader) ──────────────────────────────────

  const SpendHeader = () => (
    <View style={styles.spendSection}>
      {/* Period toggle */}
      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <Pressable
            key={p}
            style={[
              styles.periodPill,
              spend.period === p && styles.periodPillActive,
            ]}
            onPress={() => {
              lightTap();
              spend.setPeriod(p);
            }}
          >
            <Text
              style={[
                styles.periodText,
                spend.period === p && styles.periodTextActive,
              ]}
            >
              {PERIOD_LABELS[p]}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Date carousel */}
      <View style={styles.carouselRow}>
        <Pressable
          onPress={() => {
            lightTap();
            spend.goBack();
          }}
          style={styles.carouselArrow}
        >
          <ChevronLeft size={20} color={Colors.text.secondary} />
        </Pressable>
        <Text style={styles.carouselLabel}>{spend.periodLabel}</Text>
        <Pressable
          onPress={() => {
            lightTap();
            spend.goForward();
          }}
          style={[
            styles.carouselArrow,
            !spend.canGoForward && styles.carouselArrowDisabled,
          ]}
          disabled={!spend.canGoForward}
        >
          <ChevronRight
            size={20}
            color={
              spend.canGoForward
                ? Colors.text.secondary
                : Colors.text.muted
            }
          />
        </Pressable>
      </View>

      {/* Spend stat pills */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>
            {formatCurrency(spend.totalSpend)}
          </Text>
          <Text style={styles.statLabel}>Total Spend</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>
            {formatCurrency(spend.costPerMeal)}
          </Text>
          <Text style={styles.statLabel}>Per Meal</Text>
        </View>
      </View>

      {/* Add expense button */}
      <Pressable
        style={styles.addBtn}
        onPress={() => {
          lightTap();
          setShowAddExpense(true);
        }}
      >
        <Plus size={16} color={Colors.primary} strokeWidth={2.5} />
        <Text style={styles.addBtnText}>Add Expense</Text>
      </Pressable>

      {/* Recent receipts */}
      {spend.receipts.length > 0 && (
        <View style={styles.receiptsSection}>
          <Text style={styles.sectionTitle}>Recent Receipts</Text>
          {spend.receipts.slice(0, 5).map((r) => (
            <View key={r.id} style={styles.receiptRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.receiptStore}>
                  {r.store_name || "Expense"}
                </Text>
                <Text style={styles.receiptDate}>
                  {new Date(r.receipt_date).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "short",
                  })}
                </Text>
              </View>
              <Text style={styles.receiptAmount}>
                {formatCurrency(r.total)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Divider before pantry */}
      <View style={styles.divider} />

      {/* ── 3 Pantry counters in a row ─────────────────────── */}
      <View style={styles.tripleRow}>
        {/* Items counter */}
        <View style={styles.triStat}>
          <Text style={styles.triNumber}>{items.length}</Text>
          <Text style={styles.triLabel}>Items</Text>
        </View>

        {/* Expiring counter — tappable */}
        <Pressable
          style={[styles.triStat, styles.triStatTappable]}
          onPress={() => {
            lightTap();
            router.push("/(app)/expiring");
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            {expiringCount > 0 && (
              <AlertTriangle size={14} color={Colors.alert} strokeWidth={2} />
            )}
            <Text style={styles.triNumber}>{expiringCount}</Text>
          </View>
          <Text style={styles.triLabel}>Expiring</Text>
        </Pressable>

        {/* Wastage counter — conditionally visible */}
        {showWastage && (
          <View style={styles.triStat}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Trash2 size={14} color="#E53935" strokeWidth={2} />
              <Text style={[styles.triNumber, totalWaste > 0 && { color: "#E53935" }]}>
                {formatCurrency(totalWaste)}
              </Text>
            </View>
            <Text style={styles.triLabel}>Waste</Text>
          </View>
        )}
      </View>

      {/* View Full Larder button */}
      <Pressable
        style={styles.larderBtn}
        onPress={() => {
          lightTap();
          router.push("/(app)/larder");
        }}
      >
        <House size={16} color={Colors.primary} strokeWidth={2} />
        <Text style={styles.larderBtnText}>View Full Larder</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={sections}
        keyExtractor={([cat]) => cat}
        ListHeaderComponent={<SpendHeader />}
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
                    <X
                      size={12}
                      color={Colors.text.secondary}
                      strokeWidth={1.5}
                    />
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

      <AddExpenseSheet
        visible={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        onSaved={spend.refresh}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Spend dashboard
  spendSection: { marginBottom: 8 },
  periodRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  periodPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Glass.surface,
    borderWidth: 1,
    borderColor: Glass.borderLight,
  },
  periodPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  periodText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.secondary,
  },
  periodTextActive: { color: "#fff" },

  // Date carousel
  carouselRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    gap: 16,
  },
  carouselArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Glass.surface,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    justifyContent: "center",
    alignItems: "center",
  },
  carouselArrowDisabled: { opacity: 0.35 },
  carouselLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.secondary,
    minWidth: 140,
    textAlign: "center",
  },

  // Stat pills (2-col for spend)
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

  // Triple counter row (Items | Expiring | Waste)
  tripleRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  triStat: {
    flex: 1,
    backgroundColor: Glass.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Glass.borderLight,
  },
  triStatTappable: {
    borderColor: Colors.primary + "40",
  },
  triNumber: { fontSize: 20, fontWeight: "700", color: Colors.secondary },
  triLabel: { fontSize: 11, color: Colors.text.secondary, marginTop: 2 },

  // Larder button
  larderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Glass.surface,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginBottom: 16,
  },
  larderBtnText: { fontSize: 15, fontWeight: "700", color: Colors.primary },

  // Add expense
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Glass.surface,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginBottom: 16,
  },
  addBtnText: { fontSize: 15, fontWeight: "700", color: Colors.primary },

  // Receipts
  receiptsSection: { marginBottom: 16 },
  receiptRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Glass.borderLight,
  },
  receiptStore: { fontSize: 14, fontWeight: "500", color: Colors.text.primary },
  receiptDate: { fontSize: 12, color: Colors.text.secondary, marginTop: 2 },
  receiptAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.secondary,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: Glass.borderLight,
    marginVertical: 16,
  },

  // Pantry items
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
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Glass.borderLight,
  },
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
  empty: { alignItems: "center", paddingTop: 40 },
  emptyText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
});

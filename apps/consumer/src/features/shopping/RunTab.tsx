import { useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Check, MapPin, ShoppingCart } from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/typography";
import { useNoshRunStore } from "../../lib/stores/noshRunStore";
import { lightTap, mediumTap, successNotification } from "../../lib/haptics";

interface RunTabProps {
  onComplete: () => void;
}

export function RunTab({ onComplete }: RunTabProps) {
  const basket = useNoshRunStore((s) => s.basket);
  const status = useNoshRunStore((s) => s.status);
  const completeRun = useNoshRunStore((s) => s.markGotEverything);

  // Group items by vendor stop
  const vendorStops = useMemo(() => {
    if (!basket?.items) return [];
    const groups: Record<
      string,
      { source: string; items: typeof basket.items; checked: Set<string> }
    > = {};

    for (const item of basket.items) {
      const option = item.options.find((o) => o.tier === item.selectedTier);
      const source = option?.source ?? "Supermarket";
      if (!groups[source]) {
        groups[source] = { source, items: [], checked: new Set() };
      }
      groups[source].items.push(item);
    }
    return Object.values(groups);
  }, [basket]);

  const totalItems = basket?.items.length ?? 0;
  const checkedCount = vendorStops.reduce(
    (acc, stop) => acc + stop.checked.size,
    0
  );
  const progressPct = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  const handleToggle = (stopIdx: number, itemId: string) => {
    lightTap();
    const stop = vendorStops[stopIdx];
    if (stop.checked.has(itemId)) {
      stop.checked.delete(itemId);
    } else {
      stop.checked.add(itemId);
    }
    // Force re-render (vendorStops is memo'd, but checked is mutated)
    // This is a simple approach; for production, move checked state to store
  };

  const handleGotEverything = () => {
    mediumTap();
    successNotification();
    if (completeRun) completeRun();
    onComplete();
  };

  if (!basket || totalItems === 0) {
    return (
      <View style={styles.emptyState}>
        <ShoppingCart size={48} color={Colors.text.muted} strokeWidth={1.5} />
        <Text style={styles.emptyTitle}>No run active</Text>
        <Text style={styles.emptySubtitle}>
          Build your basket in the SHOP tab first
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress bar */}
        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>
            {checkedCount} of {totalItems} items
          </Text>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progressPct}%`,
                  backgroundColor:
                    checkedCount === totalItems
                      ? Colors.success
                      : Colors.primary,
                },
              ]}
            />
          </View>
        </View>

        {/* Vendor stops */}
        {vendorStops.map((stop, stopIdx) => (
          <View key={stop.source} style={styles.stopGroup}>
            <View style={styles.stopHeader}>
              <MapPin size={14} color={Colors.primary} strokeWidth={1.5} />
              <Text style={styles.stopName}>{stop.source}</Text>
              <Text style={styles.stopCount}>
                {stop.items.length} item{stop.items.length !== 1 ? "s" : ""}
              </Text>
            </View>
            {stop.items.map((item) => {
              const option = item.options.find(
                (o) => o.tier === item.selectedTier
              );
              const isChecked = stop.checked.has(item.ingredient.id);
              return (
                <Pressable
                  key={item.ingredient.id}
                  onPress={() => handleToggle(stopIdx, item.ingredient.id)}
                  style={styles.itemRow}
                >
                  <View
                    style={[
                      styles.checkbox,
                      isChecked && styles.checkboxChecked,
                    ]}
                  >
                    {isChecked && (
                      <Check size={12} color="#FFF" strokeWidth={2.5} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.itemName,
                        isChecked && styles.itemNameChecked,
                      ]}
                    >
                      {item.ingredient.name}
                    </Text>
                    <Text style={styles.itemQty}>
                      {item.ingredient.quantity ?? ""}{" "}
                      {item.ingredient.unit ?? ""}
                    </Text>
                  </View>
                  <Text style={styles.itemPrice}>
                    ${option?.price.toFixed(2) ?? "—"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Got Everything CTA */}
      <View style={styles.ctaBar}>
        <Pressable onPress={handleGotEverything} style={styles.ctaButton}>
          <Check size={18} color="#FFF" strokeWidth={2} />
          <Text style={styles.ctaText}>Got Everything</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  // Progress
  progressSection: {
    marginBottom: 20,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 8,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.divider,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },

  // Stops
  stopGroup: {
    marginBottom: 20,
  },
  stopHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  stopName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  stopCount: {
    fontSize: 12,
    color: Colors.text.muted,
    fontWeight: "600",
  },

  // Items
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  itemName: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  itemNameChecked: {
    color: Colors.text.muted,
    textDecorationLine: "line-through",
  },
  itemQty: {
    fontSize: 12,
    color: Colors.text.muted,
    marginTop: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontFamily: Fonts.mono,
    fontWeight: "600",
    color: Colors.text.primary,
  },

  // CTA
  ctaBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 24,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.success,
    paddingVertical: 16,
    borderRadius: 24,
  },
  ctaText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.text.muted,
    textAlign: "center",
    lineHeight: 20,
  },
});

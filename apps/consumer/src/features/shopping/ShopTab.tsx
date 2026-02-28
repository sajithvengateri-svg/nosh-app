import { useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import Slider from "@react-native-community/slider";
import { ShoppingBag, Store } from "lucide-react-native";
import { Colors } from "../../constants/colors";
import { Fonts } from "../../constants/typography";
import { useNoshRunStore } from "../../lib/stores/noshRunStore";
import { lightTap, mediumTap } from "../../lib/haptics";

const PRESETS = [
  { key: "tight_week" as const, label: "Budget" },
  { key: "balanced" as const, label: "Balanced" },
  { key: "treat" as const, label: "Premium" },
];

interface ShopTabProps {
  onStartRun: () => void;
}

export function ShopTab({ onStartRun }: ShopTabProps) {
  const basket = useNoshRunStore((s) => s.basket);
  const sliderPosition = useNoshRunStore((s) => s.sliderPosition);
  const activePreset = useNoshRunStore((s) => s.activePreset);
  const setSlider = useNoshRunStore((s) => s.setSlider);
  const applyPreset = useNoshRunStore((s) => s.applyPreset);

  // Group basket items by vendor/source
  const vendorGroups = useMemo(() => {
    if (!basket?.items) return [];
    const groups: Record<string, { source: string; items: typeof basket.items }> = {};
    for (const item of basket.items) {
      const option = item.options.find((o) => o.tier === item.selectedTier);
      const source = option?.source ?? "Supermarket";
      if (!groups[source]) groups[source] = { source, items: [] };
      groups[source].items.push(item);
    }
    return Object.values(groups).sort((a, b) => b.items.length - a.items.length);
  }, [basket]);

  const currentTotal = basket?.totals.current ?? 0;
  const itemCount = basket?.items.length ?? 0;

  if (!basket || itemCount === 0) {
    return (
      <View style={styles.emptyState}>
        <ShoppingBag size={48} color={Colors.text.muted} strokeWidth={1.5} />
        <Text style={styles.emptyTitle}>No items yet</Text>
        <Text style={styles.emptySubtitle}>
          Open a recipe and tap "Shop First" to build your basket
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Recipe summary */}
      <Text style={styles.recipeName}>{basket.recipeTitle}</Text>
      <Text style={styles.itemCount}>{itemCount} ingredients</Text>

      {/* Tier slider */}
      <View style={styles.sliderSection}>
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>Good</Text>
          <Text style={styles.sliderLabel}>Better</Text>
          <Text style={styles.sliderLabel}>Best</Text>
        </View>
        <Slider
          style={styles.slider}
          value={sliderPosition}
          onSlidingComplete={(val) => setSlider(val)}
          minimumValue={0}
          maximumValue={1}
          minimumTrackTintColor={Colors.primary}
          maximumTrackTintColor={Colors.border}
          thumbTintColor={Colors.primary}
        />
      </View>

      {/* Preset pills */}
      <View style={styles.presetRow}>
        {PRESETS.map((p) => (
          <Pressable
            key={p.key}
            onPress={() => {
              lightTap();
              applyPreset(p.key);
            }}
            style={[
              styles.presetPill,
              activePreset === p.key && styles.presetPillActive,
            ]}
          >
            <Text
              style={[
                styles.presetText,
                activePreset === p.key && styles.presetTextActive,
              ]}
            >
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Vendor-grouped items */}
      {vendorGroups.map((group) => (
        <View key={group.source} style={styles.vendorGroup}>
          <View style={styles.vendorHeader}>
            <Store size={14} color={Colors.text.secondary} strokeWidth={1.5} />
            <Text style={styles.vendorName}>{group.source}</Text>
            <Text style={styles.vendorCount}>{group.items.length}</Text>
          </View>
          {group.items.map((item) => {
            const option = item.options.find((o) => o.tier === item.selectedTier);
            return (
              <View key={item.ingredient.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.ingredient.name}</Text>
                  {option && (
                    <Text style={styles.itemDetail}>
                      {option.productName} · {option.tier}
                    </Text>
                  )}
                </View>
                <Text style={styles.itemPrice}>
                  ${option?.price.toFixed(2) ?? "—"}
                </Text>
              </View>
            );
          })}
        </View>
      ))}

      {/* Basket total */}
      <View style={styles.totalBar}>
        <Text style={styles.totalLabel}>Basket Total</Text>
        <Text style={styles.totalValue}>${currentTotal.toFixed(2)}</Text>
      </View>

      {/* Start Run CTA */}
      <Pressable
        onPress={() => {
          mediumTap();
          onStartRun();
        }}
        style={styles.startRunButton}
      >
        <Text style={styles.startRunText}>Start Nosh Run</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 2,
  },
  itemCount: {
    fontSize: 13,
    color: Colors.text.muted,
    marginBottom: 20,
  },

  // Slider
  sliderSection: {
    marginBottom: 16,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  sliderLabel: {
    fontSize: 11,
    color: Colors.text.muted,
    fontWeight: "600",
  },
  slider: {
    width: "100%",
    height: 32,
  },

  // Presets
  presetRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  presetPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  presetText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.secondary,
  },
  presetTextActive: {
    color: "#FFF",
  },

  // Vendor groups
  vendorGroup: {
    marginBottom: 16,
  },
  vendorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  vendorName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  vendorCount: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text.muted,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  itemName: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  itemDetail: {
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

  // Total
  totalBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 8,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  totalValue: {
    fontSize: 20,
    fontFamily: Fonts.mono,
    fontWeight: "700",
    color: Colors.primary,
  },

  // CTA
  startRunButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: "center",
  },
  startRunText: {
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

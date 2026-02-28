import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { Colors } from "../../constants/colors";
import { useNoshRunStore } from "../../lib/stores/noshRunStore";
import { groupByAisle } from "../../lib/utils/noshRunUtils";
import { lightTap, mediumTap } from "../../lib/haptics";
import type { Tier, TierOption, TieredIngredient } from "../../lib/engines/tierEngine";

const TIER_COLORS: Record<Tier, string> = {
  good: "#4CAF50",
  better: "#F5A623",
  best: "#D4654A",
};

const TIER_DOTS: Record<Tier, string> = {
  good: "🟢",
  better: "🟡",
  best: "🔴",
};

const PRESET_CONFIG = [
  { key: "tight_week" as const, label: "Tight Week", emoji: "💚" },
  { key: "balanced" as const, label: "Balanced", emoji: "💛" },
  { key: "treat" as const, label: "Treat Yourself", emoji: "❤️" },
];

interface NoshRunOverlayProps {
  onClose: () => void;
}

export function NoshRunOverlay({ onClose }: NoshRunOverlayProps) {
  const {
    status,
    basket,
    sliderPosition,
    activePreset,
    storeName,
    smartDefaultsApplied,
    selectTier,
    setSlider,
    applyPreset,
    goToMaps,
    goToDelivery,
    markGotEverything,
    cancelRun,
  } = useNoshRunStore();

  // ── Status: going (maps handoff) ──
  if (status === "going") {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>🛒</Text>
          <Text style={styles.bigTitle}>Happy shopping!</Text>
          {storeName && (
            <Text style={styles.subtitle}>
              Heading to {storeName}
            </Text>
          )}

          <Pressable
            onPress={() => {
              mediumTap();
              markGotEverything();
              onClose();
            }}
            style={[styles.cta, { backgroundColor: Colors.success, marginTop: 32 }]}
          >
            <Text style={styles.ctaText}>I Got Everything</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              cancelRun();
              onClose();
            }}
            style={{ marginTop: 16 }}
          >
            <Text style={styles.cancelText}>Cancel Run</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Status: delivering ──
  if (status === "delivering") {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>📋</Text>
          <Text style={styles.bigTitle}>List copied!</Text>
          <Text style={styles.subtitle}>
            Your shopping list is on your clipboard.
            {"\n"}Paste it into your delivery app.
          </Text>

          <Pressable
            onPress={() => {
              mediumTap();
              markGotEverything();
              onClose();
            }}
            style={[styles.cta, { backgroundColor: Colors.success, marginTop: 32 }]}
          >
            <Text style={styles.ctaText}>I Got Everything</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              cancelRun();
              onClose();
            }}
            style={{ marginTop: 16 }}
          >
            <Text style={styles.cancelText}>Cancel Run</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Status: picking (three-tier picker) ──
  if (!basket || basket.items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>✨</Text>
          <Text style={styles.subtitle}>You have everything you need!</Text>
          <Pressable onPress={onClose} style={[styles.cta, { marginTop: 24 }]}>
            <Text style={styles.ctaText}>Back to Feed</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const grouped = groupByAisle(basket.items);

  return (
    <View style={styles.container}>
      {/* Recipe title */}
      <Text style={styles.recipeTitle}>{basket.recipeTitle}</Text>

      {/* Smart defaults banner */}
      {smartDefaultsApplied && (
        <View style={styles.defaultsBanner}>
          <Text style={styles.defaultsBannerText}>
            Your usual picks applied to {basket.items.filter((i) => !i.isLocked).length} items
          </Text>
        </View>
      )}

      {/* Quick presets */}
      <View style={styles.presetRow}>
        {PRESET_CONFIG.map((p) => (
          <Pressable
            key={p.key}
            onPress={() => {
              lightTap();
              applyPreset(p.key);
            }}
            style={[
              styles.presetButton,
              activePreset === p.key && styles.presetButtonActive,
            ]}
          >
            <Text style={styles.presetText}>
              {p.emoji} {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Budget slider */}
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>🟢</Text>
        <Slider
          style={{ flex: 1, height: 40 }}
          minimumValue={0}
          maximumValue={1}
          value={sliderPosition}
          onValueChange={(val: number) => setSlider(val)}
          minimumTrackTintColor={Colors.success}
          maximumTrackTintColor={Colors.primary}
          thumbTintColor={Colors.secondary}
        />
        <Text style={styles.sliderLabel}>🔴</Text>
      </View>

      <View style={styles.totalPreview}>
        <Text style={styles.totalPreviewText}>
          All 🟢 ${basket.totals.good.toFixed(2)}
        </Text>
        <Text style={[styles.totalPreviewText, { fontWeight: "700" }]}>
          Your mix ${basket.totals.current.toFixed(2)}
        </Text>
        <Text style={styles.totalPreviewText}>
          All 🔴 ${basket.totals.best.toFixed(2)}
        </Text>
      </View>

      {/* Ingredient list grouped by aisle */}
      <ScrollView style={styles.ingredientList} showsVerticalScrollIndicator={false}>
        {Object.entries(grouped).map(([section, items]) => (
          <View key={section} style={styles.aisleGroup}>
            <Text style={styles.aisleHeader}>{section}</Text>
            {items.map((item) => (
              <IngredientRow
                key={item.ingredient.id}
                item={item}
                onSelectTier={(tier) => selectTier(item.ingredient.id, tier)}
              />
            ))}
          </View>
        ))}
        {/* Bottom spacer for sticky footer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky basket footer */}
      <View style={styles.stickyFooter}>
        <Text style={styles.basketTotal}>
          Your mix: ${basket.totals.current.toFixed(2)}
        </Text>
        <View style={styles.ctaRow}>
          <Pressable
            onPress={() => {
              mediumTap();
              // Use the most common vendor as the store to route to, or "grocery store"
              const vendorOption = basket.items
                .flatMap((i) => i.options)
                .find((o) => o.sourceType === "vendor" && o.tier === "best");
              goToMaps(vendorOption?.source ?? "grocery store near me");
            }}
            style={[styles.cta, { flex: 1, backgroundColor: Colors.primary }]}
          >
            <Text style={styles.ctaText}>I'll Go</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              mediumTap();
              goToDelivery();
            }}
            style={[styles.cta, { flex: 1, backgroundColor: Colors.secondary }]}
          >
            <Text style={styles.ctaText}>Deliver It</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ── Ingredient Row ─────────────────────────────────────────────────

function IngredientRow({
  item,
  onSelectTier,
}: {
  item: TieredIngredient;
  onSelectTier: (tier: Tier) => void;
}) {
  const qty = item.ingredient.quantity
    ? `${item.ingredient.quantity}${item.ingredient.unit ? ` ${item.ingredient.unit}` : ""}`
    : "";

  return (
    <View style={styles.ingredientRow}>
      <View style={styles.ingredientHeader}>
        <Text style={styles.ingredientName}>
          {item.ingredient.name}
          {qty ? ` ${qty}` : ""}
        </Text>
        {item.isLocked && <Text style={styles.lockIcon}>🔒</Text>}
      </View>

      {item.options.map((option) => (
        <TierOptionRow
          key={option.tier}
          option={option}
          isSelected={item.selectedTier === option.tier}
          onSelect={() => onSelectTier(option.tier)}
        />
      ))}
    </View>
  );
}

// ── Tier Option Row ────────────────────────────────────────────────

function TierOptionRow({
  option,
  isSelected,
  onSelect,
}: {
  option: TierOption;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        lightTap();
        onSelect();
      }}
      style={[
        styles.tierRow,
        isSelected && {
          backgroundColor: `${TIER_COLORS[option.tier]}15`,
          borderColor: TIER_COLORS[option.tier],
          borderWidth: 1,
        },
      ]}
    >
      <View style={styles.tierDot}>
        <Text style={{ fontSize: 10 }}>{TIER_DOTS[option.tier]}</Text>
      </View>

      <Text style={[styles.tierPrice, isSelected && { fontWeight: "700" }]}>
        ${option.price.toFixed(2)}
      </Text>

      <Text
        style={[styles.tierSource, isSelected && { color: Colors.text.primary }]}
        numberOfLines={1}
      >
        {option.source}
      </Text>

      {option.rating && (
        <Text style={styles.tierRating}>
          ⭐{option.rating}
        </Text>
      )}

      {option.tags && option.tags.length > 0 && (
        <Text style={styles.tierTag}>
          ({option.tags[0]})
        </Text>
      )}
    </Pressable>
  );
}

// ── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  bigTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
  recipeTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.secondary,
    marginBottom: 12,
  },
  defaultsBanner: {
    backgroundColor: `${Colors.success}15`,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  defaultsBannerText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.success,
    textAlign: "center",
  },

  // Presets
  presetRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: Colors.divider,
    alignItems: "center",
  },
  presetButtonActive: {
    backgroundColor: `${Colors.primary}20`,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  presetText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text.primary,
  },

  // Slider
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sliderLabel: { fontSize: 16 },

  totalPreview: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  totalPreviewText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },

  // Ingredient list
  ingredientList: { flex: 1 },
  aisleGroup: { marginBottom: 16 },
  aisleHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 4,
  },

  // Ingredient row
  ingredientRow: {
    marginBottom: 12,
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 10,
  },
  ingredientHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
    flex: 1,
  },
  lockIcon: { fontSize: 12 },

  // Tier option row
  tierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "transparent",
    marginTop: 2,
  },
  tierDot: { width: 18 },
  tierPrice: {
    fontSize: 13,
    color: Colors.text.primary,
    width: 52,
  },
  tierSource: {
    fontSize: 13,
    color: Colors.text.secondary,
    flex: 1,
  },
  tierRating: {
    fontSize: 11,
    color: Colors.alert,
  },
  tierTag: {
    fontSize: 10,
    color: Colors.text.muted,
    fontStyle: "italic",
  },

  // Sticky footer
  stickyFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: Colors.background,
  },
  basketTotal: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text.primary,
    textAlign: "center",
    marginBottom: 10,
  },
  ctaRow: {
    flexDirection: "row",
    gap: 10,
  },
  cta: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  ctaText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelText: {
    fontSize: 14,
    color: Colors.text.muted,
    textAlign: "center",
  },
});

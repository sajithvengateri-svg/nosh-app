import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
  Modal,
} from "react-native";
import { Image } from "expo-image";
import {
  Martini,
  GlassWater,
  Droplets,
  Wine,
  X,
  Trash2,
} from "lucide-react-native";
import { Colors, Glass } from "../../constants/colors";
import { useBarStore, BarItem } from "../../lib/stores/barStore";
import { lightTap, mediumTap } from "../../lib/haptics";

const { width: SCREEN_W } = Dimensions.get("window");
const COLUMNS = 4;
const GAP = 12;
const BUBBLE_SIZE = (SCREEN_W - 40 - GAP * (COLUMNS - 1)) / COLUMNS;

const CATEGORY_ICON: Record<string, React.ComponentType<any>> = {
  gin: Martini,
  whiskey: GlassWater,
  rum: GlassWater,
  vodka: GlassWater,
  tequila: GlassWater,
  liqueur: GlassWater,
  mixer: GlassWater,
  bitters: Droplets,
  wine: Wine,
  other: Martini,
};

export function BarOverlay() {
  const { items, isLoading, fetchBar, removeItem } = useBarStore();
  const [selectedItem, setSelectedItem] = useState<BarItem | null>(null);

  useEffect(() => {
    fetchBar();
  }, [fetchBar]);

  const handleBubbleTap = useCallback((item: BarItem) => {
    lightTap();
    setSelectedItem(item);
  }, []);

  const handleRemove = useCallback(
    (id: string) => {
      mediumTap();
      removeItem(id);
      setSelectedItem(null);
    },
    [removeItem],
  );

  // Empty / loading state
  if (items.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={styles.emptyContainer}
        showsVerticalScrollIndicator={false}
      >
        <Martini size={48} color={Colors.text.secondary} strokeWidth={1} />
        <Text style={styles.emptyTitle}>
          {isLoading ? "Loading..." : "Stock your bar"}
        </Text>
        {!isLoading && (
          <Text style={styles.emptyNudge}>
            Press Prep Mi and snap a pic of your spirits.{"\n"}We'll do the rest.
          </Text>
        )}
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Count pill */}
      <Text style={styles.countLabel}>
        {items.length} spirit{items.length !== 1 ? "s" : ""}
      </Text>

      {/* Bubble grid */}
      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => {
          const Icon = CATEGORY_ICON[item.category] ?? Martini;
          const hasPhoto = !!item.photo_url;

          return (
            <Pressable
              key={item.id}
              onPress={() => handleBubbleTap(item)}
              style={styles.bubble}
            >
              {hasPhoto ? (
                <Image
                  source={{ uri: item.photo_url }}
                  style={styles.bubbleImage}
                  contentFit="cover"
                  transition={150}
                />
              ) : (
                <Icon
                  size={20}
                  color={Colors.text.secondary}
                  strokeWidth={1.5}
                />
              )}
              <Text style={styles.bubbleLabel} numberOfLines={1}>
                {item.spirit_name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Product detail modal */}
      <Modal
        visible={!!selectedItem}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSelectedItem(null)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            {selectedItem && (
              <ProductDetail
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
                onRemove={handleRemove}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ── Product Detail ───────────────────────────────────────────────

function ProductDetail({
  item,
  onClose,
  onRemove,
}: {
  item: BarItem;
  onClose: () => void;
  onRemove: (id: string) => void;
}) {
  const Icon = CATEGORY_ICON[item.category] ?? Martini;

  return (
    <View>
      {/* Close */}
      <Pressable onPress={onClose} style={styles.detailClose}>
        <X size={18} color={Colors.text.secondary} strokeWidth={1.5} />
      </Pressable>

      {/* Hero */}
      <View style={styles.detailHero}>
        {item.photo_url ? (
          <Image
            source={{ uri: item.photo_url }}
            style={styles.detailPhoto}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.detailIconWrap}>
            <Icon size={36} color={Colors.text.muted} strokeWidth={1.5} />
          </View>
        )}
      </View>

      {/* Info */}
      <Text style={styles.detailName}>{item.spirit_name}</Text>
      {item.brand && (
        <Text style={styles.detailMeta}>{item.brand}</Text>
      )}
      <Text style={styles.detailCategory}>
        {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
        {item.quantity_ml ? ` \u00B7 ${item.quantity_ml}ml` : ""}
      </Text>

      {/* Remove */}
      <Pressable
        onPress={() => onRemove(item.id)}
        style={styles.detailRemove}
      >
        <Trash2 size={14} color={Colors.primary} strokeWidth={1.5} />
        <Text style={styles.detailRemoveText}>Remove</Text>
      </Pressable>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Empty state
  emptyContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyNudge: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },

  // Count
  countLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.muted,
    marginBottom: 16,
  },

  // Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
    paddingBottom: 40,
  },

  // Bubble
  bubble: {
    width: BUBBLE_SIZE,
    alignItems: "center",
    gap: 6,
  },
  bubbleImage: {
    width: BUBBLE_SIZE - 8,
    height: BUBBLE_SIZE - 8,
    borderRadius: (BUBBLE_SIZE - 8) / 2,
    backgroundColor: Colors.divider,
  },
  bubbleLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.text.secondary,
    textAlign: "center",
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  modalCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 8,
  },

  // Detail
  detailClose: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  detailHero: {
    alignItems: "center",
    marginBottom: 16,
  },
  detailPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.divider,
  },
  detailIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.divider,
    justifyContent: "center",
    alignItems: "center",
  },
  detailName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.secondary,
    textAlign: "center",
    marginBottom: 4,
  },
  detailMeta: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    marginBottom: 2,
  },
  detailCategory: {
    fontSize: 13,
    color: Colors.text.muted,
    textAlign: "center",
    marginBottom: 20,
  },
  detailRemove: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  detailRemoveText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
});

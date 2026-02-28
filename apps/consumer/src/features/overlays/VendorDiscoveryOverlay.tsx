import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import {
  Store,
  Star,
  Heart,
  Beef,
  Fish,
  Milk,
  Salad,
  Apple,
  Package,
  Croissant,
  Flame,
} from "lucide-react-native";
import { Colors, Glass, Spacing, BorderRadius } from "../../constants/colors";
import { useVendorStore } from "../../lib/stores/vendorStore";
import { CATEGORY_META, type VendorCategory } from "../../data/seedVendors";
import { VendorDealsSection } from "../vendors/VendorDealsSection";
import { lightTap } from "../../lib/haptics";

const ALL_CATEGORIES = Object.keys(CATEGORY_META) as VendorCategory[];

const VENDOR_ICON_MAP: Record<string, React.ComponentType<any>> = {
  beef: Beef,
  fish: Fish,
  milk: Milk,
  salad: Salad,
  apple: Apple,
  package: Package,
  croissant: Croissant,
  flame: Flame,
};

export function VendorDiscoveryOverlay() {
  const vendors = useVendorStore((s) => s.vendors);
  const favouriteIds = useVendorStore((s) => s.favouriteIds);
  const selectedCategory = useVendorStore((s) => s.selectedCategory);
  const setCategory = useVendorStore((s) => s.setCategory);
  const toggleFavourite = useVendorStore((s) => s.toggleFavourite);
  const loadVendors = useVendorStore((s) => s.loadVendors);

  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);

  useEffect(() => {
    if (vendors.length === 0) loadVendors();
  }, [vendors.length, loadVendors]);

  const filteredVendors = selectedCategory
    ? vendors.filter((v) => v.category === selectedCategory)
    : vendors;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Active deals from vendors */}
      <VendorDealsSection />

      {/* Category pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillRow}
      >
        <Pressable
          onPress={() => { lightTap(); setCategory(null); }}
          style={[
            styles.pill,
            !selectedCategory && styles.pillActive,
          ]}
        >
          <Text
            style={[
              styles.pillText,
              !selectedCategory && styles.pillTextActive,
            ]}
          >
            All
          </Text>
        </Pressable>
        {ALL_CATEGORIES.map((cat) => {
          const meta = CATEGORY_META[cat];
          const isActive = selectedCategory === cat;
          return (
            <Pressable
              key={cat}
              onPress={() => { lightTap(); setCategory(isActive ? null : cat); }}
              style={[styles.pill, isActive && styles.pillActive]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                {(() => {
                  const CatIcon = VENDOR_ICON_MAP[meta.iconName] ?? Store;
                  return <CatIcon size={14} color={isActive ? Colors.primary : Colors.text.secondary} strokeWidth={1.5} />;
                })()}
                <Text
                  style={[styles.pillText, isActive && styles.pillTextActive]}
                >
                  {meta.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Vendor cards */}
      {filteredVendors.map((vendor) => {
        const isFav = favouriteIds.has(vendor.id);
        const isExpanded = expandedVendor === vendor.id;

        return (
          <View key={vendor.id} style={styles.vendorCard}>
            <Pressable
              onPress={() => {
                lightTap();
                setExpandedVendor(isExpanded ? null : vendor.id);
              }}
              style={styles.vendorHeader}
            >
              <View style={{ flex: 1 }}>
                <View style={styles.vendorTitleRow}>
                  {(() => {
                    const LogoIcon = VENDOR_ICON_MAP[vendor.logo_emoji] ?? Store;
                    return <LogoIcon size={20} color={Colors.text.muted} strokeWidth={1.5} />;
                  })()}
                  <Text style={styles.vendorName}>{vendor.name}</Text>
                </View>
                <Text style={styles.vendorTagline} numberOfLines={1}>
                  {vendor.tagline}
                </Text>
                <View style={styles.vendorMeta}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <Star size={13} color={Colors.primary} strokeWidth={1.5} fill={Colors.primary} />
                    <Text style={styles.vendorRating}>
                      {vendor.rating}
                    </Text>
                  </View>
                  <Text style={styles.vendorDot}>·</Text>
                  <Text style={styles.vendorLocation}>{vendor.location}</Text>
                  {vendor.min_order > 0 && (
                    <>
                      <Text style={styles.vendorDot}>·</Text>
                      <Text style={styles.vendorLocation}>
                        Min ${vendor.min_order}
                      </Text>
                    </>
                  )}
                </View>
              </View>
              <Pressable
                onPress={() => { lightTap(); toggleFavourite(vendor.id); }}
                hitSlop={12}
              >
                <Heart
                  size={22}
                  color={isFav ? Colors.primary : Colors.text.muted}
                  strokeWidth={1.5}
                  fill={isFav ? Colors.primary : "none"}
                />
              </Pressable>
            </Pressable>

            {/* Delivery note */}
            <Text style={styles.deliveryNote}>{vendor.delivery_note}</Text>

            {/* Expandable product list */}
            {isExpanded && (
              <View style={styles.productList}>
                {vendor.products
                  .filter((p) => p.in_stock)
                  .map((product) => (
                    <View key={product.id} style={styles.productRow}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          {product.popular && (
                            <Star size={12} color={Colors.primary} strokeWidth={1.5} fill={Colors.primary} />
                          )}
                          <Text style={styles.productName}>
                            {product.name}
                          </Text>
                        </View>
                        {product.tags.length > 0 && (
                          <Text style={styles.productTags}>
                            {product.tags.join(" · ")}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.productPrice}>
                        ${product.price.toFixed(2)}/{product.unit}
                      </Text>
                    </View>
                  ))}
              </View>
            )}

            <Pressable
              onPress={() => {
                lightTap();
                setExpandedVendor(isExpanded ? null : vendor.id);
              }}
              style={styles.expandToggle}
            >
              <Text style={styles.expandText}>
                {isExpanded
                  ? "Hide products"
                  : `View ${vendor.products.filter((p) => p.in_stock).length} products`}
              </Text>
            </Pressable>
          </View>
        );
      })}

      {filteredVendors.length === 0 && (
        <View style={styles.empty}>
          <View style={{ marginBottom: 0 }}>
            <Store size={48} color={Colors.text.muted} strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyText}>No vendors in this category yet</Text>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.md },
  pillRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingRight: Spacing.md,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Glass.surface,
    borderWidth: 1,
    borderColor: Glass.borderLight,
  },
  pillActive: { backgroundColor: Glass.surfaceHover, borderColor: Glass.borderLight },
  pillText: { fontSize: 13, fontWeight: "600", color: Colors.text.secondary },
  pillTextActive: { color: Colors.secondary },

  vendorCard: {
    backgroundColor: Glass.surface,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    marginBottom: Spacing.sm + 4,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    shadowColor: Glass.shadowLight.color,
    shadowOffset: Glass.shadowLight.offset,
    shadowRadius: Glass.shadowLight.radius,
    shadowOpacity: 1,
  },
  vendorHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  vendorTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  vendorEmoji: { fontSize: 22 },
  vendorName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.secondary,
  },
  vendorTagline: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontStyle: "italic",
    marginBottom: 6,
  },
  vendorMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  vendorRating: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },
  vendorDot: { fontSize: 12, color: Colors.text.muted },
  vendorLocation: { fontSize: 13, color: Colors.text.secondary },

  heart: { fontSize: 22, color: Colors.text.muted, marginLeft: 8 },
  heartActive: { color: Colors.primary },

  deliveryNote: {
    fontSize: 12,
    color: Colors.text.muted,
    marginTop: 6,
  },

  productList: {
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.sm,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.secondary,
  },
  productTags: {
    fontSize: 11,
    color: Colors.text.muted,
    marginTop: 2,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
    marginLeft: 12,
  },

  expandToggle: {
    marginTop: 8,
    alignSelf: "center",
  },
  expandText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },

  empty: { alignItems: "center", paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: Colors.text.secondary },
});

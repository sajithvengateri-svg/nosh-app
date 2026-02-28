import { useState, useMemo } from "react";
import { View, Text, ScrollView, Pressable, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "../../../contexts/ThemeProvider";
import { useVendorPostcodeDemand, useVendorCategoryDemand } from "../../../hooks/useVendorDemand";
import { AU_POSTCODES, DEMAND_CATEGORIES, CATEGORY_COLORS } from "@queitos/shared";
import { ScreenHeader } from "../../ui/ScreenHeader";
import { SkeletonCard } from "../../ui/Skeleton";
import { lightTap } from "../../../lib/haptics";

type Channel = "d2c" | "b2b";

export function VendorDemands() {
  const { colors } = useTheme();
  const router = useRouter();
  const { data: postcodeData, isLoading, refetch } = useVendorPostcodeDemand();
  const { data: categoryData } = useVendorCategoryDemand();
  const [channel, setChannel] = useState<Channel>("b2b");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const filteredPostcodes = useMemo(() => {
    if (!postcodeData) return [];
    if (!selectedCategory) return postcodeData;
    return postcodeData
      .map((p) => ({
        ...p,
        ingredients: p.ingredients.filter((i) => i.category === selectedCategory),
        total_quantity: p.ingredients
          .filter((i) => i.category === selectedCategory)
          .reduce((sum, i) => sum + i.quantity, 0),
      }))
      .filter((p) => p.ingredients.length > 0)
      .sort((a, b) => b.total_quantity - a.total_quantity);
  }, [postcodeData, selectedCategory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <ScreenHeader title="Demands" showBack={false} />

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
          {(["b2b", "d2c"] as const).map((ch) => (
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
                {ch === "b2b" ? "B2B Hospitality" : "D2C Consumer"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Category filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 12 }}
      >
        <Pressable
          onPress={() => { lightTap(); setSelectedCategory(null); }}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 9999,
            backgroundColor: !selectedCategory ? colors.accent : colors.surface,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: !selectedCategory ? "#FFF" : colors.textSecondary,
            }}
          >
            All
          </Text>
        </Pressable>
        {DEMAND_CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => { lightTap(); setSelectedCategory(cat === selectedCategory ? null : cat); }}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 9999,
              backgroundColor: cat === selectedCategory ? colors.accent : colors.surface,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: cat === selectedCategory ? "#FFF" : colors.textSecondary,
              }}
            >
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={filteredPostcodes}
          keyExtractor={(item) => item.postcode}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 40 }}>
              <Text style={{ fontSize: 15, color: colors.textMuted }}>No demand data yet</Text>
            </View>
          }
          renderItem={({ item }) => {
            const geo = AU_POSTCODES[item.postcode];
            const suburb = geo?.name ?? item.postcode;
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
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
                      {suburb}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                      {item.postcode} — {item.order_count} orders
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: colors.accentBg,
                      borderRadius: 9999,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      alignSelf: "flex-start",
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.accent }}>
                      {item.total_quantity.toFixed(0)} kg
                    </Text>
                  </View>
                </View>

                {/* Top ingredients */}
                {item.ingredients.slice(0, 5).map((ing, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingVertical: 6,
                      borderTopWidth: idx === 0 ? 1 : 0,
                      borderTopColor: colors.border,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: CATEGORY_COLORS[ing.category] ?? colors.accent,
                        }}
                      />
                      <Text style={{ fontSize: 14, color: colors.text }}>{ing.name}</Text>
                    </View>
                    <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                      {ing.quantity.toFixed(1)} {ing.unit}
                      {ing.avg_price ? ` — $${ing.avg_price.toFixed(2)}` : ""}
                    </Text>
                  </View>
                ))}

                {item.ingredients.length > 5 && (
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 6 }}>
                    +{item.ingredients.length - 5} more ingredients
                  </Text>
                )}

                {/* Push deal button */}
                <Pressable
                  onPress={() => {
                    lightTap();
                    router.push("/(app)/(tabs)/deals");
                  }}
                  style={({ pressed }) => ({
                    marginTop: 12,
                    backgroundColor: colors.accent,
                    borderRadius: 12,
                    paddingVertical: 10,
                    alignItems: "center",
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFF" }}>
                    Push Deal for this Area
                  </Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

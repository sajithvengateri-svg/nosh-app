import { useState, useMemo } from "react";
import { View, Text, FlatList, Pressable, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { useOrg } from "../../../contexts/OrgProvider";
import { Badge } from "../../../components/ui/Badge";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SkeletonCard } from "../../../components/ui/Skeleton";
import { Shield } from "lucide-react-native";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { useTheme } from "../../../contexts/ThemeProvider";

const ALL_ALLERGENS = [
  "peanut", "tree_nuts", "milk", "eggs", "fish", "shellfish", "sesame",
  "soy", "wheat", "celery", "mustard", "sulphites", "lupin", "molluscs",
];

interface MenuItem {
  id: string;
  name: string;
  category: string | null;
  sell_price: number | null;
  allergens: string[] | null;
}

export default function Allergens() {
  const router = useRouter();
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [selected, setSelected] = useState<string[]>([]);

  const { data: items, isLoading, refetch, isRefetching } = useQuery<MenuItem[]>({
    queryKey: ["menu-items-allergens", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, category, sell_price, allergens");
      if (error) throw error;
      return (data as MenuItem[]) || [];
    },
    enabled: !!orgId,
  });

  const toggleAllergen = (a: string) => {
    setSelected((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  const { contains, safe } = useMemo(() => {
    if (!items) return { contains: [], safe: [] };
    if (selected.length === 0) return { contains: items, safe: [] };

    const c: MenuItem[] = [];
    const s: MenuItem[] = [];
    items.forEach((item) => {
      const hasAllergen = selected.some((a) => item.allergens?.includes(a));
      if (hasAllergen) c.push(item);
      else s.push(item);
    });
    return { contains: c, safe: s };
  }, [items, selected]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Allergens" />

      {/* Allergen chips */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 16, paddingBottom: 12 }}>
        {ALL_ALLERGENS.map((a) => {
          const active = selected.includes(a);
          return (
            <Pressable
              key={a}
              onPress={() => toggleAllergen(a)}
              style={{
                paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
                backgroundColor: active ? colors.destructiveBg : colors.surface,
                borderWidth: 1, borderColor: active ? colors.destructive : colors.border,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: active ? colors.destructive : colors.textSecondary }}>
                {a.replace("_", " ")}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View style={{ padding: 16, gap: 10 }}><SkeletonCard /><SkeletonCard /></View>
      ) : (
        <FlatList
          data={[
            ...(selected.length > 0 && safe.length > 0
              ? [{ type: "header" as const, label: `Safe Dishes (${safe.length})` }]
              : []),
            ...safe.map((item) => ({ type: "item" as const, ...item })),
            ...(selected.length > 0 && contains.length > 0
              ? [{ type: "header" as const, label: `Contains Selected Allergens (${contains.length})` }]
              : []),
            ...contains.map((item) => ({ type: "item" as const, ...item })),
          ]}
          keyExtractor={(item, index) => item.type === "header" ? `h-${index}` : (item as any).id}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={<EmptyState icon={<Shield size={32} color={colors.textMuted} />} title="No menu items" description="Add menu items to track allergens" />}
          renderItem={({ item }) => {
            if (item.type === "header") {
              return (
                <View style={{ backgroundColor: colors.surface, paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary }}>{item.label}</Text>
                </View>
              );
            }
            const mi = item as MenuItem & { type: "item" };
            return (
              <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{mi.name}</Text>
                  <View style={{ flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                    {mi.allergens?.map((a) => (
                      <Badge key={a} variant={selected.includes(a) ? "destructive" : "secondary"}>
                        {a.replace("_", " ")}
                      </Badge>
                    ))}
                  </View>
                </View>
                {mi.sell_price != null && (
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary }}>${mi.sell_price.toFixed(2)}</Text>
                )}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

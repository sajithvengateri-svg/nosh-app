import { useState, useMemo } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Store } from "lucide-react-native";
import { supabase } from "../../../lib/supabase";
import { useOrg } from "../../../contexts/OrgProvider";
import { useTheme } from "../../../contexts/ThemeProvider";
import { Input } from "../../../components/ui/Input";
import { Badge } from "../../../components/ui/Badge";
import { TabBar } from "../../../components/ui/Tabs";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SkeletonCard } from "../../../components/ui/Skeleton";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";

interface VendorDeal {
  id: string;
  title: string;
  description: string | null;
  discount_percent: number | null;
  discount_amount: number | null;
  min_order_value: number | null;
  start_date: string;
  end_date: string;
  business_name: string;
  applicable_categories: string[] | null;
}

const CATEGORIES = ["All", "Produce", "Meat", "Seafood", "Dairy", "Dry Goods", "Beverages", "Equipment"];

export default function Marketplace() {
  const router = useRouter();
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [tab, setTab] = useState("deals");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { data: deals, isLoading: dealsLoading, refetch, isRefetching } = useQuery<VendorDeal[]>({
    queryKey: ["vendor-deals", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_deals")
        .select("*, vendor_profiles(business_name)")
        .gte("end_date", new Date().toISOString().split("T")[0])
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        business_name: d.vendor_profiles?.business_name || "Unknown Vendor",
      }));
    },
  });

  const { data: suppliers, isLoading: suppliersLoading } = useQuery<any[]>({
    queryKey: ["marketplace-suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_profiles")
        .select("*")
        .eq("is_verified", true)
        .order("business_name");
      if (error) throw error;
      return data || [];
    },
  });

  const filteredDeals = useMemo(() => {
    if (!deals) return [];
    let filtered = deals;
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((d) => d.title.toLowerCase().includes(q) || d.business_name.toLowerCase().includes(q));
    }
    if (selectedCategory !== "All") {
      filtered = filtered.filter((d) => d.applicable_categories?.includes(selectedCategory));
    }
    return filtered;
  }, [deals, search, selectedCategory]);

  const filteredSuppliers = useMemo(() => {
    if (!suppliers) return [];
    if (!search.trim()) return suppliers;
    const q = search.toLowerCase();
    return suppliers.filter((s) => s.business_name?.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q));
  }, [suppliers, search]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Marketplace" />

      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <Input placeholder="Search vendors & deals..." value={search} onChangeText={setSearch} containerStyle={{ marginBottom: 8 }} />
      </View>

      <TabBar
        tabs={[{ key: "deals", label: "Deals" }, { key: "suppliers", label: "Suppliers" }]}
        activeTab={tab} onTabChange={setTab} style={{ marginHorizontal: 16, marginBottom: 8 }}
      />

      {tab === "deals" && (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
          {/* Category chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12, marginHorizontal: -16, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: selectedCategory === cat ? colors.accent : colors.surface }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: selectedCategory === cat ? "#FFFFFF" : colors.textSecondary }}>{cat}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {dealsLoading ? (
            <View style={{ gap: 10 }}><SkeletonCard /><SkeletonCard /></View>
          ) : filteredDeals.length === 0 ? (
            <EmptyState icon={<Store size={32} color={colors.textMuted} />} title="No deals available" description="Check back soon for vendor deals and promotions" />
          ) : (
            filteredDeals.map((deal) => (
              <View key={deal.id} style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 12, gap: 8 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>{deal.title}</Text>
                    <Text style={{ fontSize: 13, color: colors.accent, fontWeight: "600", marginTop: 2 }}>{deal.business_name}</Text>
                  </View>
                  {deal.discount_percent && (
                    <View style={{ backgroundColor: colors.successBg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ fontSize: 14, fontWeight: "800", color: colors.success }}>{deal.discount_percent}% OFF</Text>
                    </View>
                  )}
                  {!deal.discount_percent && deal.discount_amount && (
                    <View style={{ backgroundColor: colors.successBg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ fontSize: 14, fontWeight: "800", color: colors.success }}>${deal.discount_amount} OFF</Text>
                    </View>
                  )}
                </View>
                {deal.description && <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>{deal.description}</Text>}
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                  {deal.min_order_value && <Badge variant="secondary">Min ${deal.min_order_value}</Badge>}
                  <Badge variant="secondary">Ends {deal.end_date}</Badge>
                  {deal.applicable_categories?.map((c) => <Badge key={c} variant="secondary">{c}</Badge>)}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {tab === "suppliers" && (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {suppliersLoading ? (
            <View style={{ gap: 10 }}><SkeletonCard /><SkeletonCard /></View>
          ) : filteredSuppliers.length === 0 ? (
            <EmptyState icon={<Store size={32} color={colors.textMuted} />} title="No verified suppliers" description="Suppliers will appear here once verified" />
          ) : (
            filteredSuppliers.map((s) => (
              <View key={s.id} style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 12, gap: 6 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>{s.business_name}</Text>
                  {s.is_verified && <Badge variant="success">Verified</Badge>}
                </View>
                {s.category && <Text style={{ fontSize: 13, color: colors.accent, fontWeight: "600" }}>{s.category}</Text>}
                {s.description && <Text style={{ fontSize: 14, color: colors.textSecondary }}>{s.description}</Text>}
                {s.delivery_areas && <Text style={{ fontSize: 12, color: colors.textMuted }}>Delivery: {s.delivery_areas}</Text>}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

import { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ClipboardList } from "lucide-react-native";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { useOrg } from "../../../contexts/OrgProvider";
import { useTheme } from "../../../contexts/ThemeProvider";
import { TabBar } from "../../../components/ui/Tabs";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SkeletonCard } from "../../../components/ui/Skeleton";

interface Cheatsheet {
  id: string;
  title: string;
  category: string;
  content: string;
  image_url: string | null;
  org_id: string | null;
}

interface ParsedContent {
  temp?: string;
  time?: string;
  notes?: string;
}

function parseContent(raw: string): ParsedContent {
  try {
    return JSON.parse(raw);
  } catch {
    return { notes: raw };
  }
}

export default function Cheatsheets() {
  const router = useRouter();
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [tab, setTab] = useState("Sous Vide");

  const { data: sheets, isLoading, refetch, isRefetching } = useQuery<Cheatsheet[]>({
    queryKey: ["cheatsheets", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("cheatsheets")
        .select("*")
        .eq("org_id", orgId)
        .order("category")
        .order("title");
      if (error) throw error;
      return (data as Cheatsheet[]) || [];
    },
    enabled: !!orgId,
  });

  const categories = useMemo(() => {
    if (!sheets) return [];
    const cats = [...new Set(sheets.map((s) => s.category))];
    return cats.map((c) => ({ key: c, label: c }));
  }, [sheets]);

  const filtered = useMemo(() => {
    if (!sheets) return [];
    return sheets.filter((s) => s.category === tab);
  }, [sheets, tab]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Cheatsheets" />

      {categories.length > 0 && (
        <TabBar
          tabs={categories}
          activeTab={tab}
          onTabChange={setTab}
          accentColor={colors.accent}
          style={{ marginHorizontal: 16, marginBottom: 12 }}
        />
      )}

      {isLoading ? (
        <View style={{ padding: 16, gap: 10 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={32} color={colors.textMuted} />}
          title="No cheatsheets yet"
          description="Cheatsheets will appear here once seeded from your kitchen settings"
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          renderItem={({ item }) => {
            const parsed = parseContent(item.content);
            return (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 8 }}>
                  {item.title}
                </Text>
                <View style={{ flexDirection: "row", gap: 16 }}>
                  {parsed.temp && (
                    <View>
                      <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: "600" }}>TEMP</Text>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                        {parsed.temp}
                      </Text>
                    </View>
                  )}
                  {parsed.time && (
                    <View>
                      <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: "600" }}>TIME</Text>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                        {parsed.time}
                      </Text>
                    </View>
                  )}
                </View>
                {parsed.notes && (
                  <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 8 }}>
                    {parsed.notes}
                  </Text>
                )}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

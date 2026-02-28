import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "../../../contexts/ThemeProvider";
import { useOrg } from "../../../contexts/OrgProvider";
import { supabase } from "../../../lib/supabase";
import { ArrowLeft, Trophy, Medal, Crown } from "lucide-react-native";

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  best_score: number;
  grade: string;
  game_count: number;
}

type Scope = "kitchen" | "national";
type GameFilter = "edge" | "onion_blitz" | "alley_cat";

export default function Leaderboard() {
  const router = useRouter();
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const [scope, setScope] = useState<Scope>("kitchen");
  const [game, setGame] = useState<GameFilter>("edge");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [scope, game, currentOrg?.id]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("game_scores" as any)
        .select("user_id, score, grade")
        .eq("game_key", game)
        .order("score", { ascending: false })
        .limit(50);

      if (scope === "kitchen" && currentOrg?.id) {
        query = query.eq("org_id", currentOrg.id);
      }

      const { data } = await query;
      if (!data) { setEntries([]); setLoading(false); return; }

      // Group by user, take best score
      const userMap = new Map<string, LeaderboardEntry>();
      for (const row of data as any[]) {
        const existing = userMap.get(row.user_id);
        if (!existing || row.score > existing.best_score) {
          userMap.set(row.user_id, {
            user_id: row.user_id,
            display_name: row.user_id.slice(0, 8),
            best_score: row.score,
            grade: row.grade || "-",
            game_count: (existing?.game_count ?? 0) + 1,
          });
        } else {
          existing.game_count++;
        }
      }

      // Fetch display names
      const userIds = [...userMap.keys()];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("game_profiles" as any)
          .select("user_id, display_name")
          .in("user_id", userIds);

        if (profiles) {
          for (const p of profiles as any[]) {
            const entry = userMap.get(p.user_id);
            if (entry && p.display_name) entry.display_name = p.display_name;
          }
        }
      }

      setEntries([...userMap.values()].sort((a, b) => b.best_score - a.best_score));
    } catch {
      setEntries([]);
    }
    setLoading(false);
  };

  const rankIcon = (index: number) => {
    if (index === 0) return <Crown size={18} color="#f59e0b" strokeWidth={2.5} />;
    if (index === 1) return <Medal size={18} color="#94a3b8" strokeWidth={2} />;
    if (index === 2) return <Medal size={18} color="#b45309" strokeWidth={2} />;
    return <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textMuted, width: 18, textAlign: "center" }}>{index + 1}</Text>;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </Pressable>
        <Trophy size={22} color={colors.accent} strokeWidth={2} />
        <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>Leaderboard</Text>
      </View>

      {/* Scope tabs */}
      <View style={{ flexDirection: "row", marginHorizontal: 16, marginBottom: 8, backgroundColor: colors.surface, borderRadius: 10, padding: 3 }}>
        {(["kitchen", "national"] as Scope[]).map((s) => (
          <Pressable
            key={s}
            onPress={() => setScope(s)}
            style={{
              flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 8,
              backgroundColor: scope === s ? colors.card : "transparent",
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: scope === s ? "700" : "500", color: scope === s ? colors.text : colors.textMuted }}>
              {s === "kitchen" ? "Your Kitchen" : "National"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Game filter */}
      <View style={{ flexDirection: "row", marginHorizontal: 16, marginBottom: 12, gap: 8 }}>
        {([
          { key: "edge" as GameFilter, label: "15° Edge", color: "#059669" },
          { key: "onion_blitz" as GameFilter, label: "Onion Blitz", color: "#ec4899" },
          { key: "alley_cat" as GameFilter, label: "Alley Cat", color: "#8b5cf6" },
        ]).map((g) => (
          <Pressable
            key={g.key}
            onPress={() => setGame(g.key)}
            style={{
              paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8,
              backgroundColor: game === g.key ? `${g.color}20` : colors.surface,
              borderWidth: 1, borderColor: game === g.key ? g.color : colors.border,
            }}
          >
            <Text style={{
              fontSize: 12, fontWeight: "600",
              color: game === g.key ? g.color : colors.textMuted,
            }}>
              {g.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* List */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />
        ) : entries.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Trophy size={40} color={colors.textMuted} strokeWidth={1} />
            <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 12 }}>No scores yet. Be the first!</Text>
          </View>
        ) : (
          entries.map((entry, i) => (
            <View key={entry.user_id} style={{
              flexDirection: "row", alignItems: "center", gap: 12,
              paddingVertical: 12, paddingHorizontal: 14,
              backgroundColor: i < 3 ? colors.surface : colors.card,
              borderRadius: 12, marginBottom: 8,
              borderWidth: i < 3 ? 1 : 0, borderColor: i === 0 ? "#f59e0b40" : i === 1 ? "#94a3b840" : i === 2 ? "#b4530940" : "transparent",
            }}>
              <View style={{ width: 28, alignItems: "center" }}>{rankIcon(i)}</View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{entry.display_name}</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>{entry.game_count} games played</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text }}>{entry.best_score}</Text>
                <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textMuted }}>{entry.grade}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

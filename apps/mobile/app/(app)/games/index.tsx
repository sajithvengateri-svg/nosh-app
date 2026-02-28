import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import { useTheme } from "../../../contexts/ThemeProvider";
import { useGameUnlock } from "../../../hooks/useGameUnlock";
import { useGameProfile } from "../../../hooks/useGameProfile";
import { useGameHaptics } from "../../../hooks/useGameHaptics";
import { getLevel, getLevelProgress, getNextLevel } from "../../../lib/games/levels";
import {
  Gamepad2, Flame, Lock, ChevronRight, Trophy, User,
  Zap, Shield, ClipboardList, Trash2, CheckCircle, Scissors, Cat,
} from "lucide-react-native";

export default function GameHub() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isUnlocked, progress, refresh } = useGameUnlock();
  const { profile } = useGameProfile();
  const haptics = useGameHaptics();
  const [refreshing, setRefreshing] = useState(false);

  const level = getLevel(profile.xp_total);
  const levelProgress = getLevelProgress(profile.xp_total);
  const nextLevel = getNextLevel(profile.xp_total);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    refresh();
    setTimeout(() => setRefreshing(false), 1000);
  }, [refresh]);

  const gateItems = [
    { key: "temps", label: "Temps Logged", icon: Shield, done: progress.temps },
    { key: "prep", label: "Prep Done", icon: ClipboardList, done: progress.prep },
    { key: "wastage", label: "Wastage Checked", icon: Trash2, done: progress.wastage },
  ];
  const doneCount = gateItems.filter((g) => g.done).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Gamepad2 size={28} color={colors.accent} strokeWidth={2} />
            <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text }}>Mastery Suite</Text>
          </View>
          <Pressable onPress={() => { haptics.tap(); router.push("/(app)/games/profile" as any); }}>
            <User size={22} color={colors.textMuted} strokeWidth={2} />
          </Pressable>
        </View>

        {/* Streak + League Row */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
          <View style={{
            flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
            backgroundColor: profile.current_streak >= 7 ? "#f59e0b20" : colors.surface,
            borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border,
          }}>
            <Flame size={20} color={profile.current_streak >= 7 ? "#f59e0b" : colors.textMuted} strokeWidth={2} />
            <View>
              <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text }}>{profile.current_streak}</Text>
              <Text style={{ fontSize: 10, color: colors.textMuted }}>Day Streak</Text>
            </View>
          </View>
          <View style={{
            flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
            backgroundColor: profile.league === "pro" ? "#a855f720" : colors.surface,
            borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border,
          }}>
            <Trophy size={20} color={profile.league === "pro" ? "#a855f7" : colors.textMuted} strokeWidth={2} />
            <View>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                {profile.league === "pro" ? "Pro League" : "Scullery"}
              </Text>
              <Text style={{ fontSize: 10, color: colors.textMuted }}>
                {profile.league === "pro" ? "Competitive" : "7-day streak to qualify"}
              </Text>
            </View>
          </View>
        </View>

        {/* XP Bar */}
        <View style={{
          backgroundColor: colors.surface, borderRadius: 12, padding: 14,
          borderWidth: 1, borderColor: colors.border, marginBottom: 20,
        }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Zap size={14} color={level.color} strokeWidth={2.5} />
              <Text style={{ fontSize: 13, fontWeight: "700", color: level.color }}>{level.title}</Text>
            </View>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>{profile.xp_total} XP</Text>
          </View>
          <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: "hidden" }}>
            <View style={{ height: 6, backgroundColor: level.color, borderRadius: 3, width: `${Math.round(levelProgress * 100)}%` as any }} />
          </View>
          {nextLevel && (
            <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 4 }}>
              {nextLevel.minXP - profile.xp_total} XP to {nextLevel.title}
            </Text>
          )}
        </View>

        {/* Compliance Gate */}
        <View style={{
          backgroundColor: isUnlocked ? "#05966910" : colors.surface,
          borderRadius: 16, padding: 16, marginBottom: 20,
          borderWidth: 2, borderColor: isUnlocked ? "#059669" : colors.border,
        }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: isUnlocked ? "#059669" : colors.text, marginBottom: 12 }}>
            {isUnlocked ? "GAMES UNLOCKED" : "DAILY COMPLIANCE"}
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {gateItems.map((item) => (
              <View key={item.key} style={{
                flex: 1, alignItems: "center", padding: 10, borderRadius: 10,
                backgroundColor: item.done ? "#05966915" : colors.background,
                borderWidth: 1, borderColor: item.done ? "#059669" : colors.border,
              }}>
                {item.done ? (
                  <CheckCircle size={20} color="#059669" strokeWidth={2.5} />
                ) : (
                  <item.icon size={20} color={colors.textMuted} strokeWidth={1.5} />
                )}
                <Text style={{ fontSize: 9, fontWeight: "600", color: item.done ? "#059669" : colors.textMuted, marginTop: 4, textAlign: "center" }}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
          {!isUnlocked && (
            <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2, marginTop: 12, overflow: "hidden" }}>
              <View style={{ height: 4, backgroundColor: "#059669", borderRadius: 2, width: `${Math.round((doneCount / 3) * 100)}%` as any }} />
            </View>
          )}
        </View>

        {/* Game Cards */}
        <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
          Games
        </Text>

        {/* Pink Onion Blitz */}
        <Pressable
          onPress={() => {
            if (!isUnlocked) return;
            haptics.tap();
            router.push("/(app)/games/onion" as any);
          }}
          style={({ pressed }) => ({
            flexDirection: "row", alignItems: "center", gap: 14,
            backgroundColor: pressed ? colors.surface : colors.card,
            borderRadius: 16, padding: 16, marginBottom: 12,
            borderWidth: 2, borderColor: isUnlocked ? "#ec4899" : colors.border,
            opacity: isUnlocked ? (pressed ? 0.9 : 1) : 0.5,
          })}
        >
          <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "#ec489920", alignItems: "center", justifyContent: "center" }}>
            {isUnlocked ? <Scissors size={24} color="#ec4899" strokeWidth={2} /> : <Lock size={24} color={colors.textMuted} strokeWidth={2} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>Pink Onion Blitz</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>45s frenzy — cut the pink, avoid the red!</Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} strokeWidth={2} />
        </Pressable>

        {/* The Alley Cat */}
        <Pressable
          onPress={() => {
            if (!isUnlocked) return;
            haptics.tap();
            router.push("/(app)/games/alleycat" as any);
          }}
          style={({ pressed }) => ({
            flexDirection: "row", alignItems: "center", gap: 14,
            backgroundColor: pressed ? colors.surface : colors.card,
            borderRadius: 16, padding: 16, marginBottom: 12,
            borderWidth: 2, borderColor: isUnlocked ? "#8b5cf6" : colors.border,
            opacity: isUnlocked ? (pressed ? 0.9 : 1) : 0.5,
          })}
        >
          <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "#8b5cf620", alignItems: "center", justifyContent: "center" }}>
            {isUnlocked ? <Cat size={24} color="#8b5cf6" strokeWidth={2} /> : <Lock size={24} color={colors.textMuted} strokeWidth={2} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>The Alley Cat</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>40s zen — calm a stray alley cat</Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} strokeWidth={2} />
        </Pressable>

        {/* Leaderboard */}
        <Pressable
          onPress={() => { haptics.selection(); router.push("/(app)/games/leaderboard" as any); }}
          style={({ pressed }) => ({
            flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
            backgroundColor: pressed ? colors.surface : colors.card,
            borderRadius: 12, padding: 14, marginTop: 8,
            borderWidth: 1, borderColor: colors.border,
          })}
        >
          <Trophy size={18} color={colors.accent} strokeWidth={2} />
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.accent }}>View Leaderboard</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

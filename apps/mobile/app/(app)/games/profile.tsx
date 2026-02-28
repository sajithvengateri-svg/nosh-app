import { View, Text, ScrollView, Pressable, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "../../../contexts/ThemeProvider";
import { useGameProfile } from "../../../hooks/useGameProfile";
import { getLevel, getLevelProgress, getNextLevel, LEVELS } from "../../../lib/games/levels";
import { ACHIEVEMENTS, getAchievement } from "../../../lib/games/achievements";
import { ArrowLeft, Flame, Trophy, Zap, Award } from "lucide-react-native";

export default function GameProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile, earnedAchievements } = useGameProfile();

  const level = getLevel(profile.xp_total);
  const levelIndex = LEVELS.indexOf(level);
  const levelProgress = getLevelProgress(profile.xp_total);
  const nextLevel = getNextLevel(profile.xp_total);
  const initial = (profile.display_name || "C")[0].toUpperCase();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={22} color={colors.text} strokeWidth={2} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Avatar + Name */}
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 36, backgroundColor: level.color + "30",
            borderWidth: 3, borderColor: level.color,
            alignItems: "center", justifyContent: "center",
          }}>
            <Text style={{ fontSize: 28, fontWeight: "900", color: level.color }}>{initial}</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text, marginTop: 10 }}>
            {profile.display_name || "Chef"}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
            <Zap size={14} color={level.color} strokeWidth={2.5} />
            <Text style={{ fontSize: 14, fontWeight: "700", color: level.color }}>{level.title}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 14, alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
            <Zap size={18} color={colors.accent} strokeWidth={2} />
            <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text, marginTop: 4 }}>{profile.xp_total}</Text>
            <Text style={{ fontSize: 10, color: colors.textMuted }}>Total XP</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 14, alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
            <Flame size={18} color="#f59e0b" strokeWidth={2} />
            <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text, marginTop: 4 }}>{profile.current_streak}</Text>
            <Text style={{ fontSize: 10, color: colors.textMuted }}>Current Streak</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 14, alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
            <Trophy size={18} color="#a855f7" strokeWidth={2} />
            <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text, marginTop: 4 }}>{profile.longest_streak}</Text>
            <Text style={{ fontSize: 10, color: colors.textMuted }}>Best Streak</Text>
          </View>
        </View>

        {/* Level Progress */}
        <View style={{
          backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 20,
          borderWidth: 1, borderColor: colors.border,
        }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text, marginBottom: 10 }}>Level Progress</Text>
          {LEVELS.map((l, i) => {
            const isActive = i === levelIndex;
            const isPast = i < levelIndex;
            return (
              <View key={l.title} style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <View style={{
                  width: 24, height: 24, borderRadius: 12,
                  backgroundColor: isPast || isActive ? l.color : colors.border,
                  alignItems: "center", justifyContent: "center",
                }}>
                  {isPast ? (
                    <Text style={{ fontSize: 10, color: "#fff", fontWeight: "700" }}>✓</Text>
                  ) : isActive ? (
                    <Zap size={12} color="#fff" strokeWidth={3} />
                  ) : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: isActive ? "700" : "500", color: isActive ? l.color : isPast ? colors.text : colors.textMuted }}>
                    {l.title}
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>{l.minXP} XP</Text>
              </View>
            );
          })}

          {nextLevel && (
            <View style={{ marginTop: 8 }}>
              <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: "hidden" }}>
                <View style={{ height: 6, backgroundColor: level.color, borderRadius: 3, width: `${Math.round(levelProgress * 100)}%` as any }} />
              </View>
              <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 4 }}>
                {nextLevel.minXP - profile.xp_total} XP to {nextLevel.title}
              </Text>
            </View>
          )}
        </View>

        {/* Achievements */}
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text, marginBottom: 10 }}>
          Achievements ({earnedAchievements.length}/{ACHIEVEMENTS.length})
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {ACHIEVEMENTS.map((ach) => {
            const earned = earnedAchievements.includes(ach.key);
            return (
              <View key={ach.key} style={{
                width: (Dimensions.get("window").width - 56) / 3,
                backgroundColor: earned ? colors.surface : colors.background,
                borderRadius: 12, padding: 12, alignItems: "center",
                borderWidth: 1, borderColor: earned ? colors.accent : colors.border,
                opacity: earned ? 1 : 0.4,
              }}>
                <Text style={{ fontSize: 24 }}>{ach.icon}</Text>
                <Text style={{ fontSize: 10, fontWeight: "600", color: colors.text, textAlign: "center", marginTop: 4 }}>
                  {ach.title}
                </Text>
              </View>
            );
          })}
        </View>

        {/* League */}
        <View style={{
          backgroundColor: profile.league === "pro" ? "#a855f720" : colors.surface,
          borderRadius: 14, padding: 16, marginTop: 20,
          borderWidth: 1, borderColor: profile.league === "pro" ? "#a855f7" : colors.border,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Award size={20} color={profile.league === "pro" ? "#a855f7" : colors.textMuted} strokeWidth={2} />
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
              {profile.league === "pro" ? "Pro League" : "Scullery League"}
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
            {profile.league === "pro"
              ? "Your scores compete on the national leaderboard"
              : "Build a 7-day compliance streak to enter Pro League"}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


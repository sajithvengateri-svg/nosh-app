import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthProvider";
import { useOrg } from "../contexts/OrgProvider";
import { getLevel } from "../lib/games/levels";
import { getStreakAchievementKey, getLevelAchievementKey } from "../lib/games/achievements";

export interface GameProfile {
  xp_total: number;
  league: "scullery" | "pro";
  current_streak: number;
  longest_streak: number;
  level_title: string;
  display_name: string | null;
}

const DEFAULT_PROFILE: GameProfile = {
  xp_total: 0,
  league: "scullery",
  current_streak: 0,
  longest_streak: 0,
  level_title: "Scullery Hand",
  display_name: null,
};

export function useGameProfile() {
  const { user, profile: authProfile } = useAuth();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [gameProfile, setGameProfile] = useState<GameProfile>(DEFAULT_PROFILE);
  const [earnedAchievements, setEarnedAchievements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user?.id || !orgId) return;

    const { data } = await supabase
      .from("game_profiles" as any)
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setGameProfile(data as any);
    } else {
      // Create profile
      const name = authProfile?.full_name || user.email?.split("@")[0] || "Chef";
      await supabase.from("game_profiles" as any).insert({
        user_id: user.id,
        org_id: orgId,
        display_name: name,
        xp_total: 0,
        league: "scullery",
        current_streak: 0,
        longest_streak: 0,
        level_title: "Scullery Hand",
      } as any);
      setGameProfile({ ...DEFAULT_PROFILE, display_name: name });
    }

    // Fetch achievements
    const { data: achData } = await supabase
      .from("game_achievements" as any)
      .select("achievement_key")
      .eq("user_id", user.id);

    if (achData) {
      setEarnedAchievements((achData as any[]).map((a) => a.achievement_key));
    }

    setLoading(false);
  }, [user?.id, orgId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const addXP = useCallback(async (amount: number) => {
    if (!user?.id) return;
    const newXP = gameProfile.xp_total + amount;
    const newLevel = getLevel(newXP);

    await supabase
      .from("game_profiles" as any)
      .update({ xp_total: newXP, level_title: newLevel.title, updated_at: new Date().toISOString() } as any)
      .eq("user_id", user.id);

    setGameProfile((prev) => ({ ...prev, xp_total: newXP, level_title: newLevel.title }));

    // Check level achievement
    const levelKey = getLevelAchievementKey(newXP);
    if (levelKey && !earnedAchievements.includes(levelKey)) {
      await supabase.from("game_achievements" as any).insert({
        user_id: user.id,
        org_id: orgId,
        achievement_key: levelKey,
      } as any);
      setEarnedAchievements((prev) => [...prev, levelKey]);
    }
  }, [user?.id, orgId, gameProfile.xp_total, earnedAchievements]);

  const incrementStreak = useCallback(async () => {
    if (!user?.id) return;
    const newStreak = gameProfile.current_streak + 1;
    const newLongest = Math.max(newStreak, gameProfile.longest_streak);
    const newLeague = newStreak >= 7 ? "pro" : gameProfile.league;

    await supabase
      .from("game_profiles" as any)
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        league: newLeague,
        last_compliance_date: new Date().toISOString().split("T")[0],
        updated_at: new Date().toISOString(),
      } as any)
      .eq("user_id", user.id);

    setGameProfile((prev) => ({
      ...prev,
      current_streak: newStreak,
      longest_streak: newLongest,
      league: newLeague as "scullery" | "pro",
    }));

    // Check streak + league achievements
    const streakKey = getStreakAchievementKey(newStreak);
    if (streakKey && !earnedAchievements.includes(streakKey)) {
      await supabase.from("game_achievements" as any).insert({
        user_id: user.id, org_id: orgId, achievement_key: streakKey,
      } as any);
      setEarnedAchievements((prev) => [...prev, streakKey]);
    }
    if (newLeague === "pro" && !earnedAchievements.includes("pro_league")) {
      await supabase.from("game_achievements" as any).insert({
        user_id: user.id, org_id: orgId, achievement_key: "pro_league",
      } as any);
      setEarnedAchievements((prev) => [...prev, "pro_league"]);
    }
  }, [user?.id, orgId, gameProfile, earnedAchievements]);

  const saveScore = useCallback(async (gameKey: string, score: number, grade: string, meta: Record<string, unknown> = {}) => {
    if (!user?.id || !orgId) return;
    await supabase.from("game_scores" as any).insert({
      user_id: user.id,
      org_id: orgId,
      game_key: gameKey,
      score,
      grade,
      meta,
      league: gameProfile.league,
      played_at: new Date().toISOString(),
    } as any);
  }, [user?.id, orgId, gameProfile.league]);

  return {
    profile: gameProfile,
    earnedAchievements,
    loading,
    addXP,
    incrementStreak,
    saveScore,
    refresh: fetchProfile,
  };
}

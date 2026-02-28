import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgId } from "@/hooks/useOrgId";
import { getLevelForXP } from "@/portals/games/data/levels";
import { getStreakAchievementKey, getLevelAchievementKey } from "@/portals/games/data/achievements";

export interface GameProfile {
  id: string;
  user_id: string;
  org_id: string;
  display_name: string | null;
  xp_total: number;
  league: "scullery" | "pro";
  current_streak: number;
  longest_streak: number;
  last_compliance_date: string | null;
  level_title: string;
}

interface UseGameProfileReturn {
  profile: GameProfile | null;
  isLoading: boolean;
  addXP: (amount: number) => Promise<void>;
  incrementStreak: () => Promise<void>;
  resetStreak: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Manages the user's game profile: XP, streak, league, level.
 * Auto-creates profile on first load.
 */
export function useGameProfile(): UseGameProfileReturn {
  const { user } = useAuth();
  const orgId = useOrgId();
  const [profile, setProfile] = useState<GameProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrCreate = useCallback(async () => {
    if (!user?.id || !orgId) {
      setIsLoading(false);
      return;
    }

    try {
      // Try to fetch existing profile
      const { data, error } = await supabase
        .from("game_profiles" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setProfile(data as any);
      } else {
        // Create new profile
        const newProfile = {
          user_id: user.id,
          org_id: orgId,
          display_name: user.email?.split("@")[0] || "Chef",
          xp_total: 0,
          league: "scullery",
          current_streak: 0,
          longest_streak: 0,
          level_title: "Scullery Hand",
        };

        const { data: created } = await supabase
          .from("game_profiles" as any)
          .insert(newProfile as any)
          .select()
          .single();

        if (created) setProfile(created as any);
      }
    } catch (error) {
      console.error("Error fetching game profile:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, orgId]);

  const addXP = useCallback(
    async (amount: number) => {
      if (!profile) return;

      const newXP = profile.xp_total + amount;
      const newLevel = getLevelForXP(newXP);
      const newLeague =
        profile.current_streak >= 7 ? "pro" : profile.league;

      await supabase
        .from("game_profiles" as any)
        .update({
          xp_total: newXP,
          level_title: newLevel.title,
          league: newLeague,
        } as any)
        .eq("id", profile.id);

      setProfile((p) =>
        p ? { ...p, xp_total: newXP, level_title: newLevel.title, league: newLeague as any } : null
      );

      // Check for level-up achievement
      const achievementKey = getLevelAchievementKey(newXP);
      if (achievementKey && orgId) {
        await supabase
          .from("game_achievements" as any)
          .upsert(
            {
              user_id: profile.user_id,
              org_id: orgId,
              achievement_key: achievementKey,
            } as any,
            { onConflict: "user_id,achievement_key" }
          );
      }
    },
    [profile, orgId]
  );

  const incrementStreak = useCallback(async () => {
    if (!profile || !orgId) return;

    const today = new Date().toISOString().slice(0, 10);
    const newStreak = profile.current_streak + 1;
    const newLongest = Math.max(newStreak, profile.longest_streak);
    const newLeague = newStreak >= 7 ? "pro" : profile.league;

    await supabase
      .from("game_profiles" as any)
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_compliance_date: today,
        league: newLeague,
      } as any)
      .eq("id", profile.id);

    setProfile((p) =>
      p
        ? {
            ...p,
            current_streak: newStreak,
            longest_streak: newLongest,
            last_compliance_date: today,
            league: newLeague as any,
          }
        : null
    );

    // Check for streak achievement
    const achievementKey = getStreakAchievementKey(newStreak);
    if (achievementKey) {
      await supabase
        .from("game_achievements" as any)
        .upsert(
          {
            user_id: profile.user_id,
            org_id: orgId,
            achievement_key: achievementKey,
          } as any,
          { onConflict: "user_id,achievement_key" }
        );
    }

    // Check for pro league achievement
    if (newStreak === 7) {
      await supabase
        .from("game_achievements" as any)
        .upsert(
          {
            user_id: profile.user_id,
            org_id: orgId,
            achievement_key: "pro_qualified",
          } as any,
          { onConflict: "user_id,achievement_key" }
        );
    }
  }, [profile, orgId]);

  const resetStreak = useCallback(async () => {
    if (!profile) return;

    await supabase
      .from("game_profiles" as any)
      .update({
        current_streak: 0,
        league: "scullery",
      } as any)
      .eq("id", profile.id);

    setProfile((p) =>
      p ? { ...p, current_streak: 0, league: "scullery" as const } : null
    );
  }, [profile]);

  useEffect(() => {
    fetchOrCreate();
  }, [fetchOrCreate]);

  return {
    profile,
    isLoading,
    addXP,
    incrementStreak,
    resetStreak,
    refresh: fetchOrCreate,
  };
}

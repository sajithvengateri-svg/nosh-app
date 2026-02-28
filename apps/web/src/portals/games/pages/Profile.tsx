import { useState, useEffect } from "react";
import { Flame, Trophy, Star, Medal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGameProfile } from "@/hooks/useGameProfile";
import { ACHIEVEMENTS } from "../data/achievements";
import { getLevelForXP, getLevelProgress, getNextLevelXP } from "../data/levels";
import StreakBadge from "../components/StreakBadge";
import LeagueBadge from "../components/LeagueBadge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function GameProfile() {
  const { user } = useAuth();
  const { profile, isLoading } = useGameProfile();
  const [earnedKeys, setEarnedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("game_achievements" as any)
      .select("achievement_key")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) {
          setEarnedKeys(new Set((data as any[]).map((d) => d.achievement_key)));
        }
      });
  }, [user?.id]);

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        Loading profile...
      </div>
    );
  }

  const level = getLevelForXP(profile.xp_total);
  const progress = getLevelProgress(profile.xp_total);
  const nextXP = getNextLevelXP(profile.xp_total);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Profile header */}
      <div className="text-center space-y-3">
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 text-3xl font-black"
          style={{ borderColor: level.color, color: level.color }}
        >
          {profile.display_name?.[0]?.toUpperCase() || "C"}
        </div>
        <div>
          <h1 className="text-xl font-black text-white">
            {profile.display_name || "Chef"}
          </h1>
          <p className="text-sm font-bold" style={{ color: level.color }}>
            {level.title}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <StreakBadge streak={profile.current_streak} />
          <LeagueBadge league={profile.league} />
        </div>
      </div>

      {/* XP bar */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
        <div className="flex justify-between text-xs text-zinc-400">
          <span className="font-bold" style={{ color: level.color }}>
            {level.title}
          </span>
          <span>
            {profile.xp_total} / {nextXP ?? "MAX"} XP
          </span>
        </div>
        <Progress value={progress} className="h-2.5 bg-zinc-800" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          icon={<Flame className="w-4 h-4 text-orange-400" />}
          label="Current Streak"
          value={`${profile.current_streak}d`}
        />
        <StatCard
          icon={<Trophy className="w-4 h-4 text-amber-400" />}
          label="Longest Streak"
          value={`${profile.longest_streak}d`}
        />
        <StatCard
          icon={<Star className="w-4 h-4 text-emerald-400" />}
          label="Total XP"
          value={profile.xp_total.toLocaleString()}
        />
      </div>

      {/* Achievements */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
          Badges & Achievements
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {ACHIEVEMENTS.map((a) => {
            const earned = earnedKeys.has(a.key);
            return (
              <div
                key={a.key}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl p-3 border text-center transition-all",
                  earned
                    ? "border-zinc-700 bg-zinc-800/80"
                    : "border-zinc-800/50 bg-zinc-900/30 opacity-40"
                )}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: earned ? a.color + "20" : undefined,
                    color: earned ? a.color : "#52525b",
                  }}
                >
                  <Medal className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-medium text-zinc-400 leading-tight">
                  {a.title}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-center space-y-1">
      <div className="flex justify-center">{icon}</div>
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[10px] text-zinc-500 uppercase">{label}</p>
    </div>
  );
}

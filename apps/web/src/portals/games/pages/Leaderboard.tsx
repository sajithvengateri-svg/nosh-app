import { useState, useEffect } from "react";
import { Trophy, Users, Globe, Flag } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/useOrgId";
import { useOrg } from "@/contexts/OrgContext";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  best_score: number;
  grade: string;
  game_count: number;
}

type Scope = "org" | "country" | "global";

export default function Leaderboard() {
  const orgId = useOrgId();
  const { currentOrg } = useOrg();
  const [scope, setScope] = useState<Scope>("org");
  const [gameFilter, setGameFilter] = useState<"gauntlet" | "edge">("gauntlet");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [scope, gameFilter, orgId]);

  async function fetchLeaderboard() {
    setIsLoading(true);
    try {
      // For MVP, we fetch top scores grouped by user
      // In production, this would be a Supabase view or edge function
      let query = supabase
        .from("game_scores" as any)
        .select("user_id, score, grade, org_id")
        .eq("game_key", gameFilter)
        .order("score", { ascending: false })
        .limit(50);

      if (scope === "org" && orgId) {
        query = query.eq("org_id", orgId);
      }
      // Country and global scopes fetch all — country filtering done client-side for now

      const { data, error } = await query;
      if (error) throw error;

      // Group by user, take best score
      const userBest = new Map<string, LeaderboardEntry>();
      for (const row of (data as any[]) || []) {
        const existing = userBest.get(row.user_id);
        if (!existing || row.score > existing.best_score) {
          userBest.set(row.user_id, {
            user_id: row.user_id,
            display_name: row.user_id.slice(0, 8), // placeholder
            best_score: row.score,
            grade: row.grade || "-",
            game_count: (existing?.game_count ?? 0) + 1,
          });
        } else {
          existing.game_count++;
        }
      }

      // Fetch display names from game_profiles
      const userIds = Array.from(userBest.keys());
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("game_profiles" as any)
          .select("user_id, display_name")
          .in("user_id", userIds);

        for (const p of (profiles as any[]) || []) {
          const entry = userBest.get(p.user_id);
          if (entry && p.display_name) {
            entry.display_name = p.display_name;
          }
        }
      }

      setEntries(
        Array.from(userBest.values()).sort((a, b) => b.best_score - a.best_score)
      );
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  const PODIUM_COLORS = ["text-amber-400", "text-zinc-300", "text-amber-600"];
  const PODIUM_LABELS = ["1st", "2nd", "3rd"];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <h1 className="text-xl font-black text-white flex items-center gap-2">
        <Trophy className="w-5 h-5 text-amber-400" /> Leaderboard
      </h1>

      {/* Scope tabs */}
      <Tabs value={scope} onValueChange={(v) => setScope(v as Scope)}>
        <TabsList className="grid grid-cols-3 bg-zinc-800">
          <TabsTrigger value="org" className="text-xs gap-1 data-[state=active]:bg-zinc-700">
            <Users className="w-3.5 h-3.5" /> Kitchen
          </TabsTrigger>
          <TabsTrigger value="country" className="text-xs gap-1 data-[state=active]:bg-zinc-700">
            <Flag className="w-3.5 h-3.5" /> Country
          </TabsTrigger>
          <TabsTrigger value="global" className="text-xs gap-1 data-[state=active]:bg-zinc-700">
            <Globe className="w-3.5 h-3.5" /> Olympics
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Game filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setGameFilter("gauntlet")}
          className={cn(
            "flex-1 rounded-lg py-2 text-xs font-semibold border transition-colors",
            gameFilter === "gauntlet"
              ? "border-red-500/40 bg-red-500/10 text-red-400"
              : "border-zinc-700 text-zinc-500 hover:text-zinc-300"
          )}
        >
          Gauntlet
        </button>
        <button
          onClick={() => setGameFilter("edge")}
          className={cn(
            "flex-1 rounded-lg py-2 text-xs font-semibold border transition-colors",
            gameFilter === "edge"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
              : "border-zinc-700 text-zinc-500 hover:text-zinc-300"
          )}
        >
          15° Edge
        </button>
      </div>

      {/* Rankings */}
      {isLoading ? (
        <div className="text-center py-12 text-zinc-500 text-sm">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 text-sm">
          No scores yet. Be the first to play!
        </div>
      ) : (
        <div className="space-y-1.5">
          {entries.map((entry, i) => (
            <div
              key={entry.user_id}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 border",
                i < 3
                  ? "bg-zinc-800/80 border-zinc-700"
                  : "bg-zinc-900/50 border-zinc-800/50"
              )}
            >
              {/* Rank */}
              <div
                className={cn(
                  "w-8 text-center font-black text-lg",
                  i < 3 ? PODIUM_COLORS[i] : "text-zinc-600"
                )}
              >
                {i < 3 ? PODIUM_LABELS[i] : i + 1}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {entry.display_name}
                </p>
                <p className="text-[10px] text-zinc-500">
                  {entry.game_count} game{entry.game_count !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Score & Grade */}
              <div className="text-right">
                <p className="text-sm font-bold text-white">{entry.best_score}</p>
                <p className="text-[10px] text-zinc-400">{entry.grade}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

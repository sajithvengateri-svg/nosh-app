import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, ChefHat, ClipboardCheck, Package } from "lucide-react";
import { startOfWeek, endOfWeek } from "date-fns";
import { cn } from "@/lib/utils";

interface Contributor {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  count: number;
}

interface SectionActivity {
  section_id: string;
  section_name: string;
  section_color: string | null;
  count: number;
}

interface MyStats {
  recipesContributed: number;
  tasksCompleted: number;
  stockCounts: number;
}

interface ContributionStatsProps {
  showLeaderboard?: boolean;
  showSectionCoverage?: boolean;
  showMyStats?: boolean;
  compact?: boolean;
}

export const ContributionStats = ({
  showLeaderboard = true,
  showSectionCoverage = true,
  showMyStats = true,
  compact = false,
}: ContributionStatsProps) => {
  const { user } = useAuth();
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [sectionActivity, setSectionActivity] = useState<SectionActivity[]>([]);
  const [myStats, setMyStats] = useState<MyStats>({ recipesContributed: 0, tasksCompleted: 0, stockCounts: 0 });
  const [loading, setLoading] = useState(true);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();

  useEffect(() => {
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch all activity logs for this week
      const { data: activityData, error: activityError } = await supabase
        .from("activity_log")
        .select("user_id, action_type, section_id")
        .gte("created_at", weekStart)
        .lte("created_at", weekEnd);

      if (activityError) throw activityError;

      // Fetch all profiles for name lookup
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url");

      // Fetch all sections for section coverage
      const { data: sectionsData } = await supabase
        .from("kitchen_sections")
        .select("id, name, color")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      const profiles = profilesData || [];
      const sections = sectionsData || [];
      const activities = activityData || [];

      // Calculate top contributors
      const contributorCounts: Record<string, number> = {};
      activities.forEach((a) => {
        contributorCounts[a.user_id] = (contributorCounts[a.user_id] || 0) + 1;
      });

      const sortedContributors = Object.entries(contributorCounts)
        .map(([userId, count]) => {
          const profile = profiles.find((p) => p.user_id === userId);
          return {
            user_id: userId,
            full_name: profile?.full_name || "Unknown",
            avatar_url: profile?.avatar_url || null,
            count,
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setContributors(sortedContributors);

      // Calculate section activity
      const sectionCounts: Record<string, number> = {};
      activities.forEach((a) => {
        if (a.section_id) {
          sectionCounts[a.section_id] = (sectionCounts[a.section_id] || 0) + 1;
        }
      });

      const sectionActivityData = sections.map((s) => ({
        section_id: s.id,
        section_name: s.name,
        section_color: s.color,
        count: sectionCounts[s.id] || 0,
      }));

      setSectionActivity(sectionActivityData);

      // Calculate my stats
      const myActivities = activities.filter((a) => a.user_id === user.id);
      const recipesContributed = myActivities.filter((a) => a.action_type === "recipe_created").length;
      const tasksCompleted = myActivities.filter((a) =>
        ["task_completed", "prep_completed"].includes(a.action_type)
      ).length;
      const stockCounts = myActivities.filter((a) => a.action_type === "inventory_counted").length;

      setMyStats({ recipesContributed, tasksCompleted, stockCounts });
    } catch (error) {
      console.error("Error fetching contribution stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return "🏆";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `#${rank}`;
    }
  };

  const maxContribution = Math.max(...contributors.map((c) => c.count), 1);
  const maxSectionActivity = Math.max(...sectionActivity.map((s) => s.count), 1);

  if (loading) {
    return (
      <div className="space-y-4">
        {showLeaderboard && (
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      {/* Top Contributors Leaderboard */}
      {showLeaderboard && (
        <Card>
          <CardHeader className={cn("pb-3", compact && "py-3")}>
            <CardTitle className={cn("text-lg flex items-center gap-2", compact && "text-base")}>
              <Trophy className="w-5 h-5 text-warning" />
              Top Contributors This Week
            </CardTitle>
          </CardHeader>
          <CardContent className={cn(compact && "pt-0")}>
            {contributors.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No contributions yet this week
              </p>
            ) : (
              <div className="space-y-3">
                {contributors.map((contributor, index) => {
                  const isCurrentUser = contributor.user_id === user?.id;
                  const barWidth = (contributor.count / maxContribution) * 100;

                  return (
                    <div
                      key={contributor.user_id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg transition-colors",
                        isCurrentUser && "bg-primary/10 border border-primary/20"
                      )}
                    >
                      <span className="w-8 text-center font-medium text-sm">
                        {getRankEmoji(index + 1)}
                      </span>
                      <Avatar className="h-7 w-7">
                        {contributor.avatar_url && (
                          <AvatarImage src={contributor.avatar_url} alt={contributor.full_name} />
                        )}
                        <AvatarFallback className="text-xs bg-muted">
                          {contributor.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-medium truncate", isCurrentUser && "text-primary")}>
                          {contributor.full_name}
                          {isCurrentUser && " (You)"}
                        </p>
                        <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-muted-foreground">
                        {contributor.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section Coverage */}
      {showSectionCoverage && !compact && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Section Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            {sectionActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No sections configured
              </p>
            ) : (
              <div className="space-y-3">
                {sectionActivity.map((section) => {
                  const barWidth = maxSectionActivity > 0 ? (section.count / maxSectionActivity) * 100 : 0;
                  const hasActivity = section.count > 0;

                  return (
                    <div key={section.section_id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: section.section_color || "#6B7280" }}
                          />
                          <span className={cn(!hasActivity && "text-muted-foreground")}>
                            {section.section_name}
                          </span>
                        </div>
                        <span className={cn("font-medium", !hasActivity && "text-muted-foreground")}>
                          {hasActivity ? section.count : "No activity"}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${barWidth}%`,
                            backgroundColor: hasActivity ? section.section_color || "#6B7280" : "transparent",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* My Stats */}
      {showMyStats && (
        <Card>
          <CardHeader className={cn("pb-3", compact && "py-3")}>
            <CardTitle className={cn("text-lg", compact && "text-base")}>My Stats This Week</CardTitle>
          </CardHeader>
          <CardContent className={cn(compact && "pt-0")}>
            <div className={cn("grid gap-4", compact ? "grid-cols-3" : "grid-cols-3")}>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-2">
                  <ChefHat className="w-5 h-5 text-primary" />
                </div>
                <p className="text-2xl font-bold">{myStats.recipesContributed}</p>
                <p className="text-xs text-muted-foreground">Recipes</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent/10 mb-2">
                  <ClipboardCheck className="w-5 h-5 text-accent" />
                </div>
                <p className="text-2xl font-bold">{myStats.tasksCompleted}</p>
                <p className="text-xs text-muted-foreground">Tasks Done</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-warning/10 mb-2">
                  <Package className="w-5 h-5 text-warning" />
                </div>
                <p className="text-2xl font-bold">{myStats.stockCounts}</p>
                <p className="text-xs text-muted-foreground">Stock Counts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContributionStats;

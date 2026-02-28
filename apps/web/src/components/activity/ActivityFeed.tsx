import { useState, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ActivityEntry {
  id: string;
  user_id: string;
  user_name: string | null;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  section_id: string | null;
  details: unknown;
  created_at: string;
  profile?: {
    full_name: string;
    avatar_url: string | null;
  } | null;
  section?: {
    name: string;
    color: string | null;
  } | null;
}

interface ActivityFeedProps {
  limit?: number;
  sectionId?: string;
  userId?: string;
  compact?: boolean;
  className?: string;
}

const ACTION_LABELS: Record<string, (entityName: string | null) => string> = {
  recipe_created: (name) => `created recipe ${name || ""}`,
  recipe_updated: (name) => `updated recipe ${name || ""}`,
  recipe_submitted: (name) => `submitted recipe ${name || ""} for review`,
  recipe_approved: (name) => `approved recipe ${name || ""}`,
  recipe_rejected: (name) => `requested changes on ${name || "recipe"}`,
  inventory_counted: () => `completed stock count`,
  prep_completed: (name) => `completed prep task ${name || ""}`,
  task_completed: (name) => `completed task ${name || ""}`,
  task_submitted: (name) => `submitted task ${name || ""} for review`,
  task_assigned: (name) => `assigned task ${name || ""}`,
  task_started: (name) => `started working on ${name || "task"}`,
  task_approved: (name) => `approved task ${name || ""}`,
  task_rejected: (name) => `requested changes on ${name || "task"}`,
  comment_added: (name) => `commented on ${name || "task"}`,
};

const COMPACT_ACTION_LABELS: Record<string, (entityName: string | null) => string> = {
  recipe_created: () => "created recipe",
  recipe_updated: () => "updated recipe",
  recipe_submitted: () => "submitted for review",
  recipe_approved: () => "approved recipe",
  recipe_rejected: () => "requested changes",
  inventory_counted: () => "completed stock count",
  prep_completed: () => "completed prep",
  task_completed: () => "completed task",
  task_submitted: () => "submitted task",
  task_assigned: () => "assigned task",
  task_started: () => "started task",
  task_approved: () => "approved task",
  task_rejected: () => "requested changes",
  comment_added: () => "added comment",
};

const PAGE_SIZE = 20;

export const ActivityFeed = ({
  limit,
  sectionId,
  userId,
  compact = false,
  className,
}: ActivityFeedProps) => {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchActivities = useCallback(async (offset = 0) => {
    const pageSize = limit || PAGE_SIZE;

    let query = supabase
      .from("activity_log")
      .select(`
        *,
        section:kitchen_sections(name, color)
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (sectionId) {
      query = query.eq("section_id", sectionId);
    }
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching activities:", error);
      setLoading(false);
      return [];
    }

    // Fetch profiles for users
    const userIds = [...new Set((data || []).map(a => a.user_id))];
    let profilesMap: Record<string, { full_name: string; avatar_url: string | null }> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      profilesMap = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = { full_name: p.full_name, avatar_url: p.avatar_url };
        return acc;
      }, {} as typeof profilesMap);
    }

    const enrichedActivities: ActivityEntry[] = (data || []).map(activity => ({
      ...activity,
      profile: profilesMap[activity.user_id] || null,
    }));

    return enrichedActivities;
  }, [limit, sectionId, userId]);

  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      const data = await fetchActivities(0);
      setActivities(data);
      setHasMore(!limit && data.length === PAGE_SIZE);
      setLoading(false);
    };

    loadInitial();
  }, [fetchActivities, limit]);

  const loadMore = async () => {
    setLoadingMore(true);
    const data = await fetchActivities(activities.length);
    setActivities(prev => [...prev, ...data]);
    setHasMore(data.length === PAGE_SIZE);
    setLoadingMore(false);
  };

  const getActionText = (activity: ActivityEntry) => {
    const labels = compact ? COMPACT_ACTION_LABELS : ACTION_LABELS;
    const labelFn = labels[activity.action_type];
    if (labelFn) {
      return labelFn(activity.entity_name);
    }
    return activity.action_type.replace(/_/g, " ");
  };

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: limit || 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-6 h-6 bg-muted rounded-full" />
            <div className="flex-1 h-4 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className={cn("text-center py-6 text-muted-foreground", className)}>
        <p className="text-sm">No activity yet</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      {activities.map((activity) => (
        <div
          key={activity.id}
          className={cn(
            "flex items-start gap-3 py-2",
            !compact && "px-2 hover:bg-muted/50 rounded-lg transition-colors"
          )}
        >
          <Avatar className={compact ? "w-6 h-6" : "w-8 h-8"}>
            <AvatarImage src={activity.profile?.avatar_url || undefined} />
            <AvatarFallback className="text-xs">
              {getInitials(activity.profile?.full_name || activity.user_name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {compact ? (
              <p className="text-sm truncate">
                <span className="font-medium">
                  {activity.profile?.full_name || activity.user_name || "Unknown"}
                </span>{" "}
                <span className="text-muted-foreground">{getActionText(activity)}</span>
                <span className="text-muted-foreground/60 ml-2 text-xs">
                  {getRelativeTime(activity.created_at)}
                </span>
              </p>
            ) : (
              <>
                <p className="text-sm">
                  <span className="font-medium">
                    {activity.profile?.full_name || activity.user_name || "Unknown"}
                  </span>{" "}
                  <span className="text-muted-foreground">{getActionText(activity)}</span>
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {activity.section && (
                    <div className="flex items-center gap-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: activity.section.color || "var(--muted)" }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {activity.section.name}
                      </span>
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground/60">
                    {getRelativeTime(activity.created_at)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      ))}

      {hasMore && !limit && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2"
          onClick={loadMore}
          disabled={loadingMore}
        >
          {loadingMore ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            "Load more"
          )}
        </Button>
      )}
    </div>
  );
};

export default ActivityFeed;

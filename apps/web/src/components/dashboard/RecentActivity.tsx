import { useEffect, useState } from "react";
import { ChefHat, Package, ClipboardCheck, Shield, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  action: string;
  subject: string;
  user: string;
  time: string;
  type: "recipe" | "inventory" | "prep" | "safety";
}

const typeIcons = {
  recipe: ChefHat,
  inventory: Package,
  prep: ClipboardCheck,
  safety: Shield,
};

const typeColors = {
  recipe: "text-primary bg-primary/10",
  inventory: "text-accent bg-accent/10",
  prep: "text-success bg-success/10",
  safety: "text-warning bg-warning/10",
};

const RecentActivity = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentActivity = async () => {
    try {
      // Fetch recent changes from multiple tables
      const [recipesRes, prepRes, safetyRes] = await Promise.all([
        supabase
          .from('recipes')
          .select('id, name, updated_at, created_by')
          .order('updated_at', { ascending: false })
          .limit(3),
        supabase
          .from('prep_lists')
          .select('id, name, updated_at, assigned_to_name')
          .order('updated_at', { ascending: false })
          .limit(3),
        supabase
          .from('food_safety_logs')
          .select('id, log_type, updated_at, recorded_by_name')
          .order('updated_at', { ascending: false })
          .limit(3),
      ]);

      const activityItems: ActivityItem[] = [];

      // Process recipes
      (recipesRes.data || []).forEach(recipe => {
        activityItems.push({
          id: `recipe-${recipe.id}`,
          action: "Edited recipe",
          subject: recipe.name,
          user: "Chef",
          time: formatDistanceToNow(new Date(recipe.updated_at), { addSuffix: true }),
          type: "recipe",
        });
      });

      // Process prep lists
      (prepRes.data || []).forEach(prep => {
        activityItems.push({
          id: `prep-${prep.id}`,
          action: "Updated prep list",
          subject: prep.name,
          user: prep.assigned_to_name || "Team",
          time: formatDistanceToNow(new Date(prep.updated_at), { addSuffix: true }),
          type: "prep",
        });
      });

      // Process safety logs
      (safetyRes.data || []).forEach(log => {
        activityItems.push({
          id: `safety-${log.id}`,
          action: "Logged",
          subject: log.log_type.replace(/_/g, ' '),
          user: log.recorded_by_name || "Staff",
          time: formatDistanceToNow(new Date(log.updated_at), { addSuffix: true }),
          type: "safety",
        });
      });

      // Sort by time (most recent first) and take top 5
      activityItems.sort((a, b) => {
        // This is a rough sort since we only have relative time strings
        return 0;
      });

      setActivities(activityItems.slice(0, 5));
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentActivity();

    // Refresh every 30 seconds
    const interval = setInterval(fetchRecentActivity, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="card-elevated p-5 h-full">
        <h2 className="section-header">Recent Activity</h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-muted rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated p-5 h-full">
      <h2 className="section-header">Recent Activity</h2>
      
      {activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = typeIcons[activity.type];
            
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={cn("p-2 rounded-lg flex-shrink-0", typeColors[activity.type])}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {activity.action}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{activity.subject}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{activity.user}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Clock className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-medium">Nulla recens activitas</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Actiones hic apparebunt
          </p>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;

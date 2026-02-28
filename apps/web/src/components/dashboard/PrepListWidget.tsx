import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, Circle, Clock, ClipboardList, User } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { format } from "date-fns";

interface PrepListSummary {
  id: string;
  name: string;
  date: string;
  status: string;
  assigned_to_name: string | null;
  itemCount: number;
  completedCount: number;
}

const statusConfig: Record<string, { icon: typeof Circle; color: string; bg: string; label: string }> = {
  pending: { icon: Circle, color: "text-muted-foreground", bg: "bg-muted", label: "Pending" },
  in_progress: { icon: Clock, color: "text-warning", bg: "bg-warning/10", label: "In Progress" },
  completed: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", label: "Completed" },
};

const PrepListWidget = () => {
  const [prepLists, setPrepLists] = useState<PrepListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isShowingRecent, setIsShowingRecent] = useState(false);
  const { currentOrg } = useOrg();

  const fetchPrepLists = useCallback(async () => {
    if (!currentOrg?.id) return;
    try {
      const today = new Date().toISOString().split('T')[0];

      let { data, error } = await supabase
        .from('prep_lists')
        .select('*')
        .eq('date', today)
        .eq('org_id', currentOrg.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setIsShowingRecent(true);
        const fallback = await supabase
          .from('prep_lists')
          .select('*')
          .eq('org_id', currentOrg.id)
          .order('date', { ascending: false })
          .limit(5);
        if (fallback.error) throw fallback.error;
        data = fallback.data;
      } else {
        setIsShowingRecent(false);
      }

      const lists: PrepListSummary[] = (data || []).map((list) => {
        const items = Array.isArray(list.items) ? list.items : [];
        const completedCount = items.filter((i: any) => i.completed === true).length;
        return {
          id: list.id,
          name: list.name,
          date: list.date,
          status: list.status || "pending",
          assigned_to_name: list.assigned_to_name,
          itemCount: items.length,
          completedCount,
        };
      });

      setPrepLists(lists);
    } catch (error) {
      console.error('Error fetching prep lists:', error);
    } finally {
      setLoading(false);
    }
  }, [currentOrg?.id]);

  useEffect(() => {
    fetchPrepLists();
    if (!currentOrg?.id) return;

    const channel = supabase
      .channel('prep-widget-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prep_lists', filter: `org_id=eq.${currentOrg.id}` },
        () => fetchPrepLists()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentOrg?.id, fetchPrepLists]);

  const totalLists = prepLists.length;
  const completedLists = prepLists.filter(l => l.status === "completed").length;
  const progress = totalLists > 0 ? (completedLists / totalLists) * 100 : 0;

  if (loading) {
    return (
      <div className="card-elevated p-5">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-2 bg-muted rounded"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded"></div>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="section-header mb-0">{isShowingRecent ? "Recent Prep Lists" : "Today's Prep Lists"}</h2>
          <p className="text-sm text-muted-foreground">
            {totalLists > 0
              ? `${completedLists} of ${totalLists} lists completed`
              : "No prep lists"
            }
          </p>
        </div>
        <Link to="/prep" className="btn-primary text-sm py-2 px-4">View All</Link>
      </div>

      <div className="h-2 bg-muted rounded-full mb-4 overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {prepLists.length > 0 ? (
        <div className="space-y-2">
          {prepLists.slice(0, 5).map((list) => {
            const sc = statusConfig[list.status] || statusConfig.pending;
            const StatusIcon = sc.icon;
            const listProgress = list.itemCount > 0 ? (list.completedCount / list.itemCount) * 100 : 0;

            return (
              <Link to="/prep" key={list.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border border-border transition-all hover:bg-muted hover:shadow-sm block">
                <StatusIcon className={cn("w-5 h-5 flex-shrink-0", sc.color)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{list.name}</p>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full", sc.bg, sc.color)}>
                      {sc.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(list.date), "MMM d")}
                    </span>
                    {list.assigned_to_name && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="w-3 h-3" /> {list.assigned_to_name}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {list.completedCount}/{list.itemCount} tasks
                    </span>
                  </div>
                  {list.itemCount > 0 && (
                    <div className="h-1 bg-muted rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${listProgress}%` }} />
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ClipboardList className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-medium">No prep lists yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Create your first prep list</p>
          <Link to="/prep" className="btn-primary text-sm py-2 px-4 mt-4">Create Prep List</Link>
        </div>
      )}
    </div>
  );
};

export default PrepListWidget;

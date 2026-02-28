import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Loader2,
  CheckCircle2,
  Circle,
  Clock,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePrepTemplates } from "@/hooks/usePrepTemplates";
import { useSectionLeaderStatus } from "@/hooks/useSectionLeaderStatus";
import { toast } from "sonner";

type UrgencyLevel = "priority" | "end_of_day" | "within_48h";

interface PrepItem {
  id: string;
  task: string;
  quantity: string;
  completed: boolean;
  urgency?: UrgencyLevel;
}

interface PrepList {
  id: string;
  name: string;
  date: string;
  items: PrepItem[];
  assigned_to_name: string | null;
  status: "pending" | "in_progress" | "completed";
  section_id: string | null;
}

const DAY_NAMES = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export function WeeklyPrepView() {
  const { user } = useAuth();
  const { templates } = usePrepTemplates();
  const { canManageTemplates, isHeadChef } = useSectionLeaderStatus();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [prepLists, setPrepLists] = useState<PrepList[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const fetchPrepLists = async () => {
    setLoading(true);
    const weekEnd = addDays(weekStart, 6);
    
    const { data, error } = await supabase
      .from("prep_lists")
      .select("*")
      .gte("date", format(weekStart, "yyyy-MM-dd"))
      .lte("date", format(weekEnd, "yyyy-MM-dd"))
      .order("date");

    if (error) {
      console.error("Error fetching prep lists:", error);
    } else {
      const formatted = (data || []).map((item) => ({
        ...item,
        items: (Array.isArray(item.items) ? item.items : []) as unknown as PrepItem[],
        status: item.status as "pending" | "in_progress" | "completed",
      }));
      setPrepLists(formatted);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPrepLists();
  }, [weekStart]);

  const generateFromTemplates = async () => {
    if (!user) return;

    setGenerating(true);
    
    interface PrepListInsert {
      name: string;
      date: string;
      items: Record<string, unknown>[];
      section_id: string | null;
      template_id: string;
      assigned_to_name: string | null;
      created_by: string;
      status: string;
    }
    
    const listsToCreate: PrepListInsert[] = [];

    // For each day of the week
    weekDays.forEach((day) => {
      const dayName = DAY_NAMES[day.getDay() === 0 ? 6 : day.getDay() - 1];
      const dateStr = format(day, "yyyy-MM-dd");

      // Find templates that match this day
      templates.forEach((template) => {
        if (!template.is_active) return;

        const shouldGenerate =
          template.schedule_type === "daily" ||
          (template.schedule_type === "weekly" && template.schedule_days.includes(dayName));

        if (shouldGenerate) {
          // Check if a list from this template already exists for this day
          const exists = prepLists.some(
            (list) => list.date === dateStr && list.name === template.name
          );

          if (!exists) {
            listsToCreate.push({
              name: template.name,
              date: dateStr,
              items: template.items.map((item) => ({
                ...item,
                completed: false,
              })) as Record<string, unknown>[],
              section_id: template.section_id,
              template_id: template.id,
              assigned_to_name: template.default_assignee_name,
              created_by: user.id,
              status: "pending",
            });
          }
        }
      });
    });

    if (listsToCreate.length === 0) {
      toast.info("No new lists to generate - all templates already have lists for this week");
      setGenerating(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("prep_lists").insert(listsToCreate as any);

    if (error) {
      console.error("Error generating prep lists:", error);
      toast.error("Failed to generate prep lists");
    } else {
      toast.success(`Generated ${listsToCreate.length} prep lists`);
      fetchPrepLists();
    }
    setGenerating(false);
  };

  const getListsForDay = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    return prepLists.filter((list) => list.date === dateStr);
  };

  const getListStats = (list: PrepList) => {
    const total = list.items.length;
    const completed = list.items.filter((item) => item.completed).length;
    return { total, completed };
  };

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setWeekStart(subWeeks(weekStart, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-center">
            <h2 className="font-semibold">
              {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")}
            </h2>
            <p className="text-sm text-muted-foreground">Week View</p>
          </div>
          <Button variant="outline" size="icon" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {canManageTemplates && templates.length > 0 && (
          <Button onClick={generateFromTemplates} disabled={generating}>
            {generating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4 mr-2" />
            )}
            Generate from Templates
          </Button>
        )}
      </div>

      {/* Week Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-3">
          {weekDays.map((day, index) => {
            const lists = getListsForDay(day);
            const isToday = isSameDay(day, new Date());

            return (
              <motion.div
                key={day.toISOString()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "rounded-xl border border-border overflow-hidden min-h-[200px]",
                  isToday && "ring-2 ring-primary"
                )}
              >
                {/* Day Header */}
                <div
                  className={cn(
                    "p-3 text-center border-b border-border",
                    isToday ? "bg-primary text-primary-foreground" : "bg-muted/50"
                  )}
                >
                  <p className="text-xs font-medium uppercase">
                    {format(day, "EEE")}
                  </p>
                  <p className="text-lg font-bold">{format(day, "d")}</p>
                </div>

                {/* Day Content */}
                <div className="p-2 space-y-2">
                  {lists.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No prep lists
                    </p>
                  ) : (
                    lists.map((list) => {
                      const { total, completed } = getListStats(list);
                      const StatusIcon =
                        list.status === "completed"
                          ? CheckCircle2
                          : list.status === "in_progress"
                          ? Clock
                          : Circle;

                      return (
                        <div
                          key={list.id}
                          className={cn(
                            "p-2 rounded-lg text-xs",
                            list.status === "completed"
                              ? "bg-success/10"
                              : list.status === "in_progress"
                              ? "bg-warning/10"
                              : "bg-muted"
                          )}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            <StatusIcon
                              className={cn(
                                "w-3 h-3",
                                list.status === "completed"
                                  ? "text-success"
                                  : list.status === "in_progress"
                                  ? "text-warning"
                                  : "text-muted-foreground"
                              )}
                            />
                            <span className="font-medium truncate">{list.name}</span>
                          </div>
                          <div className="text-muted-foreground">
                            {completed}/{total} done
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && prepLists.length === 0 && templates.length === 0 && (
        <div className="card-elevated p-8 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">No prep lists for this week</p>
          <p className="text-sm text-muted-foreground">
            Create templates in the Templates tab to auto-generate weekly prep lists
          </p>
        </div>
      )}
    </div>
  );
}

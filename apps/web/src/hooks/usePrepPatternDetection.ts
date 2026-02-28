import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/useOrgId";
import { subDays, getDay } from "date-fns";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export interface PatternSuggestion {
  task: string;
  dayOfWeek: number; // 0-6
  dayLabel: string;
  frequency: number;
}

const STORAGE_KEY = "prep-pattern-last-check";
const DISMISSED_KEY = "prep-pattern-dismissed";

export function usePrepPatternDetection() {
  const orgId = useOrgId();
  const [suggestions, setSuggestions] = useState<PatternSuggestion[]>([]);

  useEffect(() => {
    if (!orgId) return;

    // Debounce: max once per day
    const lastCheck = localStorage.getItem(STORAGE_KEY);
    const today = new Date().toISOString().slice(0, 10);
    if (lastCheck === today) return;

    const detect = async () => {
      localStorage.setItem(STORAGE_KEY, today);

      const since = subDays(new Date(), 21).toISOString().slice(0, 10);

      const { data: lists, error } = await supabase
        .from("prep_lists")
        .select("date, items")
        .gte("date", since)
        .order("date", { ascending: false });

      if (error || !lists) return;

      // Group tasks by name+dow
      const taskDowMap = new Map<string, Map<number, number>>();

      for (const list of lists) {
        const items = Array.isArray(list.items) ? list.items : [];
        const dow = getDay(new Date(list.date + "T00:00:00"));

        for (const item of items as any[]) {
          const name = (item.task || "").trim().toLowerCase();
          if (!name) continue;

          if (!taskDowMap.has(name)) taskDowMap.set(name, new Map());
          const dowCounts = taskDowMap.get(name)!;
          dowCounts.set(dow, (dowCounts.get(dow) || 0) + 1);
        }
      }

      // Find tasks appearing 3+ times on same weekday
      const dismissed: string[] = JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]");
      const results: PatternSuggestion[] = [];

      for (const [task, dowCounts] of taskDowMap) {
        for (const [dow, count] of dowCounts) {
          if (count >= 3) {
            const key = `${task}::${dow}`;
            if (dismissed.includes(key)) continue;
            results.push({
              task: task.charAt(0).toUpperCase() + task.slice(1),
              dayOfWeek: dow,
              dayLabel: DAY_LABELS[dow],
              frequency: count,
            });
          }
        }
      }

      setSuggestions(results.slice(0, 3)); // show max 3
    };

    detect();
  }, [orgId]);

  const dismiss = (task: string, dow: number) => {
    const key = `${task.toLowerCase()}::${dow}`;
    const dismissed: string[] = JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]");
    dismissed.push(key);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
    setSuggestions(prev => prev.filter(s => !(s.task.toLowerCase() === task.toLowerCase() && s.dayOfWeek === dow)));
  };

  return { suggestions, dismiss };
}

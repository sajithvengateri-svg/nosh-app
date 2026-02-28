import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/useOrgId";
import { subDays, getDay } from "date-fns";

interface PrepSuggestion {
  task: string;
  quantity: string;
  frequency: number;
  dayMatch: boolean;
  score: number;
}

export function usePrepSuggestions(selectedDate: Date) {
  const orgId = useOrgId();
  const targetDow = getDay(selectedDate); // 0=Sun..6=Sat

  return useQuery({
    queryKey: ["prep-suggestions", orgId, targetDow],
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000, // 5 min
    queryFn: async (): Promise<PrepSuggestion[]> => {
      const since = subDays(new Date(), 30).toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from("prep_lists")
        .select("date, items")
        .gte("date", since)
        .order("date", { ascending: false });

      if (error || !data) return [];

      // Count frequencies
      const taskMap = new Map<string, { total: number; dowCount: number; lastQty: string }>();

      for (const list of data) {
        const items = Array.isArray(list.items) ? list.items : [];
        const listDow = getDay(new Date(list.date + "T00:00:00"));

        for (const item of items as any[]) {
          const name = (item.task || "").trim().toLowerCase();
          if (!name) continue;

          const existing = taskMap.get(name) || { total: 0, dowCount: 0, lastQty: "" };
          existing.total += 1;
          if (listDow === targetDow) existing.dowCount += 1;
          if (!existing.lastQty && item.quantity) existing.lastQty = item.quantity;
          taskMap.set(name, existing);
        }
      }

      // Rank: score = (dowFreq * 3) + (overallFreq * 1)
      const suggestions: PrepSuggestion[] = [];
      for (const [task, info] of taskMap) {
        const score = info.dowCount * 3 + info.total;
        suggestions.push({
          task: task.charAt(0).toUpperCase() + task.slice(1),
          quantity: info.lastQty,
          frequency: info.total,
          dayMatch: info.dowCount > 0,
          score,
        });
      }

      suggestions.sort((a, b) => b.score - a.score);
      return suggestions.slice(0, 15); // keep top 15 for filtering
    },
  });
}

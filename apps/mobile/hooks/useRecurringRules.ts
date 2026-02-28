import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useOrg } from "../contexts/OrgProvider";

export interface RecurringRule {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  recurrence_type: "daily" | "weekly" | "monthly";
  recurrence_days: number[] | null;
  recurrence_day_of_month: number | null;
  auto_assign_to: string | null;
  auto_delegate: boolean;
  org_id: string;
  created_at: string;
  is_active: boolean;
}

export type CreateRuleInput = Omit<RecurringRule, "id" | "org_id" | "created_at" | "is_active">;

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function formatRecurrence(rule: RecurringRule): string {
  if (rule.recurrence_type === "daily") return "Daily";
  if (rule.recurrence_type === "weekly" && rule.recurrence_days?.length) {
    const dayNames = rule.recurrence_days.sort().map((d) => DAYS_OF_WEEK[d]);
    return `Weekly · ${dayNames.join(", ")}`;
  }
  if (rule.recurrence_type === "monthly" && rule.recurrence_day_of_month) {
    const suffix = rule.recurrence_day_of_month === 1 ? "st" : rule.recurrence_day_of_month === 2 ? "nd" : rule.recurrence_day_of_month === 3 ? "rd" : "th";
    return `Monthly · ${rule.recurrence_day_of_month}${suffix}`;
  }
  return rule.recurrence_type;
}

export function useRecurringRules() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  return useQuery<RecurringRule[]>({
    queryKey: ["recurring-rules", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("todo_recurring_rules")
        .select("*")
        .eq("org_id", orgId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as RecurringRule[]) || [];
    },
    enabled: !!orgId,
  });
}

export function useCreateRule() {
  const { currentOrg } = useOrg();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRuleInput) => {
      const { error } = await supabase.from("todo_recurring_rules").insert({
        ...input,
        org_id: currentOrg?.id,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recurring-rules"] }),
  });
}

export function useUpdateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RecurringRule> & { id: string }) => {
      const { error } = await supabase.from("todo_recurring_rules").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recurring-rules"] }),
  });
}

export function useDeleteRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete — mark inactive
      const { error } = await supabase.from("todo_recurring_rules").update({ is_active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recurring-rules"] }),
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/useOrgId";

export interface RecurringRule {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  quantity: string | null;
  unit: string | null;
  recurrence_type: string;
  recurrence_days: number[] | null;
  recurrence_day_of_month: number | null;
  is_active: boolean;
  auto_assign_to: string | null;
  auto_assign_name: string | null;
  auto_delegate: boolean;
  created_by: string;
  created_at: string;
}

export const useTodoRecurringRules = () => {
  const orgId = useOrgId();
  const qc = useQueryClient();
  const key = ["todo_recurring_rules", orgId];

  const { data: rules = [], isLoading } = useQuery({
    queryKey: key,
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("todo_recurring_rules" as any)
        .select("*")
        .eq("org_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as RecurringRule[];
    },
  });

  const addRule = useMutation({
    mutationFn: async (input: Partial<RecurringRule>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !orgId) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("todo_recurring_rules" as any)
        .insert({ ...input, org_id: orgId, created_by: user.id } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const updateRule = useMutation({
    mutationFn: async (input: { id: string } & Partial<RecurringRule>) => {
      const { id, ...rest } = input;
      const { error } = await supabase
        .from("todo_recurring_rules" as any)
        .update(rest as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("todo_recurring_rules" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { rules, isLoading, addRule, updateRule, deleteRule };
};

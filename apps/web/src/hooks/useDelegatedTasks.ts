import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";

export interface DelegatedTask {
  id: string;
  org_id: string;
  venue_id: string | null;
  created_by: string;
  assigned_to: string;
  assigned_to_name: string;
  task: string;
  quantity: string | null;
  urgency: string;
  due_date: string;
  status: string;
  completed_at: string | null;
  source_todo_id: string | null;
  created_at: string;
}

const table = () => supabase.from("delegated_tasks" as any);

export const useDelegatedTasks = (options?: { assignedToMe?: boolean; dueDate?: string }) => {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const orgId = currentOrg?.id;

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["delegated-tasks", orgId, options?.assignedToMe, options?.dueDate],
    queryFn: async () => {
      if (!orgId) return [];
      let query = table().select("*").eq("org_id", orgId);
      if (options?.assignedToMe && user?.id) {
        query = query.eq("assigned_to", user.id);
      }
      if (options?.dueDate) {
        query = query.eq("due_date", options.dueDate);
      }
      query = query.order("created_at", { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as DelegatedTask[];
    },
    enabled: !!orgId,
  });

  const createTask = useMutation({
    mutationFn: async (input: {
      assigned_to: string;
      assigned_to_name: string;
      task: string;
      quantity?: string;
      urgency?: string;
      due_date: string;
      source_todo_id?: string;
      venue_id?: string;
    }) => {
      if (!orgId || !user?.id) throw new Error("No org or user");
      const { error } = await table().insert({
        org_id: orgId,
        created_by: user.id,
        assigned_to: input.assigned_to,
        assigned_to_name: input.assigned_to_name,
        task: input.task,
        quantity: input.quantity || null,
        urgency: input.urgency || "end_of_day",
        due_date: input.due_date,
        source_todo_id: input.source_todo_id || null,
        venue_id: input.venue_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["delegated-tasks"] }),
  });

  const toggleComplete = useMutation({
    mutationFn: async (id: string) => {
      const task = tasks.find(t => t.id === id);
      if (!task) throw new Error("Not found");
      const newStatus = task.status === "completed" ? "pending" : "completed";
      const { error } = await table().update({
        status: newStatus,
        completed_at: newStatus === "completed" ? new Date().toISOString() : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["delegated-tasks"] }),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await table().delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["delegated-tasks"] }),
  });

  return { tasks, isLoading, createTask, toggleComplete, deleteTask };
};

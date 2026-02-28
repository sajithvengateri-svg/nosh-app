import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useOrg } from "../contexts/OrgProvider";
import { useAuth } from "../contexts/AuthProvider";

export interface PrepItem {
  id: string;
  task: string;
  quantity: string;
  completed: boolean;
  urgency?: "priority" | "end_of_day" | "within_48h";
}

export interface PrepList {
  id: string;
  name: string;
  date: string;
  items: PrepItem[];
  assigned_to: string | null;
  assigned_to_name: string | null;
  status: "pending" | "in_progress" | "completed";
  notes: string | null;
  org_id: string | null;
  created_by: string | null;
}

export function usePrepLists() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  return useQuery<PrepList[]>({
    queryKey: ["prep-lists", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("prep_lists")
        .select("*")
        .eq("org_id", orgId)
        .order("date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data as PrepList[]) || [];
    },
    enabled: !!orgId,
  });
}

export function useTogglePrepItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      prepListId,
      items,
    }: {
      prepListId: string;
      items: PrepItem[];
    }) => {
      const allDone = items.every((i) => i.completed);
      const anyDone = items.some((i) => i.completed);
      const status = allDone ? "completed" : anyDone ? "in_progress" : "pending";
      const { error } = await supabase
        .from("prep_lists")
        .update({ items, status })
        .eq("id", prepListId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prep-lists"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useCreatePrepList() {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrg();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (list: Partial<PrepList>) => {
      const { data, error } = await supabase
        .from("prep_lists")
        .insert({
          ...list,
          org_id: currentOrg?.id,
          created_by: profile?.id,
          status: "pending",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prep-lists"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useUpdatePrepList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PrepList> & { id: string }) => {
      const { data, error } = await supabase
        .from("prep_lists")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prep-lists"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useDeletePrepList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("prep_lists").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prep-lists"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

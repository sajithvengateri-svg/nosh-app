import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useOrg } from "../contexts/OrgProvider";

export function useCreateBatch() {
  const { currentOrg } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (batch: { recipe_name: string; batch_size: number; unit?: string; scheduled_date?: string; notes?: string }) => {
      const { error } = await supabase.from("production_batches").insert({
        ...batch, org_id: currentOrg?.id, status: "planned",
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["production-batches"] }),
  });
}

export function useUpdateBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; yield_amount?: number; yield_unit?: string; notes?: string; completed_at?: string }) => {
      const { error } = await supabase.from("production_batches").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["production-batches"] }),
  });
}

export function useDeleteBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("production_batches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["production-batches"] }),
  });
}

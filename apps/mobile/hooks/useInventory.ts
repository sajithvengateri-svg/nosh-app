import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useOrg } from "../contexts/OrgProvider";

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  location: string | null;
  expiry_date: string | null;
  batch_number: string | null;
  min_stock: number | null;
  received_date: string | null;
  ingredient_id: string | null;
  org_id: string | null;
  ingredients?: {
    cost_per_unit: number | null;
    category: string | null;
    supplier: string | null;
  } | null;
}

export function useInventory() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  return useQuery<InventoryItem[]>({
    queryKey: ["inventory", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("inventory")
        .select("*, ingredients(cost_per_unit, category, supplier)")
        .eq("org_id", orgId)
        .order("name");
      if (error) throw error;
      return (data as InventoryItem[]) || [];
    },
    enabled: !!orgId,
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrg();

  return useMutation({
    mutationFn: async (item: Partial<InventoryItem>) => {
      const { data, error } = await supabase
        .from("inventory")
        .insert({ ...item, org_id: currentOrg?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InventoryItem> & { id: string }) => {
      const { data, error } = await supabase
        .from("inventory")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inventory").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

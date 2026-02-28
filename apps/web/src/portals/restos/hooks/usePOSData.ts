import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import {
  fetchPOSCategories, createPOSCategory, updatePOSCategory,
  fetchPOSMenuItems, createPOSMenuItem, updatePOSMenuItem,
  fetchPOSModifierGroups, createPOSModifierGroup,
  createPOSModifier, updatePOSModifier,
  fetchPOSStore, upsertPOSStore,
  fetchDailyClose, createDailyClose,
  fetchWasteLogs, logWaste,
  fetchPOSOrders, fetchPOSPayments,
} from "@/lib/shared/queries/posQueries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function usePOSStore_() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  return useQuery({
    queryKey: ["pos-store", orgId],
    queryFn: () => fetchPOSStore(orgId!),
    enabled: !!orgId,
  });
}

export function usePOSCategories() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  return useQuery({
    queryKey: ["pos-categories", orgId],
    queryFn: () => fetchPOSCategories(orgId!),
    enabled: !!orgId,
  });
}

export function usePOSMenuItems() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  return useQuery({
    queryKey: ["pos-menu-items", orgId],
    queryFn: () => fetchPOSMenuItems(orgId!),
    enabled: !!orgId,
  });
}

export function usePOSModifierGroups() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  return useQuery({
    queryKey: ["pos-modifier-groups", orgId],
    queryFn: () => fetchPOSModifierGroups(orgId!),
    enabled: !!orgId,
  });
}

export function usePOSDailyClose() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  return useQuery({
    queryKey: ["pos-daily-close", orgId],
    queryFn: () => fetchDailyClose(orgId!),
    enabled: !!orgId,
  });
}

export function usePOSWasteLogs() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  return useQuery({
    queryKey: ["pos-waste-logs", orgId],
    queryFn: () => fetchWasteLogs(orgId!),
    enabled: !!orgId,
  });
}

export function usePOSOrders(status?: string) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  return useQuery({
    queryKey: ["pos-orders", orgId, status],
    queryFn: () => fetchPOSOrders(orgId!, status),
    enabled: !!orgId,
  });
}

export function usePOSPayments(startDate?: string, endDate?: string) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  return useQuery({
    queryKey: ["pos-payments", orgId, startDate, endDate],
    queryFn: () => fetchPOSPayments(orgId!, startDate, endDate),
    enabled: !!orgId,
  });
}

export function useStoreMutations() {
  const qc = useQueryClient();

  const upsert = useMutation({
    mutationFn: (store: Record<string, unknown>) => upsertPOSStore(store),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pos-store"] }); toast.success("Store settings saved"); },
    onError: () => toast.error("Failed to save store settings"),
  });

  return { upsert };
}

export function useCategoryMutations() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  const create = useMutation({
    mutationFn: (values: { name: string; icon?: string; sort_order?: number }) =>
      createPOSCategory({ ...values, org_id: orgId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pos-categories"] }); toast.success("Category created"); },
    onError: () => toast.error("Failed to create category"),
  });

  const update = useMutation({
    mutationFn: ({ id, ...values }: { id: string; name?: string; icon?: string; sort_order?: number; is_active?: boolean }) =>
      updatePOSCategory(id, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pos-categories"] }); toast.success("Category updated"); },
    onError: () => toast.error("Failed to update category"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pos_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pos-categories"] }); toast.success("Category deleted"); },
    onError: () => toast.error("Failed to delete category"),
  });

  return { create, update, remove };
}

export function useMenuItemMutations() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  const create = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      createPOSMenuItem({ ...values, org_id: orgId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pos-menu-items"] }); toast.success("Item created"); },
    onError: () => toast.error("Failed to create item"),
  });

  const update = useMutation({
    mutationFn: ({ id, ...values }: Record<string, unknown> & { id: string }) =>
      updatePOSMenuItem(id, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pos-menu-items"] }); toast.success("Item updated"); },
    onError: () => toast.error("Failed to update item"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pos_menu_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pos-menu-items"] }); toast.success("Item deleted"); },
    onError: () => toast.error("Failed to delete item"),
  });

  return { create, update, remove };
}

export function useModifierMutations() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  const createGroup = useMutation({
    mutationFn: (values: { name: string; is_required?: boolean; min_selections?: number; max_selections?: number }) =>
      createPOSModifierGroup({ ...values, org_id: orgId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pos-modifier-groups"] }); toast.success("Group created"); },
    onError: () => toast.error("Failed to create group"),
  });

  const createMod = useMutation({
    mutationFn: (values: { group_id: string; name: string; price_adjustment?: number }) =>
      createPOSModifier(values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pos-modifier-groups"] }); toast.success("Modifier added"); },
    onError: () => toast.error("Failed to add modifier"),
  });

  const updateMod = useMutation({
    mutationFn: ({ id, ...values }: { id: string; name?: string; price_adjustment?: number; is_active?: boolean }) =>
      updatePOSModifier(id, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pos-modifier-groups"] }); toast.success("Modifier updated"); },
    onError: () => toast.error("Failed to update modifier"),
  });

  const removeGroup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pos_modifier_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pos-modifier-groups"] }); toast.success("Group deleted"); },
    onError: () => toast.error("Failed to delete group"),
  });

  return { createGroup, createMod, updateMod, removeGroup };
}

export function useDailyCloseMutations() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  const create = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      createDailyClose({ ...values, org_id: orgId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pos-daily-close"] }); toast.success("Daily close saved"); },
    onError: () => toast.error("Failed to save daily close"),
  });

  return { create };
}

export function useWasteMutations() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  const create = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      logWaste({ ...values, org_id: orgId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pos-waste-logs"] }); toast.success("Waste logged"); },
    onError: () => toast.error("Failed to log waste"),
  });

  return { create };
}

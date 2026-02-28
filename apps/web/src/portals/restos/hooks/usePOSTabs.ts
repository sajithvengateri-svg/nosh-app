import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { fetchPOSTabs, openPOSTab, closePOSTab, fetchPOSOrders } from "@/lib/shared/queries/posQueries";

export function usePOSTabs(status?: string) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  return useQuery({
    queryKey: ["pos-tabs", orgId, status],
    queryFn: () => fetchPOSTabs(orgId!, status),
    enabled: !!orgId,
  });
}

export function useTabOrders(tabId: string | null) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  return useQuery({
    queryKey: ["pos-tab-orders", orgId, tabId],
    queryFn: async () => {
      if (!orgId || !tabId) return [];
      const { data, error } = await (await import("@/integrations/supabase/client")).supabase
        .from("pos_orders")
        .select("*, items:pos_order_items(*)")
        .eq("org_id", orgId)
        .eq("tab_id", tabId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!orgId && !!tabId,
  });
}

export function useTabMutations() {
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  const open = useMutation({
    mutationFn: (name: string) =>
      openPOSTab({ org_id: orgId, name, opened_by: null }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pos-tabs"] }),
  });

  const close = useMutation({
    mutationFn: (id: string) => closePOSTab(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pos-tabs"] }),
  });

  return { open, close };
}

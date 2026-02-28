import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { fetchPOSOrders, updatePOSOrder, insertOrderEvent } from "@/lib/shared/queries/posQueries";

export function usePOSOrders(status?: string) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  return useQuery({
    queryKey: ["pos-orders", orgId, status],
    queryFn: () => fetchPOSOrders(orgId!, status),
    enabled: !!orgId,
    refetchInterval: 5000, // poll every 5s as fallback to realtime
  });
}

export function useOrderMutations() {
  const qc = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updatePOSOrder(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pos-orders"] });
    },
  });

  const addEvent = useMutation({
    mutationFn: (event: Record<string, unknown>) => insertOrderEvent(event),
  });

  return { updateStatus, addEvent };
}

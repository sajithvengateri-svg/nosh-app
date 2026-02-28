import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { ResBlockedDate, BlockType } from "@/lib/shared/types/res.types";
import { startOfMonth, endOfMonth, format } from "date-fns";

export function useBlockedDates(referenceDate?: Date) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  const ref = referenceDate || new Date();
  const monthStart = format(startOfMonth(ref), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(ref), "yyyy-MM-dd");

  const { data: blockedDates = [], isLoading } = useQuery<ResBlockedDate[]>({
    queryKey: ["res_blocked_dates", orgId, monthStart],
    queryFn: async () => {
      const { data } = await supabase
        .from("res_blocked_dates")
        .select("*")
        .eq("org_id", orgId!)
        .gte("block_date", monthStart)
        .lte("block_date", monthEnd)
        .order("block_date");
      return (data ?? []) as ResBlockedDate[];
    },
    enabled: !!orgId,
    staleTime: 2 * 60 * 1000,
  });

  const blockDateMutation = useMutation({
    mutationFn: async (params: {
      block_date: string;
      block_type: BlockType;
      service_period_key?: string | null;
      reason?: string;
      guest_message?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("res_blocked_dates").insert({
        org_id: orgId!,
        block_date: params.block_date,
        block_type: params.block_type,
        service_period_key: params.service_period_key ?? null,
        reason: params.reason ?? null,
        guest_message: params.guest_message ?? null,
        blocked_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["res_blocked_dates"] });
    },
  });

  const unblockDateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("res_blocked_dates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["res_blocked_dates"] });
    },
  });

  const isDateBlocked = (date: string, servicePeriodKey?: string): boolean => {
    return blockedDates.some(
      (b) =>
        b.block_date === date &&
        (b.service_period_key === null || b.service_period_key === servicePeriodKey)
    );
  };

  const isDateFullyBlocked = (date: string): boolean => {
    return blockedDates.some((b) => b.block_date === date && b.service_period_key === null);
  };

  const getBlockInfo = (date: string): ResBlockedDate | null => {
    return blockedDates.find((b) => b.block_date === date) ?? null;
  };

  return {
    blockedDates,
    isLoading,
    blockDate: blockDateMutation.mutateAsync,
    unblockDate: unblockDateMutation.mutateAsync,
    isBlockingDate: blockDateMutation.isPending,
    isDateBlocked,
    isDateFullyBlocked,
    getBlockInfo,
  };
}

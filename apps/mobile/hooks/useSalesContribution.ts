import { useMutation } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useOrg } from "../contexts/OrgProvider";

export function useSalesContribution() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  const sync = useMutation({
    mutationFn: async (period: string = "90d") => {
      if (!orgId) throw new Error("No org");
      const { data, error } = await supabase.functions.invoke("compute-sales-contribution", {
        body: { orgId, period },
      });
      if (error) throw error;
      return data;
    },
  });

  return {
    syncSales: (period?: string) => sync.mutateAsync(period ?? "90d"),
    isSyncing: sync.isPending,
  };
}

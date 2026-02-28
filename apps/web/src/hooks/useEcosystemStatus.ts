import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EcosystemModule {
  module: string;
  source_type: string;
  last_data_at: string;
  record_count: number;
  status: string;
}

export function useEcosystemStatus(orgId: string | undefined) {
  return useQuery({
    queryKey: ["ecosystem-status", orgId],
    queryFn: async (): Promise<EcosystemModule[]> => {
      if (!orgId) return [];

      const { data, error } = await supabase
        .from("ecosystem_sync_log")
        .select("*")
        .eq("org_id", orgId);

      if (error) {
        console.error("Ecosystem status fetch error:", error);
        return [];
      }

      return (data || []) as EcosystemModule[];
    },
    enabled: !!orgId,
    staleTime: 30 * 1000,
  });
}

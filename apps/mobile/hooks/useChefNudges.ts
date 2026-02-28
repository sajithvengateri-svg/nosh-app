import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useOrg } from "../contexts/OrgProvider";

export interface ChefNudge {
  id: string;
  nudge_type: string;
  title: string;
  body: string;
  severity: "info" | "warning" | "critical";
  target_date: string;
  status: string;
  created_at: string;
}

export function useChefNudges() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: nudges } = useQuery<ChefNudge[]>({
    queryKey: ["chef-nudges", orgId, today],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("chef_nudges")
        .select("id, nudge_type, title, body, severity, target_date, status, created_at")
        .eq("org_id", orgId)
        .eq("target_date", today)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) return [];
      return (data as ChefNudge[]) || [];
    },
    enabled: !!orgId,
    refetchInterval: 5 * 60 * 1000, // Poll every 5 minutes
  });

  const dismissNudge = useMutation({
    mutationFn: async (nudgeId: string) => {
      const { error } = await supabase
        .from("chef_nudges")
        .update({ status: "dismissed", dismissed_at: new Date().toISOString() })
        .eq("id", nudgeId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chef-nudges"] }),
  });

  return {
    nudges: nudges || [],
    dismissNudge: (id: string) => dismissNudge.mutate(id),
    hasNudges: (nudges || []).length > 0,
  };
}

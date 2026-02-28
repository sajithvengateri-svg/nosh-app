import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";

export interface TeamMember {
  user_id: string;
  full_name: string;
  role: string;
}

export const useTeamMembers = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["team-members", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data: memberships, error: memErr } = await supabase
        .from("org_memberships")
        .select("user_id, role")
        .eq("org_id", orgId)
        .eq("is_active", true);
      if (memErr) throw memErr;
      if (!memberships?.length) return [];

      const userIds = memberships.map(m => m.user_id);
      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      if (profErr) throw profErr;

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));
      return memberships.map(m => ({
        user_id: m.user_id,
        full_name: profileMap.get(m.user_id) || "Unknown",
        role: m.role,
      })) as TeamMember[];
    },
    enabled: !!orgId,
  });

  return { members, isLoading };
};

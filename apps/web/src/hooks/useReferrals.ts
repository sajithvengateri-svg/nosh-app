import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useReferrals = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-referrals", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      // First get user's referral code ids
      const { data: codes } = await supabase
        .from("referral_codes")
        .select("id")
        .eq("user_id", user!.id);

      if (!codes?.length) return [];

      const codeIds = codes.map((c: any) => c.id);

      // Then get referrals via those codes — use the referrer_id which links to user
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

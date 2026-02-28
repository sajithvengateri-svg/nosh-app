import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useReferralCode = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["referral-code", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_codes")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
};

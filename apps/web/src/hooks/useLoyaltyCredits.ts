import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useLoyaltyCredits = () => {
  const { user } = useAuth();

  const creditsQuery = useQuery({
    queryKey: ["loyalty-credits", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_credits")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const balance = creditsQuery.data?.length
    ? creditsQuery.data[0]?.balance_after ?? 0
    : 0;

  return { ...creditsQuery, balance: Number(balance) };
};

import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useOrg } from "../contexts/OrgProvider";

interface DishPrediction {
  item_name: string;
  predicted_qty: number;
  avg_per_cover: number;
  dow_weight: number;
  confidence: "low" | "medium" | "high";
  data_points: number;
}

export function useDishParPredictions(date?: string) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const targetDate = date || new Date().toISOString().split("T")[0];

  const { data, isLoading, refetch } = useQuery<{ predictions: DishPrediction[]; covers: number }>({
    queryKey: ["dish-par-predictions", orgId, targetDate],
    queryFn: async () => {
      if (!orgId) return { predictions: [], covers: 0 };
      const { data, error } = await supabase.functions.invoke("predict-dish-par", {
        body: { orgId, date: targetDate },
      });
      if (error) throw error;
      return { predictions: data?.predictions || [], covers: data?.covers || 0 };
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    predictions: data?.predictions || [],
    covers: data?.covers || 0,
    isLoading,
    refetch,
  };
}

export function useRetrainModel() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  return useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No org");
      const { data, error } = await supabase.functions.invoke("predict-dish-par", {
        body: { orgId, date: new Date().toISOString().split("T")[0] },
      });
      if (error) throw error;
      return data;
    },
  });
}

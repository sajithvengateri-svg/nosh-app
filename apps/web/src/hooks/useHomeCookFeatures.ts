import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { isHomeCookMode } from "@/lib/shared/modeConfig";

interface FeatureConfig {
  feature_key: string;
  enabled: boolean;
  label: string;
  description: string | null;
}

export const useHomeCookFeatures = () => {
  const { storeMode } = useOrg();
  const isHomeCook = isHomeCookMode(storeMode);

  const { data: features = [] } = useQuery({
    queryKey: ["home-cook-features"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_cook_feature_config")
        .select("feature_key, enabled, label, description");
      if (error) throw error;
      return data as FeatureConfig[];
    },
    enabled: isHomeCook,
    staleTime: 5 * 60 * 1000,
  });

  const isRecipeFeatureEnabled = (key: string): boolean => {
    if (!isHomeCook) return true; // full ChefOS shows everything
    const feature = features.find(f => f.feature_key === key);
    return feature?.enabled ?? true;
  };

  return { features, isRecipeFeatureEnabled, isHomeCook };
};

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HomeCookLandingSection {
  id: string;
  section_key: string;
  title: string;
  subtitle: string;
  is_visible: boolean;
  content: any;
  sort_order: number;
  updated_at: string;
}

export const useHomeCookLandingSections = () => {
  const { data: sections = [], isLoading, refetch } = useQuery({
    queryKey: ["home-cook-landing-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_cook_landing_sections")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as HomeCookLandingSection[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const sectionMap = sections.reduce<Record<string, HomeCookLandingSection>>((acc, s) => {
    acc[s.section_key] = s;
    return acc;
  }, {});

  const isVisible = (key: string) => sectionMap[key]?.is_visible !== false;

  return { sections, sectionMap, isVisible, isLoading, refetch };
};

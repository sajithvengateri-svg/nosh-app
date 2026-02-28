import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LandingSection {
  id: string;
  section_key: string;
  title: string;
  subtitle: string;
  is_visible: boolean;
  content: any;
  sort_order: number;
  updated_at: string;
}

export const useLandingSections = () => {
  const { data: sections = [], isLoading, refetch } = useQuery({
    queryKey: ["landing-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_sections")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as LandingSection[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const sectionMap = sections.reduce<Record<string, LandingSection>>((acc, s) => {
    acc[s.section_key] = s;
    return acc;
  }, {});

  const isVisible = (key: string) => sectionMap[key]?.is_visible !== false;

  return { sections, sectionMap, isVisible, isLoading, refetch };
};

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LandingSectionRow {
  id: string;
  section_key: string;
  title: string;
  subtitle: string;
  is_visible: boolean;
  content: any;
  sort_order: number;
  updated_at: string;
}

export function createLandingSectionsHook(tableName: string, queryKey: string) {
  return () => {
    const { data: sections = [], isLoading, refetch } = useQuery({
      queryKey: [queryKey],
      queryFn: async () => {
        const { data, error } = await supabase
          .from(tableName)
          .select("*")
          .order("sort_order");
        if (error) throw error;
        return data as LandingSectionRow[];
      },
      staleTime: 1000 * 60 * 5,
    });

    const sectionMap = sections.reduce<Record<string, LandingSectionRow>>((acc, s) => {
      acc[s.section_key] = s;
      return acc;
    }, {});

    const isVisible = (key: string) => sectionMap[key]?.is_visible !== false;

    return { sections, sectionMap, isVisible, isLoading, refetch };
  };
}

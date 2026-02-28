import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MobileNavSection {
  id: string;
  org_id: string | null;
  section_key: string;
  label: string;
  icon_name: string;
  sort_order: number;
  module_paths: string[];
  direct_path: string | null;
}

export const DEFAULT_SECTIONS: Omit<MobileNavSection, "id" | "org_id">[] = [
  { section_key: "home", label: "Home", icon_name: "Home", sort_order: 0, module_paths: [], direct_path: "/dashboard" },
  { section_key: "recipes", label: "Recipes", icon_name: "ChefHat", sort_order: 1, module_paths: ["/recipes", "/ingredients", "/invoices", "/marketplace", "/allergens"], direct_path: null },
  { section_key: "kitchen", label: "Kitchen", icon_name: "Utensils", sort_order: 2, module_paths: ["/prep", "/production", "/inventory", "/equipment", "/kitchen-sections", "/waste-log"], direct_path: null },
  { section_key: "safety", label: "Safety", icon_name: "Shield", sort_order: 3, module_paths: ["/food-safety", "/training", "/cheatsheets", "/housekeeping"], direct_path: null },
  { section_key: "games", label: "Games", icon_name: "Gamepad2", sort_order: 4, module_paths: ["/games"], direct_path: "/games" },
  { section_key: "settings", label: "Settings", icon_name: "Settings", sort_order: 5, module_paths: [], direct_path: "/settings" },
];

/** Fetch GLOBAL mobile nav sections (shared by all users) */
export function useMobileNavSections() {
  const queryClient = useQueryClient();

  const { data: sections, isLoading } = useQuery({
    queryKey: ["mobile_nav_sections_global"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mobile_nav_sections" as any)
        .select("*")
        .is("org_id", null)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as unknown as MobileNavSection[]) || [];
    },
  });

  const resolved: MobileNavSection[] =
    sections && sections.length > 0
      ? sections
      : DEFAULT_SECTIONS.map((s, i) => ({ ...s, id: `default-${i}`, org_id: null }));

  return { sections: resolved, isLoading };
}

/** Admin hook to manage global mobile nav config */
export function useGlobalMobileNavAdmin() {
  const queryClient = useQueryClient();

  const { data: sections, isLoading } = useQuery({
    queryKey: ["mobile_nav_sections_global"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mobile_nav_sections" as any)
        .select("*")
        .is("org_id", null)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as unknown as MobileNavSection[]) || [];
    },
  });

  const resolved: MobileNavSection[] =
    sections && sections.length > 0
      ? sections
      : DEFAULT_SECTIONS.map((s, i) => ({ ...s, id: `default-${i}`, org_id: null }));

  const saveMutation = useMutation({
    mutationFn: async (newSections: Omit<MobileNavSection, "id">[]) => {
      // Delete existing global config
      await supabase.from("mobile_nav_sections" as any).delete().is("org_id", null);
      const { error } = await supabase.from("mobile_nav_sections" as any).insert(
        newSections.map((s) => ({ ...s, org_id: null }))
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mobile_nav_sections_global"] });
    },
  });

  return { sections: resolved, isLoading, saveSections: saveMutation.mutateAsync, isSaving: saveMutation.isPending };
}

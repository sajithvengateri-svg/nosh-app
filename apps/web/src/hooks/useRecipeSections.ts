import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/useOrgId";
import { toast } from "sonner";

export interface RecipeSection {
  id: string;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
  is_default: boolean;
}

export const useRecipeSections = () => {
  const [sections, setSections] = useState<RecipeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const orgId = useOrgId();

  const fetchSections = async () => {
    const { data, error } = await supabase
      .from("recipe_sections")
      .select("*")
      .order("sort_order");

    if (error) {
      console.error("Error fetching sections:", error);
      toast.error("Failed to load recipe sections");
    } else {
      setSections(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const addSection = async (name: string, color = "#6B7280") => {
    const maxOrder = sections.length > 0 
      ? Math.max(...sections.map(s => s.sort_order)) 
      : 0;

    const { data, error } = await supabase
      .from("recipe_sections")
      .insert({
        name,
        color,
        sort_order: maxOrder + 1,
        is_default: false,
        ...(orgId ? { org_id: orgId } : {}),
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        toast.error("Section name already exists");
      } else {
        toast.error("Failed to add section");
        console.error(error);
      }
      return null;
    }

    setSections(prev => [...prev, data]);
    toast.success("Section added");
    return data;
  };

  const updateSection = async (id: string, updates: Partial<Pick<RecipeSection, "name" | "color" | "sort_order">>) => {
    const { error } = await supabase
      .from("recipe_sections")
      .update(updates)
      .eq("id", id);

    if (error) {
      if (error.code === "23505") {
        toast.error("Section name already exists");
      } else {
        toast.error("Failed to update section");
        console.error(error);
      }
      return false;
    }

    setSections(prev => 
      prev.map(s => s.id === id ? { ...s, ...updates } : s)
    );
    return true;
  };

  const deleteSection = async (id: string) => {
    const { error } = await supabase
      .from("recipe_sections")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete section");
      console.error(error);
      return false;
    }

    setSections(prev => prev.filter(s => s.id !== id));
    toast.success("Section deleted");
    return true;
  };

  const reorderSections = async (reorderedSections: RecipeSection[]) => {
    const updates = reorderedSections.map((section, index) => ({
      id: section.id,
      sort_order: index + 1,
    }));

    // Optimistic update
    setSections(reorderedSections.map((s, i) => ({ ...s, sort_order: i + 1 })));

    // Update each section
    for (const update of updates) {
      await supabase
        .from("recipe_sections")
        .update({ sort_order: update.sort_order })
        .eq("id", update.id);
    }
  };

  return {
    sections,
    loading,
    addSection,
    updateSection,
    deleteSection,
    reorderSections,
    refetch: fetchSections,
  };
};

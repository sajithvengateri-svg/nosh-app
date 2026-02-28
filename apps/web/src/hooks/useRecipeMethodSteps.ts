import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export interface MethodStep {
  id: string;
  org_id: string;
  recipe_id: string;
  section_number: number;
  section_title: string;
  step_number: number;
  instruction: string;
  image_url: string | null;
  timer_id: string | null;
  tips: string | null;
  sort_order: number;
  created_at: string;
}

export interface MethodSection {
  section_number: number;
  section_title: string;
  steps: MethodStep[];
}

export function useRecipeMethodSteps(recipeId: string | undefined) {
  const { currentOrg } = useOrg();
  const [steps, setSteps] = useState<MethodStep[]>([]);
  const [loading, setLoading] = useState(true);

  const orgId = currentOrg?.id;

  const fetchSteps = useCallback(async () => {
    if (!recipeId || !orgId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("recipe_method_steps")
      .select("*")
      .eq("recipe_id", recipeId)
      .eq("org_id", orgId)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching method steps:", error);
    } else {
      setSteps((data as MethodStep[]) || []);
    }
    setLoading(false);
  }, [recipeId, orgId]);

  useEffect(() => {
    fetchSteps();
  }, [fetchSteps]);

  // Group steps into sections
  const sections: MethodSection[] = steps.reduce<MethodSection[]>((acc, step) => {
    let section = acc.find(s => s.section_number === step.section_number);
    if (!section) {
      section = { section_number: step.section_number, section_title: step.section_title, steps: [] };
      acc.push(section);
    }
    section.steps.push(step);
    return acc;
  }, []).sort((a, b) => a.section_number - b.section_number);

  const addSection = async (title: string) => {
    if (!recipeId || !orgId) return;
    const nextSectionNum = sections.length > 0
      ? Math.max(...sections.map(s => s.section_number)) + 1
      : 1;
    const maxSort = steps.length > 0 ? Math.max(...steps.map(s => s.sort_order)) + 1 : 0;

    const { data, error } = await supabase
      .from("recipe_method_steps")
      .insert({
        org_id: orgId,
        recipe_id: recipeId,
        section_number: nextSectionNum,
        section_title: title,
        step_number: 1,
        instruction: "",
        sort_order: maxSort,
      } as any)
      .select()
      .single();

    if (error) {
      toast.error("Failed to add section");
      console.error(error);
    } else {
      setSteps(prev => [...prev, data as MethodStep]);
    }
  };

  const addStep = async (sectionNumber: number, sectionTitle: string) => {
    if (!recipeId || !orgId) return;
    const sectionSteps = steps.filter(s => s.section_number === sectionNumber);
    const nextStepNum = sectionSteps.length > 0
      ? Math.max(...sectionSteps.map(s => s.step_number)) + 1
      : 1;
    const maxSort = steps.length > 0 ? Math.max(...steps.map(s => s.sort_order)) + 1 : 0;

    const { data, error } = await supabase
      .from("recipe_method_steps")
      .insert({
        org_id: orgId,
        recipe_id: recipeId,
        section_number: sectionNumber,
        section_title: sectionTitle,
        step_number: nextStepNum,
        instruction: "",
        sort_order: maxSort,
      } as any)
      .select()
      .single();

    if (error) {
      toast.error("Failed to add step");
      console.error(error);
    } else {
      setSteps(prev => [...prev, data as MethodStep]);
    }
  };

  const updateStep = async (id: string, updates: Partial<MethodStep>) => {
    const { error } = await supabase
      .from("recipe_method_steps")
      .update(updates as any)
      .eq("id", id);

    if (error) {
      toast.error("Failed to update step");
      console.error(error);
    } else {
      setSteps(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    }
  };

  const deleteStep = async (id: string) => {
    const { error } = await supabase
      .from("recipe_method_steps")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete step");
      console.error(error);
    } else {
      setSteps(prev => prev.filter(s => s.id !== id));
    }
  };

  const updateSectionTitle = async (sectionNumber: number, newTitle: string) => {
    const sectionSteps = steps.filter(s => s.section_number === sectionNumber);
    const ids = sectionSteps.map(s => s.id);
    
    const { error } = await supabase
      .from("recipe_method_steps")
      .update({ section_title: newTitle } as any)
      .in("id", ids);

    if (error) {
      toast.error("Failed to rename section");
    } else {
      setSteps(prev => prev.map(s =>
        s.section_number === sectionNumber ? { ...s, section_title: newTitle } : s
      ));
    }
  };

  const deleteSection = async (sectionNumber: number) => {
    const sectionSteps = steps.filter(s => s.section_number === sectionNumber);
    const ids = sectionSteps.map(s => s.id);

    const { error } = await supabase
      .from("recipe_method_steps")
      .delete()
      .in("id", ids);

    if (error) {
      toast.error("Failed to delete section");
    } else {
      setSteps(prev => prev.filter(s => s.section_number !== sectionNumber));
    }
  };

  return {
    steps,
    sections,
    loading,
    addSection,
    addStep,
    updateStep,
    deleteStep,
    updateSectionTitle,
    deleteSection,
    refetch: fetchSteps,
  };
}

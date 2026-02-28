import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export interface PlatingStep {
  id: string;
  org_id: string;
  recipe_id: string;
  step_number: number;
  instruction: string;
  image_url: string | null;
  sort_order: number;
  created_at: string;
}

export function useRecipePlatingSteps(recipeId: string | undefined) {
  const { currentOrg } = useOrg();
  const [steps, setSteps] = useState<PlatingStep[]>([]);
  const [loading, setLoading] = useState(true);

  const orgId = currentOrg?.id;

  const fetchSteps = useCallback(async () => {
    if (!recipeId || !orgId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("recipe_plating_steps")
      .select("*")
      .eq("recipe_id", recipeId)
      .eq("org_id", orgId)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching plating steps:", error);
    } else {
      setSteps((data as PlatingStep[]) || []);
    }
    setLoading(false);
  }, [recipeId, orgId]);

  useEffect(() => {
    fetchSteps();
  }, [fetchSteps]);

  const addStep = async () => {
    if (!recipeId || !orgId) return;
    const nextNum = steps.length > 0 ? Math.max(...steps.map(s => s.step_number)) + 1 : 1;
    const maxSort = steps.length > 0 ? Math.max(...steps.map(s => s.sort_order)) + 1 : 0;

    const { data, error } = await supabase
      .from("recipe_plating_steps")
      .insert({
        org_id: orgId,
        recipe_id: recipeId,
        step_number: nextNum,
        instruction: "",
        sort_order: maxSort,
      } as any)
      .select()
      .single();

    if (error) {
      toast.error("Failed to add plating step");
      console.error(error);
    } else {
      setSteps(prev => [...prev, data as PlatingStep]);
    }
  };

  const updateStep = async (id: string, updates: Partial<PlatingStep>) => {
    const { error } = await supabase
      .from("recipe_plating_steps")
      .update(updates as any)
      .eq("id", id);

    if (error) {
      toast.error("Failed to update plating step");
      console.error(error);
    } else {
      setSteps(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    }
  };

  const deleteStep = async (id: string) => {
    const { error } = await supabase
      .from("recipe_plating_steps")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete plating step");
      console.error(error);
    } else {
      setSteps(prev => prev.filter(s => s.id !== id));
    }
  };

  return { steps, loading, addStep, updateStep, deleteStep, refetch: fetchSteps };
}

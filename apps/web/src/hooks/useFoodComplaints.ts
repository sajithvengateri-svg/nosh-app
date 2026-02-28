import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "./useOrgId";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface FoodComplaint {
  id: string;
  org_id: string;
  complaint_date: string;
  complaint_text: string;
  source: string;
  severity: string;
  recipe_id: string | null;
  recipe_name: string | null;
  section_id: string | null;
  section_name: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  dish_name: string | null;
  category: string;
  resolution: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useFoodComplaints(recipeId?: string) {
  const orgId = useOrgId();
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<FoodComplaint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    let query = (supabase as any)
      .from("food_complaints")
      .select("*")
      .eq("org_id", orgId)
      .order("complaint_date", { ascending: false });
    if (recipeId) {
      query = query.eq("recipe_id", recipeId);
    }
    const { data, error } = await query;
    if (error) {
      console.error(error);
      toast.error("Failed to load complaints");
    }
    setComplaints(data || []);
    setLoading(false);
  }, [orgId, recipeId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addComplaint = async (payload: Partial<FoodComplaint>) => {
    if (!orgId) return;
    const { error } = await (supabase as any)
      .from("food_complaints")
      .insert({ ...payload, org_id: orgId, created_by: user?.id });
    if (error) { toast.error("Failed to add complaint"); return; }
    toast.success("Complaint logged");
    fetch();
  };

  const updateComplaint = async (id: string, payload: Partial<FoodComplaint>) => {
    const { error } = await (supabase as any)
      .from("food_complaints")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error("Failed to update complaint"); return; }
    toast.success("Complaint updated");
    fetch();
  };

  const resolveComplaint = async (id: string, resolution: string) => {
    const { error } = await (supabase as any)
      .from("food_complaints")
      .update({
        status: "resolved",
        resolution,
        resolved_at: new Date().toISOString(),
        resolved_by: user?.id,
      })
      .eq("id", id);
    if (error) { toast.error("Failed to resolve"); return; }
    toast.success("Complaint resolved");
    fetch();
  };

  const deleteComplaint = async (id: string) => {
    const { error } = await (supabase as any)
      .from("food_complaints")
      .delete()
      .eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Complaint deleted");
    fetch();
  };

  return { complaints, loading, addComplaint, updateComplaint, resolveComplaint, deleteComplaint, refetch: fetch };
}

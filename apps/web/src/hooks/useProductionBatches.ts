import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "./useOrgId";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ProductionBatchRow {
  id: string;
  org_id: string;
  recipe_id: string | null;
  recipe_name: string;
  batch_code: string;
  quantity: number;
  unit: string;
  servings_produced: number;
  production_date: string;
  expiry_date: string | null;
  shelf_life_days: number | null;
  produced_by: string | null;
  produced_by_name: string | null;
  status: string;
  actual_cost: number | null;
  scale_factor: number | null;
  notes: string | null;
  created_at: string;
}

export interface CreateBatchInput {
  recipe_id?: string;
  recipe_name: string;
  quantity: number;
  unit: string;
  servings_produced: number;
  shelf_life_days: number;
  actual_cost?: number;
  scale_factor?: number;
  notes?: string;
}

export function useProductionBatches() {
  const orgId = useOrgId();
  const { user } = useAuth();
  const [batches, setBatches] = useState<ProductionBatchRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBatches = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("production_batches")
      .select("*")
      .eq("org_id", orgId)
      .order("production_date", { ascending: false });
    if (error) {
      console.error(error);
      toast.error("Failed to load batches");
    }
    setBatches(data || []);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  const createBatch = async (input: CreateBatchInput): Promise<ProductionBatchRow | null> => {
    if (!orgId || !user) return null;

    // Generate batch code: XX-YYYYMMDD-NNN
    const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const prefix = input.recipe_name.substring(0, 2).toUpperCase();
    const count = batches.filter(b => b.batch_code.startsWith(`${prefix}-${today}`)).length + 1;
    const batchCode = `${prefix}-${today}-${count.toString().padStart(3, "0")}`;

    const productionDate = new Date();
    const expiryDate = new Date(productionDate);
    expiryDate.setDate(expiryDate.getDate() + input.shelf_life_days);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    const producedByName = profileData?.full_name || user.email?.split("@")[0] || "You";

    const { data, error } = await supabase
      .from("production_batches")
      .insert({
        org_id: orgId,
        recipe_id: input.recipe_id || null,
        recipe_name: input.recipe_name,
        batch_code: batchCode,
        quantity: input.quantity,
        unit: input.unit,
        servings_produced: input.servings_produced,
        production_date: productionDate.toISOString(),
        expiry_date: expiryDate.toISOString(),
        shelf_life_days: input.shelf_life_days,
        produced_by: user.id,
        produced_by_name: producedByName,
        status: "completed",
        actual_cost: input.actual_cost || null,
        scale_factor: input.scale_factor || null,
        notes: input.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      toast.error("Failed to create batch");
      return null;
    }

    // Also create an expiry log entry
    await (supabase as any)
      .from("production_expiry_log")
      .insert({
        org_id: orgId,
        recipe_id: input.recipe_id || null,
        recipe_name: input.recipe_name,
        batch_code: batchCode,
        produced_at: productionDate.toISOString(),
        expires_at: expiryDate.toISOString(),
        status: "active",
        alert_hours_before: 24,
      });

    toast.success(`Batch ${batchCode} logged!`);
    fetchBatches();
    return data;
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("production_batches")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update batch");
      return;
    }
    toast.success("Batch updated");
    fetchBatches();
  };

  return { batches, loading, createBatch, updateStatus, refetch: fetchBatches };
}

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "./useOrgId";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface RestingTimer {
  id: string;
  org_id: string;
  recipe_id: string | null;
  recipe_name: string | null;
  batch_code: string | null;
  resting_type: string | null;
  started_at: string;
  target_duration_hours: number;
  expected_end_at: string | null;
  actual_end_at: string | null;
  status: string;
  check_intervals_hours: number;
  last_check_at: string | null;
  check_count: number;
  notes: string | null;
  started_by: string | null;
  completed_by: string | null;
  created_at: string;
}

export function useBatchResting() {
  const orgId = useOrgId();
  const { user } = useAuth();
  const [timers, setTimers] = useState<RestingTimer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("batch_resting_timers")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      toast.error("Failed to load resting timers");
    }
    setTimers(data || []);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { fetch(); }, [fetch]);

  const startTimer = async (payload: {
    recipe_id?: string;
    recipe_name: string;
    batch_code: string;
    resting_type: string;
    target_duration_hours: number;
    check_intervals_hours?: number;
    notes?: string;
  }) => {
    if (!orgId) return;
    const startedAt = new Date();
    const expectedEnd = new Date(startedAt.getTime() + payload.target_duration_hours * 3600000);
    const { error } = await (supabase as any)
      .from("batch_resting_timers")
      .insert({
        org_id: orgId,
        recipe_id: payload.recipe_id || null,
        recipe_name: payload.recipe_name,
        batch_code: payload.batch_code,
        resting_type: payload.resting_type,
        started_at: startedAt.toISOString(),
        target_duration_hours: payload.target_duration_hours,
        expected_end_at: expectedEnd.toISOString(),
        check_intervals_hours: payload.check_intervals_hours || 0,
        notes: payload.notes || null,
        started_by: user?.id,
        status: "resting",
      });
    if (error) { toast.error("Failed to start timer"); return; }
    toast.success("Resting timer started");
    fetch();
  };

  const logCheck = async (id: string) => {
    const timer = timers.find(t => t.id === id);
    if (!timer) return;
    const { error } = await (supabase as any)
      .from("batch_resting_timers")
      .update({
        last_check_at: new Date().toISOString(),
        check_count: (timer.check_count || 0) + 1,
      })
      .eq("id", id);
    if (error) { toast.error("Failed to log check"); return; }
    toast.success("Check logged");
    fetch();
  };

  const completeTimer = async (id: string) => {
    const { error } = await (supabase as any)
      .from("batch_resting_timers")
      .update({
        status: "completed",
        actual_end_at: new Date().toISOString(),
        completed_by: user?.id,
      })
      .eq("id", id);
    if (error) { toast.error("Failed to complete"); return; }
    toast.success("Resting completed");
    fetch();
  };

  return { timers, loading, startTimer, logCheck, completeTimer, refetch: fetch };
}

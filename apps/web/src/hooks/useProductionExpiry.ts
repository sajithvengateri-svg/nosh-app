import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "./useOrgId";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ExpiryLogEntry {
  id: string;
  org_id: string;
  recipe_id: string | null;
  recipe_name: string | null;
  batch_code: string | null;
  produced_at: string;
  expires_at: string | null;
  storage_temp: string | null;
  storage_notes: string | null;
  status: string;
  last_checked_at: string | null;
  checked_by: string | null;
  check_notes: string | null;
  alert_hours_before: number;
  alert_sent: boolean;
  created_at: string;
}

export function useProductionExpiry() {
  const orgId = useOrgId();
  const { user } = useAuth();
  const [entries, setEntries] = useState<ExpiryLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("production_expiry_log")
      .select("*")
      .eq("org_id", orgId)
      .order("expires_at", { ascending: true });
    if (error) {
      console.error(error);
      toast.error("Failed to load expiry logs");
    }
    setEntries(data || []);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addEntry = async (payload: Partial<ExpiryLogEntry>) => {
    if (!orgId) return;
    const { error } = await (supabase as any)
      .from("production_expiry_log")
      .insert({ ...payload, org_id: orgId });
    if (error) { toast.error("Failed to add expiry entry"); return; }
    toast.success("Expiry entry logged");
    fetch();
  };

  const checkEntry = async (id: string, notes: string) => {
    const { error } = await (supabase as any)
      .from("production_expiry_log")
      .update({
        last_checked_at: new Date().toISOString(),
        checked_by: user?.id,
        check_notes: notes,
        status: "checked",
      })
      .eq("id", id);
    if (error) { toast.error("Failed to log check"); return; }
    toast.success("Check logged");
    fetch();
  };

  const discardEntry = async (id: string) => {
    const { error } = await (supabase as any)
      .from("production_expiry_log")
      .update({ status: "discarded" })
      .eq("id", id);
    if (error) { toast.error("Failed to discard"); return; }
    toast.success("Marked as discarded");
    fetch();
  };

  return { entries, loading, addEntry, checkEntry, discardEntry, refetch: fetch };
}

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthProvider";
import { useOrg } from "../contexts/OrgProvider";
import { useAppSettings } from "../hooks/useAppSettings";

interface UnlockProgress {
  temps: boolean;
  prep: boolean;
  wastage: boolean;
}

interface GameUnlockState {
  isUnlocked: boolean;
  progress: UnlockProgress;
  loading: boolean;
  unlockTime: string | null;
  refresh: () => void;
}

export function useGameUnlock(): GameUnlockState {
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const { settings } = useAppSettings();
  const orgId = currentOrg?.id;
  const bypassEnabled = settings?.devGameUnlockBypass ?? false;

  const [progress, setProgress] = useState<UnlockProgress>({ temps: false, prep: false, wastage: false });
  const [unlockTime, setUnlockTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkStatus = useCallback(async () => {
    if (bypassEnabled) {
      setProgress({ temps: true, prep: true, wastage: true });
      setUnlockTime(new Date().toISOString());
      setLoading(false);
      return;
    }

    if (!orgId || !user?.id) {
      setLoading(false);
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    try {
      const [tempsRes, prepRes, wastageRes] = await Promise.all([
        supabase
          .from("daily_compliance_logs")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId)
          .eq("log_date", today)
          .in("log_type", ["fridge_temp", "freezer_temp"]),
        supabase
          .from("todo_items" as any)
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId)
          .eq("is_complete", true)
          .gte("updated_at", today),
        supabase
          .from("food_safety_logs" as any)
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId)
          .gte("created_at", today),
      ]);

      const temps = (tempsRes.count ?? 0) > 0;
      const prep = (prepRes.count ?? 0) > 0;
      const wastage = (wastageRes.count ?? 0) > 0;

      setProgress({ temps, prep, wastage });

      if (temps && prep && wastage) {
        // Upsert unlock record
        const { data } = await supabase
          .from("game_daily_unlocks" as any)
          .select("unlocked_at")
          .eq("user_id", user.id)
          .eq("unlock_date", today)
          .maybeSingle();

        if (data?.unlocked_at) {
          setUnlockTime(data.unlocked_at);
        } else {
          const now = new Date().toISOString();
          await supabase.from("game_daily_unlocks" as any).upsert({
            org_id: orgId,
            user_id: user.id,
            unlock_date: today,
            temps_logged: true,
            prep_done: true,
            wastage_checked: true,
            unlocked_at: now,
          } as any, { onConflict: "org_id,user_id,unlock_date" });
          setUnlockTime(now);
        }
      }
    } catch {
      // Silent fail
    }
    setLoading(false);
  }, [orgId, user?.id, bypassEnabled]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // TODO: restore compliance gate after Supabase migration is live
  const isUnlocked = true;

  return { isUnlocked, progress, loading, unlockTime, refresh: checkStatus };
}

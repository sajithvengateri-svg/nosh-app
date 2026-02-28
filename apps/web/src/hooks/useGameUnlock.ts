import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgId } from "@/hooks/useOrgId";
import { useAppSettings } from "@/hooks/useAppSettings";
import { format } from "date-fns";

interface UnlockProgress {
  temps: boolean;
  prep: boolean;
  wastage: boolean;
}

interface GameUnlockState {
  isUnlocked: boolean;
  progress: UnlockProgress;
  unlockTime: string | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Core compliance gate hook.
 * Checks if the user has completed today's 3 compliance tasks:
 * 1. Temps Logged — at least 1 temp entry in daily_compliance_logs today
 * 2. Prep Done — at least 1 todo_item completed today
 * 3. Wastage Checked — at least 1 waste log entry today
 *
 * Adapts per variant via the org's compliance framework.
 */
export function useGameUnlock(): GameUnlockState {
  const { user } = useAuth();
  const orgId = useOrgId();
  const { settings } = useAppSettings();
  const [progress, setProgress] = useState<UnlockProgress>({
    temps: false,
    prep: false,
    wastage: false,
  });
  const [unlockTime, setUnlockTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize today's date string so it doesn't cause useCallback churn
  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const bypassEnabled = settings.devGameUnlockBypass;
  const isUnlocked = bypassEnabled || (progress.temps && progress.prep && progress.wastage);

  const checkUnlockStatus = useCallback(async () => {
    if (bypassEnabled) {
      setProgress({ temps: true, prep: true, wastage: true });
      setUnlockTime(new Date().toISOString());
      setIsLoading(false);
      return;
    }

    if (!user?.id || !orgId) {
      setIsLoading(false);
      return;
    }

    try {
      // Check for existing unlock record
      const { data: existing } = await supabase
        .from("game_daily_unlocks" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("unlock_date", today)
        .maybeSingle();

      if (existing && (existing as any).unlocked_at) {
        setProgress({ temps: true, prep: true, wastage: true });
        setUnlockTime((existing as any).unlocked_at);
        setIsLoading(false);
        return;
      }

      // Check each condition independently against existing tables

      // 1. Temps logged today
      const { count: tempCount } = await supabase
        .from("daily_compliance_logs")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId)
        .eq("log_date", today)
        .in("log_type", ["fridge_temp", "freezer_temp"]);

      const tempsLogged = (tempCount ?? 0) > 0;

      // 2. Prep done today (any todo completed today)
      const { count: prepCount } = await supabase
        .from("todo_items")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId)
        .eq("status", "completed")
        .gte("updated_at", `${today}T00:00:00`)
        .lte("updated_at", `${today}T23:59:59`);

      const prepDone = (prepCount ?? 0) > 0;

      // 3. Wastage checked today
      // Check food_safety_logs for waste-related entries or any log type
      const { count: wasteCount } = await supabase
        .from("food_safety_logs")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId)
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`);

      const wastageChecked = (wasteCount ?? 0) > 0;

      const newProgress = {
        temps: tempsLogged,
        prep: prepDone,
        wastage: wastageChecked,
      };
      setProgress(newProgress);

      const allDone = tempsLogged && prepDone && wastageChecked;

      // Upsert the unlock record
      const unlockData = {
        org_id: orgId,
        user_id: user.id,
        unlock_date: today,
        temps_logged: tempsLogged,
        prep_done: prepDone,
        wastage_checked: wastageChecked,
        unlocked_at: allDone ? new Date().toISOString() : null,
      };

      if (existing) {
        await supabase
          .from("game_daily_unlocks" as any)
          .update(unlockData as any)
          .eq("id", (existing as any).id);
      } else {
        await supabase
          .from("game_daily_unlocks" as any)
          .insert(unlockData as any);
      }

      if (allDone) {
        setUnlockTime(new Date().toISOString());
      }
    } catch (error) {
      console.error("Error checking game unlock:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, orgId, today, bypassEnabled]);

  useEffect(() => {
    checkUnlockStatus();
  }, [checkUnlockStatus]);

  return {
    isUnlocked,
    progress,
    unlockTime,
    isLoading,
    refresh: checkUnlockStatus,
  };
}

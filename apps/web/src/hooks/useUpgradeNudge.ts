import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgId } from "@/hooks/useOrgId";

interface UpgradeNudge {
  id: string;
  nudge_type: string;
  metadata: Record<string, any>;
  created_at: string;
}

/**
 * Fetches the latest unseen upgrade nudge for the current user.
 * Returns the nudge and functions to dismiss or mark as converted.
 */
export function useUpgradeNudge() {
  const { user } = useAuth();
  const orgId = useOrgId();
  const [nudge, setNudge] = useState<UpgradeNudge | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchNudge = async () => {
      try {
        const { data } = await supabase
          .from("upgrade_nudges")
          .select("*")
          .eq("user_id", user.id)
          .is("seen_at", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        setNudge(data as UpgradeNudge | null);
      } catch {
        // Non-critical
      } finally {
        setIsLoading(false);
      }
    };

    fetchNudge();
  }, [user?.id]);

  const markSeen = async () => {
    if (!nudge) return;
    await supabase
      .from("upgrade_nudges")
      .update({ seen_at: new Date().toISOString() } as any)
      .eq("id", nudge.id);
  };

  const dismiss = async () => {
    if (!nudge) return;
    await supabase
      .from("upgrade_nudges")
      .update({ dismissed_at: new Date().toISOString() } as any)
      .eq("id", nudge.id);
    setNudge(null);
  };

  const markConverted = async () => {
    if (!nudge) return;
    await supabase
      .from("upgrade_nudges")
      .update({ converted_at: new Date().toISOString() } as any)
      .eq("id", nudge.id);
    setNudge(null);
  };

  return { nudge, isLoading, markSeen, dismiss, markConverted };
}

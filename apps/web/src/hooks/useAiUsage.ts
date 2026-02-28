import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "./useOrgId";

interface AiUsageData {
  pctUsed: number;
  tokensUsed: number;
  tokensLimit: number;
  isLoading: boolean;
}

/**
 * Hook to fetch the current org's AI token usage for the month.
 * Uses the get_org_ai_usage RPC (SECURITY DEFINER).
 * Refreshes every 5 minutes.
 */
export function useAiUsage(): AiUsageData {
  const orgId = useOrgId();
  const [data, setData] = useState<AiUsageData>({
    pctUsed: 0,
    tokensUsed: 0,
    tokensLimit: 0,
    isLoading: true,
  });

  useEffect(() => {
    if (!orgId) {
      setData((d) => ({ ...d, isLoading: false }));
      return;
    }

    let cancelled = false;

    const fetch = async () => {
      const { data: row, error } = await supabase.rpc("get_org_ai_usage", {
        p_org_id: orgId,
      });

      if (cancelled) return;

      if (error || !row || (Array.isArray(row) && row.length === 0)) {
        setData({ pctUsed: 0, tokensUsed: 0, tokensLimit: 0, isLoading: false });
        return;
      }

      const r = Array.isArray(row) ? row[0] : row;
      setData({
        pctUsed: Number(r.pct_used ?? 0),
        tokensUsed: Number(r.tokens_used ?? 0),
        tokensLimit: Number(r.tokens_limit ?? 0),
        isLoading: false,
      });
    };

    fetch();
    const interval = setInterval(fetch, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [orgId]);

  return data;
}

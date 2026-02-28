import { useCallback, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

/**
 * Lightweight beta analytics hook for mobile.
 * Logs page_view, action, and session events to beta_analytics_events.
 *
 * Usage:
 *   const track = useBetaTrack("chefos_au");
 *   track.pageView("food-safety");
 *   track.action("food-safety", "log_temp");
 */

interface TrackOptions {
  page?: string;
  action?: string;
  metadata?: Record<string, unknown>;
  duration_ms?: number;
}

export function useBetaTrack(variant: string) {
  const sessionStart = useRef(Date.now());

  const log = useCallback(
    async (event_type: string, opts: TrackOptions = {}) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from("beta_analytics_events").insert({
          user_id: user?.id ?? null,
          variant,
          event_type,
          page: opts.page ?? null,
          action: opts.action ?? null,
          metadata: opts.metadata ?? {},
          duration_ms: opts.duration_ms ?? null,
        });
      } catch {
        // Silent — analytics should never break the app
      }
    },
    [variant]
  );

  const pageView = useCallback(
    (page: string, metadata?: Record<string, unknown>) => {
      log("page_view", { page, metadata });
    },
    [log]
  );

  const action = useCallback(
    (page: string, actionName: string, metadata?: Record<string, unknown>) => {
      log("action", { page, action: actionName, metadata });
    },
    [log]
  );

  useEffect(() => {
    log("session_start");
    return () => {
      const duration_ms = Date.now() - sessionStart.current;
      log("session_end", { duration_ms });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { pageView, action, log };
}

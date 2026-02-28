// Realtime hook — wraps Supabase realtime subscriptions
// Works in both React web and React Native

import { useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";

type PostgresEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

interface UseRealtimeOptions {
  table: string;
  schema?: string;
  event?: PostgresEvent;
  filter?: string;
  onPayload: (payload: any) => void;
  enabled?: boolean;
}

/**
 * Subscribe to Supabase realtime changes on a table.
 * Automatically unsubscribes on unmount.
 */
export const useRealtime = ({
  table,
  schema = "public",
  event = "*",
  filter,
  onPayload,
  enabled = true,
}: UseRealtimeOptions) => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const channelConfig: any = {
      event,
      schema,
      table,
    };
    if (filter) channelConfig.filter = filter;

    channelRef.current = supabase
      .channel(`realtime-${table}-${event}`)
      .on("postgres_changes", channelConfig, onPayload)
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [table, schema, event, filter, enabled]);
  // Note: onPayload intentionally excluded from deps to avoid re-subscribing on every render
};

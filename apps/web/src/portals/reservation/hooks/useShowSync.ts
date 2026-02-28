import { useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export type ShowDataSource = "manual" | "website" | "airtable" | "api";

interface ShowSyncConfig {
  source: ShowDataSource;
  website_url?: string;
  airtable_base_id?: string;
  airtable_table_name?: string;
  airtable_api_key?: string;
  api_url?: string;
  api_auth_header?: string;
}

export function useShowSync() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  const [isSyncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const syncShows = async (config: ShowSyncConfig) => {
    if (!orgId) return;
    setSyncing(true);
    setError(null);

    try {
      switch (config.source) {
        case "website": {
          // Call the scrape-shows Edge Function
          const { data, error: fnError } = await supabase.functions.invoke("scrape-shows", {
            body: { url: config.website_url, org_id: orgId },
          });
          if (fnError) throw new Error(fnError.message);
          setLastSyncAt(new Date().toISOString());
          break;
        }
        case "airtable": {
          // Direct Airtable API call
          if (!config.airtable_base_id || !config.airtable_table_name || !config.airtable_api_key) {
            throw new Error("Airtable base ID, table name, and API key are required");
          }
          const res = await fetch(
            `https://api.airtable.com/v0/${config.airtable_base_id}/${encodeURIComponent(config.airtable_table_name)}`,
            { headers: { Authorization: `Bearer ${config.airtable_api_key}` } }
          );
          if (!res.ok) throw new Error(`Airtable API error: ${res.status}`);
          const airtableData = await res.json();

          // Map Airtable records to res_shows rows
          const records = (airtableData.records || []).map((r: any) => ({
            org_id: orgId,
            external_id: r.id,
            title: r.fields.Title || r.fields.Name || "Untitled",
            venue_name: r.fields.Venue || null,
            show_date: r.fields.Date || null,
            doors_time: r.fields.Doors || null,
            curtain_time: r.fields.Curtain || r.fields.Start || "19:00",
            end_time: r.fields.End || null,
            genre: r.fields.Genre || null,
            expected_attendance: r.fields.Attendance || null,
            source: "airtable",
            is_suggestion: true,
            is_active: true,
          })).filter((r: any) => r.show_date);

          if (records.length > 0) {
            const { error: insertErr } = await supabase
              .from("res_shows")
              .upsert(records, { onConflict: "org_id,external_id" as any, ignoreDuplicates: false });
            if (insertErr) throw insertErr;
          }
          setLastSyncAt(new Date().toISOString());
          break;
        }
        case "api": {
          if (!config.api_url) throw new Error("API URL is required");
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (config.api_auth_header) headers["Authorization"] = config.api_auth_header;

          const res = await fetch(config.api_url, { headers });
          if (!res.ok) throw new Error(`API error: ${res.status}`);
          const apiData = await res.json();

          const shows = (Array.isArray(apiData) ? apiData : apiData.shows || apiData.data || [])
            .map((s: any) => ({
              org_id: orgId,
              external_id: s.id || s.external_id || null,
              title: s.title || s.name || "Untitled",
              venue_name: s.venue || s.venue_name || null,
              show_date: s.date || s.show_date || null,
              curtain_time: s.curtain_time || s.start_time || s.time || "19:00",
              doors_time: s.doors_time || null,
              end_time: s.end_time || null,
              genre: s.genre || null,
              expected_attendance: s.attendance || s.expected_attendance || null,
              source: "api",
              is_suggestion: true,
              is_active: true,
            }))
            .filter((s: any) => s.show_date);

          if (shows.length > 0) {
            const { error: insertErr } = await supabase.from("res_shows").upsert(shows, { ignoreDuplicates: false });
            if (insertErr) throw insertErr;
          }
          setLastSyncAt(new Date().toISOString());
          break;
        }
        case "manual":
          // No-op
          break;
      }

      queryClient.invalidateQueries({ queryKey: ["res_shows"] });
    } catch (err: any) {
      setError(err.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  // Confirm a suggested show
  const confirmShow = async (showId: string) => {
    await supabase.from("res_shows").update({ is_suggestion: false }).eq("id", showId);
    queryClient.invalidateQueries({ queryKey: ["res_shows"] });
  };

  // Dismiss a suggested show
  const dismissShow = async (showId: string) => {
    await supabase.from("res_shows").update({ is_active: false }).eq("id", showId);
    queryClient.invalidateQueries({ queryKey: ["res_shows"] });
  };

  return {
    isSyncing,
    lastSyncAt,
    error,
    syncShows,
    confirmShow,
    dismissShow,
  };
}

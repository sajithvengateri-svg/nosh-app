import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useOrg } from "../contexts/OrgProvider";

export interface Reservation {
  id: string;
  guest_name: string;
  party_size: number;
  time: string;
  status: string;
  dietary_notes: string | null;
  table_number: string | null;
  occasion: string | null;
  guest?: { vip_tier: string | null; visit_count: number | null } | null;
}

interface ImportedCoverData {
  id: string;
  data_type: string;
  payload: { covers?: number; bookings?: number; date?: string } | null;
  synced_at: string;
}

function getDateRange(selectedDate: Date, viewMode: "day" | "week"): { start: string; end: string } {
  if (viewMode === "day") {
    const d = selectedDate.toISOString().split("T")[0];
    return { start: d, end: d };
  }
  const day = selectedDate.getDay();
  const monday = new Date(selectedDate);
  monday.setDate(selectedDate.getDate() - ((day === 0 ? 7 : day) - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split("T")[0],
    end: sunday.toISOString().split("T")[0],
  };
}

export function useReservationData(selectedDate: Date, viewMode: "day" | "week") {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const { start, end } = getDateRange(selectedDate, viewMode);

  const { data: reservations, isLoading } = useQuery<Reservation[]>({
    queryKey: ["reservations", orgId, start, end],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("res_reservations")
        .select("id, guest_name, party_size, time, status, dietary_notes, table_number, occasion, guest:res_guests(vip_tier, visit_count)")
        .eq("org_id", orgId)
        .gte("date", start)
        .lte("date", end)
        .in("status", ["CONFIRMED", "SEATED"])
        .order("time", { ascending: true });
      if (error) return [];
      // Supabase joins return array — flatten to single object
      const mapped = (data || []).map((r: any) => ({
        ...r,
        guest: Array.isArray(r.guest) ? r.guest[0] || null : r.guest,
      }));
      return mapped as Reservation[];
    },
    enabled: !!orgId,
  });

  // Fallback: check data_imports for external reservation data
  const { data: importedData } = useQuery<ImportedCoverData[]>({
    queryKey: ["imported-covers", orgId, start, end],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("data_imports")
        .select("id, data_type, payload, synced_at")
        .eq("org_id", orgId)
        .eq("data_type", "covers")
        .gte("synced_at", start + "T00:00:00")
        .lte("synced_at", end + "T23:59:59")
        .order("synced_at", { ascending: false })
        .limit(10);
      if (error) return [];
      return (data as ImportedCoverData[]) || [];
    },
    enabled: !!orgId && (!reservations || reservations.length === 0),
  });

  const stats = useMemo(() => {
    const list = reservations || [];
    const totalCovers = list.reduce((s, r) => s + (r.party_size || 0), 0);
    const totalBookings = list.length;
    const vipCount = list.filter((r) => r.guest?.vip_tier && r.guest.vip_tier !== "none").length;
    const avgPartySize = totalBookings > 0 ? Math.round(totalCovers / totalBookings) : 0;
    const upcoming = list.slice(0, 3);

    // Weekly: covers per day
    const coversByDay: Record<string, number> = {};
    if (viewMode === "week") {
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        coversByDay[d.toISOString().split("T")[0]] = 0;
      }
      // Note: res_reservations doesn't have a `date` field in the query results
      // so we just show aggregated totals for week view
    }

    // Fallback stats from imported data
    let importedCovers = 0;
    let importedBookings = 0;
    if (list.length === 0 && importedData && importedData.length > 0) {
      for (const imp of importedData) {
        importedCovers += imp.payload?.covers || 0;
        importedBookings += imp.payload?.bookings || 0;
      }
    }

    const hasData = list.length > 0 || importedCovers > 0;
    const isFromImport = list.length === 0 && importedCovers > 0;

    return {
      totalCovers: list.length > 0 ? totalCovers : importedCovers,
      totalBookings: list.length > 0 ? totalBookings : importedBookings,
      vipCount,
      avgPartySize,
      upcoming,
      hasData,
      isFromImport,
      lastSynced: isFromImport && importedData?.[0]?.synced_at ? importedData[0].synced_at : null,
    };
  }, [reservations, importedData, viewMode, start]);

  return { reservations: reservations || [], stats, isLoading };
}

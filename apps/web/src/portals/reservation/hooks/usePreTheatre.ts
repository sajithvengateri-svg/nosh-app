import { useQuery } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { ResShow } from "@/lib/shared/types/res.types";
import { format, differenceInMinutes, parse } from "date-fns";

const DEFAULT_BILL_DROP_LEAD_MIN = 5;

export function usePreTheatre(date?: string) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const targetDate = date || format(new Date(), "yyyy-MM-dd");

  // Fetch shows for a date (up to 6 sessions)
  const { data: shows = [], isLoading: showsLoading } = useQuery<ResShow[]>({
    queryKey: ["res_shows", orgId, targetDate],
    queryFn: async () => {
      const { data } = await supabase
        .from("res_shows")
        .select("*")
        .eq("org_id", orgId!)
        .eq("show_date", targetDate)
        .eq("is_active", true)
        .order("curtain_time");
      return (data ?? []) as ResShow[];
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  // Confirmed shows only (not suggestions)
  const confirmedShows = shows.filter((s) => !s.is_suggestion);
  const suggestedShows = shows.filter((s) => s.is_suggestion);

  // Fetch pre-theatre reservations for date
  const { data: preTheatreReservations = [], isLoading: reservationsLoading } = useQuery({
    queryKey: ["pre_theatre_reservations", orgId, targetDate],
    queryFn: async () => {
      const { data } = await supabase
        .from("res_reservations")
        .select("*, res_shows!show_id(title, curtain_time)")
        .eq("org_id", orgId!)
        .eq("date", targetDate)
        .eq("is_pre_theatre", true)
        .not("status", "in", "(CANCELLED,NO_SHOW)");
      return data ?? [];
    },
    enabled: !!orgId,
    staleTime: 30 * 1000,
  });

  // Bill-drop countdown for a specific show
  const billDropCountdown = (curtainTime: string, leadMinutes = DEFAULT_BILL_DROP_LEAD_MIN): number => {
    const now = new Date();
    const curtain = parse(`${targetDate} ${curtainTime}`, "yyyy-MM-dd HH:mm:ss", new Date());
    const billDropTime = new Date(curtain.getTime() - leadMinutes * 60 * 1000);
    return differenceInMinutes(billDropTime, now);
  };

  // Check if a reservation should have bill dropped now
  const shouldAutoBillDrop = (reservation: any, leadMinutes = DEFAULT_BILL_DROP_LEAD_MIN): boolean => {
    if (!reservation.is_pre_theatre || reservation.bill_dropped_at) return false;
    if (reservation.status !== "SEATED") return false;
    const show = reservation.res_shows;
    if (!show?.curtain_time) return false;
    return billDropCountdown(show.curtain_time, leadMinutes) <= 0;
  };

  // Pacing data per show
  const preTheatrePacing = () => {
    return confirmedShows.map((show) => {
      const showReservations = preTheatreReservations.filter((r: any) => r.show_id === show.id);
      const total = showReservations.length;
      const seated = showReservations.filter((r: any) => r.status === "SEATED").length;
      const billed = showReservations.filter((r: any) => r.bill_dropped_at).length;
      const completed = showReservations.filter((r: any) => r.status === "COMPLETED").length;
      const minutesToCurtain = billDropCountdown(show.curtain_time, 0);
      const minutesToBillDrop = billDropCountdown(show.curtain_time);

      return {
        show,
        total,
        seated,
        billed,
        completed,
        remaining: total - completed,
        minutesToCurtain,
        minutesToBillDrop,
        urgency: minutesToBillDrop <= 0 ? "critical" as const
          : minutesToBillDrop <= 15 ? "urgent" as const
          : minutesToBillDrop <= 30 ? "warning" as const
          : "normal" as const,
      };
    });
  };

  return {
    shows,
    confirmedShows,
    suggestedShows,
    showsLoading,
    preTheatreReservations,
    reservationsLoading,
    billDropCountdown,
    shouldAutoBillDrop,
    preTheatrePacing,
  };
}

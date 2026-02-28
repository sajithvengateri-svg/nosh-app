import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import type { JourneyStage } from "@/lib/shared/types/res.types";
import {
  fetchJourneyEvents,
  fetchPosOrdersByReservationIds,
} from "@/lib/shared/queries/resQueries";

/**
 * Computes the 6-stage guest journey for the ResOS Dashboard.
 *
 * Stages:
 *   ARRIVING  -> SEATED  -> ORDERED  -> IN_SERVICE  -> BILL  -> LEFT
 *
 * POS order data is polled every 30 seconds so the dashboard
 * stays up-to-date without manual refreshes.
 */
export function useReservationJourney(reservations: any[]) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  // Collect all reservation IDs once so we can batch-fetch POS orders.
  const reservationIds = useMemo(
    () => reservations.map((r) => r.id as string),
    [reservations],
  );

  // --- Queries ---------------------------------------------------------------

  const {
    data: journeyEventsData,
    isLoading: isLoadingEvents,
  } = useQuery({
    queryKey: ["journeyEvents", orgId, reservationIds],
    queryFn: async () => {
      const { data } = await fetchJourneyEvents(orgId!, reservationIds);
      return data ?? [];
    },
    enabled: !!orgId && reservationIds.length > 0,
  });

  const {
    data: posOrdersData,
    isLoading: isLoadingPos,
  } = useQuery({
    queryKey: ["posOrdersByReservation", reservationIds],
    queryFn: async () => {
      const { data } = await fetchPosOrdersByReservationIds(reservationIds);
      return data ?? [];
    },
    enabled: reservationIds.length > 0,
    refetchInterval: 30_000, // poll every 30 s
  });

  // --- Stage resolution ------------------------------------------------------

  /**
   * Build a lookup from reservation_id -> POS order so stage detection
   * is O(1) per reservation rather than a nested scan.
   */
  const posOrderByReservationId = useMemo(() => {
    const map = new Map<string, any>();
    if (posOrdersData && Array.isArray(posOrdersData)) {
      for (const order of posOrdersData) {
        map.set(order.reservation_id, order);
      }
    }
    return map;
  }, [posOrdersData]);

  /**
   * Determine the current journey stage for a single reservation.
   */
  const getStage = useMemo(() => {
    return (reservation: any): JourneyStage => {
      const { status, notes, id } = reservation;
      const posOrder = posOrderByReservationId.get(id);

      // LEFT
      if (status === "COMPLETED") return "LEFT";

      // ARRIVING
      if (status === "CONFIRMED") return "ARRIVING";

      // Remaining stages all require status === 'SEATED'
      if (status === "SEATED") {
        // BILL — POS order is paid, OR the legacy [BILL_DROPPED] note marker
        if (posOrder?.status === "PAID" || notes?.includes("[BILL_DROPPED]")) {
          return "BILL";
        }

        // IN_SERVICE — POS order is being prepared or ready
        if (posOrder?.status === "IN_PROGRESS" || posOrder?.status === "READY") {
          return "IN_SERVICE";
        }

        // ORDERED — a POS order exists (any status not caught above)
        if (posOrder) return "ORDERED";

        // SEATED — no POS order at all
        return "SEATED";
      }

      // Fallback for any unexpected status
      return "ARRIVING";
    };
  }, [posOrderByReservationId]);

  // --- Grouped output --------------------------------------------------------

  const { stages, counts } = useMemo(() => {
    const stageMap = new Map<JourneyStage, any[]>([
      ["ARRIVING", []],
      ["SEATED", []],
      ["ORDERED", []],
      ["IN_SERVICE", []],
      ["BILL", []],
      ["LEFT", []],
    ]);

    for (const reservation of reservations) {
      const stage = getStage(reservation);
      stageMap.get(stage)!.push(reservation);
    }

    const countRecord = {} as Record<JourneyStage, number>;
    for (const [stage, list] of stageMap) {
      countRecord[stage] = list.length;
    }

    return { stages: stageMap, counts: countRecord };
  }, [reservations, getStage]);

  return {
    stages,
    counts,
    getStage,
    isLoading: isLoadingEvents || isLoadingPos,
  };
}

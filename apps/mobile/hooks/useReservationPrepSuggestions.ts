import { useMemo } from "react";
import type { Reservation } from "./useReservationData";

export interface PrepSuggestion {
  title: string;
  priority: string;
  category: string;
  source: "reservation";
}

export function useReservationPrepSuggestions(reservations: Reservation[]): PrepSuggestion[] {
  return useMemo(() => {
    if (!reservations || reservations.length === 0) return [];

    const suggestions: PrepSuggestion[] = [];
    const totalCovers = reservations.reduce((s, r) => s + (r.party_size || 0), 0);

    // VIP guests
    for (const res of reservations) {
      if (res.guest?.vip_tier && res.guest.vip_tier !== "none") {
        suggestions.push({
          title: `VIP ${res.guest_name} arriving ${res.time} — prepare welcome amuse-bouche`,
          priority: "high",
          category: "prep",
          source: "reservation",
        });
      }
    }

    // High covers warning
    if (totalCovers >= 40) {
      suggestions.push({
        title: `${totalCovers} covers booked tonight — check protein and produce stock`,
        priority: "high",
        category: "ordering",
        source: "reservation",
      });
    }

    // Dietary requirements
    for (const res of reservations) {
      if (res.dietary_notes && res.dietary_notes.trim()) {
        suggestions.push({
          title: `Table ${res.table_number || "?"}: ${res.dietary_notes} (${res.guest_name}, party of ${res.party_size})`,
          priority: "medium",
          category: "prep",
          source: "reservation",
        });
      }
    }

    // Large party
    for (const res of reservations) {
      if (res.party_size >= 10) {
        suggestions.push({
          title: `Large party (${res.party_size}) at ${res.time} — prep sharing platters`,
          priority: "medium",
          category: "prep",
          source: "reservation",
        });
      }
    }

    // Special occasions
    for (const res of reservations) {
      if (res.occasion && res.occasion.trim()) {
        suggestions.push({
          title: `${res.occasion} — ${res.guest_name} at ${res.time} (table ${res.table_number || "TBD"})`,
          priority: "medium",
          category: "prep",
          source: "reservation",
        });
      }
    }

    return suggestions.slice(0, 8);
  }, [reservations]);
}

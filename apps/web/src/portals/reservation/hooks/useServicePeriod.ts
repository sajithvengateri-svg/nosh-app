import { useQuery } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { fetchResSettings } from "@/lib/shared/queries/resQueries";
import type { ServicePeriod } from "@/lib/shared/types/res.types";

const DEFAULT_SERVICE_PERIODS: ServicePeriod[] = [
  { key: "breakfast", label: "Breakfast", start: "06:00", end: "11:00" },
  { key: "lunch", label: "Lunch", start: "11:30", end: "15:00" },
  { key: "dinner", label: "Dinner", start: "17:00", end: "23:00" },
];

export function useServicePeriod() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  const { data: settings, isLoading } = useQuery({
    queryKey: ["res_settings", orgId],
    queryFn: () => fetchResSettings(orgId!),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  const servicePeriods: ServicePeriod[] =
    (settings?.data?.service_periods as ServicePeriod[] | undefined) ??
    DEFAULT_SERVICE_PERIODS;

  /**
   * Returns the service period key that matches the current time, or null if
   * the current time falls outside all configured periods.
   */
  function getCurrentServicePeriod(): string | null {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const currentTime = `${hh}:${mm}`;
    return getServicePeriodForTime(currentTime);
  }

  /**
   * Maps a reservation time (HH:mm) to a service period key.
   * Returns null if the time does not fall within any period.
   */
  function getServicePeriodForTime(time: string): string | null {
    for (const period of servicePeriods) {
      if (time >= period.start && time <= period.end) {
        return period.key;
      }
    }
    return null;
  }

  /**
   * Filters reservations to only those whose `time` field falls within the
   * start/end range of the given service period key.
   */
  function filterByServicePeriod(
    reservations: any[],
    periodKey: string,
  ): any[] {
    const period = servicePeriods.find((p) => p.key === periodKey);
    if (!period) return [];
    return reservations.filter(
      (r) => r.time >= period.start && r.time <= period.end,
    );
  }

  return {
    servicePeriods,
    getCurrentServicePeriod,
    getServicePeriodForTime,
    filterByServicePeriod,
    isLoading,
  };
}

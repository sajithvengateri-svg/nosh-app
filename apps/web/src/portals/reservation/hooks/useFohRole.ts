import { useOrg } from "@/contexts/OrgContext";
import { FohRole } from "@/lib/shared/types/res.types";

// FOH permission hierarchy (higher number = more permissions)
const ROLE_LEVEL: Record<string, number> = {
  host: 0,
  server: 1,
  shift_manager: 2,
  foh_admin: 3,
  head_chef: 3,
  owner: 4,
};

export function useFohRole() {
  const { membership } = useOrg();
  const role = membership?.role as string | undefined;
  const level = role ? (ROLE_LEVEL[role] ?? 0) : -1;

  const fohRole: FohRole | null = role
    ? (["owner", "foh_admin", "shift_manager", "server", "host"].includes(role)
        ? (role as FohRole)
        : role === "head_chef"
        ? "foh_admin"
        : null)
    : null;

  return {
    fohRole,
    roleLevel: level,

    // Permission checks
    canViewFloor: level >= 0,
    canManageReservations: level >= 1, // server+
    canWalkIn: level >= 1,             // server+
    canDropBill: level >= 1,           // server+
    canBlockDates: level >= 2,         // shift_manager+
    canManageShows: level >= 3,        // foh_admin+
    canEditSettings: level >= 3,       // foh_admin+
    canGrantAccess: level >= 4,        // owner only
    canManageTeam: level >= 3,         // foh_admin+

    // Shift manager can only block same-day
    canBlockDate: (date: string) => {
      if (level >= 3) return true; // foh_admin+ can block any date
      if (level >= 2) {
        // shift_manager can only block today
        const today = new Date().toISOString().split("T")[0];
        return date === today;
      }
      return false;
    },
  };
}

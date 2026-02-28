import { useQuery } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import type { ResSidebarSection, SidebarNavItem } from "@/lib/shared/types/res.types";
import { fetchSidebarConfig, upsertSidebarConfig } from "@/lib/shared/queries/resQueries";

// ─── Role hierarchy (higher index = more access) ─────────
const ROLE_HIERARCHY: Record<string, number> = {
  staff: 0,
  chef: 1,
  head_chef: 2,
  owner: 3,
};

function meetsRoleRequirement(
  userRole: string | null | undefined,
  requiredRole: string | null,
): boolean {
  // No role restriction — everyone can see it
  if (!requiredRole) return true;
  // Role is required but user has none — hide
  if (!userRole) return false;

  const userLevel = ROLE_HIERARCHY[userRole] ?? -1;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? -1;
  return userLevel >= requiredLevel;
}

// ─── Default sections (returned when no DB rows exist) ───
const PLACEHOLDER_TS = new Date(0).toISOString();

const DEFAULT_SECTIONS: ResSidebarSection[] = [
  {
    id: "default-reservations",
    org_id: "",
    section_key: "reservations",
    label: "Reservations",
    icon_name: "CalendarCheck",
    sort_order: 0,
    is_visible: true,
    required_role: null,
    items: [
      { key: "dashboard", label: "Dashboard", path: "/reservation/dashboard", icon: "LayoutDashboard", is_visible: true, required_role: null },
      { key: "diary", label: "Diary", path: "/reservation/diary", icon: "BookOpen", is_visible: true, required_role: null },
      { key: "floor", label: "Floor Plan", path: "/reservation/floor", icon: "Map", is_visible: true, required_role: null },
      { key: "reservations", label: "Reservations", path: "/reservation/reservations", icon: "ClipboardList", is_visible: true, required_role: null },
      { key: "waitlist", label: "Waitlist", path: "/reservation/waitlist", icon: "Clock", is_visible: true, required_role: null },
      { key: "shows", label: "Shows", path: "/reservation/shows", icon: "Ticket", is_visible: true, required_role: null },
    ],
    created_at: PLACEHOLDER_TS,
    updated_at: PLACEHOLDER_TS,
  },
  {
    id: "default-venueflow",
    org_id: "",
    section_key: "venueflow",
    label: "VenueFlow",
    icon_name: "Building2",
    sort_order: 1,
    is_visible: true,
    required_role: null,
    items: [
      { key: "vf-dashboard", label: "Dashboard", path: "/reservation/venueflow/dashboard", icon: "LayoutDashboard", is_visible: true, required_role: null },
      { key: "vf-pipeline", label: "Pipeline", path: "/reservation/venueflow/pipeline", icon: "Kanban", is_visible: true, required_role: null },
      { key: "vf-calendar", label: "Calendar", path: "/reservation/venueflow/calendar", icon: "Calendar", is_visible: true, required_role: null },
      { key: "vf-proposals", label: "Proposals", path: "/reservation/venueflow/proposals", icon: "FileText", is_visible: true, required_role: null },
    ],
    created_at: PLACEHOLDER_TS,
    updated_at: PLACEHOLDER_TS,
  },
  {
    id: "default-growth",
    org_id: "",
    section_key: "growth",
    label: "Growth",
    icon_name: "TrendingUp",
    sort_order: 2,
    is_visible: true,
    required_role: null,
    items: [
      { key: "leads", label: "Leads", path: "/reservation/venueflow/leads", icon: "UserPlus", is_visible: true, required_role: null },
      { key: "referrals", label: "Referrals", path: "/reservation/venueflow/referrals", icon: "Share2", is_visible: true, required_role: null },
      { key: "reactivation", label: "Re-activation", path: "/reservation/venueflow/reactivation", icon: "RefreshCw", is_visible: true, required_role: null },
      { key: "analytics", label: "Analytics", path: "/reservation/venueflow/analytics", icon: "BarChart3", is_visible: true, required_role: null },
    ],
    created_at: PLACEHOLDER_TS,
    updated_at: PLACEHOLDER_TS,
  },
  {
    id: "default-guests",
    org_id: "",
    section_key: "guests",
    label: "Guests",
    icon_name: "Users",
    sort_order: 3,
    is_visible: true,
    required_role: null,
    items: [
      { key: "guest-db", label: "Guest Database", path: "/reservation/guests", icon: "Database", is_visible: true, required_role: null },
      { key: "csv-import", label: "CSV Import", path: "/reservation/venueflow/csv-import", icon: "Upload", is_visible: true, required_role: null },
    ],
    created_at: PLACEHOLDER_TS,
    updated_at: PLACEHOLDER_TS,
  },
  {
    id: "default-system",
    org_id: "",
    section_key: "system",
    label: "System",
    icon_name: "Cog",
    sort_order: 4,
    is_visible: true,
    required_role: null,
    items: [
      { key: "rooms", label: "Rooms & Spaces", path: "/reservation/functions/spaces", icon: "DoorOpen", is_visible: true, required_role: null },
      { key: "menus", label: "Menu Templates", path: "/reservation/venueflow/menus", icon: "UtensilsCrossed", is_visible: true, required_role: null },
      { key: "beverages", label: "Beverage Packages", path: "/reservation/venueflow/beverages", icon: "Wine", is_visible: true, required_role: null },
      { key: "booking-widget", label: "Booking Widget", path: "/reservation/widget", icon: "ExternalLink", is_visible: true, required_role: null },
      { key: "function-widget", label: "Function Widget", path: "/reservation/function-widget", icon: "ExternalLink", is_visible: true, required_role: null },
      { key: "voice-agent", label: "Voice Agent", path: "/reservation/voice-agent", icon: "Phone", is_visible: true, required_role: "owner" },
      { key: "automations", label: "Automations", path: "/reservation/venueflow/automations", icon: "Zap", is_visible: true, required_role: null },
      { key: "integrations", label: "Integrations", path: "/reservation/venueflow/integrations", icon: "Puzzle", is_visible: true, required_role: null },
      { key: "reports", label: "Reports", path: "/reservation/reports/generate", icon: "FileBarChart", is_visible: true, required_role: null },
      { key: "settings", label: "Settings", path: "/reservation/settings", icon: "Settings", is_visible: true, required_role: null },
      { key: "help", label: "Help Center", path: "/reservation/help", icon: "HelpCircle", is_visible: true, required_role: null },
      { key: "training", label: "Training", path: "/reservation/training", icon: "GraduationCap", is_visible: true, required_role: null },
      { key: "test-plan", label: "Test Plan", path: "/reservation/test-plan", icon: "ClipboardList", is_visible: true, required_role: "owner" },
    ],
    created_at: PLACEHOLDER_TS,
    updated_at: PLACEHOLDER_TS,
  },
];

// ─── Hook ────────────────────────────────────────────────
export function useSidebarConfig(userRole?: string | null) {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id ?? "";

  const { data, isLoading } = useQuery({
    queryKey: ["res_sidebar_config", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data: rows, error } = await fetchSidebarConfig(orgId);
      // Table may not exist yet (migration not run) — fall back to defaults
      if (error) {
        console.warn("[useSidebarConfig] query error, using defaults:", error.message);
        return null;
      }
      return rows as ResSidebarSection[] | null;
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Determine whether we're falling back to defaults
  const isUsingDefaults = !data || data.length === 0;

  // Always use DEFAULT_SECTIONS as the canonical structure.
  // If DB rows exist, apply their visibility/order overrides on top.
  const rawSections: ResSidebarSection[] = isUsingDefaults
    ? DEFAULT_SECTIONS
    : DEFAULT_SECTIONS.map((defSection) => {
        const dbSection = data.find((d: any) => d.section_key === defSection.section_key);
        if (!dbSection) return defSection; // new section not in DB yet — use default
        return {
          ...defSection,
          sort_order: dbSection.sort_order ?? defSection.sort_order,
          is_visible: dbSection.is_visible ?? defSection.is_visible,
          required_role: dbSection.required_role ?? defSection.required_role,
          items: defSection.items.map((defItem) => {
            const dbItem = dbSection.items?.find((di: any) => di.key === defItem.key);
            if (!dbItem) return defItem; // new item not in DB yet — use default
            return { ...defItem, is_visible: dbItem.is_visible ?? defItem.is_visible };
          }),
        };
      });

  // Filter & sort
  const sections = rawSections
    // 1. Only visible sections the user's role can access
    .filter(
      (section) =>
        section.is_visible && meetsRoleRequirement(userRole, section.required_role),
    )
    // 2. Filter items within each section
    .map((section) => ({
      ...section,
      items: section.items
        .filter(
          (item: SidebarNavItem) =>
            item.is_visible && meetsRoleRequirement(userRole, item.required_role),
        ),
    }))
    // 3. Drop sections that end up with zero visible items
    .filter((section) => section.items.length > 0)
    // 4. Sort by sort_order
    .sort((a, b) => a.sort_order - b.sort_order);

  return {
    sections,
    isLoading,
    isUsingDefaults,
  };
}

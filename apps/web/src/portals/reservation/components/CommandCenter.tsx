import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { useResStore } from "@/lib/shared/state/resStore";
import {
  fetchReservationsByDate,
  fetchActiveWaitlist,
  fetchTables,
  updateReservationStatus,
  createJourneyEvent,
  fetchFloorLayouts,
  fetchFloorZones,
  fetchWaiters,
} from "@/lib/shared/queries/resQueries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useState, useCallback, useMemo, useEffect } from "react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Maximize2, Minimize2, CalendarDays, LayoutList, MapPin, GripVertical, Ticket, AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JourneyStage } from "@/lib/shared/types/res.types";
import { cn } from "@/lib/utils";

// Child components (separate files)
import ServiceCalendarPane from "./ServiceCalendarPane";
import EnhancedJourneyBar, { JOURNEY_STAGES } from "./EnhancedJourneyBar";
import ReservationRowEnhanced from "./ReservationRowEnhanced";
import WalkInDialog from "./WalkInDialog";
import FloorCanvas from "./FloorCanvas";
import WeatherStrip from "./WeatherStrip";
import { useServicePeriod } from "../hooks/useServicePeriod";
import { useBlockedDates } from "../hooks/useBlockedDates";
import { usePreTheatre } from "../hooks/usePreTheatre";

// ---------------------------------------------------------------------------
// Inline journey-stage detection
// ---------------------------------------------------------------------------

function getJourneyStage(r: any): JourneyStage {
  if (r.status === "COMPLETED") return "LEFT";
  if (r.status === "CONFIRMED") return "ARRIVING";
  if (r.status === "SEATED") {
    if (r.notes?.includes("[BILL_DROPPED]")) return "BILL";
    return "SEATED";
  }
  return "ARRIVING";
}

// ---------------------------------------------------------------------------
// Service-period time ranges (HH:mm boundaries)
// ---------------------------------------------------------------------------

// Dynamic service periods from hook — no more hardcoded ranges
function isWithinDynamicServicePeriod(
  reservationTime: string | null | undefined,
  periodKey: string,
  periods: Array<{ key: string; start: string; end: string }>
): boolean {
  if (!reservationTime || periodKey === "all") return true;
  const time = reservationTime.slice(0, 5);
  const period = periods.find((p) => p.key.toUpperCase() === periodKey || p.key === periodKey);
  if (!period) return true;
  return time >= period.start && time <= period.end;
}

// ---------------------------------------------------------------------------
// Map journey stage key to the status mutation it triggers
// ---------------------------------------------------------------------------

function stageToStatusUpdate(stage: JourneyStage): string | null {
  switch (stage) {
    case "ARRIVING":
      return "CONFIRMED";
    case "SEATED":
      return "SEATED";
    case "LEFT":
      return "COMPLETED";
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// SectionHeader — shared header for each section panel
// ---------------------------------------------------------------------------

function SectionHeader({ title, icon: Icon, sectionKey, zoomedSection, onZoom }: {
  title: string;
  icon: React.ElementType;
  sectionKey: 'calendar' | 'command' | 'floor';
  zoomedSection: string | null;
  onZoom: (section: any) => void;
}) {
  const isZoomed = zoomedSection === sectionKey;
  return (
    <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/30 flex-shrink-0">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={() => onZoom(isZoomed ? null : sectionKey)}
      >
        {isZoomed ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ResizeHandle — draggable divider between panels
// ---------------------------------------------------------------------------

function ResizeHandle({ onDrag, onDoubleClick }: { onDrag: (deltaX: number) => void; onDoubleClick?: () => void }) {
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      onDrag(ev.clientX - startX);
    };
    const onUp = () => {
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", onUp);
    };
    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerup", onUp);
  }, [onDrag]);

  return (
    <div
      onPointerDown={handlePointerDown}
      onDoubleClick={onDoubleClick}
      className="w-1.5 flex-shrink-0 cursor-col-resize flex items-center justify-center hover:bg-primary/10 active:bg-primary/20 transition-colors group"
      title="Drag to resize · Double-click to expand/collapse"
    >
      <GripVertical className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// FullPageCommandPanel — zoomed command panel view
// ---------------------------------------------------------------------------

function FullPageCommandPanel({
  reservations, journeyCounts, journeyFilter, onFilterChange, onAdvance, getJourneyStage: getStage, getWaiterForTable, tables, onNavigate
}: {
  reservations: any[];
  journeyCounts: Record<string, number>;
  journeyFilter: any;
  onFilterChange: (stage: any) => void;
  onAdvance: (id: string, target: string) => void;
  getJourneyStage: (r: any) => JourneyStage;
  getWaiterForTable: (table: any) => string | null;
  tables: any[];
  onNavigate: (path: string) => void;
}) {
  const activeReservations = reservations.filter(r => getStage(r) !== 'LEFT');
  const leftReservations = reservations.filter(r => getStage(r) === 'LEFT');
  const STAGE_COLORS: Record<string, string> = {
    ARRIVING: 'bg-blue-500', SEATED: 'bg-green-500', ORDERED: 'bg-indigo-500',
    IN_SERVICE: 'bg-orange-500', BILL: 'bg-amber-400', LEFT: 'bg-gray-400',
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b overflow-x-auto flex-shrink-0">
        <Button size="sm" variant={!journeyFilter ? "default" : "ghost"} className="h-7 text-xs px-2" onClick={() => onFilterChange(null)}>
          All ({reservations.length})
        </Button>
        {JOURNEY_STAGES.filter(s => s.key !== 'LEFT').map(s => (
          <Button key={s.key} size="sm" variant={journeyFilter === s.key ? "default" : "ghost"} className="h-7 text-xs px-2" onClick={() => onFilterChange(s.key)}>
            {s.label} ({journeyCounts[s.key] ?? 0})
          </Button>
        ))}
      </div>

      {/* Reservation list */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y">
          {activeReservations.map(r => {
            const stage = getStage(r);
            const guest = r.res_guests ?? r.guest ?? {};
            const guestName = [guest.first_name, guest.last_name].filter(Boolean).join(' ') || 'Guest';
            const table = tables.find((t: any) => t.id === r.table_id);
            const waiter = table ? getWaiterForTable(table) : null;
            const stageColor = STAGE_COLORS[stage] ?? 'bg-gray-400';
            const nextTarget = stage === 'ARRIVING' ? 'SEATED' : stage === 'SEATED' ? 'BILL' : stage === 'BILL' ? 'LEFT' : null;

            return (
              <div key={r.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 text-sm cursor-pointer" onClick={() => onNavigate(`/reservation/reservations/${r.id}`)}>
                <span className="w-12 font-mono text-xs tabular-nums flex-shrink-0">{r.time?.slice(0, 5) ?? '--:--'}</span>
                <span className="font-medium truncate min-w-[100px] max-w-[160px]">{guestName}</span>
                <span className="text-muted-foreground text-xs flex-shrink-0">{r.party_size ?? '?'}p</span>
                {(r.table_name || table?.name) ? (
                  <Badge variant="outline" className="text-[10px] flex-shrink-0">{r.table_name || table?.name}</Badge>
                ) : null}
                {waiter && (
                  <Badge className="text-[10px] bg-violet-100 text-violet-700 border-0 flex-shrink-0">{waiter}</Badge>
                )}
                <div className="flex-1" />
                <button
                  className={cn("h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 transition-transform hover:scale-110", stageColor)}
                  title={nextTarget ? `Advance to ${nextTarget}` : stage}
                  onClick={(e) => { e.stopPropagation(); if (nextTarget) onAdvance(r.id, nextTarget); }}
                >
                  {stage.charAt(0)}
                </button>
              </div>
            );
          })}
        </div>

        {/* Left bin */}
        {leftReservations.length > 0 && (
          <details className="border-t-2 border-muted">
            <summary className="px-3 py-2 text-xs font-semibold text-muted-foreground cursor-pointer hover:bg-muted/50 select-none">
              Left ({leftReservations.length})
            </summary>
            <div className="divide-y opacity-60">
              {leftReservations.map(r => {
                const guest = r.res_guests ?? r.guest ?? {};
                const guestName = [guest.first_name, guest.last_name].filter(Boolean).join(' ') || 'Guest';
                return (
                  <div key={r.id} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-muted/30" onClick={() => onNavigate(`/reservation/reservations/${r.id}`)}>
                    <span className="w-12 font-mono text-xs tabular-nums">{r.time?.slice(0, 5) ?? '--:--'}</span>
                    <span className="font-medium truncate">{guestName}</span>
                    <span className="text-muted-foreground text-xs">{r.party_size ?? '?'}p</span>
                    <div className="flex-1" />
                    <span className="h-7 w-7 rounded-full flex items-center justify-center bg-gray-400 text-white text-[10px] font-bold">L</span>
                  </div>
                );
              })}
            </div>
          </details>
        )}
      </div>

      {/* Bottom thermometer */}
      <div className="border-t border-border px-3 py-2 bg-muted/20 flex-shrink-0">
        <EnhancedJourneyBar counts={journeyCounts as Record<JourneyStage, number>} activeFilter={journeyFilter} onStageClick={onFilterChange} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CommandCenter
// ---------------------------------------------------------------------------

export default function CommandCenter() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ---- Store state ----
  const {
    selectedDate,
    setSelectedDate,
    servicePeriod,
    setServicePeriod,
    journeyFilter,
    setJourneyFilter,
    auditPanelOpen,
    setAuditPanelOpen,
    zoomedSection,
    setZoomedSection,
    selectedTableId,
    setSelectedTableId,
    zoneWaiterMap,
    setZoneWaiterMap,
    tableWaiterOverrides,
    setTableWaiterOverride,
    floorActionMode,
  } = useResStore();

  // ---- Local state ----
  const [activeReservation, setActiveReservation] = useState<any | null>(null);
  const [walkInOpen, setWalkInOpen] = useState(false);

  // ---- Dynamic service periods, blocked dates, pre-theatre ----
  const { periods: servicePeriods, getCurrentServicePeriod: getActiveServicePeriod } = useServicePeriod();
  const { isDateBlocked, getBlockInfo } = useBlockedDates();
  const { shows, preTheatrePacing } = usePreTheatre(selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));

  // ---- Panel widths (persisted to localStorage) ----
  const [panelWidths, setPanelWidths] = useState<{ calendar: number; command: number }>(() => {
    try {
      const saved = localStorage.getItem("cc_panel_widths");
      if (saved) return JSON.parse(saved);
    } catch {}
    return { calendar: 240, command: 0 }; // command=0 means "auto flex"
  });

  const savePanelWidths = useCallback((widths: { calendar: number; command: number }) => {
    setPanelWidths(widths);
    try { localStorage.setItem("cc_panel_widths", JSON.stringify(widths)); } catch {}
  }, []);

  const handleCalendarResize = useCallback((deltaX: number) => {
    savePanelWidths({
      ...panelWidths,
      calendar: Math.max(180, Math.min(600, panelWidths.calendar + deltaX)),
    });
  }, [panelWidths, savePanelWidths]);

  const handleCommandResize = useCallback((deltaX: number) => {
    if (panelWidths.command === 0) return;
    savePanelWidths({
      ...panelWidths,
      command: Math.max(250, Math.min(800, panelWidths.command + deltaX)),
    });
  }, [panelWidths, savePanelWidths]);

  const toggleCalendarExpand = useCallback(() => {
    savePanelWidths({
      ...panelWidths,
      calendar: panelWidths.calendar > 300 ? 240 : 480,
    });
  }, [panelWidths, savePanelWidths]);

  // ---- DnD sensors ----
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 6 },
  });
  const sensors = useSensors(pointerSensor, touchSensor);

  // ---- Data queries ----
  const {
    data: reservations = [],
    isLoading: loadingReservations,
    error: reservationsError,
  } = useQuery({
    queryKey: ["res_reservations", orgId, selectedDate],
    queryFn: async () => {
      const { data } = await fetchReservationsByDate(orgId!, selectedDate);
      return data ?? [];
    },
    enabled: !!orgId,
  });

  const { data: waitlist = [], isLoading: loadingWaitlist } = useQuery({
    queryKey: ["waitlist", orgId],
    queryFn: async () => {
      const { data } = await fetchActiveWaitlist(orgId!);
      return data ?? [];
    },
    enabled: !!orgId,
  });

  const { data: tables = [], isLoading: loadingTables } = useQuery({
    queryKey: ["tables", orgId],
    queryFn: async () => {
      const { data } = await fetchTables(orgId!);
      return data ?? [];
    },
    enabled: !!orgId,
  });

  const { data: layouts = [] } = useQuery({
    queryKey: ["res_floor_layouts", orgId],
    queryFn: async () => { const { data } = await fetchFloorLayouts(orgId!); return data ?? []; },
    enabled: !!orgId,
  });

  const { data: floorZones = [] } = useQuery({
    queryKey: ["res_floor_zones", orgId],
    queryFn: async () => { const { data } = await fetchFloorZones(orgId!); return data ?? []; },
    enabled: !!orgId,
  });

  const { data: waiters = [] } = useQuery({
    queryKey: ["res_waiters", orgId],
    queryFn: async () => { const { data } = await fetchWaiters(orgId!); return data ?? []; },
    enabled: !!orgId,
  });

  const activeLayout = useMemo(() => layouts.find((l: any) => l.is_active) ?? layouts[0] ?? null, [layouts]);

  // ---- Mutations ----
  const statusMutation = useMutation({
    mutationFn: async ({
      id,
      targetStage,
    }: {
      id: string;
      targetStage: string;
    }) => {
      if (targetStage === "BILL") {
        // Append [BILL_DROPPED] to notes (stays SEATED in DB)
        const res = reservations.find((r: any) => r.id === id);
        const existing = res?.notes || "";
        if (!existing.includes("[BILL_DROPPED]")) {
          await supabase
            .from("res_reservations")
            .update({ notes: `${existing} [BILL_DROPPED]`.trim() } as any)
            .eq("id", id);
        }
      } else if (targetStage === "SEATED") {
        await updateReservationStatus(id, "SEATED");
      } else if (targetStage === "LEFT") {
        await updateReservationStatus(id, "COMPLETED");
      } else if (targetStage === "NO_SHOW") {
        await updateReservationStatus(id, "NO_SHOW");
      } else if (targetStage === "CANCELLED") {
        await updateReservationStatus(id, "CANCELLED");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["res_reservations"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["res_tables"], refetchType: "all" });
    },
    onError: (err: any) => {
      toast.error("Failed to update reservation", {
        description: err?.message ?? "Unknown error",
      });
    },
  });

  const journeyEventMutation = useMutation({
    mutationFn: ({
      reservationId,
      stage,
    }: {
      reservationId: string;
      stage: JourneyStage;
    }) => createJourneyEvent({ reservation_id: reservationId, stage, org_id: orgId }),
    onError: (err: any) => {
      console.error("Journey event creation failed", err);
    },
  });

  // ---- Unified advance handler (used by inline button, context menu, swipe, drag-drop) ----
  const advanceReservation = useCallback(
    (reservationId: string, targetStage: string) => {
      statusMutation.mutate({ id: reservationId, targetStage });
      // Fire-and-forget journey event
      if (["ARRIVING", "SEATED", "ORDERED", "IN_SERVICE", "BILL", "LEFT"].includes(targetStage)) {
        journeyEventMutation.mutate({ reservationId, stage: targetStage as JourneyStage });
      }
      const label =
        targetStage === "SEATED" ? "Seated" :
        targetStage === "BILL" ? "Bill dropped" :
        targetStage === "LEFT" ? "Marked left" :
        targetStage === "NO_SHOW" ? "No show" :
        targetStage === "CANCELLED" ? "Cancelled" : targetStage;
      toast.success(label);
    },
    [statusMutation, journeyEventMutation]
  );

  // ---- Waiter resolution helper ----
  const getWaiterForTable = useCallback((tableOrId: any): string | null => {
    const table = typeof tableOrId === 'string' ? tables.find((t: any) => t.id === tableOrId) : tableOrId;
    if (!table) return null;
    const override = tableWaiterOverrides[table.id];
    if (override) return override.staffName;
    const zoneAssignment = zoneWaiterMap[table.zone];
    if (zoneAssignment) return zoneAssignment.staffName;
    return null;
  }, [tables, tableWaiterOverrides, zoneWaiterMap]);

  // ---- Waiter initials map for FloorCanvas ----
  const waiterInitialsMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const table of tables) {
      const name = getWaiterForTable(table);
      if (name) {
        const parts = name.split(' ');
        map[table.id] = parts.map((p: string) => p[0]).join('').toUpperCase().slice(0, 2);
      }
    }
    return map;
  }, [tables, getWaiterForTable]);

  // ---- onTableAction handler ----
  const handleTableAction = useCallback((tableId: string, action: string) => {
    const table = tables.find((t: any) => t.id === tableId);
    if (!table) return;
    const res = reservations.find((r: any) => r.table_id === tableId && (r.status === 'SEATED' || r.status === 'CONFIRMED'));

    switch (action) {
      case 'seat':
        if (res) advanceReservation(res.id, 'SEATED');
        break;
      case 'bill':
        if (res) advanceReservation(res.id, 'BILL');
        break;
      case 'left':
        if (res) advanceReservation(res.id, 'LEFT');
        break;
      case 'noshow':
        if (res) advanceReservation(res.id, 'NO_SHOW');
        break;
      case 'cancel':
        if (res) advanceReservation(res.id, 'CANCELLED');
        break;
      case 'block':
        import('@/lib/shared/queries/resQueries').then(({ blockTable, unblockTable }) => {
          if (table.is_blocked) {
            unblockTable(table.id).then(() => {
              queryClient.invalidateQueries({ queryKey: ["res_tables"], refetchType: "all" });
              toast.success("Table unblocked");
            });
          } else {
            blockTable(table.id, "Blocked from floor").then(() => {
              queryClient.invalidateQueries({ queryKey: ["res_tables"], refetchType: "all" });
              toast.success("Table blocked");
            });
          }
        });
        break;
      case 'book':
        navigate(`/reservation/reservations/new?table_id=${tableId}`);
        break;
      case 'walkin':
        setWalkInOpen(true);
        break;
      case 'assign':
        toast.info("Assign waiters via Zone Waiters in the calendar panel");
        break;
    }
  }, [tables, reservations, advanceReservation, queryClient, navigate]);

  // ---- Filtered & sorted reservations ----
  const filteredReservations = useMemo(() => {
    let list = reservations.filter((r: any) =>
      isWithinDynamicServicePeriod(r.time ?? r.reservation_time, servicePeriod, servicePeriods)
    );

    if (journeyFilter) {
      list = list.filter(
        (r: any) => getJourneyStage(r) === journeyFilter
      );
    }

    // Sort by reservation time ascending
    list.sort((a: any, b: any) => {
      const ta = a.time ?? a.reservation_time ?? "";
      const tb = b.time ?? b.reservation_time ?? "";
      return ta.localeCompare(tb);
    });

    return list;
  }, [reservations, servicePeriod, servicePeriods, journeyFilter]);

  // ---- Journey stage counts ----
  const journeyCounts = useMemo(() => {
    const periodFiltered = reservations.filter((r: any) =>
      isWithinDynamicServicePeriod(r.time ?? r.reservation_time, servicePeriod, servicePeriods)
    );

    const counts: Record<string, number> = {};
    for (const stage of JOURNEY_STAGES) {
      counts[stage.key] = 0;
    }
    for (const r of periodFiltered) {
      const stage = getJourneyStage(r);
      if (counts[stage] !== undefined) {
        counts[stage]++;
      }
    }
    return counts;
  }, [reservations, servicePeriod, servicePeriods]);

  // ---- Stats for left pane ----
  const stats = useMemo(() => {
    const totalCovers = filteredReservations.reduce(
      (sum: number, r: any) => sum + (r.party_size ?? 0),
      0
    );
    const confirmedCount = filteredReservations.filter(
      (r: any) => r.status === "CONFIRMED"
    ).length;
    const seatedCount = filteredReservations.filter(
      (r: any) => r.status === "SEATED"
    ).length;

    const seatedTableIds = new Set(
      filteredReservations
        .filter((r: any) => r.status === "SEATED" && r.table_id)
        .map((r: any) => r.table_id)
    );
    const availableTables = tables.filter(
      (t: any) => !t.is_blocked && !seatedTableIds.has(t.id)
    ).length;

    const waitlistCount = waitlist.length;

    const vipCount = filteredReservations.filter((r: any) => {
      const tier = r.guest?.vip_tier ?? r.vip_tier;
      return tier === "VIP" || tier === "CHAMPION";
    }).length;

    return {
      totalCovers,
      confirmedCount,
      seatedCount,
      availableTables,
      waitlistCount,
      vipCount,
    };
  }, [filteredReservations, tables, waitlist]);

  // ---- DnD handlers ----
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = event.active.id as string;
      const res = reservations.find((r: any) => r.id === id);
      setActiveReservation(res ?? null);
    },
    [reservations]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveReservation(null);

      const { active, over } = event;
      if (!over) return;

      const reservationId = active.id as string;
      const targetStage = over.id as JourneyStage;

      // Determine the current stage of the dragged reservation
      const res = reservations.find((r: any) => r.id === reservationId);
      if (!res) return;
      const currentStage = getJourneyStage(res);
      if (currentStage === targetStage) return;

      advanceReservation(reservationId, targetStage);
    },
    [reservations, statusMutation, journeyEventMutation]
  );

  const handleDragCancel = useCallback(() => {
    setActiveReservation(null);
  }, []);

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '1') setZoomedSection(zoomedSection === 'calendar' ? null : 'calendar');
      if (e.key === '2') setZoomedSection(zoomedSection === 'command' ? null : 'command');
      if (e.key === '3') setZoomedSection(zoomedSection === 'floor' ? null : 'floor');
      if (e.key === 'Escape' && zoomedSection) setZoomedSection(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [zoomedSection, setZoomedSection]);

  // ---- Loading / Error states ----
  if (!orgId) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No organisation selected.
      </div>
    );
  }

  if (loadingReservations && reservations.length === 0) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading reservations...
      </div>
    );
  }

  if (reservationsError) {
    return (
      <div className="flex h-full items-center justify-center text-destructive">
        Failed to load reservations. Please try again.
      </div>
    );
  }

  // ---- Render ----
  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
      <div className="flex h-full flex-col overflow-hidden">
        {/* Blocked day banner */}
        {(() => {
          const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
          const blockInfo = getBlockInfo(dateStr);
          if (!blockInfo) return null;
          return (
            <div className="mx-4 mb-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-400">
              <AlertOctagon className="w-5 h-5 flex-shrink-0" />
              <span>
                {blockInfo.block_type === "venue_hire" ? "PRIVATE EVENT" : "VENUE CLOSED"}
                {blockInfo.reason && ` — ${blockInfo.reason}`}
                {blockInfo.service_period_key && ` (${blockInfo.service_period_key} only)`}
              </span>
            </div>
          );
        })()}

        {/* Weather strip across the top */}
        <WeatherStrip
          selectedDate={selectedDate}
          tables={tables.map((t: any) => ({ id: t.id, name: t.name, zone: t.zone, is_blocked: !!t.is_blocked }))}
          onBlockOutdoorTables={() => {
            const outdoorUnblocked = tables.filter((t: any) => t.zone === "OUTDOOR" && !t.is_blocked);
            if (outdoorUnblocked.length === 0) return;
            import("@/lib/shared/queries/resQueries").then(({ blockTable }) => {
              Promise.all(outdoorUnblocked.map((t: any) => blockTable(t.id, "Weather: high rain probability")))
                .then(() => {
                  queryClient.invalidateQueries({ queryKey: ["tables"], refetchType: "all" });
                  toast.success(`Blocked ${outdoorUnblocked.length} outdoor table${outdoorUnblocked.length !== 1 ? "s" : ""}`);
                });
            });
          }}
        />

        {/* Pre-theatre pacing strip */}
        {shows && shows.length > 0 && (
          <div className="mx-4 mb-2 p-3 rounded-lg bg-teal-500/10 border border-teal-500/20">
            <div className="flex items-center gap-2 mb-2 text-sm font-medium text-teal-700 dark:text-teal-400">
              <Ticket className="w-4 h-4" />
              Pre-Theatre Pacing
            </div>
            <div className="space-y-1.5">
              {shows.map((show: any) => {
                const pacing = preTheatrePacing?.find((p: any) => p.showId === show.id);
                const total = pacing?.totalGuests ?? 0;
                const billed = pacing?.billedGuests ?? 0;
                const pct = total > 0 ? Math.round((billed / total) * 100) : 0;
                return (
                  <div key={show.id} className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground w-16 truncate">S{show.session_number}</span>
                    <span className="flex-1 truncate font-medium">{show.title}</span>
                    <span className="text-muted-foreground">{show.curtain_time?.slice(0, 5)}</span>
                    <div className="w-20 h-1.5 bg-teal-200 dark:bg-teal-900 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-12 text-right tabular-nums">{billed}/{total}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main 3-column layout: Calendar | Command | Floor */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          <AnimatePresence mode="popLayout">
            {/* Column 1: Res Calendar (sticky, scrollable internally) */}
            {(!zoomedSection || zoomedSection === 'calendar') && (
              <motion.aside
                key="calendar"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: zoomedSection === 'calendar' ? '100%' : panelWidths.calendar }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="flex flex-col border-r border-border overflow-hidden flex-shrink-0 h-full"
              >
                <SectionHeader title="Res Calendar" icon={CalendarDays} sectionKey="calendar" zoomedSection={zoomedSection} onZoom={setZoomedSection} />
                <div className="flex-1 overflow-y-auto">
                  <ServiceCalendarPane
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    servicePeriod={servicePeriod}
                    onServicePeriodChange={setServicePeriod}
                    stats={stats}
                    pendingAuditCount={0}
                    onAuditClick={() => setAuditPanelOpen(true)}
                    onWalkInClick={() => setWalkInOpen(true)}
                    onNewBookingClick={() => navigate("/reservation/reservations/new")}
                    zones={floorZones.map((z: any) => ({ id: z.id, zone: z.zone ?? z.label, label: z.label }))}
                    waiters={waiters as any}
                    zoneWaiterMap={zoneWaiterMap}
                    onZoneWaiterChange={(zone: string, staff: any) => {
                      setZoneWaiterMap({ ...zoneWaiterMap, [zone]: staff });
                    }}
                  />
                </div>
              </motion.aside>
            )}

            {/* Resize handle: Calendar ↔ Command */}
            {!zoomedSection && <ResizeHandle onDrag={handleCalendarResize} onDoubleClick={toggleCalendarExpand} />}

            {/* Column 2: Command Panel */}
            {(!zoomedSection || zoomedSection === 'command') && (
              <motion.main
                key="command"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="flex-1 flex flex-col overflow-hidden border-r border-border min-w-0 h-full"
              >
                <SectionHeader title="Command Panel" icon={LayoutList} sectionKey="command" zoomedSection={zoomedSection} onZoom={setZoomedSection} />
                {zoomedSection === 'command' ? (
                  <FullPageCommandPanel
                    reservations={filteredReservations}
                    journeyCounts={journeyCounts}
                    journeyFilter={journeyFilter}
                    onFilterChange={setJourneyFilter}
                    onAdvance={advanceReservation}
                    getJourneyStage={getJourneyStage}
                    getWaiterForTable={getWaiterForTable}
                    tables={tables}
                    onNavigate={navigate}
                  />
                ) : (
                  <>
                    <EnhancedJourneyBar
                      counts={journeyCounts as Record<JourneyStage, number>}
                      activeFilter={journeyFilter}
                      onStageClick={setJourneyFilter}
                    />
                    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                      {filteredReservations.length === 0 ? (
                        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                          No reservations{journeyFilter ? ` in ${journeyFilter} stage` : ""} for this period.
                        </div>
                      ) : (
                        filteredReservations.map((reservation: any) => {
                          const table = tables.find((t: any) => t.id === reservation.table_id);
                          return (
                            <ReservationRowEnhanced
                              key={reservation.id}
                              reservation={reservation}
                              journeyStage={getJourneyStage(reservation)}
                              waiterName={table ? getWaiterForTable(table) : null}
                              onClick={() => navigate(`/reservation/reservations/${reservation.id}`)}
                              onNavigate={navigate}
                              onAdvance={advanceReservation}
                            />
                          );
                        })
                      )}
                    </div>
                  </>
                )}
              </motion.main>
            )}

            {/* Resize handle: Command ↔ Floor */}
            {!zoomedSection && <ResizeHandle onDrag={handleCommandResize} />}

            {/* Column 3: Floor View — takes full remaining height, no wasted space */}
            {(!zoomedSection || zoomedSection === 'floor') && (
              <motion.section
                key="floor"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="flex-1 flex flex-col overflow-hidden min-w-0 h-full"
              >
                <SectionHeader title="Floor View" icon={MapPin} sectionKey="floor" zoomedSection={zoomedSection} onZoom={setZoomedSection} />
                <div className="flex-1 overflow-hidden relative">
                  {tables.length > 0 ? (
                    <FloorCanvas
                      tables={tables as any}
                      layout={activeLayout}
                      reservations={reservations as any}
                      zones={floorZones.map((z: any) => ({ id: z.id, zone: z.zone ?? z.label, label: z.label, x: z.x ?? 0, y: z.y ?? 0, width: z.width ?? 200, height: z.height ?? 200, color: z.color ?? 'rgba(107,114,128,0.25)' }))}
                      waiterMap={waiterInitialsMap}
                      floorActionMode={floorActionMode}
                      onTableAction={handleTableAction}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      <div className="text-center space-y-2">
                        <MapPin className="mx-auto h-8 w-8 opacity-40" />
                        <p>No tables configured</p>
                        <p className="text-xs opacity-60">Add tables in Floor Editor</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between border-t border-border bg-background px-3 py-1.5 flex-shrink-0">
          <div className="flex gap-1">
            {([
              { key: 'calendar' as const, label: 'Calendar', icon: CalendarDays },
              { key: 'command' as const, label: 'Command', icon: LayoutList },
              { key: 'floor' as const, label: 'Floor', icon: MapPin },
            ]).map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={zoomedSection === key ? "default" : "ghost"}
                size="sm"
                className="h-6 px-2 text-[10px] gap-1"
                onClick={() => setZoomedSection(zoomedSection === key ? null : key)}
              >
                <Icon className="h-3 w-3" />
                {label}
              </Button>
            ))}
            {zoomedSection && (
              <Button variant="outline" size="sm" className="h-6 px-2 text-[10px]" onClick={() => setZoomedSection(null)}>
                All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] text-muted-foreground"
              onClick={() => savePanelWidths({ calendar: 240, command: 0 })}
              title="Reset panel sizes"
            >
              Reset
            </Button>
          </div>
          <span className="text-xs text-muted-foreground">
            {format(new Date(selectedDate), "EEEE, MMM d")} &middot;{" "}
            {filteredReservations.length} reservation{filteredReservations.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay dropAnimation={null}>
        {activeReservation ? (
          <div className="rounded-md border border-primary/40 bg-background px-3 py-2 shadow-lg opacity-90">
            <p className="text-sm font-medium">
              {activeReservation.guest?.name ?? activeReservation.guest_name ?? "Guest"}
            </p>
            <p className="text-xs text-muted-foreground">
              Party of {activeReservation.party_size ?? "?"}
            </p>
          </div>
        ) : null}
      </DragOverlay>

      <WalkInDialog open={walkInOpen} onOpenChange={setWalkInOpen} />
    </DndContext>
  );
}

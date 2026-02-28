import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isToday,
} from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  Clock,
  AlertTriangle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CalendarEvent {
  id: string;
  client_name: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  party_size: number | null;
  event_type: string | null;
  status: string;
  venue_space_id: string | null;
  room_name: string | null;
  room_color: string | null;
}

interface VenueSpace {
  id: string;
  name: string;
  color_code: string | null;
  is_active: boolean;
}

type ViewMode = "month" | "week";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DEFAULT_ROOM_COLOR = "#94a3b8"; // slate-400

function getRoomColor(space: VenueSpace | undefined): string {
  return space?.color_code || DEFAULT_ROOM_COLOR;
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    CONFIRMED: "Confirmed",
    TENTATIVE: "Tentative",
    DEPOSIT_PAID: "Deposit Paid",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    ENQUIRY: "Enquiry",
  };
  return map[status] ?? status;
}

// ---------------------------------------------------------------------------
// Component: VFCalendar
// ---------------------------------------------------------------------------

const VFCalendar: React.FC = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const navigate = useNavigate();

  // -- State ---------------------------------------------------------------
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // -- Computed date range -------------------------------------------------
  const dateRange = useMemo(() => {
    if (viewMode === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return { start: calStart, end: calEnd, monthStart, monthEnd };
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return { start: weekStart, end: weekEnd, monthStart: weekStart, monthEnd: weekEnd };
    }
  }, [currentDate, viewMode]);

  const calendarDays = useMemo(
    () => eachDayOfInterval({ start: dateRange.start, end: dateRange.end }),
    [dateRange],
  );

  // -- Queries -------------------------------------------------------------

  const { data: venueSpaces = [], isLoading: loadingSpaces } = useQuery({
    queryKey: ["vf_calendar_spaces", orgId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("res_venue_spaces")
        .select("id, name, color_code, is_active")
        .eq("org_id", orgId!)
        .eq("is_active", true)
        .order("sort_order");
      if (error) {
        console.error("Error fetching venue spaces:", error);
        return [];
      }
      return (data ?? []) as VenueSpace[];
    },
    enabled: !!orgId,
  });

  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: [
      "vf_calendar_events",
      orgId,
      format(dateRange.start, "yyyy-MM-dd"),
      format(dateRange.end, "yyyy-MM-dd"),
    ],
    queryFn: async () => {
      const startStr = format(dateRange.start, "yyyy-MM-dd");
      const endStr = format(dateRange.end, "yyyy-MM-dd");

      const { data, error } = await (supabase as any)
        .from("res_functions")
        .select(
          "id, client_name, event_date, start_time, end_time, party_size, event_type, status, venue_space_id",
        )
        .eq("org_id", orgId!)
        .gte("event_date", startStr)
        .lte("event_date", endStr)
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error fetching calendar events:", error);
        toast.error("Failed to load calendar events");
        return [];
      }
      return (data ?? []) as CalendarEvent[];
    },
    enabled: !!orgId,
  });

  // -- Derived data --------------------------------------------------------

  const spaceMap = useMemo(() => {
    const map = new Map<string, VenueSpace>();
    venueSpaces.forEach((s) => map.set(s.id, s));
    return map;
  }, [venueSpaces]);

  // Initialize selectedRooms to all rooms when spaces load
  useMemo(() => {
    if (venueSpaces.length > 0 && selectedRooms.size === 0) {
      setSelectedRooms(new Set(venueSpaces.map((s) => s.id)));
    }
  }, [venueSpaces]);

  // Enrich events with room data and apply room filter
  const filteredEvents = useMemo(() => {
    return events
      .map((evt) => ({
        ...evt,
        room_name: evt.venue_space_id ? spaceMap.get(evt.venue_space_id)?.name ?? null : null,
        room_color: evt.venue_space_id
          ? getRoomColor(spaceMap.get(evt.venue_space_id))
          : DEFAULT_ROOM_COLOR,
      }))
      .filter((evt) => {
        if (selectedRooms.size === 0) return true;
        if (!evt.venue_space_id) return true; // show events without a room
        return selectedRooms.has(evt.venue_space_id);
      });
  }, [events, spaceMap, selectedRooms]);

  // Group events by date string
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    filteredEvents.forEach((evt) => {
      const key = evt.event_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(evt);
    });
    return map;
  }, [filteredEvents]);

  // Detect conflicts: same room, same day
  const conflictDays = useMemo(() => {
    const conflicts = new Set<string>();
    eventsByDate.forEach((dayEvents, dateKey) => {
      const roomCounts = new Map<string, number>();
      dayEvents.forEach((evt) => {
        if (evt.venue_space_id) {
          roomCounts.set(evt.venue_space_id, (roomCounts.get(evt.venue_space_id) || 0) + 1);
        }
      });
      roomCounts.forEach((count) => {
        if (count >= 2) conflicts.add(dateKey);
      });
    });
    return conflicts;
  }, [eventsByDate]);

  // Events for selected day (Sheet)
  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    const key = format(selectedDay, "yyyy-MM-dd");
    return eventsByDate.get(key) ?? [];
  }, [selectedDay, eventsByDate]);

  // -- Handlers ------------------------------------------------------------

  const toggleRoom = (roomId: string) => {
    setSelectedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) {
        next.delete(roomId);
      } else {
        next.add(roomId);
      }
      return next;
    });
  };

  const navigatePrev = () => {
    if (viewMode === "month") {
      setCurrentDate((d) => subMonths(d, 1));
    } else {
      setCurrentDate((d) => subWeeks(d, 1));
    }
  };

  const navigateNext = () => {
    if (viewMode === "month") {
      setCurrentDate((d) => addMonths(d, 1));
    } else {
      setCurrentDate((d) => addWeeks(d, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // -- Loading state -------------------------------------------------------
  const isLoading = loadingEvents || loadingSpaces;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-vf-gold mx-auto" />
          <p className="text-sm text-vf-navy/60">Loading calendar...</p>
        </div>
      </div>
    );
  }

  // -- Render: Month View --------------------------------------------------
  const renderMonthView = () => {
    const weeks: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-vf-navy/5 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-vf-navy/5">
          {DAY_HEADERS.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-semibold text-vf-navy/50 uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-vf-navy/5 last:border-b-0">
            {week.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayEvents = eventsByDate.get(dateKey) ?? [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);
              const hasConflict = conflictDays.has(dateKey);

              return (
                <div
                  key={dateKey}
                  className={`min-h-[80px] lg:min-h-[100px] p-1.5 border-r border-vf-navy/5 last:border-r-0 cursor-pointer transition-colors hover:bg-vf-cream/40 ${
                    !isCurrentMonth ? "bg-vf-navy/[0.02]" : ""
                  }`}
                  onClick={() => setSelectedDay(day)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                        isTodayDate
                          ? "ring-2 ring-vf-gold bg-vf-gold/10 text-vf-navy font-bold"
                          : isCurrentMonth
                            ? "text-vf-navy"
                            : "text-vf-navy/30"
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                    {hasConflict && (
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                    )}
                  </div>

                  {/* Event dots / bars */}
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((evt) => (
                      <div
                        key={evt.id}
                        className="flex items-center gap-1 group"
                        title={`${evt.client_name} ${evt.room_name ? `- ${evt.room_name}` : ""}`}
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: evt.room_color || DEFAULT_ROOM_COLOR }}
                        />
                        <span className="text-[10px] text-vf-navy/60 truncate hidden lg:inline">
                          {evt.client_name}
                        </span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[9px] text-vf-navy/40 font-medium">
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // -- Render: Week View ---------------------------------------------------
  const renderWeekView = () => {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-vf-navy/5 overflow-hidden">
        <div className="grid grid-cols-7">
          {calendarDays.slice(0, 7).map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDate.get(dateKey) ?? [];
            const isTodayDate = isToday(day);
            const hasConflict = conflictDays.has(dateKey);

            return (
              <div
                key={dateKey}
                className="border-r border-vf-navy/5 last:border-r-0 min-h-[400px]"
              >
                {/* Day header */}
                <div
                  className={`p-2 border-b border-vf-navy/5 text-center ${
                    isTodayDate ? "bg-vf-gold/10" : "bg-vf-cream/30"
                  }`}
                >
                  <p className="text-[10px] font-semibold text-vf-navy/50 uppercase tracking-wider">
                    {format(day, "EEE")}
                  </p>
                  <p
                    className={`text-lg font-bold mt-0.5 ${
                      isTodayDate ? "text-vf-gold" : "text-vf-navy"
                    }`}
                  >
                    {format(day, "d")}
                  </p>
                  {hasConflict && (
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span className="text-[9px] text-amber-600 font-medium">Conflict</span>
                    </div>
                  )}
                </div>

                {/* Events stack */}
                <div className="p-1.5 space-y-1.5">
                  {dayEvents.length === 0 && (
                    <p className="text-[10px] text-vf-navy/20 text-center py-4">No events</p>
                  )}
                  {dayEvents.map((evt) => (
                    <Card
                      key={evt.id}
                      className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      style={{ borderLeftWidth: "3px", borderLeftColor: evt.room_color || DEFAULT_ROOM_COLOR }}
                      onClick={() => navigate(`/reservation/functions/${evt.id}`)}
                    >
                      <CardContent className="p-2">
                        <p className="text-xs font-semibold text-vf-navy truncate">
                          {evt.client_name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-vf-navy/50">
                          {evt.start_time && (
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {evt.start_time.slice(0, 5)}
                            </span>
                          )}
                          {evt.party_size && (
                            <span className="flex items-center gap-0.5">
                              <Users className="w-2.5 h-2.5" />
                              {evt.party_size}
                            </span>
                          )}
                        </div>
                        {evt.room_name && (
                          <Badge
                            variant="outline"
                            className="text-[8px] px-1 h-3.5 mt-1"
                            style={{
                              borderColor: evt.room_color || undefined,
                              color: evt.room_color || undefined,
                            }}
                          >
                            {evt.room_name}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // -- Main render ---------------------------------------------------------
  return (
    <div className="min-h-screen bg-vf-cream">
      <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-vf-navy flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-vf-gold" />
            </div>
            <h1 className="text-xl lg:text-2xl font-display font-bold text-vf-navy">Calendar</h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View toggle */}
            <div className="flex rounded-lg border border-vf-navy/10 overflow-hidden">
              <button
                onClick={() => setViewMode("month")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === "month"
                    ? "bg-vf-navy text-white"
                    : "bg-white text-vf-navy/60 hover:bg-vf-cream"
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === "week"
                    ? "bg-vf-navy text-white"
                    : "bg-white text-vf-navy/60 hover:bg-vf-cream"
                }`}
              >
                Week
              </button>
            </div>

            <Button variant="outline" size="sm" onClick={goToToday} className="text-xs">
              Today
            </Button>
          </div>
        </div>

        {/* Navigation + Room Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={navigatePrev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-lg font-semibold text-vf-navy min-w-[180px] text-center">
              {viewMode === "month"
                ? format(currentDate, "MMMM yyyy")
                : `${format(dateRange.start, "d MMM")} - ${format(dateRange.end, "d MMM yyyy")}`}
            </h2>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={navigateNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Room filter chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {venueSpaces.map((space) => {
              const isActive = selectedRooms.has(space.id);
              const color = getRoomColor(space);
              return (
                <button
                  key={space.id}
                  onClick={() => toggleRoom(space.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                    isActive
                      ? "border-current shadow-sm"
                      : "border-vf-navy/10 opacity-40 hover:opacity-70"
                  }`}
                  style={{
                    color: isActive ? color : undefined,
                    backgroundColor: isActive ? `${color}15` : undefined,
                    borderColor: isActive ? color : undefined,
                  }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {space.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Calendar Grid */}
        {viewMode === "month" ? renderMonthView() : renderWeekView()}

        {/* Room Legend */}
        {venueSpaces.length > 0 && (
          <div className="flex items-center gap-4 flex-wrap pt-1">
            {venueSpaces.map((space) => (
              <div key={space.id} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getRoomColor(space) }}
                />
                <span className="text-xs text-vf-navy/60">{space.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Day Detail Sheet */}
        <Sheet open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
          <SheetContent side="right" className="w-full sm:max-w-md bg-vf-cream">
            <SheetHeader>
              <SheetTitle className="text-vf-navy font-display">
                {selectedDay ? format(selectedDay, "EEEE, d MMMM yyyy") : ""}
              </SheetTitle>
              <SheetDescription>
                {selectedDayEvents.length === 0
                  ? "No events on this day."
                  : `${selectedDayEvents.length} event${selectedDayEvents.length !== 1 ? "s" : ""} scheduled.`}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 space-y-3">
              {selectedDayEvents.length === 0 && (
                <div className="py-12 text-center">
                  <CalendarIcon className="w-10 h-10 text-vf-navy/15 mx-auto mb-3" />
                  <p className="text-sm text-vf-navy/40">No events scheduled</p>
                </div>
              )}

              {selectedDayEvents.map((evt) => {
                const hasConflict =
                  evt.venue_space_id &&
                  selectedDayEvents.filter((e) => e.venue_space_id === evt.venue_space_id).length >=
                    2;

                return (
                  <Card
                    key={evt.id}
                    className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow bg-white"
                    style={{
                      borderLeftWidth: "4px",
                      borderLeftColor: evt.room_color || DEFAULT_ROOM_COLOR,
                    }}
                    onClick={() => navigate(`/reservation/functions/${evt.id}`)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-vf-navy truncate">
                            {evt.client_name}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-vf-navy/50">
                            {evt.start_time && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {evt.start_time.slice(0, 5)}
                                {evt.end_time ? ` - ${evt.end_time.slice(0, 5)}` : ""}
                              </span>
                            )}
                            {evt.party_size && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {evt.party_size} pax
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge
                            variant="outline"
                            className="text-[10px]"
                          >
                            {getStatusLabel(evt.status)}
                          </Badge>
                          {hasConflict && (
                            <div className="flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3 text-amber-500" />
                              <span className="text-[9px] text-amber-600 font-medium">
                                Room conflict
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {evt.room_name && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 h-4 mt-2"
                          style={{
                            borderColor: evt.room_color || undefined,
                            color: evt.room_color || undefined,
                          }}
                        >
                          {evt.room_name}
                        </Badge>
                      )}

                      {evt.event_type && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 h-4 mt-2 ml-1">
                          {evt.event_type}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default VFCalendar;

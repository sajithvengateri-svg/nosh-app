import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { View, Text, Pressable, RefreshControl, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import {
  CalendarDays, ChevronLeft, ChevronRight,
} from "lucide-react-native";
import { supabase } from "../../../lib/supabase";
import { useOrg } from "../../../contexts/OrgProvider";
import { useTheme } from "../../../contexts/ThemeProvider";
import { Input } from "../../../components/ui/Input";
import { SkeletonCard } from "../../../components/ui/Skeleton";
import { FAB } from "../../../components/ui/FAB";
import { FormSheet } from "../../../components/ui/FormSheet";
import { Select } from "../../../components/ui/Select";
import { DatePicker } from "../../../components/ui/DatePicker";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { lightTap } from "../../../lib/haptics";

interface CalendarEvent {
  id: string;
  title: string;
  event_type: string | null;
  date: string;
  time: string | null;
  end_time: string | null;
  description: string | null;
  org_id: string | null;
}

const EVENT_TYPES = [
  { label: "Meeting", value: "meeting" }, { label: "Inspection", value: "inspection" },
  { label: "Training", value: "training" }, { label: "Delivery", value: "delivery" },
  { label: "Maintenance", value: "maintenance" }, { label: "License Renewal", value: "license" },
  { label: "Interview", value: "interview" }, { label: "Fetch Call", value: "fetch_call" },
  { label: "Event", value: "event" }, { label: "Other", value: "other" },
];

const TYPE_COLORS: Record<string, string> = {
  meeting: "#6366F1", inspection: "#DC2626", training: "#F59E0B",
  delivery: "#10B981", maintenance: "#0EA5E9", license: "#F97316",
  interview: "#EC4899", fetch_call: "#14B8A6", event: "#8B5CF6", other: "#6B7280",
};

const DAY_NAMES_SHORT = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FULL_DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FULL_MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type ViewMode = "day" | "week" | "month" | "year";

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6AM to 10PM
const HOUR_HEIGHT = 56;

function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function startOfWeek(d: Date): Date { const r = new Date(d); const day = r.getDay(); r.setDate(r.getDate() - (day === 0 ? 6 : day - 1)); r.setHours(0, 0, 0, 0); return r; }
function startOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1); }
function formatDateStr(d: Date): string { return d.toISOString().split("T")[0]; }
function isSameDay(a: Date, b: Date): boolean { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }

function formatDayHeader(d: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${days[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

function formatWeekLabel(ws: Date): string {
  const we = addDays(ws, 6);
  if (ws.getMonth() === we.getMonth()) return `${ws.getDate()}–${we.getDate()} ${MONTH_NAMES[ws.getMonth()]}`;
  return `${ws.getDate()} ${MONTH_NAMES[ws.getMonth()]} – ${we.getDate()} ${MONTH_NAMES[we.getMonth()]}`;
}

function formatHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

function formatDisplayTime(t: string | null): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const hr = h % 12 || 12;
  return m === 0 ? `${hr}${ampm}` : `${hr}:${String(m).padStart(2, "0")}${ampm}`;
}

function timeToHour(t: string | null): number {
  if (!t) return 9;
  const [h] = t.split(":").map(Number);
  return h;
}

function timeToMinutes(t: string | null): number {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

export default function CalendarScreen() {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ date?: string; view?: string }>();
  const scrollRef = useRef<ScrollView>(null);

  const initialDate = params.date ? new Date(params.date + "T00:00:00") : new Date();
  const initialView = (["day", "week", "month", "year"].includes(params.view || "") ? params.view : "day") as ViewMode;

  const { data: events, isLoading, refetch, isRefetching } = useQuery<CalendarEvent[]>({
    queryKey: ["calendar", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from("calendar_events").select("*").eq("org_id", orgId).order("date", { ascending: true }).order("time", { ascending: true }).limit(500);
      if (error) throw error;
      return (data as CalendarEvent[]) || [];
    },
    enabled: !!orgId,
  });

  const createEvent = useMutation({
    mutationFn: async (evt: Partial<CalendarEvent>) => {
      const { error } = await supabase.from("calendar_events").insert({ ...evt, org_id: orgId });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["calendar"] }),
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CalendarEvent> & { id: string }) => {
      const { error } = await supabase.from("calendar_events").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["calendar"] }),
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("calendar_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["calendar"] }),
  });

  const [viewMode, setViewMode] = useState<ViewMode>(initialView);
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(initialDate));
  const [monthDate, setMonthDate] = useState<Date>(() => startOfMonth(initialDate));
  const [yearDate, setYearDate] = useState<number>(initialDate.getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("meeting");
  const [eventDate, setEventDate] = useState<Date>(new Date());
  const [eventTime, setEventTime] = useState<Date>(new Date(2000, 0, 1, 9, 0));
  const [description, setDescription] = useState("");

  const todayObj = new Date();
  const today = formatDateStr(todayObj);

  // Scroll to ~8AM on day/week view mount
  useEffect(() => {
    if (viewMode === "day" || viewMode === "week") {
      setTimeout(() => scrollRef.current?.scrollTo({ y: (8 - 6) * HOUR_HEIGHT, animated: false }), 100);
    }
  }, [viewMode]);

  const goToToday = useCallback(() => {
    const now = new Date();
    setSelectedDate(now);
    setWeekStart(startOfWeek(now));
    setMonthDate(startOfMonth(now));
    setYearDate(now.getFullYear());
  }, []);

  const eventsMap = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const e of events || []) {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    }
    return map;
  }, [events]);

  const eventDatesSet = useMemo(() => new Set((events || []).map((e) => e.date)), [events]);

  // Week view data
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(weekStart, i);
      const ds = formatDateStr(d);
      return { date: d, dateStr: ds, events: eventsMap[ds] || [] };
    });
  }, [eventsMap, weekStart]);

  // Month grid
  const monthGrid = useMemo(() => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = (firstDay.getDay() + 6) % 7;

    const cells: { date: Date; dateStr: string; events: CalendarEvent[]; isCurrentMonth: boolean }[] = [];
    for (let i = 0; i < startDay; i++) {
      const d = addDays(firstDay, -(startDay - i));
      const ds = formatDateStr(d);
      cells.push({ date: d, dateStr: ds, events: eventsMap[ds] || [], isCurrentMonth: false });
    }
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const d = new Date(year, month, day);
      const ds = formatDateStr(d);
      cells.push({ date: d, dateStr: ds, events: eventsMap[ds] || [], isCurrentMonth: true });
    }
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = addDays(lastDay, i);
        const ds = formatDateStr(d);
        cells.push({ date: d, dateStr: ds, events: eventsMap[ds] || [], isCurrentMonth: false });
      }
    }
    return cells;
  }, [eventsMap, monthDate]);

  // Day events
  const dayEvents = useMemo(() => eventsMap[formatDateStr(selectedDate)] || [], [eventsMap, selectedDate]);

  const parseTime = (t: string | null) => { if (!t) return new Date(2000, 0, 1, 9, 0); const [h, m] = t.split(":").map(Number); return new Date(2000, 0, 1, h || 0, m || 0); };
  const formatTime = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  const resetForm = () => { setTitle(""); setEventType("meeting"); setEventDate(new Date()); setEventTime(new Date(2000, 0, 1, 9, 0)); setDescription(""); setEditing(null); };
  const openCreate = (prefillDate?: Date, prefillHour?: number) => {
    resetForm();
    if (prefillDate) setEventDate(prefillDate);
    if (prefillHour !== undefined) setEventTime(new Date(2000, 0, 1, prefillHour, 0));
    setShowForm(true);
  };
  const openEdit = (evt: CalendarEvent) => {
    setEditing(evt); setTitle(evt.title || ""); setEventType(evt.event_type || "meeting");
    setEventDate(new Date(evt.date + "T00:00:00")); setEventTime(parseTime(evt.time));
    setDescription(evt.description || ""); setShowForm(true);
  };

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert("Error", "Title is required"); return; }
    setSaving(true);
    try {
      const data: any = { title: title.trim(), event_type: eventType, date: eventDate.toISOString().split("T")[0], time: formatTime(eventTime), description: description.trim() || null };
      if (editing) await updateEvent.mutateAsync({ id: editing.id, ...data });
      else await createEvent.mutateAsync(data);
      setShowForm(false); resetForm();
    } catch (e: any) { Alert.alert("Error", e.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleLongPress = (item: CalendarEvent) => {
    Alert.alert(item.title, "What would you like to do?", [
      { text: "Edit", onPress: () => openEdit(item) },
      { text: "Delete", style: "destructive", onPress: () => Alert.alert("Delete", "Delete this event?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => deleteEvent.mutate(item.id) }]) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // Navigation helpers
  const navLabel = useMemo(() => {
    switch (viewMode) {
      case "day": return formatDayHeader(selectedDate);
      case "week": return formatWeekLabel(weekStart);
      case "month": return `${FULL_MONTH_NAMES[monthDate.getMonth()]} ${monthDate.getFullYear()}`;
      case "year": return `${yearDate}`;
    }
  }, [viewMode, selectedDate, weekStart, monthDate, yearDate]);

  const navPrev = useCallback(() => {
    lightTap();
    switch (viewMode) {
      case "day": { const d = addDays(selectedDate, -1); setSelectedDate(d); setWeekStart(startOfWeek(d)); setMonthDate(startOfMonth(d)); break; }
      case "week": { const w = addDays(weekStart, -7); setWeekStart(w); break; }
      case "month": setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1)); break;
      case "year": setYearDate(yearDate - 1); break;
    }
  }, [viewMode, selectedDate, weekStart, monthDate, yearDate]);

  const navNext = useCallback(() => {
    lightTap();
    switch (viewMode) {
      case "day": { const d = addDays(selectedDate, 1); setSelectedDate(d); setWeekStart(startOfWeek(d)); setMonthDate(startOfMonth(d)); break; }
      case "week": { const w = addDays(weekStart, 7); setWeekStart(w); break; }
      case "month": setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1)); break;
      case "year": setYearDate(yearDate + 1); break;
    }
  }, [viewMode, selectedDate, weekStart, monthDate, yearDate]);

  const switchToDay = (d: Date) => {
    setSelectedDate(d);
    setWeekStart(startOfWeek(d));
    setMonthDate(startOfMonth(d));
    setViewMode("day");
  };

  const switchToMonth = (month: number) => {
    setMonthDate(new Date(yearDate, month, 1));
    setViewMode("month");
  };

  // ─── Time Grid (shared by Day & Week) ─────────────────────
  const TimeGutter = () => (
    <View style={{ width: 44 }}>
      {HOURS.map((h) => (
        <View key={h} style={{ height: HOUR_HEIGHT, justifyContent: "flex-start", paddingTop: 0 }}>
          <Text style={{ fontSize: 10, color: colors.textMuted, textAlign: "right", paddingRight: 6, marginTop: -6 }}>
            {formatHour(h)}
          </Text>
        </View>
      ))}
    </View>
  );

  // ─── Event Pill (reused) ───────────────────────────────────
  const EventPill = ({ evt, compact = false }: { evt: CalendarEvent; compact?: boolean }) => {
    const typeColor = TYPE_COLORS[evt.event_type || "other"] || "#6B7280";
    return (
      <Pressable
        onPress={() => openEdit(evt)}
        onLongPress={() => handleLongPress(evt)}
        style={{
          backgroundColor: typeColor + "15",
          borderLeftWidth: 3,
          borderLeftColor: typeColor,
          borderRadius: 6,
          paddingHorizontal: compact ? 4 : 8,
          paddingVertical: compact ? 2 : 5,
          marginBottom: 2,
        }}
      >
        <Text style={{ fontSize: compact ? 9 : 13, fontWeight: "600", color: colors.text }} numberOfLines={1}>
          {compact ? evt.title : `${formatDisplayTime(evt.time)} ${evt.title}`}
        </Text>
        {!compact && evt.description && (
          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }} numberOfLines={1}>{evt.description}</Text>
        )}
      </Pressable>
    );
  };

  // ─── YEAR VIEW: Mini Month ─────────────────────────────────
  const MiniMonth = ({ month, year }: { month: number; year: number }) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();
    const cells: (number | null)[] = Array(startDay).fill(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    return (
      <Pressable onPress={() => { lightTap(); switchToMonth(month); }} style={{ flex: 1, padding: 6 }}>
        <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text, textAlign: "center", marginBottom: 4 }}>
          {MONTH_NAMES[month]}
        </Text>
        <View style={{ flexDirection: "row", marginBottom: 2 }}>
          {DAY_NAMES_SHORT.map((d, i) => (
            <View key={i} style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 8, color: colors.textMuted, fontWeight: "500" }}>{d}</Text>
            </View>
          ))}
        </View>
        {Array.from({ length: Math.ceil(cells.length / 7) }, (_, weekIdx) => (
          <View key={weekIdx} style={{ flexDirection: "row" }}>
            {cells.slice(weekIdx * 7, weekIdx * 7 + 7).map((day, i) => {
              if (day === null) return <View key={i} style={{ flex: 1, height: 18 }} />;
              const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isToday = ds === today;
              const hasEvent = eventDatesSet.has(ds);
              return (
                <View key={i} style={{ flex: 1, height: 18, alignItems: "center", justifyContent: "center" }}>
                  <View style={{
                    width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center",
                    backgroundColor: isToday ? colors.accent : "transparent",
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: isToday ? "800" : "400", color: isToday ? "#FFFFFF" : colors.text }}>
                      {day}
                    </Text>
                  </View>
                  {hasEvent && !isToday && (
                    <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.accent, position: "absolute", bottom: 1 }} />
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Calendar" rightAction={
        <Pressable
          onPress={() => { lightTap(); goToToday(); }}
          style={({ pressed }) => ({
            flexDirection: "row", alignItems: "center", gap: 4,
            backgroundColor: colors.accent + "12", paddingHorizontal: 10, paddingVertical: 5,
            borderRadius: 12, opacity: pressed ? 0.7 : 1,
          })}
        >
          <CalendarDays size={12} color={colors.accent} strokeWidth={2} />
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.accent }}>Today</Text>
        </Pressable>
      } />

      {/* View pills + navigation in one row */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingBottom: 4, gap: 6 }}>
        <Pressable onPress={navPrev} style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
          <ChevronLeft size={14} color={colors.text} strokeWidth={2} />
        </Pressable>

        <View style={{ flex: 1, flexDirection: "row", gap: 4 }}>
          {(["day", "week", "month", "year"] as ViewMode[]).map((mode) => {
            const isActive = viewMode === mode;
            return (
              <Pressable
                key={mode}
                onPress={() => { lightTap(); setViewMode(mode); }}
                style={{
                  flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: "center",
                  backgroundColor: isActive ? colors.accent : colors.surface,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "600", color: isActive ? "#FFFFFF" : colors.textSecondary, textTransform: "capitalize" }}>
                  {mode}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={navNext} style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
          <ChevronRight size={14} color={colors.text} strokeWidth={2} />
        </Pressable>
      </View>

      {/* Nav label */}
      <Pressable onPress={() => { lightTap(); goToToday(); }} style={{ alignItems: "center", paddingBottom: 0 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>{navLabel}</Text>
      </Pressable>

      {/* ── DAY VIEW ── */}
      {viewMode === "day" && (
        <View style={{ flex: 1 }}>
          {isLoading ? (
            <View style={{ padding: 24, gap: 10 }}><SkeletonCard /><SkeletonCard /></View>
          ) : (
            <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}
              refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
              <View style={{ flexDirection: "row" }}>
                <TimeGutter />
                <View style={{ flex: 1 }}>
                  {HOURS.map((h) => {
                    const hourEvents = dayEvents.filter((e) => timeToHour(e.time) === h);
                    return (
                      <Pressable
                        key={h}
                        onPress={() => openCreate(selectedDate, h)}
                        style={{
                          height: HOUR_HEIGHT,
                          borderTopWidth: 0.5,
                          borderTopColor: colors.border,
                          paddingHorizontal: 4,
                          paddingVertical: 2,
                          justifyContent: "flex-start",
                        }}
                      >
                        {hourEvents.map((evt) => (
                          <EventPill key={evt.id} evt={evt} />
                        ))}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      )}

      {/* ── WEEK VIEW ── */}
      {viewMode === "week" && (
        <View style={{ flex: 1 }}>
          {/* Day Headers */}
          <View style={{ flexDirection: "row", paddingLeft: 44 }}>
            {weekDays.map(({ date, dateStr }) => {
              const isToday = dateStr === today;
              const dayIdx = (date.getDay() + 6) % 7;
              return (
                <Pressable key={dateStr} onPress={() => switchToDay(date)} style={{ flex: 1, alignItems: "center", paddingVertical: 4 }}>
                  <Text style={{ fontSize: 10, fontWeight: "600", color: isToday ? colors.accent : colors.textMuted }}>
                    {DAY_NAMES_SHORT[dayIdx]}
                  </Text>
                  <View style={{
                    width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", marginTop: 1,
                    backgroundColor: isToday ? colors.accent : "transparent",
                  }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: isToday ? "#FFFFFF" : colors.text }}>
                      {date.getDate()}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {isLoading ? (
            <View style={{ padding: 24, gap: 10 }}><SkeletonCard /><SkeletonCard /></View>
          ) : (
            <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}
              refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
              <View style={{ flexDirection: "row" }}>
                <TimeGutter />
                <View style={{ flex: 1, flexDirection: "row" }}>
                  {weekDays.map(({ date, dateStr, events: dayEvts }) => {
                    const isToday = dateStr === today;
                    return (
                      <View key={dateStr} style={{ flex: 1, backgroundColor: isToday ? colors.accent + "06" : "transparent" }}>
                        {HOURS.map((h) => {
                          const hourEvts = dayEvts.filter((e) => timeToHour(e.time) === h);
                          return (
                            <Pressable
                              key={h}
                              onPress={() => openCreate(date, h)}
                              style={{
                                height: HOUR_HEIGHT,
                                borderTopWidth: 0.5,
                                borderTopColor: colors.border,
                                borderLeftWidth: 0.5,
                                borderLeftColor: colors.border,
                                paddingHorizontal: 1,
                                paddingVertical: 1,
                              }}
                            >
                              {hourEvts.map((evt) => {
                                const typeColor = TYPE_COLORS[evt.event_type || "other"] || "#6B7280";
                                return (
                                  <Pressable
                                    key={evt.id}
                                    onPress={() => openEdit(evt)}
                                    onLongPress={() => handleLongPress(evt)}
                                    style={{
                                      backgroundColor: typeColor + "20",
                                      borderLeftWidth: 2,
                                      borderLeftColor: typeColor,
                                      borderRadius: 3,
                                      paddingHorizontal: 2,
                                      paddingVertical: 1,
                                      marginBottom: 1,
                                    }}
                                  >
                                    <Text style={{ fontSize: 8, fontWeight: "600", color: typeColor }} numberOfLines={1}>{evt.title}</Text>
                                  </Pressable>
                                );
                              })}
                            </Pressable>
                          );
                        })}
                      </View>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      )}

      {/* ── MONTH VIEW ── */}
      {viewMode === "month" && (
        <View style={{ flex: 1 }}>
          {/* Day Name Headers */}
          <View style={{ flexDirection: "row", paddingHorizontal: 8, paddingBottom: 2 }}>
            {DAY_NAMES_SHORT.map((name, i) => (
              <View key={i} style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textMuted }}>{name}</Text>
              </View>
            ))}
          </View>

          {isLoading ? (
            <View style={{ padding: 24, gap: 10 }}><SkeletonCard /><SkeletonCard /></View>
          ) : (
            <View style={{ flex: 1, paddingHorizontal: 4, paddingBottom: 80 }}>
              {Array.from({ length: Math.ceil(monthGrid.length / 7) }, (_, weekIdx) => (
                <View key={weekIdx} style={{ flex: 1, flexDirection: "row" }}>
                  {monthGrid.slice(weekIdx * 7, weekIdx * 7 + 7).map((cell) => {
                    const isToday = cell.dateStr === today;
                    return (
                      <Pressable
                        key={cell.dateStr}
                        onPress={() => switchToDay(cell.date)}
                        style={{
                          flex: 1, margin: 0.5, borderRadius: 6, padding: 2,
                          backgroundColor: isToday ? colors.accent + "08" : "transparent",
                          borderWidth: isToday ? 0.5 : 0, borderColor: colors.accent + "30",
                        }}
                      >
                        <View style={{ alignItems: "center", paddingTop: 2 }}>
                          <View style={{
                            width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center",
                            backgroundColor: isToday ? colors.accent : "transparent",
                          }}>
                            <Text style={{
                              fontSize: 13, fontWeight: isToday ? "800" : "500",
                              color: isToday ? "#FFFFFF" : cell.isCurrentMonth ? colors.text : colors.textMuted + "40",
                            }}>
                              {cell.date.getDate()}
                            </Text>
                          </View>
                        </View>
                        {/* Event dots */}
                        <View style={{ flexDirection: "row", justifyContent: "center", gap: 2, marginTop: 3, flexWrap: "wrap" }}>
                          {cell.events.slice(0, 3).map((evt) => (
                            <View key={evt.id} style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: TYPE_COLORS[evt.event_type || "other"] || "#6B7280" }} />
                          ))}
                        </View>
                        {cell.events.length > 3 && (
                          <Text style={{ fontSize: 8, color: colors.textMuted, textAlign: "center" }}>+{cell.events.length - 3}</Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* ── YEAR VIEW ── */}
      {viewMode === "year" && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
          {Array.from({ length: 4 }, (_, rowIdx) => (
            <View key={rowIdx} style={{ flexDirection: "row", marginBottom: 8 }}>
              {Array.from({ length: 3 }, (_, colIdx) => {
                const month = rowIdx * 3 + colIdx;
                return <MiniMonth key={month} month={month} year={yearDate} />;
              })}
            </View>
          ))}
        </ScrollView>
      )}

      <FAB onPress={() => openCreate(selectedDate)} />
      <FormSheet visible={showForm} onClose={() => { setShowForm(false); resetForm(); }} onSave={handleSave} title={editing ? "Edit Event" : "New Event"} saving={saving}>
        <Input label="Title" value={title} onChangeText={setTitle} placeholder="Event title" />
        <Select label="Type" value={eventType} onValueChange={setEventType} options={EVENT_TYPES} />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}><DatePicker label="Date" value={eventDate} onChange={setEventDate} mode="date" /></View>
          <View style={{ flex: 1 }}><DatePicker label="Time" value={eventTime} onChange={setEventTime} mode="time" /></View>
        </View>
        <Input label="Description" value={description} onChangeText={setDescription} placeholder="Event details" multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: "top" }} />
      </FormSheet>
    </SafeAreaView>
  );
}

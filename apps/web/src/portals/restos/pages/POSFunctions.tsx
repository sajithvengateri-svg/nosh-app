import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users, DollarSign, Clock, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  ENQUIRY: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  CONFIRMED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  COMPLETED: "bg-sky-500/20 text-sky-400 border-sky-500/40",
  CANCELLED: "bg-slate-500/20 text-slate-400 border-slate-500/40",
  PROPOSAL_SENT: "bg-violet-500/20 text-violet-400 border-violet-500/40",
};

export default function POSFunctions() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: functions = [], isLoading } = useQuery({
    queryKey: ["res-functions", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("res_functions")
        .select("*")
        .eq("org_id", orgId!)
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, typeof functions> = {};
    functions.forEach((f: any) => {
      const key = f.event_date;
      if (!map[key]) map[key] = [];
      map[key].push(f);
    });
    return map;
  }, [functions]);

  const selectedEvents = selectedDate
    ? eventsByDate[format(selectedDate, "yyyy-MM-dd")] || []
    : [];

  const upcomingEvents = functions.filter((f: any) => new Date(f.event_date) >= new Date()).slice(0, 5);

  const stats = useMemo(() => {
    const confirmed = functions.filter((f: any) => f.status === "CONFIRMED");
    const totalValue = confirmed.reduce((s: number, f: any) => s + (Number(f.quoted_total) || 0), 0);
    const totalGuests = confirmed.reduce((s: number, f: any) => s + (f.party_size || 0), 0);
    return { count: confirmed.length, totalValue, totalGuests, enquiries: functions.filter((f: any) => f.status === "ENQUIRY").length };
  }, [functions]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Functions & Events</h1>
        <p className="text-sm text-slate-400">Upcoming functions, packages, and event management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-white">{stats.count}</p><p className="text-xs text-slate-400">Confirmed</p>
        </CardContent></Card>
        <Card className="bg-white/5 border-white/10"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-white">{stats.enquiries}</p><p className="text-xs text-slate-400">Enquiries</p>
        </CardContent></Card>
        <Card className="bg-white/5 border-white/10"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-white">{stats.totalGuests}</p><p className="text-xs text-slate-400">Total Guests</p>
        </CardContent></Card>
        <Card className="bg-white/5 border-white/10"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">${stats.totalValue.toLocaleString()}</p><p className="text-xs text-slate-400">Pipeline Value</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="bg-white/5 border-white/10 lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-white">{format(currentMonth, "MMMM yyyy")}</CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="text-[10px] text-center text-slate-500 font-medium py-1">{d}</div>
              ))}
              {/* Pad start */}
              {Array.from({ length: (days[0].getDay() + 6) % 7 }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {days.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const dayEvents = eventsByDate[key] || [];
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "relative h-12 rounded-lg text-xs font-medium transition-colors flex flex-col items-center justify-start pt-1",
                      isSelected ? "bg-rose-500/20 border border-rose-500/40" : "hover:bg-white/5",
                      isToday && !isSelected ? "ring-1 ring-rose-500/30" : ""
                    )}
                  >
                    <span className={cn("text-slate-300", isToday && "text-rose-400 font-bold")}>{day.getDate()}</span>
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {dayEvents.slice(0, 3).map((_: any, i: number) => (
                          <span key={i} className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected day detail */}
            {selectedDate && (
              <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                <p className="text-xs text-slate-500">{format(selectedDate, "EEEE, d MMMM yyyy")}</p>
                {selectedEvents.length === 0 ? (
                  <p className="text-xs text-slate-500">No events scheduled</p>
                ) : (
                  selectedEvents.map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                      <div>
                        <p className="text-sm text-white font-medium">{e.client_name || "Unnamed"}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{e.party_size || "?"}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{e.start_time || "TBC"}</span>
                          <span>{e.event_type || "Event"}</span>
                        </div>
                      </div>
                      <Badge className={cn("text-[10px] border", STATUS_COLORS[e.status] || STATUS_COLORS.ENQUIRY)}>
                        {e.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader><CardTitle className="text-sm text-white">Upcoming</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <p className="text-xs text-slate-500">No upcoming events</p>
            ) : (
              upcomingEvents.map((e: any) => (
                <div key={e.id} className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white font-medium">{e.client_name || "Unnamed"}</p>
                    <Badge className={cn("text-[10px] border", STATUS_COLORS[e.status] || STATUS_COLORS.ENQUIRY)}>
                      {e.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{format(new Date(e.event_date), "d MMM")}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{e.party_size || "?"}</span>
                    {e.quoted_total && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{Number(e.quoted_total).toLocaleString()}</span>}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

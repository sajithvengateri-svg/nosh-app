import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { useNavigate } from "react-router-dom";
import { format, isToday } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, CalendarCheck, Crown, Clock, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchReservationsByDate } from "@/lib/shared/queries/resQueries";
import { WeatherPanel } from "../components/WeatherPanel";

const ResDiary = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["res_reservations", orgId, dateStr],
    queryFn: async () => {
      const { data } = await fetchReservationsByDate(orgId!, dateStr);
      return data ?? [];
    },
    enabled: !!orgId,
  });

  const totalCovers = useMemo(
    () => reservations.reduce((sum: number, r: any) => sum + (r.party_size || 0), 0),
    [reservations]
  );

  const goToToday = () => setSelectedDate(new Date());

  // Group reservations by time slot
  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const r of reservations) {
      const slot = r.time?.slice(0, 5) || "No time";
      if (!map.has(slot)) map.set(slot, []);
      map.get(slot)!.push(r);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [reservations]);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarCheck className="w-7 h-7 text-primary" /> Res Diary
          </h1>
          <p className="text-muted-foreground text-sm">
            {format(selectedDate, "EEEE, d MMMM yyyy")}
          </p>
        </div>
        {!isToday(selectedDate) && (
          <Button onClick={goToToday} variant="default" size="sm">
            <Zap className="w-4 h-4 mr-1" /> Go to Now
          </Button>
        )}
      </div>

      {/* Split layout: calendar + weather left, diary right */}
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] lg:grid-cols-[360px_1fr] gap-6">
        {/* Left panel: Calendar + Weather + Summary */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                className={cn("p-0 pointer-events-auto")}
              />
            </CardContent>
          </Card>

          {/* Day summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Day Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <CalendarCheck className="w-3.5 h-3.5" /> Bookings
                </span>
                <span className="font-bold">{reservations.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Covers
                </span>
                <span className="font-bold">{totalCovers}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Time slots
                </span>
                <span className="font-bold">{grouped.length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Weather — compact 7-day cards + radar */}
          <WeatherPanel
            selectedDate={dateStr}
            onDateSelect={(d) => setSelectedDate(new Date(d + "T00:00:00"))}
            compact
          />
        </div>

        {/* Diary timeline */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>{format(selectedDate, "d MMM")} — Timeline</span>
              <Button size="sm" variant="outline" onClick={() => navigate(`/reservation/reservations/new?date=${dateStr}`)}>
                + New Booking
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-12">
                <CalendarCheck className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No reservations for this day</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => navigate(`/reservation/reservations/new?date=${dateStr}`)}>
                  Add Booking
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {grouped.map(([time, resos]) => (
                  <div key={time}>
                    {/* Time slot header */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-sm font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {time}
                      </div>
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground">{resos.length} booking{resos.length > 1 ? "s" : ""}</span>
                    </div>

                    {/* Reservation cards */}
                    <div className="space-y-1.5 ml-2 border-l-2 border-primary/20 pl-4">
                      {resos.map((r: any) => {
                        const guest = r.res_guests;
                        const guestName = guest
                          ? `${guest.first_name} ${guest.last_name}`
                          : "Walk-in";
                        const isVip = guest?.vip_tier === "VIP" || guest?.vip_tier === "CHAMPION";
                        const statusColor: Record<string, string> = {
                          CONFIRMED: "bg-blue-500",
                          SEATED: "bg-red-500",
                          COMPLETED: "bg-muted-foreground",
                        };
                        const isBill = r.status === "SEATED" && r.notes?.includes("[BILL_DROPPED]");

                        return (
                          <div
                            key={r.id}
                            onClick={() => navigate(`/reservation/reservations/${r.id}`)}
                            className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn("w-2.5 h-2.5 rounded-full", isBill ? "bg-amber-400" : statusColor[r.status] || "bg-muted")} />
                              <div>
                                <p className="text-sm font-medium flex items-center gap-1">
                                  {guestName}
                                  {isVip && <Crown className="w-3 h-3 text-amber-500" />}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {r.party_size} pax · {r.res_tables?.name || "No table"}
                                  {r.special_requests && ` · ${r.special_requests}`}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={r.status === "SEATED" ? "default" : "secondary"}
                              className="text-[10px]"
                            >
                              {isBill ? "BILL" : r.status}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResDiary;

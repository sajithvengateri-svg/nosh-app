import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, ChevronRight, Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOrg } from "@/contexts/OrgContext";
import { fetchCampaigns } from "@/lib/shared/queries/marketingQueries";
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, isSameMonth, getDay } from "date-fns";

const statusDot: Record<string, string> = {
  DRAFT: "bg-muted-foreground",
  SCHEDULED: "bg-blue-500",
  SENT: "bg-green-500",
  COMPLETED: "bg-secondary-foreground",
};

const GrowthCalendar = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: campaigns = [] } = useQuery({
    queryKey: ["growth-campaigns", orgId],
    queryFn: () => fetchCampaigns(orgId!),
    enabled: !!orgId,
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart); // 0=Sun

  const getCampaignsForDay = (day: Date) => {
    return campaigns.filter((c) => {
      const scheduledDate = c.scheduled_at ? new Date(c.scheduled_at) : null;
      const sentDate = c.sent_at ? new Date(c.sent_at) : null;
      const createdDate = new Date(c.created_at);
      const relevantDate = scheduledDate || sentDate || createdDate;
      return isSameDay(relevantDate, day);
    });
  };

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const selectedCampaigns = selectedDay ? getCampaignsForDay(selectedDay) : [];

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-primary" />
            Content Calendar
          </h1>
          <p className="text-sm text-muted-foreground">Plan and schedule marketing campaigns</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <CardTitle className="text-base">{format(currentMonth, "MMMM yyyy")}</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-xs font-medium text-muted-foreground text-center py-1">{d}</div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startPadding }).map((_, i) => (
              <div key={`pad-${i}`} className="aspect-square" />
            ))}
            {days.map((day) => {
              const dayCampaigns = getCampaignsForDay(day);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 text-sm transition-colors
                    ${isToday ? "ring-2 ring-primary" : ""}
                    ${isSelected ? "bg-primary/10" : "hover:bg-muted/50"}
                  `}
                >
                  <span className={`${isToday ? "font-bold text-primary" : "text-foreground"}`}>
                    {format(day, "d")}
                  </span>
                  {dayCampaigns.length > 0 && (
                    <div className="flex gap-0.5">
                      {dayCampaigns.slice(0, 3).map((c) => (
                        <div key={c.id} className={`w-1.5 h-1.5 rounded-full ${statusDot[c.status] || "bg-muted-foreground"}`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected day detail */}
      {selectedDay && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{format(selectedDay, "EEEE, d MMMM yyyy")}</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedCampaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No campaigns on this date</p>
            ) : (
              <div className="space-y-2">
                {selectedCampaigns.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <Megaphone className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.channel} · {c.type.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <Badge className={`${statusDot[c.status]?.replace('bg-', 'bg-')}`}>{c.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GrowthCalendar;

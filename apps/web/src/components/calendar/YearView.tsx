import { motion } from "framer-motion";
import { format, getMonth, getYear, startOfYear, addMonths, isSameMonth } from "date-fns";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  title: string;
  event_type: string;
  date: string;
  status: string | null;
}

interface YearViewProps {
  events: CalendarEvent[];
  selectedMonth: Date | null;
  onMonthSelect: (date: Date) => void;
  year: number;
}

const eventTypeColors: Record<string, string> = {
  maintenance: "bg-primary",
  license: "bg-warning",
  inspection: "bg-destructive",
  training: "bg-success",
  other: "bg-muted-foreground",
};

const YearView = ({ events, selectedMonth, onMonthSelect, year }: YearViewProps) => {
  const yearStart = startOfYear(new Date(year, 0, 1));
  const months = Array.from({ length: 12 }, (_, i) => addMonths(yearStart, i));

  const getEventsForMonth = (monthDate: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return getMonth(eventDate) === getMonth(monthDate) && getYear(eventDate) === year;
    });
  };

  const getMonthStats = (monthEvents: CalendarEvent[]) => {
    const overdue = monthEvents.filter(e => e.status === "overdue").length;
    const due = monthEvents.filter(e => e.status === "due").length;
    const upcoming = monthEvents.filter(e => e.status === "upcoming").length;
    const completed = monthEvents.filter(e => e.status === "completed").length;
    return { overdue, due, upcoming, completed, total: monthEvents.length };
  };

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {months.map((month, index) => {
        const monthEvents = getEventsForMonth(month);
        const stats = getMonthStats(monthEvents);
        const isSelected = selectedMonth && isSameMonth(month, selectedMonth);
        const hasAlerts = stats.overdue > 0 || stats.due > 0;

        return (
          <motion.button
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => onMonthSelect(month)}
            className={cn(
              "p-4 rounded-xl text-left transition-all border-2",
              "hover:shadow-md hover:scale-[1.02]",
              isSelected
                ? "border-primary bg-primary/10 shadow-md"
                : "border-transparent bg-card hover:border-muted",
              hasAlerts && !isSelected && "border-warning/50"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={cn(
                "text-lg font-semibold",
                isSelected ? "text-primary" : "text-foreground"
              )}>
                {format(month, "MMM")}
              </span>
              {hasAlerts && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                </span>
              )}
            </div>

            {stats.total > 0 ? (
              <div className="space-y-1">
                <div className="flex gap-1 flex-wrap">
                  {monthEvents.slice(0, 3).map((event, i) => (
                    <span
                      key={i}
                      className={cn(
                        "w-2 h-2 rounded-full",
                        eventTypeColors[event.event_type] || "bg-muted"
                      )}
                    />
                  ))}
                  {stats.total > 3 && (
                    <span className="text-xs text-muted-foreground">+{stats.total - 3}</span>
                  )}
                </div>
                <div className="flex gap-2 text-xs">
                  {stats.overdue > 0 && (
                    <span className="text-destructive font-medium">{stats.overdue} overdue</span>
                  )}
                  {stats.due > 0 && (
                    <span className="text-warning font-medium">{stats.due} due</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No events</p>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

export default YearView;

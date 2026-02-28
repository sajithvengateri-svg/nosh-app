import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, startOfYear, addMonths, getMonth, getYear, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ServiceLog } from "@/types/housekeeping";

interface ServiceCalendarViewProps {
  logs: ServiceLog[];
  year: number;
  onYearChange: (year: number) => void;
}

export default function ServiceCalendarView({ logs, year, onYearChange }: ServiceCalendarViewProps) {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const yearStart = startOfYear(new Date(year, 0, 1));
  const months = Array.from({ length: 12 }, (_, i) => addMonths(yearStart, i));

  const getLogsForMonth = (monthIdx: number) =>
    logs.filter((l) => {
      const d = parseISO(l.service_date);
      return getMonth(d) === monthIdx && getYear(d) === year;
    });

  const selectedLogs = selectedMonth !== null ? getLogsForMonth(selectedMonth) : [];

  return (
    <div className="space-y-4">
      {/* Year navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onYearChange(year - 1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium">{year}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onYearChange(year + 1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {months.map((month, i) => {
          const monthLogs = getLogsForMonth(i);
          const hasOverdue = monthLogs.some((l) => l.next_due_date && new Date(l.next_due_date) < new Date());
          const isSelected = selectedMonth === i;

          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => setSelectedMonth(isSelected ? null : i)}
              className={cn(
                "p-3 rounded-lg border text-left transition-all",
                isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/50",
                hasOverdue && "border-destructive/50"
              )}
            >
              <p className="text-xs font-medium">{format(month, "MMM")}</p>
              <div className="flex items-center gap-1 mt-1">
                {monthLogs.length > 0 ? (
                  <>
                    <div className="flex gap-0.5">
                      {monthLogs.slice(0, 4).map((_, j) => (
                        <div key={j} className="w-1.5 h-1.5 rounded-full bg-primary" />
                      ))}
                      {monthLogs.length > 4 && (
                        <span className="text-[9px] text-muted-foreground ml-0.5">+{monthLogs.length - 4}</span>
                      )}
                    </div>
                  </>
                ) : (
                  <span className="text-[10px] text-muted-foreground">—</span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Selected month detail */}
      {selectedMonth !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated divide-y divide-border"
        >
          <div className="p-3 flex items-center justify-between">
            <h4 className="text-sm font-medium">
              {format(months[selectedMonth], "MMMM yyyy")}
            </h4>
            <Badge variant="secondary" className="text-xs">{selectedLogs.length} entries</Badge>
          </div>
          {selectedLogs.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No entries this month</div>
          ) : (
            selectedLogs.map((log) => (
              <div key={log.id} className="p-3 flex items-center gap-3">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{format(parseISO(log.service_date), "d MMM")}</span>
                    {log.provider_name && (
                      <span className="text-xs text-muted-foreground">{log.provider_name}</span>
                    )}
                  </div>
                  {log.next_due_date && (
                    <p className="text-xs text-muted-foreground">
                      Next due: {format(parseISO(log.next_due_date), "d MMM yyyy")}
                    </p>
                  )}
                </div>
                {log.cost != null && log.cost > 0 && (
                  <span className="text-sm font-medium tabular-nums">${log.cost.toFixed(2)}</span>
                )}
              </div>
            ))
          )}
        </motion.div>
      )}
    </div>
  );
}

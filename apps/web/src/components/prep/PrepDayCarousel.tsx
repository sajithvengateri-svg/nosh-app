import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, addDays, isSameDay, addWeeks, subWeeks, startOfWeek } from "date-fns";

interface PrepDayCarouselProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  weekStart: Date;
  onWeekChange: (newWeekStart: Date) => void;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function PrepDayCarousel({ selectedDate, onSelectDate, weekStart, onWeekChange }: PrepDayCarouselProps) {
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={() => onWeekChange(subWeeks(weekStart, 1))}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      <div className="flex-1 overflow-x-auto snap-x snap-mandatory scrollbar-none">
        <div className="flex gap-1.5 min-w-0 justify-center">
          {weekDays.map((day, i) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, today);

            return (
              <motion.button
                key={day.toISOString()}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => onSelectDate(day)}
                className={cn(
                  "relative flex flex-col items-center px-3 py-2 rounded-xl text-sm font-medium transition-all min-w-[52px] snap-center",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "hover:bg-muted text-muted-foreground"
                )}
              >
                <span className="text-[10px] uppercase tracking-wider opacity-80">
                  {DAY_LABELS[i]}
                </span>
                <span className="text-lg font-bold leading-tight">
                  {format(day, "d")}
                </span>
                {/* Today dot indicator */}
                {isToday && (
                  <span
                    className={cn(
                      "absolute -bottom-0.5 w-1.5 h-1.5 rounded-full",
                      isSelected ? "bg-primary-foreground" : "bg-primary"
                    )}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={() => onWeekChange(addWeeks(weekStart, 1))}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

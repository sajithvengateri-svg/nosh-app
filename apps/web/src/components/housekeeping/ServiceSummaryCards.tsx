import { DollarSign, Hash, Clock, CalendarCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useServiceSummary } from "@/hooks/useHousekeeping";
import type { ServiceType } from "@/types/housekeeping";

interface ServiceSummaryCardsProps {
  serviceType: ServiceType;
}

export default function ServiceSummaryCards({ serviceType }: ServiceSummaryCardsProps) {
  const { totalSpend, entryCount, avgFrequencyDays, nextDueDate, isOverdue } = useServiceSummary(serviceType);

  const frequencyLabel = avgFrequencyDays
    ? avgFrequencyDays <= 7 ? "Weekly"
    : avgFrequencyDays <= 14 ? "Fortnightly"
    : avgFrequencyDays <= 35 ? "Monthly"
    : avgFrequencyDays <= 100 ? "Quarterly"
    : "Annually"
    : "—";

  const dueLabel = nextDueDate
    ? (() => {
        const diff = Math.ceil((new Date(nextDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (diff < 0) return `${Math.abs(diff)}d overdue`;
        if (diff === 0) return "Due today";
        return `Due in ${diff}d`;
      })()
    : "No schedule";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <Card>
        <CardContent className="p-3 flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-success/10">
            <DollarSign className="w-4 h-4 text-success" />
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums">${totalSpend.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground uppercase">YTD Spend</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Hash className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums">{entryCount}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Entries</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/10">
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-lg font-bold">{frequencyLabel}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Avg Frequency</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 flex items-center gap-2.5">
          <div className={cn("p-1.5 rounded-lg", isOverdue ? "bg-destructive/10" : "bg-muted")}>
            <CalendarCheck className={cn("w-4 h-4", isOverdue ? "text-destructive" : "text-muted-foreground")} />
          </div>
          <div>
            <p className={cn("text-lg font-bold", isOverdue && "text-destructive")}>{dueLabel}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Next Due</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

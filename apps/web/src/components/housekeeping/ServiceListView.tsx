import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { AlertTriangle, FileText, Trash2, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ServiceLog } from "@/types/housekeeping";

interface ServiceListViewProps {
  logs: ServiceLog[];
  priceAlertIds: Set<string>;
  onDelete: (id: string) => void;
}

function groupByMonth(logs: ServiceLog[]): Record<string, ServiceLog[]> {
  const grouped: Record<string, ServiceLog[]> = {};
  for (const log of logs) {
    const month = log.service_date.slice(0, 7);
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(log);
  }
  return grouped;
}

function getQuantityDisplay(metadata: Record<string, any>): string | null {
  const qtyKeys = ["litres_fresh", "litres_dirty", "weight_kg", "bin_count", "grease_level_pct"];
  const parts: string[] = [];
  for (const key of qtyKeys) {
    if (metadata[key] != null && metadata[key] !== "" && metadata[key] !== 0) {
      const label = key === "litres_fresh" ? "Fresh" : key === "litres_dirty" ? "Dirty"
        : key === "weight_kg" ? "kg" : key === "bin_count" ? "bins"
        : key === "grease_level_pct" ? "%" : key;
      parts.push(`${metadata[key]}${label === "%" ? "%" : ` ${label}`}`);
    }
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export default function ServiceListView({ logs, priceAlertIds, onDelete }: ServiceListViewProps) {
  if (logs.length === 0) {
    return (
      <div className="card-elevated p-8 text-center">
        <FileText className="w-8 h-8 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">No entries yet. Add your first entry to start tracking.</p>
      </div>
    );
  }

  const grouped = groupByMonth(logs);

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([month, entries], gi) => (
        <motion.div
          key={month}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: gi * 0.05 }}
        >
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {format(parseISO(`${month}-01`), "MMMM yyyy")}
            <span className="ml-2 text-[10px] font-normal">
              ({entries.length} {entries.length === 1 ? "entry" : "entries"}
              {entries.some((e) => e.cost != null && e.cost > 0) &&
                ` · $${entries.reduce((s, e) => s + (e.cost ?? 0), 0).toFixed(0)}`}
              )
            </span>
          </h3>
          <div className="card-elevated divide-y divide-border">
            {entries.map((log) => {
              const qtyDisplay = getQuantityDisplay(log.metadata ?? {});
              return (
                <div key={log.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {format(parseISO(log.service_date), "d MMM")}
                      </span>
                      {log.provider_name && (
                        <span className="text-xs text-muted-foreground truncate">
                          {log.provider_name}
                        </span>
                      )}
                      {qtyDisplay && (
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                          {qtyDisplay}
                        </Badge>
                      )}
                      {priceAlertIds.has(log.id) && (
                        <Badge variant="destructive" className="text-[10px] h-5 px-1.5 gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Above avg
                        </Badge>
                      )}
                    </div>
                    {log.notes && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{log.notes}</p>
                    )}
                  </div>

                  {log.cost != null && log.cost > 0 && (
                    <span className={cn(
                      "text-sm font-medium tabular-nums",
                      priceAlertIds.has(log.id) ? "text-destructive" : "text-foreground"
                    )}>
                      ${log.cost.toFixed(2)}
                    </span>
                  )}

                  {log.invoice_url && (
                    <a href={log.invoice_url} target="_blank" rel="noopener noreferrer" title="View invoice" className="shrink-0">
                      <Paperclip className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                    </a>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => onDelete(log.id)}
                  >
                    <Trash2 className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

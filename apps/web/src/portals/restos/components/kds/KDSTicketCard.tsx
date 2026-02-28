import { useMemo } from "react";
import { calcTicketAge, getTicketColour } from "@/lib/shared/calculations/posCalc";
import type { POSStation } from "@/lib/shared/types/pos.types";
import { DEFAULT_STATION_COLORS } from "../../pages/POSOrderScreen";
import { Clock, ChevronRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  order: any;
  activeStation: POSStation | null;
  onBump: () => void;
  onRecall: () => void;
}

const AGE_STYLES = {
  green: { border: "border-emerald-500/50", bg: "bg-emerald-500/5", timer: "text-emerald-400" },
  amber: { border: "border-amber-500/60", bg: "bg-amber-500/5", timer: "text-amber-400" },
  red:   { border: "border-red-500/70",    bg: "bg-red-500/10",   timer: "text-red-400 animate-pulse" },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  SENT:        { label: "NEW",     color: "bg-sky-500" },
  IN_PROGRESS: { label: "COOKING", color: "bg-amber-500" },
  READY:       { label: "READY",   color: "bg-emerald-500" },
};

export default function KDSTicketCard({ order, activeStation, onBump, onRecall }: Props) {
  const age = useMemo(() => calcTicketAge(order.created_at), [order.created_at]);
  const colour = getTicketColour(age);
  const style = AGE_STYLES[colour];
  const statusCfg = STATUS_LABELS[order.status] ?? STATUS_LABELS.SENT;

  // Filter items by station if active
  const items = activeStation
    ? (order.items ?? []).filter((i: any) => i.station === activeStation)
    : (order.items ?? []);

  // Group items by station
  const stationGroups = items.reduce((acc: Record<string, any[]>, item: any) => {
    if (!acc[item.station]) acc[item.station] = [];
    acc[item.station].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div
      className={cn(
        "rounded-xl border-2 flex flex-col overflow-hidden transition-all",
        style.border, style.bg
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">#{order.order_number}</span>
          <span className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full text-white", statusCfg.color)}>
            {statusCfg.label}
          </span>
        </div>
        <div className={cn("flex items-center gap-1 text-xs font-mono", style.timer)}>
          <Clock className="h-3 w-3" />
          {age}m
        </div>
      </div>

      {/* Order meta */}
      <div className="px-3 py-1.5 text-[10px] text-slate-500 flex gap-3 border-b border-white/5">
        <span>{order.order_type?.replace("_", " ")}</span>
        {order.table_number && <span>Table {order.table_number}</span>}
      </div>

      {/* Items grouped by station */}
      <div className="flex-1 px-3 py-2 space-y-2 overflow-auto max-h-64">
        {Object.entries(stationGroups).map(([station, stItems]) => {
          const sc = DEFAULT_STATION_COLORS[station as POSStation];
          return (
            <div key={station}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className={cn("h-1.5 w-1.5 rounded-full", sc?.text.replace("text-", "bg-"))} />
                <span className={cn("text-[9px] font-semibold uppercase tracking-wider", sc?.text)}>
                  {sc?.label || station}
                </span>
              </div>
              {(stItems as any[]).map((item: any) => (
                <div key={item.id} className="flex items-start gap-2 py-0.5">
                  <span className="text-sm font-bold text-white w-5">{item.quantity}×</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white leading-tight">{item.item_name}</p>
                    {item.modifiers && Array.isArray(item.modifiers) && item.modifiers.length > 0 && (
                      <p className="text-[10px] text-slate-400">
                        {item.modifiers.map((m: any) => m.name).join(", ")}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-[10px] text-amber-400/80 italic">⚠ {item.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Order notes */}
      {order.notes && (
        <div className="px-3 py-1.5 border-t border-white/5 text-[10px] text-amber-400/80 italic">
          📝 {order.notes}
        </div>
      )}

      {/* Bump / Recall buttons */}
      <div className="flex border-t border-white/10">
        {order.status !== "SENT" && (
          <button
            onClick={onRecall}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors border-r border-white/10"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Recall
          </button>
        )}
        <button
          onClick={onBump}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors",
            order.status === "SENT"
              ? "text-sky-400 hover:bg-sky-500/10"
              : order.status === "IN_PROGRESS"
              ? "text-emerald-400 hover:bg-emerald-500/10"
              : "text-white hover:bg-white/10"
          )}
        >
          {order.status === "SENT" ? "Start" : order.status === "IN_PROGRESS" ? "Ready" : "Complete"}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

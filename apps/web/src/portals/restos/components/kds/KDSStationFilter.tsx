import type { POSStation } from "@/lib/shared/types/pos.types";
import { DEFAULT_STATION_COLORS } from "../../pages/POSOrderScreen";
import { cn } from "@/lib/utils";

const ALL_STATIONS: POSStation[] = ["HOT", "COLD", "BAR", "PASS", "COFFEE"];

interface Props {
  active: POSStation | null;
  onSelect: (s: POSStation | null) => void;
}

export default function KDSStationFilter({ active, onSelect }: Props) {
  return (
    <div className="flex gap-1">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors",
          !active ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"
        )}
      >
        All
      </button>
      {ALL_STATIONS.map((station) => {
        const sc = DEFAULT_STATION_COLORS[station];
        return (
          <button
            key={station}
            onClick={() => onSelect(active === station ? null : station)}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors",
              active === station
                ? `${sc.bg} ${sc.text} border ${sc.border}`
                : "text-slate-500 hover:text-white border border-transparent"
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", sc.text.replace("text-", "bg-"))} />
            {station}
          </button>
        );
      })}
    </div>
  );
}

import type { POSStation } from "@/lib/shared/types/pos.types";
import { cn } from "@/lib/utils";

interface StationColor {
  bg: string;
  border: string;
  text: string;
  label: string;
}

interface Props {
  stations: POSStation[];
  activeStation: POSStation | null;
  onSelect: (station: POSStation | null) => void;
  colors: Record<POSStation, StationColor>;
}

export default function POSSectionTabs({ stations, activeStation, onSelect, colors }: Props) {
  return (
    <div className="flex gap-1 px-3 py-2 border-b border-white/10 bg-[#0a0c10]/40">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
          !activeStation
            ? "bg-white/10 text-white border border-white/20"
            : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
        )}
      >
        All Stations
      </button>
      {stations.map((station) => {
        const sc = colors[station];
        const isActive = activeStation === station;
        return (
          <button
            key={station}
            onClick={() => onSelect(isActive ? null : station)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
              isActive
                ? `${sc.bg} ${sc.text} ${sc.border}`
                : "text-slate-400 hover:text-white hover:bg-white/5 border-transparent"
            )}
          >
            <span className={cn("h-2.5 w-2.5 rounded-full", sc.text.replace("text-", "bg-"))} />
            {sc.label}
          </button>
        );
      })}
    </div>
  );
}

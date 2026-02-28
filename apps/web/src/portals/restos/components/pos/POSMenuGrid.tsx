import type { POSStation } from "@/lib/shared/types/pos.types";
import { cn } from "@/lib/utils";

interface StationColor {
  bg: string;
  border: string;
  text: string;
  label: string;
}

interface Props {
  items: any[];
  stationColors: Record<POSStation, StationColor>;
  onItemTap: (item: any) => void;
  loading?: boolean;
  sym?: string;
}

export default function POSMenuGrid({ items, stationColors, onItemTap, loading, sym = "$" }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
        No items found. Try changing the filter or add items in Menu Admin.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
      {items.map((item: any) => {
        const sc = stationColors[item.station as POSStation] ?? stationColors.HOT;
        return (
          <button
            key={item.id}
            onClick={() => onItemTap(item)}
            className={cn(
              "relative flex flex-col items-start justify-between p-3 rounded-xl border transition-all",
              "hover:scale-[1.02] active:scale-[0.98] text-left",
              sc.bg, sc.border
            )}
          >
            {/* Station dot */}
            <div className="flex items-center gap-1.5 mb-1">
              <span className={cn("h-2 w-2 rounded-full", sc.text.replace("text-", "bg-"))} />
              <span className={cn("text-[9px] font-semibold uppercase tracking-wider", sc.text)}>
                {item.station}
              </span>
            </div>

            <span className="text-sm font-medium text-white leading-tight line-clamp-2">
              {item.name}
            </span>

            <span className="text-xs text-slate-400 mt-1">
              {sym}{Number(item.price).toFixed(2)}
            </span>

            {/* Category badge */}
            {item.category?.name && (
              <span className="absolute top-1.5 right-1.5 text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-slate-500 font-medium">
                {item.category.name}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

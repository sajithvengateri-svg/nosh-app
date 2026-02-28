import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  streak: number;
  className?: string;
}

export default function StreakBadge({ streak, className }: StreakBadgeProps) {
  const isHot = streak >= 7;
  const isOnFire = streak >= 30;

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
        isOnFire
          ? "bg-amber-500/20 text-amber-400"
          : isHot
          ? "bg-orange-500/20 text-orange-400"
          : streak > 0
          ? "bg-zinc-800 text-zinc-400"
          : "bg-zinc-800/50 text-zinc-600",
        className
      )}
    >
      <Flame
        className={cn(
          "w-3.5 h-3.5",
          isOnFire && "animate-pulse",
          isHot && "text-orange-400"
        )}
      />
      <span>{streak}d</span>
    </div>
  );
}

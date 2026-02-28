import { Shield, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeagueBadgeProps {
  league: "scullery" | "pro";
  className?: string;
}

export default function LeagueBadge({ league, className }: LeagueBadgeProps) {
  const isPro = league === "pro";

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider",
        isPro
          ? "bg-red-500/20 text-red-400 border border-red-500/30"
          : "bg-zinc-800 text-zinc-400 border border-zinc-700",
        className
      )}
    >
      {isPro ? <Trophy className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
      <span>{isPro ? "Pro" : "Scullery"}</span>
    </div>
  );
}

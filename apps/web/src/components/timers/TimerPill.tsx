// TimerPill — individual timer display in the floating dock

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useTimerStore } from "@/lib/shared/state/timerStore";
import type { ActiveTimer } from "@/lib/shared/types/timer.types";
import { Clock, Flame, Snowflake, Droplet, Thermometer, Timer, Pause, Play } from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  clock: Clock,
  flame: Flame,
  snowflake: Snowflake,
  droplet: Droplet,
  thermometer: Thermometer,
  timer: Timer,
};

const URGENCY_STYLES: Record<string, string> = {
  safe: "border-emerald-500/60 bg-emerald-500/10",
  warning: "border-amber-500/60 bg-amber-500/10",
  danger: "border-red-500/60 bg-red-500/10 animate-pulse",
  complete: "border-red-400 bg-red-500/20 animate-[pulse_0.5s_infinite]",
  overdue: "border-red-600 bg-red-600/20",
  info: "border-sky-500/60 bg-sky-500/10",
};

const PROGRESS_COLORS: Record<string, string> = {
  safe: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  complete: "bg-red-400",
  overdue: "bg-red-600",
  info: "bg-sky-500",
};

function formatTime(seconds: number): string {
  const abs = Math.abs(Math.floor(seconds));
  const sign = seconds < 0 ? "+" : "";
  if (abs >= 86400) {
    const d = Math.floor(abs / 86400);
    const h = Math.floor((abs % 86400) / 3600);
    return `${sign}${d}d ${h}h`;
  }
  if (abs >= 3600) {
    const h = Math.floor(abs / 3600);
    const m = Math.floor((abs % 3600) / 60);
    const s = abs % 60;
    return `${sign}${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return `${sign}${m}:${String(s).padStart(2, "0")}`;
}

interface TimerPillProps {
  timer: ActiveTimer;
  onTap?: () => void;
  onLongPress?: () => void;
}

export default function TimerPill({ timer, onTap, onLongPress }: TimerPillProps) {
  const { getTimerRemaining, getTimerProgress, getTimerUrgency, pauseTimer, resumeTimer } = useTimerStore();
  const [, setTick] = useState(0);

  // Re-render every second for countdown
  useEffect(() => {
    if (timer.status !== "RUNNING") return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [timer.status]);

  const remaining = getTimerRemaining(timer);
  const progress = getTimerProgress(timer);
  const urgency = getTimerUrgency(timer);
  const IconComp = ICON_MAP[timer.icon] || Clock;

  let longPressTimer: ReturnType<typeof setTimeout> | null = null;

  const handlePointerDown = () => {
    longPressTimer = setTimeout(() => {
      onLongPress?.();
      longPressTimer = null;
    }, 600);
  };

  const handlePointerUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
      onTap?.();
    }
  };

  return (
    <div
      className={cn(
        "relative flex flex-col gap-0.5 rounded-lg border-2 px-2.5 py-1.5 min-w-[120px] max-w-[160px] cursor-pointer select-none transition-all",
        URGENCY_STYLES[urgency]
      )}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => {
        if (longPressTimer) clearTimeout(longPressTimer);
      }}
    >
      {/* Label row */}
      <div className="flex items-center gap-1.5 overflow-hidden">
        <IconComp className="h-3 w-3 shrink-0 text-slate-400" />
        <span className="text-[10px] text-slate-300 truncate font-medium">{timer.label}</span>
      </div>

      {/* Countdown */}
      <div className="text-lg font-mono font-bold text-white leading-none tracking-tight">
        {formatTime(remaining)}
      </div>

      {/* Progress bar */}
      {timer.timer_type !== "COUNT_UP" && (
        <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", PROGRESS_COLORS[urgency])}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}

      {/* Pause/play indicator */}
      {timer.status === "PAUSED" && (
        <button
          onClick={(e) => { e.stopPropagation(); resumeTimer(timer.id); }}
          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-slate-700 border border-slate-500 flex items-center justify-center"
        >
          <Play className="h-2.5 w-2.5 text-white" />
        </button>
      )}
      {timer.status === "RUNNING" && (
        <button
          onClick={(e) => { e.stopPropagation(); pauseTimer(timer.id); }}
          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-slate-700/80 border border-slate-600 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
        >
          <Pause className="h-2.5 w-2.5 text-white" />
        </button>
      )}

      {/* Station tag */}
      {timer.station && (
        <span className="text-[8px] text-slate-500 uppercase tracking-wider">{timer.station}</span>
      )}
    </div>
  );
}

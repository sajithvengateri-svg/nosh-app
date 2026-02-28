// TimerPrompt — popup when KDS ticket is started showing recipe timers

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Play, SkipForward, PlayCircle, X } from "lucide-react";
import type { RecipeTimer, StartTimerConfig } from "@/lib/shared/types/timer.types";

interface TimerPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderLabel: string;
  recipeTimers: Array<{
    recipeName: string;
    timers: RecipeTimer[];
  }>;
  onStartTimer: (config: StartTimerConfig) => void;
  onStartAll: () => void;
  orgId: string;
  orderId?: string;
  station?: string;
  startedBy?: string;
}

function formatDuration(seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${m}m`;
}

export default function TimerPrompt({
  open,
  onOpenChange,
  orderLabel,
  recipeTimers,
  onStartTimer,
  onStartAll,
  orgId,
  orderId,
  station,
  startedBy,
}: TimerPromptProps) {
  const totalTimers = recipeTimers.reduce((sum, r) => sum + r.timers.length, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Clock className="h-4 w-4 text-sky-400" />
            {orderLabel} — Recipe Timers
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[50vh] overflow-y-auto">
          {recipeTimers.map(({ recipeName, timers }) => (
            <div key={recipeName} className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {recipeName}
              </h4>
              {timers.filter(t => t.is_enabled).map((timer, idx) => (
                <div
                  key={timer.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/50 p-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{timer.label}</div>
                    <div className="text-xs text-slate-400">
                      {formatDuration(timer.duration_seconds)}
                      {timer.timer_type !== "COUNTDOWN" && (
                        <span className="ml-1.5 text-sky-400">
                          {timer.timer_type === "MINIMUM_WAIT" ? "min wait" : timer.timer_type.toLowerCase()}
                        </span>
                      )}
                      {timer.critical && <span className="ml-1.5 text-red-400">⚠ Critical</span>}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
                    onClick={() => {
                      onStartTimer({
                        org_id: orgId,
                        label: `${orderLabel} — ${timer.label}`,
                        duration_seconds: timer.duration_seconds,
                        source_type: "ORDER",
                        timer_type: timer.timer_type,
                        recipe_id: timer.recipe_id,
                        order_id: orderId,
                        stages: timer.stages ?? undefined,
                        is_minimum_time: timer.is_minimum_time,
                        station,
                        colour: timer.colour ?? undefined,
                        icon: timer.icon,
                        alert_type: timer.alert_type,
                        critical: timer.critical,
                        notes: timer.notes ?? undefined,
                        started_by: startedBy,
                      });
                    }}
                  >
                    <Play className="h-3.5 w-3.5 mr-1" /> Start
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-slate-500 hover:text-slate-300"
                    onClick={() => {/* skip — do nothing */}}
                  >
                    <SkipForward className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-700">
          <Button
            onClick={() => {
              onStartAll();
              onOpenChange(false);
            }}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500"
          >
            <PlayCircle className="h-4 w-4 mr-1.5" />
            Start All ({totalTimers})
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4 mr-1" /> Dismiss
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

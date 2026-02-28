// TimerDock — persistent floating bar at bottom of screen

import { useState, useEffect, useCallback } from "react";
import { useTimerStore } from "@/lib/shared/state/timerStore";
import { useAppSettings } from "@/hooks/useAppSettings";
import { initAudio, playAlert, stopSnoozeAlert } from "@/lib/shared/utils/timerAudio";
import { useRealtime } from "@/lib/shared/hooks/useRealtime";
import TimerPill from "./TimerPill";
import QuickTimerDialog from "./QuickTimerDialog";
import { Timer, Plus, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ActiveTimer, TimerCategory } from "@/lib/shared/types/timer.types";
import { supabase } from "@/lib/shared/supabaseClient";

interface TimerDockProps {
  orgId?: string;
  station?: string;
  category?: TimerCategory;
  className?: string;
}

export default function TimerDock({ orgId, station, category = "kitchen", className }: TimerDockProps) {
  const { settings } = useAppSettings();
  const { timers, upsertTimer, removeTimer, startTimer, dismissTimer, addTime, snoozeTimer, getTimerRemaining } =
    useTimerStore();
  const [quickOpen, setQuickOpen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [expandedTimerId, setExpandedTimerId] = useState<string | null>(null);

  const activeTimers = timers.filter((t) =>
    ["RUNNING", "PAUSED", "COMPLETE", "OVERDUE"].includes(t.status)
  );

  // Realtime sync
  useRealtime({
    table: "active_timers",
    event: "*",
    filter: orgId ? `org_id=eq.${orgId}` : undefined,
    enabled: !!orgId && settings.timersEnabled,
    onPayload: useCallback((payload: any) => {
      if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        upsertTimer(payload.new as ActiveTimer);
      } else if (payload.eventType === "DELETE") {
        removeTimer(payload.old?.id);
      }
    }, [upsertTimer, removeTimer]),
  });

  // Check for completed timers and trigger alerts
  useEffect(() => {
    if (!settings.timersEnabled || !settings.timerSoundEnabled || !audioEnabled) return;
    const interval = setInterval(() => {
      activeTimers.forEach((timer) => {
        if (timer.status === "RUNNING" && timer.timer_type !== "COUNT_UP") {
          const remaining = getTimerRemaining(timer);
          if (remaining <= 0) {
            playAlert(timer.alert_type, timer.critical);
            supabase
              .from("active_timers")
              .update({ status: "COMPLETE", completed_at: new Date().toISOString() } as any)
              .eq("id", timer.id)
              .then();
            upsertTimer({ ...timer, status: "COMPLETE" });
          }
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimers.length, audioEnabled, settings.timerSoundEnabled, settings.timersEnabled]);

  // Master toggle — after all hooks
  if (!settings.timersEnabled) return null;

  const handleEnableAudio = () => {
    const ok = initAudio();
    setAudioEnabled(ok);
  };

  const handleLongPress = (timer: ActiveTimer) => {
    setExpandedTimerId(expandedTimerId === timer.id ? null : timer.id);
  };

  return (
    <div
      className={cn(
        "border-t border-white/10 bg-[#0a0c10]/95 backdrop-blur-sm px-3 py-2 shrink-0",
        className
      )}
    >
      {/* Audio init banner */}
      {!audioEnabled && settings.timerSoundEnabled && (
        <button
          onClick={handleEnableAudio}
          className="w-full text-center text-xs text-amber-400 bg-amber-500/10 rounded py-1 mb-2 hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-1.5"
        >
          <Volume2 className="h-3 w-3" /> Tap to enable timer sounds
        </button>
      )}

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <Timer className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
            {activeTimers.length > 0 ? `Timers (${activeTimers.length})` : "Timers"}
          </span>
        </div>

        {/* Timer pills — horizontal scroll */}
        <div className="flex-1 overflow-x-auto flex gap-2 scrollbar-none min-h-[48px] items-center">
          {activeTimers.length === 0 ? (
            <span className="text-xs text-slate-600 italic">No active timers</span>
          ) : (
            activeTimers
              .sort((a, b) => {
                // Sort: COMPLETE/OVERDUE first, then by remaining time
                const aComplete = a.status === "COMPLETE" || a.status === "OVERDUE";
                const bComplete = b.status === "COMPLETE" || b.status === "OVERDUE";
                if (aComplete && !bComplete) return -1;
                if (!aComplete && bComplete) return 1;
                return getTimerRemaining(a) - getTimerRemaining(b);
              })
              .map((timer) => (
                <TimerPill
                  key={timer.id}
                  timer={timer}
                  onTap={() => setExpandedTimerId(expandedTimerId === timer.id ? null : timer.id)}
                  onLongPress={() => handleLongPress(timer)}
                />
              ))
          )}
        </div>

        {/* Add timer button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setQuickOpen(true)}
          className="text-slate-400 hover:text-white shrink-0 h-8 px-2"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          <span className="text-xs">Timer</span>
        </Button>
      </div>

      {/* Expanded timer options */}
      {expandedTimerId && (
        <ExpandedOptions
          timer={activeTimers.find((t) => t.id === expandedTimerId)}
          onDismiss={(id) => { dismissTimer(id); setExpandedTimerId(null); }}
          onAddTime={(id, secs) => addTime(id, secs)}
          onSnooze={(id) => snoozeTimer(id, settings.timerSnoozeInterval)}
          onClose={() => setExpandedTimerId(null)}
        />
      )}

      <QuickTimerDialog
        open={quickOpen}
        onOpenChange={setQuickOpen}
        defaultStation={station}
        defaultCategory={category}
        onStart={async (config) => {
          if (!orgId) return;
          await startTimer({
            org_id: orgId,
            label: config.label,
            duration_seconds: config.duration_seconds,
            alert_type: config.alert_type,
            source_type: "ADHOC",
            station: config.station,
          });
        }}
      />
    </div>
  );
}

// ── Expanded options panel ──
function ExpandedOptions({
  timer,
  onDismiss,
  onAddTime,
  onSnooze,
  onClose,
}: {
  timer?: ActiveTimer;
  onDismiss: (id: string) => void;
  onAddTime: (id: string, secs: number) => void;
  onSnooze: (id: string) => void;
  onClose: () => void;
}) {
  if (!timer) return null;

  return (
    <div className="mt-2 p-2.5 rounded-lg border border-slate-700 bg-slate-800/80 flex flex-wrap gap-2 items-center">
      <span className="text-xs text-slate-300 font-medium mr-2">{timer.label}</span>
      {timer.notes && <span className="text-[10px] text-slate-500 mr-auto">{timer.notes}</span>}
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs border-slate-600 text-slate-300"
        onClick={() => onAddTime(timer.id, 60)}
      >
        +1m
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs border-slate-600 text-slate-300"
        onClick={() => onAddTime(timer.id, 300)}
      >
        +5m
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs border-amber-600/50 text-amber-300"
        onClick={() => onSnooze(timer.id)}
      >
        Snooze
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs border-red-600/50 text-red-300"
        onClick={() => onDismiss(timer.id)}
      >
        Dismiss
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs text-slate-500"
        onClick={onClose}
      >
        Close
      </Button>
    </div>
  );
}

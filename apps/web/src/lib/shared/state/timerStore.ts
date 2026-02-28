// Smart Timer Zustand Store — client-side timing engine
// Calculates remaining from DB started_at; no server tick needed

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ActiveTimer, StartTimerConfig, TimerUrgency } from '../types/timer.types';
import { getTimerUrgency } from '../types/timer.types';
import { supabase } from '../supabaseClient';
import { playAlert, startSnoozeAlert, stopSnoozeAlert } from '../utils/timerAudio';

interface TimerState {
  timers: ActiveTimer[];
  _hasHydrated: boolean;

  // Sync
  setTimers: (timers: ActiveTimer[]) => void;
  upsertTimer: (timer: ActiveTimer) => void;
  removeTimer: (id: string) => void;

  // Actions (write to DB, optimistic local update)
  startTimer: (config: StartTimerConfig) => Promise<ActiveTimer | null>;
  pauseTimer: (id: string) => Promise<void>;
  resumeTimer: (id: string) => Promise<void>;
  dismissTimer: (id: string, userId?: string) => Promise<void>;
  cancelTimer: (id: string) => Promise<void>;
  addTime: (id: string, seconds: number) => Promise<void>;
  snoozeTimer: (id: string, intervalSeconds?: number) => Promise<void>;

  // Computed helpers (pure, no state mutation)
  getTimerRemaining: (timer: ActiveTimer) => number;
  getTimerProgress: (timer: ActiveTimer) => number;
  getTimerUrgency: (timer: ActiveTimer) => TimerUrgency;
  getActiveTimers: () => ActiveTimer[];
  getTimersForStation: (station: string) => ActiveTimer[];
}

const ACTIVE_STATUSES = ['RUNNING', 'PAUSED', 'COMPLETE', 'OVERDUE'];

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      timers: [],
      _hasHydrated: false,

      // ── Sync helpers ──
      setTimers: (timers) => set({ timers }),

      upsertTimer: (timer) =>
        set((s) => {
          const idx = s.timers.findIndex((t) => t.id === timer.id);
          const next = [...s.timers];
          if (idx >= 0) next[idx] = timer;
          else next.push(timer);
          return { timers: next };
        }),

      removeTimer: (id) =>
        set((s) => ({ timers: s.timers.filter((t) => t.id !== id) })),

      // ── Actions ──
      startTimer: async (config) => {
        const row: any = {
          org_id: config.org_id,
          label: config.label,
          duration_seconds: config.duration_seconds,
          source_type: config.source_type ?? 'ADHOC',
          timer_type: config.timer_type ?? 'COUNTDOWN',
          status: 'RUNNING',
          started_at: new Date().toISOString(),
          recipe_id: config.recipe_id ?? null,
          order_id: config.order_id ?? null,
          prep_task_id: config.prep_task_id ?? null,
          stages: config.stages ?? null,
          is_minimum_time: config.is_minimum_time ?? false,
          station: config.station ?? null,
          colour: config.colour ?? '#10b981',
          icon: config.icon ?? 'clock',
          alert_type: config.alert_type ?? 'CHIME',
          critical: config.critical ?? false,
          notes: config.notes ?? null,
          started_by: config.started_by ?? null,
          chain_id: config.chain_id ?? null,
          chain_position: config.chain_position ?? null,
          auto_start_after: config.auto_start_after ?? null,
        };

        const { data, error } = await supabase
          .from('active_timers')
          .insert(row)
          .select()
          .single();

        if (error || !data) return null;
        const timer = data as unknown as ActiveTimer;
        get().upsertTimer(timer);
        return timer;
      },

      pauseTimer: async (id) => {
        const now = new Date().toISOString();
        await supabase
          .from('active_timers')
          .update({ status: 'PAUSED', paused_at: now } as any)
          .eq('id', id);
        set((s) => ({
          timers: s.timers.map((t) =>
            t.id === id ? { ...t, status: 'PAUSED' as const, paused_at: now } : t
          ),
        }));
      },

      resumeTimer: async (id) => {
        const timer = get().timers.find((t) => t.id === id);
        if (!timer || !timer.paused_at) return;
        const pausedMs = Date.now() - new Date(timer.paused_at).getTime();
        const addedPause = Math.round(pausedMs / 1000);
        const newPausedDuration = timer.paused_duration_seconds + addedPause;

        await supabase
          .from('active_timers')
          .update({
            status: 'RUNNING',
            paused_at: null,
            paused_duration_seconds: newPausedDuration,
          } as any)
          .eq('id', id);

        set((s) => ({
          timers: s.timers.map((t) =>
            t.id === id
              ? { ...t, status: 'RUNNING' as const, paused_at: null, paused_duration_seconds: newPausedDuration }
              : t
          ),
        }));
      },

      dismissTimer: async (id, userId) => {
        const timer = get().timers.find((t) => t.id === id);
        stopSnoozeAlert(id);

        const now = new Date().toISOString();
        await supabase
          .from('active_timers')
          .update({ status: 'DISMISSED', dismissed_at: now, dismissed_by: userId ?? null } as any)
          .eq('id', id);

        // Log to history
        if (timer) {
          const actualDuration = Math.round(
            (Date.now() - new Date(timer.started_at).getTime()) / 1000 - timer.paused_duration_seconds
          );
          await supabase.from('timer_history').insert({
            org_id: timer.org_id,
            timer_id: timer.id,
            recipe_id: timer.recipe_id,
            order_id: timer.order_id,
            label: timer.label,
            duration_seconds: timer.duration_seconds,
            actual_duration_seconds: actualDuration,
            was_overdue: actualDuration > timer.duration_seconds,
            overdue_seconds: Math.max(0, actualDuration - timer.duration_seconds),
            station: timer.station,
            started_by: timer.started_by,
          } as any);

          // Auto-start next in chain
          if (timer.chain_id) {
            const nextInChain = get().timers.find(
              (t) =>
                t.chain_id === timer.chain_id &&
                t.chain_position === (timer.chain_position ?? 0) + 1 &&
                t.status === 'PAUSED'
            );
            if (nextInChain) {
              get().resumeTimer(nextInChain.id);
            }
          }
        }

        set((s) => ({ timers: s.timers.filter((t) => t.id !== id) }));
      },

      cancelTimer: async (id) => {
        stopSnoozeAlert(id);
        await supabase
          .from('active_timers')
          .update({ status: 'CANCELLED' } as any)
          .eq('id', id);
        set((s) => ({ timers: s.timers.filter((t) => t.id !== id) }));
      },

      addTime: async (id, seconds) => {
        const timer = get().timers.find((t) => t.id === id);
        if (!timer) return;
        const newDuration = timer.duration_seconds + seconds;
        await supabase
          .from('active_timers')
          .update({ duration_seconds: newDuration, status: 'RUNNING' } as any)
          .eq('id', id);
        set((s) => ({
          timers: s.timers.map((t) =>
            t.id === id ? { ...t, duration_seconds: newDuration, status: 'RUNNING' as const } : t
          ),
        }));
      },

      snoozeTimer: async (id, intervalSeconds = 30) => {
        const timer = get().timers.find((t) => t.id === id);
        if (!timer) return;
        const snoozeUntil = new Date(Date.now() + intervalSeconds * 1000).toISOString();
        await supabase
          .from('active_timers')
          .update({
            snooze_count: timer.snooze_count + 1,
            snooze_until: snoozeUntil,
          } as any)
          .eq('id', id);
        set((s) => ({
          timers: s.timers.map((t) =>
            t.id === id
              ? { ...t, snooze_count: t.snooze_count + 1, snooze_until: snoozeUntil }
              : t
          ),
        }));
        startSnoozeAlert(id, timer.alert_type, intervalSeconds * 1000);
      },

      // ── Computed ──
      getTimerRemaining: (timer) => {
        if (timer.status === 'PAUSED' && timer.paused_at) {
          const elapsedBeforePause =
            (new Date(timer.paused_at).getTime() - new Date(timer.started_at).getTime()) / 1000 -
            timer.paused_duration_seconds;
          return timer.duration_seconds - elapsedBeforePause;
        }
        const elapsed =
          (Date.now() - new Date(timer.started_at).getTime()) / 1000 -
          timer.paused_duration_seconds;
        if (timer.timer_type === 'COUNT_UP') return elapsed;
        return timer.duration_seconds - elapsed;
      },

      getTimerProgress: (timer) => {
        if (timer.timer_type === 'COUNT_UP') return 0;
        const remaining = get().getTimerRemaining(timer);
        return Math.max(0, Math.min(1, remaining / timer.duration_seconds));
      },

      getTimerUrgency: (timer) => {
        const remaining = get().getTimerRemaining(timer);
        return getTimerUrgency(remaining, timer.duration_seconds, timer.timer_type, timer.status);
      },

      getActiveTimers: () =>
        get().timers.filter((t) => ACTIVE_STATUSES.includes(t.status)),

      getTimersForStation: (station) =>
        get()
          .getActiveTimers()
          .filter((t) => t.station === station),
    }),
    {
      name: 'chefos-timer-store',
      partialize: (state) => ({ timers: state.timers }),
    }
  )
);

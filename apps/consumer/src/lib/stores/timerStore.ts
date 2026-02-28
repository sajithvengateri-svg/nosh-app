import { create } from "zustand";
import * as Notifications from "expo-notifications";
import { successNotification } from "../haptics";

// ── Types ──────────────────────────────────────────────────────────

export interface TimerInstance {
  cardId: string;
  title: string;
  totalSeconds: number;
  timeLeft: number;
  running: boolean;
  notificationId?: string;
}

interface TimerStore {
  timers: Record<string, TimerInstance>;
  _intervalId: ReturnType<typeof setInterval> | null;

  startTimer: (cardId: string, title: string, totalSeconds: number) => void;
  pauseTimer: (cardId: string) => void;
  resumeTimer: (cardId: string) => void;
  adjustTimer: (cardId: string, deltaSeconds: number) => void;
  getTimer: (cardId: string) => TimerInstance | undefined;
  getActiveCount: () => number;
  clearAll: () => void;
}

// Configure notification handler (silent — just vibrate)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function scheduleTimerNotification(
  title: string,
  seconds: number
): Promise<string | undefined> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const { status: newStatus } =
        await Notifications.requestPermissionsAsync();
      if (newStatus !== "granted") return undefined;
    }
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: "Timer Done!",
        body: `${title} is ready`,
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, repeats: false },
    });
  } catch {
    return undefined;
  }
}

async function cancelNotification(id?: string) {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // ignore
  }
}

// ── Store ──────────────────────────────────────────────────────────

export const useTimerStore = create<TimerStore>((set, get) => {
  // Start the global tick interval
  const ensureTicking = () => {
    if (get()._intervalId) return;
    const id = setInterval(() => {
      const { timers } = get();
      let anyRunning = false;
      const updated = { ...timers };

      for (const key of Object.keys(updated)) {
        const t = updated[key];
        if (!t.running || t.timeLeft <= 0) continue;
        anyRunning = true;
        const newLeft = t.timeLeft - 1;
        updated[key] = { ...t, timeLeft: newLeft };
        if (newLeft <= 0) {
          updated[key].running = false;
          successNotification();
        }
      }

      set({ timers: updated });

      if (!anyRunning) {
        clearInterval(get()._intervalId!);
        set({ _intervalId: null });
      }
    }, 1000);
    set({ _intervalId: id });
  };

  return {
    timers: {},
    _intervalId: null,

    startTimer: async (cardId, title, totalSeconds) => {
      const existing = get().timers[cardId];
      if (existing?.running) return;

      const timeLeft = existing?.timeLeft ?? totalSeconds;
      if (timeLeft <= 0) return;

      const notificationId = await scheduleTimerNotification(title, timeLeft);

      set((state) => ({
        timers: {
          ...state.timers,
          [cardId]: {
            cardId,
            title,
            totalSeconds,
            timeLeft,
            running: true,
            notificationId,
          },
        },
      }));
      ensureTicking();
    },

    pauseTimer: (cardId) => {
      const timer = get().timers[cardId];
      if (!timer?.running) return;
      cancelNotification(timer.notificationId);
      set((state) => ({
        timers: {
          ...state.timers,
          [cardId]: { ...timer, running: false, notificationId: undefined },
        },
      }));
    },

    resumeTimer: async (cardId) => {
      const timer = get().timers[cardId];
      if (!timer || timer.running || timer.timeLeft <= 0) return;

      const notificationId = await scheduleTimerNotification(
        timer.title,
        timer.timeLeft
      );

      set((state) => ({
        timers: {
          ...state.timers,
          [cardId]: { ...timer, running: true, notificationId },
        },
      }));
      ensureTicking();
    },

    adjustTimer: (cardId, deltaSeconds) => {
      const timer = get().timers[cardId];
      if (!timer) return;
      const newLeft = Math.max(0, timer.timeLeft + deltaSeconds);
      const newTotal = Math.max(timer.totalSeconds, newLeft);

      // Reschedule notification if running
      if (timer.running) {
        cancelNotification(timer.notificationId);
        if (newLeft > 0) {
          scheduleTimerNotification(timer.title, newLeft).then((nid) => {
            set((state) => ({
              timers: {
                ...state.timers,
                [cardId]: { ...state.timers[cardId], notificationId: nid },
              },
            }));
          });
        }
      }

      set((state) => ({
        timers: {
          ...state.timers,
          [cardId]: { ...timer, timeLeft: newLeft, totalSeconds: newTotal },
        },
      }));
    },

    getTimer: (cardId) => get().timers[cardId],

    getActiveCount: () =>
      Object.values(get().timers).filter((t) => t.running).length,

    clearAll: () => {
      const { timers, _intervalId } = get();
      for (const t of Object.values(timers)) {
        cancelNotification(t.notificationId);
      }
      if (_intervalId) clearInterval(_intervalId);
      set({ timers: {}, _intervalId: null });
    },
  };
});

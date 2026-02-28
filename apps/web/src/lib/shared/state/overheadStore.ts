import { create } from 'zustand';

export type OverheadPeriod = 'today' | 'this_week' | 'this_month' | 'custom';

interface OverheadState {
  period: OverheadPeriod;
  customStart: string | null;
  customEnd: string | null;
  setPeriod: (p: OverheadPeriod) => void;
  setCustomRange: (start: string, end: string) => void;
}

export const useOverheadStore = create<OverheadState>((set) => ({
  period: 'this_month',
  customStart: null,
  customEnd: null,
  setPeriod: (period) => set({ period }),
  setCustomRange: (start, end) => set({ customStart: start, customEnd: end, period: 'custom' }),
}));
